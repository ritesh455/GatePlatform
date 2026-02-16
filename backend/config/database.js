// db.js
const { Pool } = require('pg');
require('dotenv').config();

// Database connection pool configuration
const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || '123',
  database: process.env.PGDATABASE || 'educational_platform',
  port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected PG client error', err);
  process.exit(-1);
});

// Test database connection (from old db.js)
const connectDB = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query("SELECT NOW()");
    console.log("Database connected successfully at:", result.rows[0].now);
    client.release();
    return true;
  } catch (error) {
    console.error("Database connection error:", error);
    throw error;
  }
};

// Query helper function with logging (from old db.js)
const query = async (text, params) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log("Executed query", { text, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error("Query error:", error);
    throw error;
  }
};

module.exports = {
  pool,
  connectDB,
  query,
};