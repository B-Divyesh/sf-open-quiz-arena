use crate::model::{Phase, Quiz, Room, RoomError};
use axum::{
    body::Body,
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        Path, Query, State,
    },
    http::{header, HeaderValue, Request, StatusCode},
    middleware::{self, Next},
    response::{IntoResponse, Response},
    routing::{get, post},
    Json, Router,
};
use futures_util::{SinkExt, StreamExt};
use rand::Rng;
use serde::Deserialize;
use serde_json::{json, Value};
use std::{
    collections::HashMap,
    path::PathBuf,
    sync::{
        atomic::{AtomicU64, Ordering},
        Arc, Mutex as StdMutex,
    },
    time::{Duration, Instant, SystemTime, UNIX_EPOCH},
};
use tokio::sync::{Mutex, RwLock};
use tower_http::{
    compression::CompressionLayer,
    limit::RequestBodyLimitLayer,
    services::{ServeDir, ServeFile},
    trace::TraceLayer,
};
use uuid::Uuid;

pub type SharedRoom = Arc<Mutex<Room>>;

pub struct AppState {
    pub rooms: RwLock<HashMap<String, SharedRoom>>,
    build_sha: String,
    rate_second: AtomicU64,
    rate_count: AtomicU64,
    rate_clients: StdMutex<HashMap<String, (u64, u32)>>,
}

impl AppState {
    pub fn new() -> Self {
        Self::with_build_sha(
            std::env::var("BUILD_SHA").unwrap_or_else(|_| env!("BUILD_SHA").to_owned()),
        )
    }

    pub fn with_build_sha(build_sha: impl Into<String>) -> Self {
        Self {
            rooms: RwLock::new(HashMap::new()),
            build_sha: build_sha.into(),
            rate_second: AtomicU64::new(0),
            rate_count: AtomicU64::new(0),
            rate_clients: StdMutex::new(HashMap::new()),
        }
    }

    pub fn build_sha(&self) -> &str {
        &self.build_sha
    }

    pub async fn create_room(&self, quiz: Quiz) -> (String, String) {
        let mut rooms = self.rooms.write().await;
        let mut rng = rand::rng();
        let code = loop {
            let candidate = format!("{:06}", rng.random_range(0..1_000_000u32));
            if !rooms.contains_key(&candidate) {
                break candidate;
            }
        };
        let host_token = Uuid::new_v4().simple().to_string();
        rooms.insert(
            code.clone(),
            Arc::new(Mutex::new(Room::new(
                code.clone(),
                quiz,
                host_token.clone(),
            ))),
        );
        (code, host_token)
    }

    async fn room(&self, code: &str) -> Option<SharedRoom> {
        self.rooms.read().await.get(code).cloned()
    }

    pub async fn purge_expired(&self) -> usize {
        let entries: Vec<(String, SharedRoom)> = self
            .rooms
            .read()
            .await
            .iter()
            .map(|(k, v)| (k.clone(), v.clone()))
            .collect();
        let now = Instant::now();
        let mut expired = Vec::new();
        for (code, room) in entries {
            if room.lock().await.expired(now) {
                expired.push(code);
            }
        }
        let mut rooms = self.rooms.write().await;
        let before = rooms.len();
        for code in expired {
            rooms.remove(&code);
        }
        before - rooms.len()
    }
}

impl Default for AppState {
    fn default() -> Self {
        Self::new()
    }
}

