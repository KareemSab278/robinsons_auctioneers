use rusqlite::{params, Connection, OptionalExtension, Result};
use crate::{structs, queries};

// ── Reads ──────────────────────────────────────────────────────────────────────

pub fn get_all_auction_bids(conn: &Connection, auction_id: i64) -> Result<Vec<structs::Bid>> {
    let mut stmt = conn.prepare(queries::GET_ALL_AUCTION_BIDS)?;
    let iter = stmt.query_map(params![auction_id], |row| {
        Ok(structs::Bid {
            bid_id: row.get(0)?,
            auction_id: row.get(1)?,
            bidder_id: row.get(2)?,
            bid_amount: row.get(3)?,
            bid_time: row.get(4)?,
        })
    })?;
    iter.collect()
}

pub fn get_user_auctions(conn: &Connection, user_id: i64) -> Result<Vec<structs::Auction>> {
    let mut stmt = conn.prepare(queries::GET_USER_AUCTIONS)?;
    let iter = stmt.query_map(params![user_id], |row| {
        Ok(structs::Auction {
            auction_id: row.get(0)?,
            title: row.get(1)?,
            description: row.get(2)?,
            starting_price: row.get(3)?,
            current_price: row.get(4)?,
            seller_id: row.get(5)?,
            start_time: row.get(6)?,
            end_time: row.get(7)?,
            is_active: row.get(8)?,
        })
    })?;
    iter.collect()
}

pub fn get_user_won_auctions(conn: &Connection, user_id: i64) -> Result<Vec<structs::WonAuction>> {
    let mut stmt = conn.prepare(queries::GET_USER_WON_AUCTIONS)?;
    let iter = stmt.query_map(params![user_id], |row| {
        Ok(structs::WonAuction {
            win_id: row.get(0)?,
            auction_id: row.get(1)?,
            winner_id: row.get(2)?,
            winning_bid: row.get(3)?,
            won_time: row.get(4)?,
        })
    })?;
    iter.collect()
}

pub fn get_max_bid(conn: &Connection, auction_id: i64) -> Result<Option<f64>> {
    let mut stmt = conn.prepare(queries::GET_MAX_BID)?;
    stmt.query_row(params![auction_id], |row| row.get(0)).optional()
}

pub fn get_all_active_auctions(conn: &Connection) -> Result<Vec<structs::Auction>> {
    let mut stmt = conn.prepare(queries::GET_ALL_ACTIVE_AUCTIONS)?;
    let iter = stmt.query_map([], |row| {
        Ok(structs::Auction {
            auction_id: row.get(0)?,
            title: row.get(1)?,
            description: row.get(2)?,
            starting_price: row.get(3)?,
            current_price: row.get(4)?,
            seller_id: row.get(5)?,
            start_time: row.get(6)?,
            end_time: row.get(7)?,
            is_active: row.get(8)?,
        })
    })?;
    iter.collect()
}

pub fn get_all_ended_auctions(conn: &Connection) -> Result<Vec<structs::Auction>> {
    let mut stmt = conn.prepare(queries::GET_ALL_ENDED_AUCTIONS)?;
    let iter = stmt.query_map([], |row| {
        Ok(structs::Auction {
            auction_id: row.get(0)?,
            title: row.get(1)?,
            description: row.get(2)?,
            starting_price: row.get(3)?,
            current_price: row.get(4)?,
            seller_id: row.get(5)?,
            start_time: row.get(6)?,
            end_time: row.get(7)?,
            is_active: row.get(8)?,
        })
    })?;
    iter.collect()
}

pub fn get_user_by_id(conn: &Connection, user_id: i64) -> Result<Option<structs::Account>> {
    let mut stmt = conn.prepare(queries::GET_USER_BY_ID)?;
    stmt.query_row(params![user_id], |row| {
        Ok(structs::Account {
            account_id: row.get(0)?,
            username: row.get(1)?,
            email: row.get(2)?,
            // password_hash: row.get(3)?,
            created_at: row.get(4)?,
            is_admin: false,
            session_expiry: String::new(),
            token: None,
        })
    })
    .optional()
}

/// Returns the account plus the stored password hash for login verification.
pub fn get_user_by_username(conn: &Connection, username: &str) -> Result<Option<(structs::Account, String)>> {
    let mut stmt = conn.prepare(queries::GET_USER_BY_USERNAME)?;
    stmt.query_row(params![username], |row| {
        Ok((
            structs::Account {
                account_id: row.get(0)?,
                username: row.get(1)?,
                email: row.get(2)?,
                created_at: row.get(4)?,
                is_admin: false,
                session_expiry: String::new(),
                token: None,
            },
            row.get::<_, String>(3)?,
        ))
    })
    .optional()
}

pub fn create_user(conn: &Connection, username: &str, email: &str, password_hash: &str) -> Result<i64> {
    conn.execute(queries::CREATE_USER, params![username, email, password_hash])?;
    Ok(conn.last_insert_rowid())
}

pub fn authenticate_user(conn: &Connection, username: &str, password_hash: &str) -> Result<Option<structs::Account>> {
    let mut stmt = conn.prepare(queries::AUTH_USER)?;
    stmt.query_row(params![username, password_hash], |row| {
        Ok(structs::Account {
            account_id: row.get(0)?,
            username: row.get(1)?,
            email: row.get(2)?,
            // password_hash: row.get(3)?,
            created_at: row.get(4)?,
            is_admin: false,
            session_expiry: String::new(),
            token: None,
        })
    })
    .optional()
}

