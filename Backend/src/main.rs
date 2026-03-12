mod database;
use axum::{
    routing::{get, delete},
    Json, Router,
    extract::Path,
    response::IntoResponse,
    http::StatusCode,
};
use tower_http::cors::CorsLayer;
use axum::http::Method;
use serde::Deserialize;
use std::net::{SocketAddr, UdpSocket};


fn get_local_ip() -> String {
    let socket = UdpSocket::bind("0.0.0.0:0").unwrap();
    socket.connect("8.8.8.8:80").unwrap();
    socket.local_addr().unwrap().ip().to_string()
}

pub async fn run() {
    let app = Router::new()
        // need to add the endpoints here
        .layer(
            CorsLayer::new()
                .allow_origin(tower_http::cors::Any)
                .allow_methods([Method::GET, Method::POST, Method::PUT, Method::DELETE])
                .allow_headers(tower_http::cors::Any),
        );
    let addr = SocketAddr::from(([0,0,0,0], 3000));
    let local_ip = get_local_ip();

    println!("Server running on http://{}:3000", local_ip);

    let listener = tokio::net::TcpListener::bind(addr)
        .await
        .unwrap();

    axum::serve(listener, app)
        .await
        .unwrap();
}

#[tokio::main]
async fn main() {
    run().await;
}