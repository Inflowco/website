import { z } from 'zod';
import superjson from 'superjson';
import { db } from '../../helpers/db';
import { verifyToken, extractTokenFromHeader } from '../../helpers/auth';

const schema = z.object({
  title: z.string().optional(),
  facilityId: z.number().optional(),
});

export async function handle(request: Request) {
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

    const text = await request.text();
    const json = text ? superjson.parse(text) : {};
    const data = schema.parse(json);

    const session = await db.insertInto('chatSessions')
      .values({
        userId: payload.userId,
        title: data.title || 'New Chat',
        facilityId: data.facilityId || null,
      })
      .returning(['id', 'title', 'createdAt'])
      .executeTakeFirstOrThrow();

    return new Response(superjson.stringify({ session }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create session';
    return new Response(superjson.stringify({ error: message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
