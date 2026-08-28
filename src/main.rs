use open_quiz_arena::server::{app, AppState};
use std::{env, net::SocketAddr, sync::Arc, time::Duration};
use tokio::signal;
use tracing::info;
use tracing_subscriber::EnvFilter;

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .json()
        .with_env_filter(
            EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "open_quiz_arena=info,tower_http=info".into()),
        )
        .init();

    let supplied_port = env::var("PORT").ok().and_then(|value| value.parse().ok());
    let port = supplied_port.unwrap_or(8080);
    let state = Arc::new(AppState::new());
    let purge_state = state.clone();
    tokio::spawn(async move {
        let mut ticker = tokio::time::interval(Duration::from_secs(30));
        loop {
            ticker.tick().await;
            purge_state.purge_expired().await;
        }
    });
    let address = SocketAddr::from(([0, 0, 0, 0], port));
    let listener = tokio::net::TcpListener::bind(address)
        .await
        .expect("bind server");
    let build_sha = state.build_sha();
    info!(%address, %build_sha, port_config = if supplied_port.is_some() { "supplied" } else { "defaulted" }, "server_started");
    axum::serve(listener, app(state))
        .with_graceful_shutdown(shutdown_signal())
        .await
        .expect("serve");
    info!("server_stopped");
}

async fn shutdown_signal() {
    let ctrl_c = async { signal::ctrl_c().await.expect("install Ctrl+C handler") };
    #[cfg(unix)]
    let terminate = async {
        signal::unix::signal(signal::unix::SignalKind::terminate())
            .expect("install signal handler")
            .recv()
            .await;
    };
    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();
    tokio::select! { _ = ctrl_c => {}, _ = terminate => {} }
}
