import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

// pg 8.20+ treats sslmode=require/prefer as verify-full, which rejects
// Supabase's pooler certificate chain. Strip sslmode from the URL and
// pass ssl: { rejectUnauthorized: false } explicitly so we still encrypt
// the connection without failing on the pooler's intermediate CA.
const rawUrl = process.env.DATABASE_URL ?? '';
const connectionString = rawUrl.replace(/[?&]sslmode=[^&]*/g, (m, offset) =>
  m.startsWith('?') ? '' : (offset === rawUrl.indexOf('?') + 1 ? '?' : '&')
).replace(/[?&]$/, '');

const pool = new Pool({
  connectionString,
  ssl: rawUrl.includes('supabase') ? { rejectUnauthorized: false } : false,
});

export const db = drizzle(pool, { schema });
