// Creates a ready-to-demo account: demo@openbell.dev / demo-password
// Usage: npm run seed
import "dotenv/config";
import argon2 from "argon2";
import pg from "pg";

const EMAIL = "demo@openbell.dev";
const PASSWORD = "demo-password";
const STOCKS = ["NVDA", "AAPL", "TSLA", "MSFT"];

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  const hash = await argon2.hash(PASSWORD, { type: argon2.argon2id });
  const { rows } = await client.query(
    `INSERT INTO users (id, name, email, password_hash, onboarded_at)
     VALUES (gen_random_uuid(), 'Demo User', $1, $2, now())
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
     RETURNING id`,
    [EMAIL, hash],
  );
  const userId = rows[0].id;
  // Insert in reverse so the dashboard (newest first) shows them in STOCKS order.
  for (const [i, symbol] of [...STOCKS].reverse().entries()) {
    await client.query(
      `INSERT INTO saved_stocks (id, user_id, symbol, created_at)
       VALUES (gen_random_uuid(), $1, $2, now() + make_interval(secs => $3))
       ON CONFLICT (user_id, symbol) DO NOTHING`,
      [userId, symbol, i],
    );
  }
  console.log(`Seeded ${EMAIL} / ${PASSWORD} with ${STOCKS.join(", ")}`);
} finally {
  await client.end();
}
