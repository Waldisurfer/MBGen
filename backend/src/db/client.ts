import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

// Pool is created lazily on first use so that process.env.DATABASE_URL is
// guaranteed to be populated by dotenv regardless of ESM import hoisting.
// pg 8.20+ also overrides ssl options derived from the URL's sslmode param,
// so we parse the URL manually and pass individual fields to bypass that.
function buildPool(): Pool {
  const rawUrl = process.env.DATABASE_URL ?? '';
  const isSupabase = rawUrl.includes('supabase');

  if (isSupabase) {
    const u = new URL(rawUrl);
    return new Pool({
      host:     u.hostname,
      port:     u.port ? parseInt(u.port, 10) : 5432,
      database: u.pathname.replace(/^\//, ''),
      user:     decodeURIComponent(u.username),
      password: decodeURIComponent(u.password),
      ssl:      { rejectUnauthorized: false },
    });
  }

  return new Pool({ connectionString: rawUrl || undefined });
}

let _pool: Pool | null = null;
const pool = new Proxy({} as Pool, {
  get: (_, prop: keyof Pool) => {
    if (!_pool) _pool = buildPool();
    const val = _pool[prop];
    return typeof val === 'function' ? (val as Function).bind(_pool) : val;
  },
});

export const db: NodePgDatabase<typeof schema> = drizzle(pool, { schema });
