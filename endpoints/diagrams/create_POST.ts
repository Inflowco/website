import { z } from 'zod';
import superjson from 'superjson';
import { db } from '../../helpers/db';
import { verifyToken, extractTokenFromHeader, userHasFacilityAccess } from '../../helpers/auth';

const schema = z.object({
  facilityId: z.number(),
  name: z.string().min(1),
  description: z.string().optional(),
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
    const json = superjson.parse(text);
    const data = schema.parse(json);

    const hasAccess = await userHasFacilityAccess(payload.userId, data.facilityId);
    if (!hasAccess) {
      return new Response(superjson.stringify({ error: 'Access denied' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const diagram = await db.insertInto('diagrams')
      .values({
        facilityId: data.facilityId,
        name: data.name,
        description: data.description || null,
        createdBy: payload.userId,
        updatedAt: new Date().toISOString(),
      })
      .returning(['id', 'name', 'description', 'updatedAt', 'createdAt'])
      .executeTakeFirstOrThrow();

    return new Response(superjson.stringify({ diagram }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create diagram';
    return new Response(superjson.stringify({ error: message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
