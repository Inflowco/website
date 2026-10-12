import { z } from 'zod';
import superjson from 'superjson';
import { db } from '../../helpers/db';
import { verifyToken, extractTokenFromHeader, userHasFacilityAccess } from '../../helpers/auth';
import { v4 as uuidv4 } from 'uuid';

const schema = z.object({
  facilityId: z.number(),
  equipmentId: z.number().optional(),
  name: z.string().min(1),
  sensorType: z.enum(['pressure', 'temperature', 'flow', 'power', 'humidity', 'dewpoint', 'vibration']),
  unit: z.string().min(1),
  minValue: z.number().optional(),
  maxValue: z.number().optional(),
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

    const apiKey = uuidv4();

    const sensor = await db.insertInto('sensors')
      .values({
        facilityId: data.facilityId,
        equipmentId: data.equipmentId || null,
        name: data.name,
        sensorType: data.sensorType,
        unit: data.unit,
        apiKey,
        minValue: data.minValue || null,
        maxValue: data.maxValue || null,
      })
      .returning(['id', 'name', 'sensorType', 'unit', 'apiKey'])
      .executeTakeFirstOrThrow();

    return new Response(superjson.stringify({ sensor }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create sensor';
    return new Response(superjson.stringify({ error: message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