pub fn get_auction_by_id(conn: &Connection, auction_id: i64) -> Result<Option<structs::Auction>> {
    let mut stmt = conn.prepare(queries::GET_AUCTION_BY_ID)?;
    stmt.query_row(params![auction_id], |row| {
        Ok(structs::Auction {
            auction_id: row.get(0)?,
            title: row.get(1)?,
            description: row.get(2)?,
            starting_price: row.get(3)?,
            current_price: row.get(4)?,
            seller_id: row.get(5)?,
            start_time: row.get(6)?,
            end_time: row.get(7)?,
            is_active: row.get(8)?,
        })
    })
    .optional()
}

pub fn get_admin_by_username(conn: &Connection, username: &str) -> Result<Option<(i64, String)>> {
    let mut stmt = conn.prepare(queries::GET_ADMIN_BY_USERNAME)?;
    stmt.query_row(params![username], |row| {
        Ok((row.get::<_, i64>(0)?, row.get::<_, String>(2)?))
    })
    .optional()
}

// ── Writes ─────────────────────────────────────────────────────────────────────

pub fn create_auction(
    conn: &Connection,
    title: &str,
    description: Option<&str>,
    starting_price: f64,
    seller_id: i64,
    end_time: &str,
) -> Result<i64> {
    conn.execute(queries::CREATE_AUCTION, params![title, description, starting_price, seller_id, end_time])?;
    Ok(conn.last_insert_rowid())
}

pub fn place_bid(conn: &Connection, auction_id: i64, bidder_id: i64, bid_amount: f64) -> Result<i64> {
    conn.execute(queries::PLACE_BID, params![auction_id, bidder_id, bid_amount])?;
    conn.execute(queries::UPDATE_AUCTION_CURRENT_PRICE, params![bid_amount, auction_id])?;
    Ok(conn.last_insert_rowid())
}

pub fn end_auction(conn: &Connection, auction_id: i64) -> Result<()> {
    conn.execute(queries::END_AUCTION, params![auction_id])?;
    let winner = conn
        .prepare(queries::GET_MAX_BIDDER)?
        .query_row(params![auction_id], |row| Ok((row.get::<_, i64>(0)?, row.get::<_, f64>(1)?)))
        .optional()?;
    if let Some((winner_id, winning_bid)) = winner {
        conn.execute(queries::INSERT_WON_AUCTION, params![auction_id, winner_id, winning_bid])?;
    }
    Ok(())
}

// ── Deletes ────────────────────────────────────────────────────────────────────

pub fn admin_delete_auction(conn: &Connection, auction_id: i64) -> Result<()> {
    conn.execute(queries::DELETE_BIDS_FOR_AUCTION, params![auction_id])?;
    conn.execute(queries::DELETE_WON_AUCTIONS_FOR_AUCTION, params![auction_id])?;
    conn.execute(queries::DELETE_AUCTION_IMAGES, params![auction_id])?;
    conn.execute(queries::DELETE_AUCTION, params![auction_id])?;
    Ok(())
}

pub fn admin_delete_user(conn: &Connection, user_id: i64) -> Result<()> {
    conn.execute(queries::DELETE_USER, params![user_id])?;
    Ok(())
}

pub fn bootstrap_admin(conn: &Connection, username: &str, password_hash: &str) -> Result<()> {
    conn.execute(queries::BOOTSTRAP_ADMIN, params![username, password_hash])?;
    Ok(())
}

pub fn create_admin(conn: &Connection, username: &str, password_hash: &str) -> Result<i64> {
    conn.execute(queries::CREATE_ADMIN, params![username, password_hash])?;
    Ok(conn.last_insert_rowid())
}

pub fn user_delete_auction(conn: &Connection, auction_id: i64, user_id: i64) -> Result<bool> {
    let rows = conn.execute(queries::USER_DELETE_AUCTION, params![auction_id, user_id])?;
    Ok(rows > 0)
}

pub fn user_delete_bid(conn: &Connection, bid_id: i64, user_id: i64) -> Result<bool> {
    let rows = conn.execute(queries::USER_DELETE_BID, params![bid_id, user_id])?;
    Ok(rows > 0)
}

// ── Updates ────────────────────────────────────────────────────────────────────

pub fn admin_update_auction(
    conn: &Connection,
    auction_id: i64,
    title: &str,
    description: Option<&str>,
    end_time: &str,
    is_active: bool,
) -> Result<bool> {
    let rows = conn.execute(
        queries::ADMIN_UPDATE_AUCTION,
        params![title, description, end_time, is_active, auction_id],
    )?;
    Ok(rows > 0)
}

pub fn update_user(conn: &Connection, user_id: i64, email: &str, password_hash: &str) -> Result<bool> {
    let rows = conn.execute(queries::UPDATE_USER, params![email, password_hash, user_id])?;
    Ok(rows > 0)
}

pub fn user_update_auction(
    conn: &Connection,
    auction_id: i64,
    user_id: i64,
    title: &str,
    description: Option<&str>,
    end_time: &str,
) -> Result<bool> {
    let rows = conn.execute(
        queries::USER_UPDATE_AUCTION,
        params![title, description, end_time, auction_id, user_id],
    )?;
    Ok(rows > 0)
}