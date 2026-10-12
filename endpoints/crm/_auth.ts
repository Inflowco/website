import superjson from 'superjson';
import { verifyToken, extractTokenFromHeader } from '../../helpers/auth';
import { getDb } from '../../helpers/db';

export function requireUser(request: Request): Response | null {
  const token = extractTokenFromHeader(request.headers.get('Authorization') || undefined);
  if (!token) return new Response(superjson.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  if (!verifyToken(token)) return new Response(superjson.stringify({ error: 'Invalid token' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  return null;
}

const snakeToCamel = (s: string) => s.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());

export function query(sql: string, params: any[] = []): Record<string, any>[] {
  const db = getDb();
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  const rows: Record<string, any>[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(row)) out[snakeToCamel(k)] = v;
    rows.push(out);
  }
  stmt.free();
  return rows;
}

export function ok(body: any): Response {
  return new Response(superjson.stringify(body), { headers: { 'Content-Type': 'application/json' } });
}

export function fail(error: unknown, fallback: string): Response {
  const message = error instanceof Error ? error.message : fallback;
  return new Response(superjson.stringify({ error: message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
}