pub fn app(state: Arc<AppState>) -> Router {
    let dist = PathBuf::from(std::env::var("STATIC_DIR").unwrap_or_else(|_| "dist".into()));
    let assets = ServeDir::new(dist.join("assets"));
    let favicon = ServeFile::new(dist.join("favicon.svg"));
    let spa = ServeFile::new(dist.join("index.html"));
    let apple_icon = ServeFile::new(dist.join("apple-touch-icon.png"));
    let open_graph = ServeFile::new(dist.join("open-graph.png"));
    let not_found_css = ServeFile::new(dist.join("not-found.css"));
    let sitemap = ServeFile::new(dist.join("sitemap.xml"));
    Router::new()
        .route("/health", get(health))
        .route("/robots.txt", get(robots))
        .route_service("/sitemap.xml", sitemap)
        .route_service("/apple-touch-icon.png", apple_icon)
        .route_service("/open-graph.png", open_graph)
        .route_service("/not-found.css", not_found_css)
        .route("/api/rooms", post(create_room))
        .route("/api/rooms/{code}", get(room_status))
        .route("/api/rooms/{code}/join", post(join_room))
        .route("/api/rooms/{code}/action", post(host_action))
        .route("/api/rooms/{code}/answer", post(answer))
        .route("/ws/{code}", get(websocket))
        .nest_service("/assets", assets)
        .route_service("/favicon.svg", favicon)
        .route_service("/", spa.clone())
        .route_service("/demo", spa.clone())
        .route_service("/create", spa.clone())
        .route_service("/play", spa.clone())
        .route_service("/host", spa.clone())
        .route_service("/privacy", spa.clone())
        .route_service("/terms", spa.clone())
        .route_service("/404", spa)
        .fallback(not_found_page)
        .layer(RequestBodyLimitLayer::new(256 * 1024))
        .layer(CompressionLayer::new())
        .layer(TraceLayer::new_for_http())
        .layer(middleware::from_fn(security_headers))
        .layer(middleware::from_fn_with_state(state.clone(), rate_limit))
        .with_state(state)
}

async fn not_found_page(State(state): State<Arc<AppState>>) -> Response {
    let build = state.build_sha.chars().take(12).collect::<String>();
    (
        StatusCode::NOT_FOUND,
        [(header::CONTENT_TYPE, "text/html; charset=utf-8")],
        include_str!("../src-web/public/404.html").replace("__BUILD_SHA__", &build),
    )
        .into_response()
}

async fn health(State(state): State<Arc<AppState>>) -> Json<Value> {
    Json(json!({ "status": "ok", "build": state.build_sha }))
}

async fn robots() -> Response {
    (
        [(header::CONTENT_TYPE, "text/plain; charset=utf-8")],
        include_str!("../src-web/public/robots.txt"),
    )
        .into_response()
}

#[derive(Deserialize)]
struct CreateRequest {
    quiz: Quiz,
}
async fn create_room(
    State(state): State<Arc<AppState>>,
    Json(mut request): Json<CreateRequest>,
) -> ApiResult {
    request
        .quiz
        .validate()
        .map_err(|e| ApiError::bad_request(&e))?;
    let quiz = request.quiz.clone();
    let (code, host_token) = state.create_room(request.quiz).await;
    Ok((
        StatusCode::CREATED,
        Json(json!({ "code": code, "host_token": host_token, "quiz": quiz })),
    ))
}

async fn room_status(State(state): State<Arc<AppState>>, Path(code): Path<String>) -> ApiResult {
    let room = state
        .room(&normalized_code(&code))
        .await
        .ok_or_else(ApiError::not_found)?;
    let room = room.lock().await;
    Ok((StatusCode::OK, Json(snapshot(&room, Viewer::Guest))))
}

#[derive(Deserialize)]
struct JoinRequest {
    nickname: String,
    reconnect_token: Option<String>,
}
async fn join_room(
    State(state): State<Arc<AppState>>,
    Path(code): Path<String>,
    Json(request): Json<JoinRequest>,
) -> ApiResult {
    let room = state
        .room(&normalized_code(&code))
        .await
        .ok_or_else(ApiError::not_found)?;
    let mut room = room.lock().await;
    if let Some(token) = request.reconnect_token.as_deref() {
        if let Some(player) = room.reconnect(token) {
            return Ok((
                StatusCode::OK,
                Json(
                    json!({ "player_id": player.id, "nickname": player.nickname, "player_token": token, "reconnected": true }),
                ),
            ));
        }
    }
    let token = Uuid::new_v4().simple().to_string();
    let id = Uuid::new_v4().simple().to_string();
    let player = room
        .add_player(&request.nickname, token.clone(), id)
        .map_err(map_room_error)?;
    let result = json!({ "player_id": player.id, "nickname": player.nickname, "player_token": token, "reconnected": false });
    Ok((StatusCode::CREATED, Json(result)))
}

