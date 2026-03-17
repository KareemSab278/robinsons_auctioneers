use crate::{crud, structs};
use chrono::{DateTime, Duration as ChronoDuration, Utc};
use hmac::{Hmac, Mac};
use jwt::{SignWithKey, VerifyWithKey};
use rusqlite::Connection;
use sha2::Sha256;
use std::collections::BTreeMap;
use std::time::{SystemTime, UNIX_EPOCH};

const SESSION_DURATION_SECS: u64 = 60 * 60; // 1 hour

type HmacSha256 = Hmac<Sha256>;

fn jwt_secret() -> Vec<u8> {
    std::env::var("JWT_SECRET")
        .unwrap_or_else(|_| "secret_key".to_string())
        .into_bytes()
}

fn jwt_key() -> HmacSha256 {
    HmacSha256::new_from_slice(&jwt_secret()).expect("JWT_SECRET must be a valid key")
}

pub fn generate_jwt(user_id: i64, duration_secs: u64) -> Result<String, String> {
    let key = jwt_key();

    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|e| e.to_string())?
        .as_secs();

    let mut claims = BTreeMap::new();
    claims.insert("user_id".to_string(), user_id.to_string());
    claims.insert("exp".to_string(), (now + duration_secs).to_string());

    claims.sign_with_key(&key).map_err(|e| e.to_string())
}

// used btreemap because the jwt crate wants it like that. hmaps are better (o(1) while btreemap is o(log n)) imo but the creators of the jwt crate know better
pub fn validate_jwt(token: &str) -> Result<BTreeMap<String, String>, String> {
    let key = jwt_key();
    let claims: BTreeMap<String, String> = token.verify_with_key(&key).map_err(|e| e.to_string())?;

    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|e| e.to_string())?
        .as_secs();

    let exp = claims
        .get("exp")
        .ok_or_else(|| "missing exp claim".to_string())
        .and_then(|v| v.parse::<u64>().map_err(|e| e.to_string()))?;

    if exp < now {
        Err("token expired".to_string())
    } else {
        Ok(claims)
    }
}

/// returns ISO-8601 session expiry string, used by the frontend session validation.
pub fn new_session_expiry() -> String {
    (Utc::now() + ChronoDuration::seconds(SESSION_DURATION_SECS as i64)).to_rfc3339()
}

pub fn session_valid(session_value: &str) -> bool {
    if session_value.trim().is_empty() {
        return false;
    }

    if let Ok(dt) = DateTime::parse_from_rfc3339(session_value) {
        return dt > Utc::now();
    }

    validate_jwt(session_value).is_ok()
}

pub fn create_admin(conn: &Connection, auth_req: structs::AuthReq) -> Result<structs::Admin, String> {
    let password_hash = bcrypt::hash(&auth_req.password, bcrypt::DEFAULT_COST).map_err(|e| e.to_string())?;
    let admin_id = crud::create_admin(conn, &auth_req.username, &password_hash).map_err(|e| e.to_string())?;

    Ok(structs::Admin {
        admin_id,
        username: auth_req.username,
    })
}

