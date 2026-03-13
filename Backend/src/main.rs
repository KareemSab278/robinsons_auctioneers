mod database;
mod queries;
mod structs;
mod response;
mod crud;
mod authentication;

use axum::{
    routing::{ get, post, put, delete },
    extract::{ Path, Json },
    response::IntoResponse,
    http::StatusCode,
    Router,
};
use tower_http::cors::CorsLayer;
use axum::http::Method;
use std::net::{ SocketAddr, UdpSocket };

use response::ApiResponse;
use structs::Auction;

fn get_local_ip() -> String {
    let socket = UdpSocket::bind("0.0.0.0:0").unwrap();
    socket.connect("8.8.8.8:80").unwrap();
    socket.local_addr().unwrap().ip().to_string()
}

pub async fn run() {
    database
        ::initialize_db()
        .expect(
            "Failed to initialize database. Check permissions and try again. Message from main.rs"
        );

    let app = Router::new()
        .route("/health", get(health))
        .route("/api/session/validate", post(session_check))

        // auction routes
        .route("/api/auctions/active", get(get_active_auctions))
        .route("/api/auctions/ended", get(get_ended_auctions))
        .route("/api/auctions/:id", get(get_auction))
        .route("/api/auctions/user/:user_id", get(get_user_auctions))
        .route("/api/auctions", post(create_auction))
        .route("/api/auctions/:id", put(update_auction))
        .route("/api/auctions/:id", delete(delete_auction))
        .route("/api/auctions/:id/end", post(end_auction))
        .route("/api/auctions/:id/bids", get(get_auction_bids))
        .route("/api/auctions/:id/bids/max", get(get_max_bid))

        // bid routes
        .route("/api/bids", post(place_bid))
        .route("/api/bids/:id", delete(delete_bid))

        // user routes
        .route("/api/users/id/:id", get(get_user_by_id))
        .route("/api/users/:id", put(update_user))
        .route("/api/users/:id", delete(delete_user))
        .route("/api/users/:id/won", get(get_user_won_auctions))

        .route("/api/register", post(register))
        .route("/api/login", post(login))
        .route("/api/admin/login", post(admin_login))

        .layer(
            CorsLayer::new()
                .allow_origin(tower_http::cors::Any)
                .allow_methods([Method::GET, Method::POST, Method::PUT, Method::DELETE])
                .allow_headers(tower_http::cors::Any)
        );

    let addr = SocketAddr::from(([0, 0, 0, 0], 3000));
    let local_ip = get_local_ip();

    println!("Server running on http://{}:3000", local_ip);

    let listener = tokio::net::TcpListener
        ::bind(addr).await
        .expect("Failed to bind to address. Check if port 3000 is already in use and try again.");

    axum::serve(listener, app).await.expect(
        "Failed to start server. Check if port 3000 is already in use and try again."
    );
}

async fn health() -> impl IntoResponse {
    Json(ApiResponse::ok("ok"))
}

async fn session_check(Json(payload): Json<structs::SessionReq>) -> impl IntoResponse {
    let valid = authentication::session_valid(&payload.session_expiry);
    Json(ApiResponse::<bool>::session_passed(valid))
    // returns true if session is valid, false if expired or invalid format
}

async fn get_active_auctions() -> impl IntoResponse {
    match database::open_connection().and_then(|conn| crud::get_all_active_auctions(&conn)) {
        Ok(list) => (StatusCode::OK, Json(ApiResponse::ok(list))),
        Err(e) =>
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::<Vec<Auction>>::fail(e.to_string())),
            ),
    }
}

async fn get_ended_auctions() -> impl IntoResponse {
    match database::open_connection().and_then(|conn| crud::get_all_ended_auctions(&conn)) {
        Ok(list) => (StatusCode::OK, Json(ApiResponse::ok(list))),
        Err(e) =>
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::<Vec<Auction>>::fail(e.to_string())),
            ),
    }
}

async fn get_auction(Path(id): Path<i64>) -> impl IntoResponse {
    match database::open_connection().and_then(|conn| crud::get_auction_by_id(&conn, id)) {
        Ok(Some(a)) => (StatusCode::OK, Json(ApiResponse::ok(a))),
        Ok(None) =>
            (StatusCode::NOT_FOUND, Json(ApiResponse::<Auction>::fail("Auction not found"))),
        Err(e) =>
            (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::<Auction>::fail(e.to_string()))),
    }
}

async fn get_user_auctions(Path(user_id): Path<i64>) -> impl IntoResponse {
    match database::open_connection().and_then(|conn| crud::get_user_auctions(&conn, user_id)) {
        Ok(list) => (StatusCode::OK, Json(ApiResponse::ok(list))),
        Err(e) =>
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::<Vec<Auction>>::fail(e.to_string())),
            ),
    }
}

