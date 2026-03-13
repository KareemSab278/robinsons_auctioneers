use rusqlite::{params, Connection, Result};
use crate::queries;

pub const MAX_IMAGES_PER_AUCTION: i64 = 8;

pub fn get_auction_images(conn: &Connection, auction_id: i64) -> Result<Vec<(i64, Vec<u8>)>> {
    let mut stmt = conn.prepare(queries::GET_AUCTION_IMAGES)?;
    let iter = stmt.query_map(params![auction_id], |row| {
        Ok((row.get::<_, i64>(0)?, row.get::<_, Vec<u8>>(1)?))
    })?;
    iter.collect()
}

pub fn count_auction_images(conn: &Connection, auction_id: i64) -> Result<i64> {
    let mut stmt = conn.prepare(queries::COUNT_AUCTION_IMAGES)?;
    stmt.query_row(params![auction_id], |row| row.get(0))
}

pub fn add_auction_image(conn: &Connection, auction_id: i64, data: &[u8]) -> Result<i64> {
    conn.execute(queries::ADD_AUCTION_IMAGE, params![auction_id, data])?;
    Ok(conn.last_insert_rowid())
}

pub fn delete_auction_images(conn: &Connection, auction_id: i64) -> Result<()> {
    conn.execute(queries::DELETE_AUCTION_IMAGES, params![auction_id])?;
    Ok(())
}
