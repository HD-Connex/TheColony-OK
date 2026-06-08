import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const { Client } = pg;

function loadEnvLocal() {
  const envPath = join(dirname(fileURLToPath(import.meta.url)), '..', '.env.local');
  try {
    const raw = readFileSync(envPath, 'utf8');
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    /* .env.local optional when DIRECT_URL is set in environment */
  }
}

loadEnvLocal();

const DIRECT_URL = process.env.DIRECT_URL;
if (!DIRECT_URL) {
  console.error('DIRECT_URL is required (set in .env.local or environment).');
  process.exit(1);
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const seedPath = join(__dirname, '..', 'supabase', 'seed-content.sql');

const SEED_TABLES = ['shows', 'episodes', 'live_events', 'series', 'video_episodes'];

async function countRows(client, table) {
  const exists = await client.query(
    `SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = $1`,
    [table]
  );
  if (exists.rowCount === 0) return { table, exists: false, count: null };
  const res = await client.query(`SELECT COUNT(*)::int AS count FROM public.${table}`);
  return { table, exists: true, count: res.rows[0].count };
}

async function main() {
  const client = new Client({
    connectionString: DIRECT_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('Connected to database.');

    const sql = readFileSync(seedPath, 'utf8');
    await client.query(sql);
    console.log('OK   seed-content.sql');

    const counts = [];
    for (const table of SEED_TABLES) {
      counts.push(await countRows(client, table));
    }

    console.log('\n=== SEED ROW COUNTS ===');
    for (const { table, exists, count } of counts) {
      if (!exists) {
        console.log(`SKIP  ${table} (table not present)`);
      } else {
        console.log(`OK    ${table}: ${count} rows`);
      }
    }

    console.log('\n=== SUMMARY ===');
    console.log(JSON.stringify({ seedFile: 'supabase/seed-content.sql', rowCounts: counts }, null, 2));
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();