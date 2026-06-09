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
const migrationsDir = join(__dirname, '..', 'supabase', 'migrations');

const KEY_TABLES = [
  'live_events',
  'live_chat_messages',
  'live_polls',
  'members',
  'series',
  'video_episodes',
  'watch_progress',
  'articles',
  'watchlist',
  'downloads',
  'transcripts',
  'content_embeddings',
  'clips',
  'threaded_comments',
  'contributors',
  'contributor_applications',
];

const MIGRATION_FILES = [
  '0001_live_events.sql',
  '0003_episode_data_refinements.sql',
  '0004_realtime_chat_polls.sql',
  '0005_realtime_publication.sql',
  '0006_members_stripe.sql',
  '0007_video_catalog.sql',
  '0008_watch_progress.sql',
  '0009_articles_stub.sql',
  '0010_articles_contributors.sql',
  '0010_member_features.sql',
  '0011_ai_search.sql',
  '0012_contributor_applications.sql',
  '0013_contributors_table.sql',
  '0014_clips_and_threaded_comments_rls.sql',
];

async function ensureMigrationTable(client) {
  await client.query(`
    CREATE SCHEMA IF NOT EXISTS supabase_migrations;
    CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (
      version text PRIMARY KEY,
      statements text[],
      name text
    );
  `);
}

async function getAppliedMigrations(client) {
  const res = await client.query(
    'SELECT version FROM supabase_migrations.schema_migrations ORDER BY version'
  );
  return new Set(res.rows.map((r) => r.version));
}

async function recordMigration(client, version, name, sql) {
  await client.query(
    `INSERT INTO supabase_migrations.schema_migrations (version, statements, name)
     VALUES ($1, $2, $3)
     ON CONFLICT (version) DO NOTHING`,
    [version, [sql], name]
  );
}

async function verifyTables(client) {
  const res = await client.query(
    `SELECT tablename FROM pg_tables
     WHERE schemaname = 'public' AND tablename = ANY($1::text[])
     ORDER BY tablename`,
    [KEY_TABLES]
  );
  const found = new Set(res.rows.map((r) => r.tablename));
  return KEY_TABLES.map((t) => ({ table: t, exists: found.has(t) }));
}

async function main() {
  const client = new Client({
    connectionString: DIRECT_URL,
    ssl: { rejectUnauthorized: false },
  });

  const results = {
    cliAttempt: 'skipped - no access token',
    applied: [],
    skipped: [],
    failed: [],
    tableVerification: [],
  };

  try {
    await client.connect();
    console.log('Connected to database.');

    await ensureMigrationTable(client);
    const applied = await getAppliedMigrations(client);
    console.log('Already applied:', [...applied].join(', ') || '(none)');

    for (const file of MIGRATION_FILES) {
      const version = file.split('_')[0];
      const name = file.replace(/^\d+_/, '').replace(/\.sql$/, '');

      if (applied.has(version)) {
        results.skipped.push({ version, file, reason: 'already applied' });
        console.log(`SKIP ${file} (already applied)`);
        continue;
      }

      const sqlPath = join(migrationsDir, file);
      const sql = readFileSync(sqlPath, 'utf8');

      try {
        await client.query('BEGIN');
        await client.query(sql);
        await recordMigration(client, version, name, sql);
        await client.query('COMMIT');
        results.applied.push({ version, file });
        console.log(`OK   ${file}`);
      } catch (err) {
        await client.query('ROLLBACK');
        results.failed.push({ version, file, error: err.message });
        console.error(`FAIL ${file}: ${err.message}`);
      }
    }

    results.tableVerification = await verifyTables(client);
    console.log('\n=== TABLE VERIFICATION ===');
    for (const { table, exists } of results.tableVerification) {
      console.log(`${exists ? 'OK' : 'MISSING'}  ${table}`);
    }

    console.log('\n=== SUMMARY ===');
    console.log(JSON.stringify(results, null, 2));
  } catch (err) {
    console.error('Fatal error:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();