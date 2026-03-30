// // db.js
// const { Pool } = require('pg');
// require('dotenv').config();

// // Database connection pool configuration
// const pool = new Pool({
//   host: process.env.PGHOST || 'localhost',
//   user: process.env.PGUSER || 'postgres',
//   password: process.env.PGPASSWORD || '123',
//   database: process.env.PGDATABASE || 'educational_platform',
//   port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
//   max: 10,
//   idleTimeoutMillis: 30000,
//   connectionTimeoutMillis: 2000,
// });

// pool.on('error', (err) => {
//   console.error('Unexpected PG client error', err);
//   process.exit(-1);
// });

// // Test database connection (from old db.js)
// const connectDB = async () => {
//   try {
//     const client = await pool.connect();
//     const result = await client.query("SELECT NOW()");
//     console.log("Database connected successfully at:", result.rows[0].now);
//     client.release();
//     return true;
//   } catch (error) {
//     console.error("Database connection error:", error);
//     throw error;
//   }
// };

// // Query helper function with logging (from old db.js)
// const query = async (text, params) => {
//   const start = Date.now();
//   try {
//     const result = await pool.query(text, params);
//     const duration = Date.now() - start;
//     console.log("Executed query", { text, duration, rows: result.rowCount });
//     return result;
//   } catch (error) {
//     console.error("Query error:", error);
//     throw error;
//   }
// };

// module.exports = {
//   pool,
//   connectDB,
//   query,
// };


// db.js
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
require("dotenv").config();

// 🔗 Supabase PostgreSQL connection (Session Pooler)
const pool = new Pool({
  host: process.env.DB_HOST,          // aws-xxx.pooler.supabase.com
  user: process.env.DB_USER,          // postgres.<project-ref>
  password: process.env.DB_PASSWORD,  // your password
  database: process.env.DB_NAME || "postgres",
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 6543, // pooler port

  ssl: {
    rejectUnauthorized: false, // required for Supabase
  },

  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// 🔴 Handle unexpected errors
pool.on("error", (err) => {
  console.error("❌ Unexpected PG client error:", err.message);
  process.exit(-1);
});

// 🔥 AUTO SEED ADMIN (runs on server start)
const seedAdmin = async () => {
  try {
    console.log("🔄 Seeding system admin...");

    // 1. Delete all existing admins
    await pool.query("DELETE FROM systemadmin");

    // 2. Create hashed password
    const plainPassword = "admin123"; // default password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(plainPassword, saltRounds);

    // 3. Insert new admin
    await pool.query(
      `INSERT INTO systemadmin 
      (admin_id, username, password_hash, email, created_at, last_login, role)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $5)`,
      [
        1,
        "system-admin",
        passwordHash,
        "admin@example.com",
        "system_admin",
      ]
    );

    console.log("✅ Default admin created:");
    console.log("📧 Email: admin@example.com");
    console.log("🔑 Password: admin123");

  } catch (error) {
    console.error("❌ Error seeding admin:", error.message);
  }
};

// ✅ Test DB connection + seed admin
const connectDB = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query("SELECT NOW()");
    console.log("✅ Supabase connected at:", result.rows[0].now);
    client.release();

    // 🔥 Run seeding
    await seedAdmin();

    return true;
  } catch (error) {
    console.error("❌ Database connection error:", error.message);
    throw error;
  }
};

// 🔍 Query helper
const query = async (text, params) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;

    console.log("📊 Query executed:", {
      duration: `${duration}ms`,
      rows: result.rowCount,
    });

    return result;
  } catch (error) {
    console.error("❌ Query error:", error.message);
    throw error;
  }
};

module.exports = {
  pool,
  connectDB,
  query,
};