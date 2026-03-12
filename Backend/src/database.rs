use rusqlite::{params, Connection, Result};
use serde::{Serialize};
use std::path::PathBuf;

const DB_FILE: &str = "robinsons_auctioneers.db";

fn db_path(file: &str) -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join(file)
}

fn create_new_db() -> Result<String> {
    let conn = Connection::open(db_path(DB_FILE))?;
     conn.execute_batch(
        "
        PRAGMA foreign_keys = ON;

        CREATE TABLE IF NOT EXISTS accounts (
            account_id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS admin (
            admin_id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS auctions (
            auction_id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            starting_price REAL NOT NULL,
            current_price REAL,
            seller_id INTEGER NOT NULL,
            start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
            end_time DATETIME NOT NULL,
            is_active BOOLEAN DEFAULT 1,
            FOREIGN KEY (seller_id) REFERENCES accounts(account_id)
        );

        CREATE TABLE IF NOT EXISTS bids (
            bid_id INTEGER PRIMARY KEY AUTOINCREMENT,
            auction_id INTEGER NOT NULL,
            bidder_id INTEGER NOT NULL,
            bid_amount REAL NOT NULL,
            bid_time DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (auction_id) REFERENCES auctions(auction_id),
            FOREIGN KEY (bidder_id) REFERENCES accounts(account_id)
        );

        CREATE TABLE IF NOT EXISTS won_auctions (
            win_id INTEGER PRIMARY KEY AUTOINCREMENT,
            auction_id INTEGER NOT NULL,
            winner_id INTEGER NOT NULL,
            winning_bid REAL NOT NULL,
            won_time DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (auction_id) REFERENCES auctions(auction_id),
            FOREIGN KEY (winner_id) REFERENCES accounts(account_id)
        );
        "
    )?;
    Ok("Database initialized successfully.".to_string())
}

fn check_database_exists(database: &str) -> bool {
    std::path::Path::new(&database).exists()
}

pub fn initialize_database() -> Result<String> {
    if !check_database_exists(db_path(DB_FILE).to_str().expect("Failed to start DB. Attempting to create new database...")) {
        create_new_db()?;
    }
    Ok("Database is ready.".to_string())
}  