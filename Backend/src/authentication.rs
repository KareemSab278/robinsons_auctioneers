use chrono::{DateTime, Duration, Utc};
use crate::{structs, queries};
use rusqlite::{Connection, OptionalExtension, Result, params};

const SESSION_DURATION_HOURS: i64 = 1;

pub fn session_valid(session_expiry: &str) -> bool {
    match DateTime::parse_from_rfc3339(session_expiry) {
        Ok(expiry) => Utc::now() < expiry,
        Err(_) => false,
    }
}

pub fn new_session_expiry() -> String {
    (Utc::now() + Duration::hours(SESSION_DURATION_HOURS)).to_rfc3339()
}


pub fn user_sign_in(conn: &Connection, auth_req: structs::AuthReq) -> Result<Option<structs::Account>> {
    let mut stmt = conn.prepare(queries::GET_USER_BY_USERNAME)?;
    let result = stmt.query_row(params![auth_req.username], |row| {
        Ok((
            structs::Account {
                account_id: row.get(0)?,
                username: row.get(1)?,
                email: row.get(2)?,
                created_at: row.get(4)?,
                session_expiry: new_session_expiry(),
                is_admin: false,
            },
            row.get::<_, String>(3)?,
        ))
    }).optional()?;

    match result {
        Some((account, stored_hash)) => {
            match bcrypt::verify(&auth_req.password, &stored_hash) {
                Ok(true) => Ok(Some(account)),
                _ => Ok(None),
            }
        }
        None => Ok(None),
    }
}

pub fn admin_sign_in(conn: &Connection, auth_req: structs::AuthReq) -> Result<Option<structs::Admin>> {
    let mut stmt = conn.prepare(queries::GET_ADMIN_BY_USERNAME)?;
    let result = stmt.query_row(params![auth_req.username], |row| {
        Ok((
            row.get::<_, i64>(0)?,
            row.get::<_, String>(1)?,
            row.get::<_, String>(2)?,
        ))
    }).optional()?;

    match result {
        Some((admin_id, username, stored_hash)) => {
            match bcrypt::verify(&auth_req.password, &stored_hash) {
                Ok(true) => Ok(Some(structs::Admin { admin_id, username })),
                _ => Ok(None),
            }
        }
        None => Ok(None),
    }
}

pub fn create_admin(conn: &Connection, auth_req: structs::AuthReq) -> Result<structs::Admin> {
    let password_hash = bcrypt::hash(&auth_req.password, bcrypt::DEFAULT_COST)
        .map_err(|e| rusqlite::Error::ToSqlConversionFailure(Box::new(e)))?;
    conn.execute(queries::CREATE_ADMIN, params![auth_req.username, password_hash])?;
    let admin_id = conn.last_insert_rowid();
    Ok(structs::Admin {
        admin_id,
        username: auth_req.username,
    })
}