#[derive(Deserialize)]
struct ActionRequest {
    host_token: String,
    action: String,
}
async fn host_action(
    State(state): State<Arc<AppState>>,
    Path(code): Path<String>,
    Json(request): Json<ActionRequest>,
) -> ApiResult {
    let room = state
        .room(&normalized_code(&code))
        .await
        .ok_or_else(ApiError::not_found)?;
    let mut room = room.lock().await;
    room.authorize_host(&request.host_token)
        .map_err(map_room_error)?;
    match request.action.as_str() {
        "start" => room.start().map_err(map_room_error)?,
        "advance" => room.advance().map_err(map_room_error)?,
        "end" => room.end(),
        _ => return Err(ApiError::bad_request("Unknown host action.")),
    }
    Ok((StatusCode::OK, Json(snapshot(&room, Viewer::Host))))
}

#[derive(Deserialize)]
struct AnswerRequest {
    player_token: String,
    choice: usize,
}
async fn answer(
    State(state): State<Arc<AppState>>,
    Path(code): Path<String>,
    Json(request): Json<AnswerRequest>,
) -> ApiResult {
    let room = state
        .room(&normalized_code(&code))
        .await
        .ok_or_else(ApiError::not_found)?;
    let mut room = room.lock().await;
    let elapsed = room
        .question_started
        .map(|started| started.elapsed())
        .unwrap_or(Duration::ZERO);
    let result = room
        .submit_answer(&request.player_token, request.choice, elapsed)
        .map_err(map_room_error)?;
    Ok((
        StatusCode::OK,
        Json(json!({ "accepted": true, "choice": result.choice })),
    ))
}

#[derive(Deserialize)]
struct WsQuery {
    role: Option<String>,
    token: Option<String>,
}
async fn websocket(
    State(state): State<Arc<AppState>>,
    Path(code): Path<String>,
    Query(query): Query<WsQuery>,
    ws: WebSocketUpgrade,
) -> Response {
    let code = normalized_code(&code);
    let Some(room) = state.room(&code).await else {
        return ApiError::not_found().into_response();
    };
    let viewer = {
        let room = room.lock().await;
        match query.role.as_deref() {
            Some("host")
                if query
                    .token
                    .as_deref()
                    .is_some_and(|token| room.authorize_host(token).is_ok()) =>
            {
                Viewer::Host
            }
            Some("player") => query
                .token
                .as_deref()
                .and_then(|token| room.reconnect(token).map(|p| Viewer::Player(p.id.clone())))
                .unwrap_or(Viewer::Guest),
            _ => Viewer::Guest,
        }
    };
    if matches!(viewer, Viewer::Guest) {
        return ApiError::unauthorized().into_response();
    }
    ws.on_upgrade(move |socket| websocket_loop(socket, room, viewer))
}

#[derive(Clone)]
enum Viewer {
    Host,
    Player(String),
    Guest,
}

async fn websocket_loop(socket: WebSocket, room: SharedRoom, viewer: Viewer) {
    let (mut sender, mut receiver) = socket.split();
    let mut updates = {
        let mut room = room.lock().await;
        if matches!(viewer, Viewer::Host) {
            room.host_connected = true;
            room.touch();
        }
        let initial = snapshot(&room, viewer.clone()).to_string();
        let updates = room.updates.subscribe();
        if sender.send(Message::Text(initial.into())).await.is_err() {
            return;
        }
        updates
    };
    loop {
        tokio::select! {
            update = updates.recv() => {
                if update.is_err() { break; }
                let state = { let room = room.lock().await; snapshot(&room, viewer.clone()).to_string() };
                if sender.send(Message::Text(state.into())).await.is_err() { break; }
            }
            message = receiver.next() => match message {
                Some(Ok(Message::Ping(data))) => { if sender.send(Message::Pong(data)).await.is_err() { break; } }
                Some(Ok(Message::Close(_))) | None | Some(Err(_)) => break,
                _ => {}
            }
        }
    }
    if matches!(viewer, Viewer::Host) {
        let mut room = room.lock().await;
        room.host_connected = false;
        room.touch();
    }
}

