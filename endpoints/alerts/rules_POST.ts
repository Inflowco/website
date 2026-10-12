import { z } from 'zod';
import superjson from 'superjson';
import { db } from '../../helpers/db';
import { verifyToken, extractTokenFromHeader, userHasFacilityAccess } from '../../helpers/auth';

const schema = z.object({
  facilityId: z.number(),
  sensorId: z.number().optional(),
  name: z.string().min(1),
  condition: z.enum(['above', 'below', 'equal', 'change_rate']),
  threshold: z.number(),
  duration: z.number().default(0),
  severity: z.enum(['critical', 'warning', 'info']).default('warning'),
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

    const rule = await db.insertInto('alertRules')
      .values({
        facilityId: data.facilityId,
        sensorId: data.sensorId || null,
        name: data.name,
        condition: data.condition,
        threshold: data.threshold,
        duration: data.duration,
        severity: data.severity,
        enabled: 1,
      })
      .returning(['id', 'name', 'condition', 'threshold', 'severity', 'enabled'])
      .executeTakeFirstOrThrow();

    return new Response(superjson.stringify({ rule }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create rule';
    return new Response(superjson.stringify({ error: message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
