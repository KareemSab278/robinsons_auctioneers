use serde::Serialize;
use serde::Deserialize;

#[derive(Serialize)]
pub struct Bid {
    pub bid_id: i64,
    pub auction_id: i64,
    pub bidder_id: i64,
    pub bid_amount: f64,
    pub bid_time: String,
}

#[derive(Serialize)]
pub struct Auction {
    pub auction_id: i64,
    pub title: String,
    pub description: Option<String>,
    pub starting_price: f64,
    pub current_price: Option<f64>,
    pub seller_id: i64,
    pub start_time: String,
    pub end_time: String,
    pub is_active: bool,
}

#[derive(Serialize)]
pub struct Account {
    pub account_id: i64,
    pub username: String,
    pub email: String,
    // pub password_hash: String,
    pub created_at: String,
    pub is_admin: bool,
    pub session_expiry: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub token: Option<String>,
}

#[derive(Serialize)]
pub struct Admin {
    pub admin_id: i64,
    pub username: String,
    // pub password_hash: String,
}

#[derive(Serialize)]
pub struct WonAuction {
    pub win_id: i64,
    pub auction_id: i64,
    pub winner_id: i64,
    pub winning_bid: f64,
    pub won_time: String,
}

#[derive(Serialize)]
pub struct SessionStatus {
    pub session_status: bool,
    pub description: String,
}

#[derive(Deserialize)]
pub struct SessionReq {
    pub session_expiry: String,
}

#[derive(Deserialize)]
pub struct CreateAuctionReq {
    pub title: String,
    pub description: Option<String>,
    pub starting_price: f64,
    pub seller_id: i64,
    pub end_time: String,
}

#[derive(Deserialize)]
pub struct UpdateAuctionReq {
    pub title: String,
    pub description: Option<String>,
    pub end_time: String,
    pub session_expiry: String,
}

#[derive(Deserialize)]
pub struct PlaceBidReq {
    pub auction_id: i64,
    pub bidder_id: i64,
    pub bid_amount: f64,
    pub session_expiry: String,
}

#[derive(Deserialize, Clone)]
pub struct AuthReq {
    pub username: String,
    pub password: String,
}

#[derive(Deserialize)]
pub struct CreateUserReq {
    pub username: String,
    pub email: String,
    pub password: String,
}

#[derive(Deserialize)]
pub struct UpdateUserReq {
    pub email: String,
    pub password: String,
    pub session_expiry: String,
}
#[derive(Deserialize)]
pub struct AdminLoginReq {
    pub username: String,
    pub password: String,
}

#[derive(Deserialize)]
pub struct CreateAdminReq {
    pub username: String,
    pub password: String,
    pub session_expiry: String,
}

#[derive(Deserialize)]
pub struct UploadImageReq {
    pub image_data: Vec<String>, // base64-encoded image bytes
    pub session_expiry: String,
}