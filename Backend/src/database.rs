use rusqlite::{Connection, Result};
use std::path::PathBuf;

use crate::queries;

pub const DB_FILE: &str = "app/robinsons_auctioneers.db";


fn db_path(file: &str) -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join(file)
}

pub fn open_connection() -> Result<Connection> {
    Connection::open(db_path(DB_FILE))
}

fn create_new_db() -> Result<String> {
    let conn = Connection::open(db_path(DB_FILE))?;
     conn.execute_batch(
        queries::CREATE_DB_SCHEMA,
    )?;
    Ok("Database initialized successfully.".to_string())
}

fn check_db_exists(database: &str) -> bool {
    std::path::Path::new(&database).exists()
}

pub fn initialize_db() -> Result<String> {
    if !check_db_exists(db_path(DB_FILE).to_str().expect("Failed to start DB. Attempting to create new database...")) {
        create_new_db()?;
    }
    Ok("Database is ready.".to_string())
}  