use crate::{structs, queries};
use bcrypt;
use rusqlite::{params, Connection, OptionalExtension, Result};

fn hash_password(password: &str) -> String {
    bcrypt::hash(password, bcrypt::DEFAULT_COST).unwrap()
}

pub fn user_sign_in(conn: &Connection, auth_req: structs::AuthReq) -> Result<Option<structs::Account>> {
    let password_hash = hash_password(&auth_req.password);
    conn.query_row(queries::AUTH_USER, params![auth_req.username, password_hash], |row| {
        Ok(structs::Account {
            account_id: row.get(0)?,
            username: row.get(1)?,
            email: row.get(2)?,
            created_at: row.get(4)?,
        })
    }).optional()
}

pub fn is_admin(conn: &Connection, auth_req: structs::AuthReq) -> Result<bool> {
    let password_hash = hash_password(&auth_req.password);
    let mut stmt = conn.prepare(queries::CHECK_ADMIN)?;
    stmt.exists(params![auth_req.username, password_hash])
}

pub fn admin_sign_in(conn: &Connection, auth_req: structs::AuthReq) -> Result<structs::Admin> {
    let admin_exists = is_admin(conn, auth_req.clone())?;
    let admin_id = if admin_exists {
        conn.query_row(queries::CHECK_ADMIN, params![auth_req.username, hash_password(&auth_req.password)], |row| row.get(0))?
    } else {
        return Err(rusqlite::Error::QueryReturnedNoRows);
    };
    if admin_exists {
        Ok(structs::Admin {
            admin_id,
            username: auth_req.username,
            email: auth_req.email,
            created_at: chrono::Utc::now().naive_utc(),
        })
    } else {
        Err(rusqlite::Error::QueryReturnedNoRows)
    }
}

pub fn create_admin(conn: &Connection, auth_req: structs::AuthReq) -> Result<structs::Admin> {
    conn.execute(queries::CREATE_ADMIN, params![auth_req.username, auth_req.email, hash_password(&auth_req.password)])?;
    let admin_id = conn.last_insert_rowid();
    Ok(structs::Admin {
        admin_id,
        username: auth_req.username,
        email: auth_req.email,
        created_at: chrono::Utc::now().naive_utc(),
    })
}