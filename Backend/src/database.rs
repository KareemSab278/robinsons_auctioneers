use rusqlite::{Connection, Result};
use std::path::PathBuf;
use std::fs;
use crate::queries;

pub const LIVE_DB_FILE: &str = "/var/data/robinsons_auctioneers.db";
const LOCAL_DB_FILE: &str = "app/robinsons_auctioneers.db";
pub const DB_FILE: &str = LIVE_DB_FILE;


fn db_path(file: &str) -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join(file)
}

pub fn open_connection() -> Result<Connection> {
    Connection::open(DB_FILE)
}

fn create_new_db() -> Result<String> {
    fs::create_dir_all("/var/data").ok();
    let conn = Connection::open(DB_FILE)?;
     conn.execute_batch(
        queries::CREATE_DB_SCHEMA,
    )?;
    Ok("Database initialized successfully.".to_string())
}

fn check_db_exists(database: &str) -> bool {
    std::path::Path::new(&database).exists()
}

pub fn initialize_db() -> Result<String> {
    if !check_db_exists(DB_FILE) {
        create_new_db()?;
    }
    Ok("Database is ready.".to_string())
}  