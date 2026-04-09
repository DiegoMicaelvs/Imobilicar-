import "dotenv/config";
import pg from "pg";
const { Pool } = pg;

async function run() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  try {
    const cols = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'admin_users' ORDER BY ordinal_position`);
    const colNames = cols.rows.map((r: any) => r.column_name);
    console.log("Columns:", colNames.join(', '));
    
    const res = await pool.query("SELECT id, name, email, role FROM admin_users LIMIT 20");
    for (const row of res.rows) {
      console.log(JSON.stringify(row));
    }
    console.log("Total:", res.rows.length);
  } catch(e: any) {
    console.error("Error:", e.message);
  }
  await pool.end();
  process.exit(0);
}
run();