fn snapshot(room: &Room, viewer: Viewer) -> Value {
    let current = room.question_index.map(|index| {
        let question = &room.quiz.questions[index];
        let reveal = matches!(room.phase, Phase::Leaderboard | Phase::Finished);
        let mut value = json!({
            "number": index + 1, "total": room.quiz.questions.len(), "prompt": question.prompt,
            "answers": question.answers, "time_limit_seconds": question.time_limit_seconds,
            "answered": room.players.values().filter(|p| p.answers.contains_key(&index)).count()
        });
        if reveal || matches!(viewer, Viewer::Host) {
            value["correct_index"] = json!(question.correct_index);
        }
        value
    });
    let mut leaders: Vec<_> = room
        .players
        .values()
        .map(|p| json!({ "nickname": p.nickname, "score": p.score, "streak": p.streak }))
        .collect();
    leaders.sort_by_key(|p| std::cmp::Reverse(p["score"].as_u64().unwrap_or(0)));
    let me = match &viewer { Viewer::Player(id) => room.players.get(id).map(|p| {
        let answer = room.question_index.and_then(|index| p.answers.get(&index));
        json!({ "nickname": p.nickname, "score": p.score, "answered": answer.is_some(), "choice": answer.map(|a| a.choice), "correct": if matches!(room.phase, Phase::Leaderboard | Phase::Finished) { answer.map(|a| a.correct) } else { None }, "points": if matches!(room.phase, Phase::Leaderboard | Phase::Finished) { answer.map(|a| a.points) } else { None } })
    }), _ => None };
    json!({ "type": "state", "code": room.code, "quiz_title": room.quiz.title, "phase": room.phase, "player_count": room.players.len(), "host_connected": room.host_connected, "current": current, "leaderboard": leaders, "me": me, "revision": room.revision })
}

type ApiResult = Result<(StatusCode, Json<Value>), ApiError>;
struct ApiError {
    status: StatusCode,
    message: String,
}
impl ApiError {
    fn bad_request(message: &str) -> Self {
        Self {
            status: StatusCode::BAD_REQUEST,
            message: message.into(),
        }
    }
    fn not_found() -> Self {
        Self {
            status: StatusCode::NOT_FOUND,
            message: "That room is not active. Check the code with your host.".into(),
        }
    }
    fn unauthorized() -> Self {
        Self {
            status: StatusCode::UNAUTHORIZED,
            message: "This session token is not valid.".into(),
        }
    }
}
impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        (self.status, Json(json!({ "error": self.message }))).into_response()
    }
}
fn map_room_error(error: RoomError) -> ApiError {
    match error {
        RoomError::Unauthorized => ApiError::unauthorized(),
        RoomError::NotFound => ApiError::not_found(),
        RoomError::AlreadyAnswered => ApiError {
            status: StatusCode::CONFLICT,
            message: "Your answer was already received.".into(),
        },
        RoomError::WrongPhase => ApiError {
            status: StatusCode::CONFLICT,
            message: "That action is not available right now.".into(),
        },
        RoomError::InvalidChoice => ApiError::bad_request("That answer choice does not exist."),
    }
}
fn normalized_code(code: &str) -> String {
    code.chars().filter(char::is_ascii_digit).take(6).collect()
}

