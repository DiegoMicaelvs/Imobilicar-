import "dotenv/config";
import pg from "pg";

const { Pool } = pg;
async function checkDb() {
  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    const res = await pool.query("SELECT 1");
    console.log("DB_OK", res.rows);
  } catch (e) {
    console.error("DB_ERROR:", e.message);
  }
  process.exit();
}
checkDb();
