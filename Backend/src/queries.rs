pub const GET_ALL_AUCTION_BIDS: &str = "SELECT * FROM bids WHERE auction_id = ?1";
pub const GET_USER_AUCTIONS: &str = "SELECT * FROM auctions WHERE seller_id = ?1";


pub const GET_USER_WON_AUCTIONS: &str = "SELECT * FROM won_auctions WHERE winner_id = ?1";

pub const GET_MAX_BID: &str = "SELECT MAX(bid_amount) FROM bids WHERE auction_id = ?1";

pub const GET_MAX_BIDDER: &str = "SELECT bidder_id, bid_amount FROM bids WHERE auction_id = ?1 ORDER BY bid_amount DESC LIMIT 1";

pub const GET_ALL_ACTIVE_AUCTIONS: &str = "SELECT * FROM auctions WHERE is_active = 1";

pub const GET_ALL_ENDED_AUCTIONS: &str = "SELECT * FROM auctions WHERE is_active = 0";

pub const GET_USER_BY_ID: &str = "SELECT * FROM accounts WHERE account_id = ?1";

pub const GET_USER_BY_USERNAME: &str =
    "SELECT account_id, username, email, password_hash, created_at FROM accounts WHERE username = ?1";

pub const CREATE_USER: &str = "INSERT INTO accounts (username, email, password_hash) VALUES (?1, ?2, ?3)";

pub const CHECK_ADMIN: &str = "SELECT * FROM admin WHERE username = ?1 AND password_hash = ?2";

pub const CREATE_ADMIN: &str = "INSERT INTO admin (username, password_hash) VALUES (?1, ?2)";
pub const BOOTSTRAP_ADMIN: &str = "INSERT OR IGNORE INTO admin (username, password_hash) VALUES (?1, ?2)";

pub const AUTH_USER: &str = "SELECT * FROM accounts WHERE username = ?1 AND password_hash = ?2";

pub const GET_AUCTION_BY_ID: &str = "SELECT * FROM auctions WHERE auction_id = ?1";


pub const CREATE_AUCTION: &str =
    "INSERT INTO auctions (title, description, starting_price, current_price, seller_id, end_time) VALUES (?1, ?2, ?3, ?3, ?4, ?5)";

pub const PLACE_BID: &str =
    "INSERT INTO bids (auction_id, bidder_id, bid_amount) VALUES (?1, ?2, ?3)";

pub const UPDATE_AUCTION_CURRENT_PRICE: &str =
    "UPDATE auctions SET current_price = ?1 WHERE auction_id = ?2";

pub const END_AUCTION: &str =
    "UPDATE auctions SET is_active = 0 WHERE auction_id = ?1";

pub const INSERT_WON_AUCTION: &str =
    "INSERT INTO won_auctions (auction_id, winner_id, winning_bid) VALUES (?1, ?2, ?3)";


pub const DELETE_BIDS_FOR_AUCTION: &str = "DELETE FROM bids WHERE auction_id = ?1";

pub const DELETE_WON_AUCTIONS_FOR_AUCTION: &str = "DELETE FROM won_auctions WHERE auction_id = ?1";

pub const DELETE_AUCTION: &str = "DELETE FROM auctions WHERE auction_id = ?1";

pub const DELETE_USER: &str = "DELETE FROM accounts WHERE account_id = ?1";

pub const USER_DELETE_AUCTION: &str =
    "DELETE FROM auctions WHERE auction_id = ?1 AND seller_id = ?2 AND is_active = 1";

pub const USER_DELETE_BID: &str =
    "DELETE FROM bids WHERE bid_id = ?1 AND bidder_id = ?2 AND auction_id IN (SELECT auction_id FROM auctions WHERE is_active = 1)";


pub const ADMIN_UPDATE_AUCTION: &str =
    "UPDATE auctions SET title = ?1, description = ?2, end_time = ?3, is_active = ?4 WHERE auction_id = ?5";

pub const UPDATE_USER: &str =
    "UPDATE accounts SET email = ?1, password_hash = ?2 WHERE account_id = ?3";
    
pub const USER_UPDATE_AUCTION: &str =
    "UPDATE auctions SET title = ?1, description = ?2, end_time = ?3 WHERE auction_id = ?4 AND seller_id = ?5 AND is_active = 1";


pub const CREATE_DB_SCHEMA: &str = "
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
            is_active BOOLEAN DEFAULT 1
            -- FOREIGN KEY (seller_id) REFERENCES accounts(account_id) -- removed to allow admin-created auctions
        );

        CREATE TABLE IF NOT EXISTS auction_images (
            image_id INTEGER PRIMARY KEY AUTOINCREMENT,
            auction_id INTEGER NOT NULL,
            image_data BLOB NOT NULL,
            FOREIGN KEY (auction_id) REFERENCES auctions(auction_id)
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
        ";

pub const GET_ADMIN_BY_USERNAME: &str =
    "SELECT admin_id, username, password_hash FROM admin WHERE username = ?1";

pub const GET_AUCTION_IMAGES: &str = "SELECT image_id, image_data FROM auction_images WHERE auction_id = ?1 ORDER BY image_id ASC";
pub const ADD_AUCTION_IMAGE: &str = "INSERT INTO auction_images (auction_id, image_data) VALUES (?1, ?2)";
pub const COUNT_AUCTION_IMAGES: &str = "SELECT COUNT(*) FROM auction_images WHERE auction_id = ?1";
pub const DELETE_AUCTION_IMAGES: &str = "DELETE FROM auction_images WHERE auction_id = ?1";