async fn security_headers(request: Request<Body>, next: Next) -> Response {
    let immutable_asset = request.uri().path().starts_with("/assets/");
    let mut response = next.run(request).await;
    let headers = response.headers_mut();
    headers.insert(
        "x-content-type-options",
        HeaderValue::from_static("nosniff"),
    );
    headers.insert("x-frame-options", HeaderValue::from_static("DENY"));
    headers.insert("referrer-policy", HeaderValue::from_static("no-referrer"));
    headers.insert(
        "strict-transport-security",
        HeaderValue::from_static("max-age=31536000; includeSubDomains"),
    );
    headers.insert(
        "permissions-policy",
        HeaderValue::from_static("camera=(), microphone=(), geolocation=()"),
    );
    headers.insert("content-security-policy", HeaderValue::from_static("default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self' ws: wss:; img-src 'self' data:; font-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'"));
    headers.insert(
        header::CACHE_CONTROL,
        if immutable_asset {
            HeaderValue::from_static("public, max-age=31536000, immutable")
        } else {
            HeaderValue::from_static("no-store")
        },
    );
    response
}

async fn rate_limit(
    State(state): State<Arc<AppState>>,
    request: Request<Body>,
    next: Next,
) -> Response {
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();
    let previous = state.rate_second.load(Ordering::Relaxed);
    if previous != now
        && state
            .rate_second
            .compare_exchange(previous, now, Ordering::Relaxed, Ordering::Relaxed)
            .is_ok()
    {
        state.rate_count.store(0, Ordering::Relaxed);
    }
    if state.rate_count.fetch_add(1, Ordering::Relaxed) > 2000 {
        return (
            StatusCode::TOO_MANY_REQUESTS,
            [(header::RETRY_AFTER, "1")],
            Json(json!({ "error": "Too many requests. Wait a moment and try again." })),
        )
            .into_response();
    }
    let client = request
        .headers()
        .get("x-forwarded-for")
        .and_then(|value| value.to_str().ok())
        .and_then(|value| value.split(',').next())
        .or_else(|| {
            request
                .headers()
                .get("x-real-ip")
                .and_then(|value| value.to_str().ok())
        })
        .unwrap_or("direct")
        .trim()
        .to_owned();
    let limited = {
        let mut clients = state
            .rate_clients
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner());
        if clients.len() > 10_000 {
            clients.retain(|_, (second, _)| *second + 10 >= now);
        }
        let entry = clients.entry(client).or_insert((now, 0));
        if entry.0 != now {
            *entry = (now, 0);
        }
        entry.1 += 1;
        entry.1 > 180
    };
    if limited {
        return (StatusCode::TOO_MANY_REQUESTS, [(header::RETRY_AFTER, "1")], Json(json!({ "error": "Too many requests from this connection. Wait a moment and try again." }))).into_response();
    }
    next.run(request).await
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::http::Request;
    use http_body_util::BodyExt;
    use tower::ServiceExt;

    fn quiz_json() -> Value {
        json!({ "title":"Eight", "questions": (1..=8).map(|i| json!({"prompt":format!("Question {i}?"),"answers":["A","B","C","D"],"correct_index":0,"time_limit_seconds":20})).collect::<Vec<_>>() })
    }
    #[tokio::test]
    async fn lifecycle_api_and_unique_codes() {
        let state = Arc::new(AppState::new());
        let app = app(state.clone());
        let create = || {
            Request::builder()
                .method("POST")
                .uri("/api/rooms")
                .header("content-type", "application/json")
                .body(Body::from(json!({"quiz":quiz_json()}).to_string()))
                .unwrap()
        };
        let response = app.clone().oneshot(create()).await.unwrap();
        assert_eq!(response.status(), StatusCode::CREATED);
        let value: Value =
            serde_json::from_slice(&response.into_body().collect().await.unwrap().to_bytes())
                .unwrap();
        let code = value["code"].as_str().unwrap();
        let host = value["host_token"].as_str().unwrap();
        assert_eq!(code.len(), 6);
        let response2 = app.clone().oneshot(create()).await.unwrap();
        let value2: Value =
            serde_json::from_slice(&response2.into_body().collect().await.unwrap().to_bytes())
                .unwrap();
        assert_ne!(code, value2["code"]);
        let join = Request::builder()
            .method("POST")
            .uri(format!("/api/rooms/{code}/join"))
            .header("content-type", "application/json")
            .body(Body::from(r#"{"nickname":"Sam"}"#))
            .unwrap();
        assert_eq!(
            app.clone().oneshot(join).await.unwrap().status(),
            StatusCode::CREATED
        );
        let bad = Request::builder()
            .method("POST")
            .uri(format!("/api/rooms/{code}/action"))
            .header("content-type", "application/json")
            .body(Body::from(r#"{"host_token":"wrong","action":"start"}"#))
            .unwrap();
        assert_eq!(
            app.clone().oneshot(bad).await.unwrap().status(),
            StatusCode::UNAUTHORIZED
        );
        let start = Request::builder()
            .method("POST")
            .uri(format!("/api/rooms/{code}/action"))
            .header("content-type", "application/json")
            .body(Body::from(
                json!({"host_token":host,"action":"start"}).to_string(),
            ))
            .unwrap();
        assert_eq!(app.oneshot(start).await.unwrap().status(), StatusCode::OK);
    }
    #[tokio::test]
    #[doc = "@claim:temporary-room-expiry"]
    async fn claim_temporary_room_expiry() {
        let state = AppState::new();
        let (code, _) = state
            .create_room(serde_json::from_value(quiz_json()).unwrap())
            .await;
        state.rooms.read().await[&code].lock().await.finished_at =
            Some(Instant::now() - crate::model::FINISHED_TTL);
        assert_eq!(state.purge_expired().await, 1);
        assert!(state.rooms.read().await.is_empty());

        let (code, _) = state
            .create_room(serde_json::from_value(quiz_json()).unwrap())
            .await;
        state.rooms.read().await[&code].lock().await.touched_at =
            Instant::now() - crate::model::ACTIVE_TTL;
        assert_eq!(state.purge_expired().await, 1);
        assert!(state.rooms.read().await.is_empty());
    }
    #[tokio::test]
    async fn room_accepts_at_least_40_concurrent_learners() {
        let state = Arc::new(AppState::new());
        let (code, _) = state
            .create_room(serde_json::from_value(quiz_json()).unwrap())
            .await;
        let room = state.room(&code).await.unwrap();
        let mut tasks = Vec::new();
        for index in 0..40 {
            let room = room.clone();
            tasks.push(tokio::spawn(async move {
                room.lock()
                    .await
                    .add_player(
                        &format!("Player {index}"),
                        format!("token-{index}"),
                        format!("id-{index}"),
                    )
                    .map(|_| ())
            }));
        }
        for task in tasks {
            task.await.unwrap().unwrap();
        }
        assert_eq!(room.lock().await.players.len(), 40);
    }
    #[tokio::test]
    async fn health_exposes_configured_build_sha_and_security_headers() {
        let app = app(Arc::new(AppState::with_build_sha("21029cf3e036")));
        let response = app
            .oneshot(
                Request::builder()
                    .uri("/health")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::OK);
        assert_eq!(
            response.headers().get("strict-transport-security").unwrap(),
            "max-age=31536000; includeSubDomains"
        );
        let body: Value =
            serde_json::from_slice(&response.into_body().collect().await.unwrap().to_bytes())
                .unwrap();
        assert_eq!(body["status"], "ok");
        assert_eq!(body["build"], "21029cf3e036");
    }
    #[tokio::test]
    async fn robots_is_plain_text_and_not_the_spa_fallback() {
        let app = app(Arc::new(AppState::with_build_sha("test")));
        let response = app
            .oneshot(
                Request::builder()
                    .uri("/robots.txt")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::OK);
        assert!(response
            .headers()
            .get(header::CONTENT_TYPE)
            .unwrap()
            .to_str()
            .unwrap()
            .starts_with("text/plain"));
        assert_eq!(
            response.headers().get("strict-transport-security").unwrap(),
            "max-age=31536000; includeSubDomains"
        );
        let body = response.into_body().collect().await.unwrap().to_bytes();
        assert!(std::str::from_utf8(&body)
            .unwrap()
            .starts_with("User-agent: *"));
    }
}