async fn create_auction(Json(payload): Json<structs::CreateAuctionReq>) -> impl IntoResponse {
    let desc_ref = payload.description.as_deref();
    match
        database
            ::open_connection()
            .and_then(|conn| {
                crud::create_auction(
                    &conn,
                    &payload.title,
                    desc_ref,
                    payload.starting_price,
                    payload.seller_id,
                    &payload.end_time
                )
            })
    {
        Ok(id) => (StatusCode::OK, Json(ApiResponse::ok(id))),
        Err(e) =>
            (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::<i64>::fail(e.to_string()))),
    }
}

async fn update_auction(
    Path(id): Path<i64>,
    Json(payload): Json<structs::UpdateAuctionReq>
) -> impl IntoResponse {
    if !authentication::session_valid(&payload.session_expiry) {
        return (StatusCode::UNAUTHORIZED, Json(ApiResponse::<bool>::fail_with_session("Session expired", false)),
);
    }
    let result = database::open_connection().and_then(|conn| {
        // fetch current active flag so we don't accidentally reactivate ended auctions
        let is_active = crud
            ::get_auction_by_id(&conn, id)
            .map(|opt| opt.map(|a| a.is_active).unwrap_or(true))?;
        crud::admin_update_auction(
            &conn,
            id,
            &payload.title,
            payload.description.as_deref(),
            &payload.end_time,
            is_active
        )
    });

    match result {
        Ok(changed) => (StatusCode::OK, Json(ApiResponse::ok(changed))),
        Err(e) =>
            (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::<bool>::fail(e.to_string()))),
    }
}

async fn delete_auction(Path(id): Path<i64>, Json(payload): Json<structs::SessionReq>) -> impl IntoResponse {
    if !authentication::session_valid(&payload.session_expiry) {
        return (StatusCode::UNAUTHORIZED, Json(ApiResponse::<&str>::fail_with_session("Session expired", false)),
);
    }
    match database::open_connection().and_then(|conn| crud::admin_delete_auction(&conn, id)) {
        Ok(()) => (StatusCode::OK, Json(ApiResponse::ok("deleted"))),
        Err(e) =>
            (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::<&str>::fail(e.to_string()))),
    }
}

async fn end_auction(Path(id): Path<i64>, Json(payload): Json<structs::SessionReq>) -> impl IntoResponse {
    if !authentication::session_valid(&payload.session_expiry) {
        return (StatusCode::UNAUTHORIZED, Json(ApiResponse::<&str>::fail_with_session("Session expired", false)),
);
    }
    match database::open_connection().and_then(|conn| crud::end_auction(&conn, id)) {
        Ok(()) => (StatusCode::OK, Json(ApiResponse::ok("ended"))),
        Err(e) =>
            (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::<&str>::fail(e.to_string()))),
    }
}

async fn get_auction_bids(Path(id): Path<i64>) -> impl IntoResponse {
    match database::open_connection().and_then(|conn| crud::get_all_auction_bids(&conn, id)) {
        Ok(list) => (StatusCode::OK, Json(ApiResponse::ok(list))),
        Err(e) =>
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::<Vec<structs::Bid>>::fail(e.to_string())),
            ),
    }
}

async fn get_max_bid(Path(id): Path<i64>) -> impl IntoResponse {
    match database::open_connection().and_then(|conn| crud::get_max_bid(&conn, id)) {
        Ok(opt) => (StatusCode::OK, Json(ApiResponse::ok(opt))),
        Err(e) =>
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::<Option<f64>>::fail(e.to_string())),
            ),
    }
}

async fn place_bid(Json(payload): Json<structs::PlaceBidReq>) -> impl IntoResponse {
    if !authentication::session_valid(&payload.session_expiry) {
        return (StatusCode::UNAUTHORIZED, Json(ApiResponse::<i64>::fail_with_session("Session expired", false)),
);
    }
    match
        database
            ::open_connection()
            .and_then(|conn| {
                crud::place_bid(&conn, payload.auction_id, payload.bidder_id, payload.bid_amount)
            })
    {
        Ok(id) => (StatusCode::OK, Json(ApiResponse::ok(id))),
        Err(e) =>
            (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::<i64>::fail(e.to_string()))),
    }
}

async fn delete_bid(Path(id): Path<i64>, Json(payload): Json<structs::SessionReq>) -> impl IntoResponse {
    if !authentication::session_valid(&payload.session_expiry) {
        return (StatusCode::UNAUTHORIZED, Json(ApiResponse::<bool>::fail_with_session("Session expired", false)),
);
    }
    // user deletion rules not enforced here
    match database::open_connection().and_then(|conn| crud::user_delete_bid(&conn, id, 0)) {
        Ok(deleted) => (StatusCode::OK, Json(ApiResponse::ok(deleted))),
        Err(e) =>
            (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::<bool>::fail(e.to_string()))),
    }
}

async fn get_user_by_id(Path(id): Path<i64>) -> impl IntoResponse {
    match database::open_connection().and_then(|conn| crud::get_user_by_id(&conn, id)) {
        Ok(Some(u)) => (StatusCode::OK, Json(ApiResponse::ok(u))),
        Ok(None) =>
            (StatusCode::NOT_FOUND, Json(ApiResponse::<structs::Account>::fail("User not found"))),
        Err(e) =>
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::<structs::Account>::fail(e.to_string())),
            ),
    }
}

