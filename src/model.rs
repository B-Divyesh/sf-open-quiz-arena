use serde::{Deserialize, Serialize};
use std::{
    collections::{HashMap, HashSet},
    time::{Duration, Instant},
};
use tokio::sync::broadcast;

pub const MAX_QUESTIONS: usize = 50;
pub const ACTIVE_TTL: Duration = Duration::from_secs(2 * 60 * 60);
pub const FINISHED_TTL: Duration = Duration::from_secs(10 * 60);

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct Quiz {
    pub title: String,
    pub questions: Vec<Question>,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct Question {
    pub prompt: String,
    pub answers: Vec<String>,
    pub correct_index: usize,
    #[serde(default = "default_time")]
    pub time_limit_seconds: u16,
}

fn default_time() -> u16 {
    20
}

impl Quiz {
    pub fn validate(&mut self) -> Result<(), String> {
        self.title = clean_text(&self.title, 100);
        if self.title.is_empty() {
            return Err("Give your quiz a title.".into());
        }
        if self.questions.is_empty() || self.questions.len() > MAX_QUESTIONS {
            return Err(format!("Add between 1 and {MAX_QUESTIONS} questions."));
        }
        for (index, question) in self.questions.iter_mut().enumerate() {
            question.prompt = clean_text(&question.prompt, 240);
            if question.prompt.is_empty() {
                return Err(format!("Question {} needs a prompt.", index + 1));
            }
            if !(2..=4).contains(&question.answers.len()) {
                return Err(format!("Question {} needs 2 to 4 answers.", index + 1));
            }
            for answer in &mut question.answers {
                *answer = clean_text(answer, 120);
            }
            if question.answers.iter().any(String::is_empty) {
                return Err(format!("Question {} has an empty answer.", index + 1));
            }
            if question.correct_index >= question.answers.len() {
                return Err(format!(
                    "Question {} has no valid correct answer.",
                    index + 1
                ));
            }
            if !(5..=120).contains(&question.time_limit_seconds) {
                return Err(format!(
                    "Question {} time must be between 5 and 120 seconds.",
                    index + 1
                ));
            }
        }
        Ok(())
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum Phase {
    Lobby,
    Question,
    Leaderboard,
    Finished,
}

#[derive(Clone, Debug)]
pub struct AnswerRecord {
    pub choice: usize,
    pub correct: bool,
    pub points: u32,
}

#[derive(Clone, Debug)]
pub struct Player {
    pub id: String,
    pub token: String,
    pub nickname: String,
    pub score: u32,
    pub streak: u16,
    pub answers: HashMap<usize, AnswerRecord>,
}

pub struct Room {
    pub code: String,
    pub host_token: String,
    pub quiz: Quiz,
    pub phase: Phase,
    pub question_index: Option<usize>,
    pub question_started: Option<Instant>,
    pub players: HashMap<String, Player>,
    pub player_tokens: HashMap<String, String>,
    pub created_at: Instant,
    pub touched_at: Instant,
    pub finished_at: Option<Instant>,
    pub host_connected: bool,
    pub revision: u64,
    pub updates: broadcast::Sender<u64>,
}

#[derive(Debug, PartialEq, Eq)]
pub enum RoomError {
    Unauthorized,
    WrongPhase,
    InvalidChoice,
    AlreadyAnswered,
    NotFound,
}

impl Room {
    pub fn new(code: String, quiz: Quiz, host_token: String) -> Self {
        let (updates, _) = broadcast::channel(128);
        let now = Instant::now();
        Self {
            code,
            host_token,
            quiz,
            phase: Phase::Lobby,
            question_index: None,
            question_started: None,
            players: HashMap::new(),
            player_tokens: HashMap::new(),
            created_at: now,
            touched_at: now,
            finished_at: None,
            host_connected: false,
            revision: 0,
            updates,
        }
    }

    pub fn authorize_host(&self, token: &str) -> Result<(), RoomError> {
        if constant_time_eq(self.host_token.as_bytes(), token.as_bytes()) {
            Ok(())
        } else {
            Err(RoomError::Unauthorized)
        }
    }

    pub fn add_player(
        &mut self,
        requested: &str,
        token: String,
        id: String,
    ) -> Result<&Player, RoomError> {
        let nickname = unique_nickname(
            sanitize_nickname(requested),
            self.players.values().map(|p| p.nickname.as_str()),
        );
        self.player_tokens.insert(token.clone(), id.clone());
        self.players.insert(
            id.clone(),
            Player {
                id: id.clone(),
                token,
                nickname,
                score: 0,
                streak: 0,
                answers: HashMap::new(),
            },
        );
        self.touch();
        Ok(self.players.get(&id).expect("player inserted"))
    }

    pub fn reconnect(&self, token: &str) -> Option<&Player> {
        self.player_tokens
            .get(token)
            .and_then(|id| self.players.get(id))
    }

    pub fn start(&mut self) -> Result<(), RoomError> {
        if self.phase != Phase::Lobby {
            return Err(RoomError::WrongPhase);
        }
        self.phase = Phase::Question;
        self.question_index = Some(0);
        self.question_started = Some(Instant::now());
        self.touch();
        Ok(())
    }

    pub fn advance(&mut self) -> Result<(), RoomError> {
        match self.phase {
            Phase::Question => {
                self.phase = Phase::Leaderboard;
            }
            Phase::Leaderboard => {
                let next = self.question_index.unwrap_or(0) + 1;
                if next >= self.quiz.questions.len() {
                    self.phase = Phase::Finished;
                    self.finished_at = Some(Instant::now());
                } else {
                    self.phase = Phase::Question;
                    self.question_index = Some(next);
                    self.question_started = Some(Instant::now());
                }
            }
            _ => return Err(RoomError::WrongPhase),
        }
        self.touch();
        Ok(())
    }

    pub fn end(&mut self) {
        self.phase = Phase::Finished;
        self.finished_at = Some(Instant::now());
        self.touch();
    }

    pub fn submit_answer(
        &mut self,
        player_token: &str,
        choice: usize,
        elapsed: Duration,
    ) -> Result<AnswerRecord, RoomError> {
        if self.phase != Phase::Question {
            return Err(RoomError::WrongPhase);
        }
        let q_index = self.question_index.ok_or(RoomError::WrongPhase)?;
        let question = &self.quiz.questions[q_index];
        if choice >= question.answers.len() {
            return Err(RoomError::InvalidChoice);
        }
        let id = self
            .player_tokens
            .get(player_token)
            .cloned()
            .ok_or(RoomError::Unauthorized)?;
        let player = self.players.get_mut(&id).ok_or(RoomError::Unauthorized)?;
        if player.answers.contains_key(&q_index) {
            return Err(RoomError::AlreadyAnswered);
        }
        let correct = choice == question.correct_index;
        let points = if correct {
            speed_score(
                elapsed,
                Duration::from_secs(question.time_limit_seconds.into()),
            )
        } else {
            0
        };
        if correct {
            player.score = player.score.saturating_add(points);
            player.streak = player.streak.saturating_add(1);
        } else {
            player.streak = 0;
        }
        let answer = AnswerRecord {
            choice,
            correct,
            points,
        };
        player.answers.insert(q_index, answer.clone());
        self.touch();
        Ok(answer)
    }

    pub fn touch(&mut self) {
        self.touched_at = Instant::now();
        self.revision += 1;
        let _ = self.updates.send(self.revision);
    }

    pub fn expired(&self, now: Instant) -> bool {
        match self.finished_at {
            Some(finished) => now.duration_since(finished) >= FINISHED_TTL,
            None => now.duration_since(self.touched_at) >= ACTIVE_TTL,
        }
    }
}

pub fn speed_score(elapsed: Duration, limit: Duration) -> u32 {
    if elapsed >= limit || limit.is_zero() {
        return 500;
    }
    let ratio = 1.0 - elapsed.as_secs_f64() / limit.as_secs_f64();
    500 + (ratio * 500.0).round() as u32
}

pub fn clean_text(value: &str, max: usize) -> String {
    value
        .chars()
        .filter(|c| !c.is_control())
        .take(max)
        .collect::<String>()
        .split_whitespace()
        .collect::<Vec<_>>()
        .join(" ")
}

pub fn sanitize_nickname(value: &str) -> String {
    const BLOCKED: &[&str] = &["fuck", "shit", "bitch", "cunt", "nigger", "nigga", "faggot"];
    let mut cleaned: String = value
        .chars()
        .filter(|c| c.is_alphanumeric() || matches!(c, ' ' | '-' | '_' | '\'' | '’'))
        .take(24)
        .collect();
    cleaned = cleaned.split_whitespace().collect::<Vec<_>>().join(" ");
    if cleaned.is_empty() {
        cleaned = "Player".into();
    }
    let lower = cleaned.to_lowercase();
    if BLOCKED.iter().any(|word| lower.contains(word)) {
        "Player".into()
    } else {
        cleaned
    }
}

fn unique_nickname(base: String, existing: impl Iterator<Item = impl AsRef<str>>) -> String {
    let names: HashSet<String> = existing.map(|s| s.as_ref().to_lowercase()).collect();
    if !names.contains(&base.to_lowercase()) {
        return base;
    }
    for suffix in 2..=999 {
        let candidate = format!("{base} · {suffix}");
        if !names.contains(&candidate.to_lowercase()) {
            return candidate;
        }
    }
    format!("Player · {}", names.len() + 1)
}

fn constant_time_eq(a: &[u8], b: &[u8]) -> bool {
    if a.len() != b.len() {
        return false;
    }
    a.iter().zip(b).fold(0u8, |diff, (x, y)| diff | (x ^ y)) == 0
}

#[cfg(test)]
mod tests {
    use super::*;
    fn quiz() -> Quiz {
        Quiz {
            title: "Test".into(),
            questions: vec![Question {
                prompt: "One?".into(),
                answers: vec!["Yes".into(), "No".into()],
                correct_index: 0,
                time_limit_seconds: 20,
            }],
        }
    }

    #[test]
    fn score_is_deterministic_and_bounded() {
        assert_eq!(speed_score(Duration::ZERO, Duration::from_secs(20)), 1000);
        assert_eq!(
            speed_score(Duration::from_secs(10), Duration::from_secs(20)),
            750
        );
        assert_eq!(
            speed_score(Duration::from_secs(30), Duration::from_secs(20)),
            500
        );
    }
    #[test]
    fn answer_is_idempotent() {
        let mut room = Room::new("123456".into(), quiz(), "host".into());
        room.add_player("Lee", "token".into(), "id".into()).unwrap();
        room.start().unwrap();
        assert_eq!(
            room.submit_answer("token", 0, Duration::from_secs(5))
                .unwrap()
                .points,
            875
        );
        assert_eq!(
            room.submit_answer("token", 0, Duration::from_secs(5))
                .unwrap_err(),
            RoomError::AlreadyAnswered
        );
        assert_eq!(room.players["id"].score, 875);
    }
    #[test]
    fn reconnect_and_host_authorization() {
        let mut room = Room::new("123456".into(), quiz(), "host".into());
        room.add_player("Lee", "again".into(), "id".into()).unwrap();
        assert_eq!(room.reconnect("again").unwrap().id, "id");
        assert!(room.authorize_host("host").is_ok());
        assert_eq!(room.authorize_host("no"), Err(RoomError::Unauthorized));
    }
    #[test]
    fn nicknames_are_sanitized_and_unique() {
        let mut room = Room::new("123456".into(), quiz(), "host".into());
        room.add_player("  Alex<script> ", "a".into(), "1".into())
            .unwrap();
        room.add_player("Alexscript", "b".into(), "2".into())
            .unwrap();
        assert_eq!(room.players["1"].nickname, "Alexscript");
        assert_eq!(room.players["2"].nickname, "Alexscript · 2");
        assert_eq!(sanitize_nickname("shitty"), "Player");
    }
    #[test]
    fn lifecycle_and_expiry() {
        let mut room = Room::new("123456".into(), quiz(), "host".into());
        room.start().unwrap();
        assert_eq!(room.phase, Phase::Question);
        room.advance().unwrap();
        assert_eq!(room.phase, Phase::Leaderboard);
        room.advance().unwrap();
        assert_eq!(room.phase, Phase::Finished);
        room.finished_at = Some(Instant::now() - FINISHED_TTL);
        assert!(room.expired(Instant::now()));
    }
    #[test]
    fn quiz_limits_are_enforced() {
        let mut q = quiz();
        q.questions[0].answers = vec!["one".into()];
        assert!(q.validate().is_err());
        let mut q = quiz();
        q.questions[0].time_limit_seconds = 2;
        assert!(q.validate().is_err());
    }
}
