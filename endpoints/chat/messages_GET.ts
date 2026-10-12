import superjson from 'superjson';
import { db } from '../../helpers/db';
import { verifyToken, extractTokenFromHeader } from '../../helpers/auth';

export async function handle(request: Request, sessionId: string) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = extractTokenFromHeader(authHeader || undefined);

    if (!token) {
      return new Response(superjson.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return new Response(superjson.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify session belongs to user
    const session = await db.selectFrom('chatSessions')
      .select('userId')
      .where('id', '=', parseInt(sessionId))
      .executeTakeFirst();

    if (!session || session.userId !== payload.userId) {
      return new Response(superjson.stringify({ error: 'Session not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const messages = await db.selectFrom('chatMessages')
      .select(['id', 'role', 'content', 'sources', 'createdAt'])
      .where('sessionId', '=', parseInt(sessionId))
      .orderBy('createdAt', 'asc')
      .execute();

    // Parse sources JSON
    const parsedMessages = messages.map(m => ({
      ...m,
      sources: m.sources ? JSON.parse(m.sources) : null,
    }));

    return new Response(superjson.stringify({ messages: parsedMessages }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch messages';
    return new Response(superjson.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