async fn update_user(
    Path(id): Path<i64>,
    Json(payload): Json<structs::UpdateUserReq>
) -> impl IntoResponse {
    if !authentication::session_valid(&payload.session_expiry) {
        return (StatusCode::UNAUTHORIZED, Json(ApiResponse::<bool>::fail_with_session("Session expired", false)),
);
    }
    let password_hash = match bcrypt::hash(&payload.password, bcrypt::DEFAULT_COST) {
        Ok(h) => h,
        Err(e) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::<bool>::fail(e.to_string()))),
    };
    match
        database
            ::open_connection()
            .and_then(|conn| { crud::update_user(&conn, id, &payload.email, &password_hash) })
    {
        Ok(changed) => (StatusCode::OK, Json(ApiResponse::ok(changed))),
        Err(e) =>
            (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::<bool>::fail(e.to_string()))),
    }
}

async fn delete_user(Path(id): Path<i64>, Json(payload): Json<structs::SessionReq>) -> impl IntoResponse {
    if !authentication::session_valid(&payload.session_expiry) {
        return (StatusCode::UNAUTHORIZED, Json(ApiResponse::<&str>::fail_with_session("Session expired", false)),
);
    }
    match database::open_connection().and_then(|conn| crud::admin_delete_user(&conn, id)) {
        Ok(()) => (StatusCode::OK, Json(ApiResponse::ok("deleted"))),
        Err(e) =>
            (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::<&str>::fail(e.to_string()))),
    }
}

async fn get_user_won_auctions(Path(id): Path<i64>) -> impl IntoResponse {
    match database::open_connection().and_then(|conn| crud::get_user_won_auctions(&conn, id)) {
        Ok(list) => (StatusCode::OK, Json(ApiResponse::ok(list))),
        Err(e) =>
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::<Vec<structs::WonAuction>>::fail(e.to_string())),
            ),
    }
}

async fn login(Json(payload): Json<structs::AuthReq>) -> impl IntoResponse {
    match database::open_connection().and_then(|conn| crud::get_user_by_username(&conn, &payload.username)) {
        Ok(Some((user, stored_hash))) => {
            match bcrypt::verify(&payload.password, &stored_hash) {
                Ok(true) => {
                    let mut authed_user = user;
                    authed_user.session_expiry = authentication::new_session_expiry();
                    (StatusCode::OK, Json(ApiResponse::ok(authed_user)))
                }
                _ => (StatusCode::UNAUTHORIZED, Json(ApiResponse::<structs::Account>::fail("Invalid credentials"))),
            }
        }
        Ok(None) => (StatusCode::UNAUTHORIZED, Json(ApiResponse::<structs::Account>::fail("Invalid credentials"))),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::<structs::Account>::fail(e.to_string()))),
    }
}

async fn register(Json(payload): Json<structs::CreateUserReq>) -> impl IntoResponse {
    let password_hash = match bcrypt::hash(&payload.password, bcrypt::DEFAULT_COST) {
        Ok(h) => h,
        Err(e) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::<structs::Account>::fail(e.to_string()))),
    };
    match
        database
            ::open_connection()
            .and_then(|conn| {
                crud::create_user(
                    &conn,
                    &payload.username,
                    &payload.email,
                    &password_hash
                ).and_then(|id|
                    crud::get_user_by_id(&conn, id).map(|opt| opt.expect("just created"))
                )
            })
    {
        Ok(user) => {
            let mut registered_user = user;
            registered_user.session_expiry = authentication::new_session_expiry();
            (StatusCode::OK, Json(ApiResponse::ok(registered_user)))
        }
        Err(e) =>
            (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::<structs::Account>::fail(e.to_string()))),
    }
}

async fn admin_login(Json(payload): Json<structs::AuthReq>) -> impl IntoResponse {
    match database::open_connection().and_then(|conn| crud::get_admin_by_username(&conn, &payload.username)) {
        Ok(Some((admin_id, stored_hash))) => {
            // if there is an admin then see if the password is correct with the one in the db
            match bcrypt::verify(&payload.password, &stored_hash) {
                Ok(true) => {
                    let admin_account = structs::Account {
                        account_id: admin_id,
                        username: payload.username,
                        email: String::new(),
                        created_at: String::new(),
                        is_admin: true,
                        session_expiry: authentication::new_session_expiry(),
                    };
                    (StatusCode::OK, Json(ApiResponse::ok(admin_account)))
                }
                _ => (StatusCode::UNAUTHORIZED, Json(ApiResponse::<structs::Account>::fail("Invalid admin credentials"))),
            }
        }
        Ok(None) => (StatusCode::UNAUTHORIZED, Json(ApiResponse::<structs::Account>::fail("Invalid admin credentials"))),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::<structs::Account>::fail(e.to_string()))),
    }
}

#[tokio::main]
async fn main() {
    run().await;
}
