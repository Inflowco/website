import superjson from 'superjson';
import { db } from '../../helpers/db';
import { verifyToken, extractTokenFromHeader, userHasFacilityAccess } from '../../helpers/auth';

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

    const url = new URL(request.url);
    const sensorId = url.searchParams.get('sensorId');
    const facilityId = url.searchParams.get('facilityId');
    const start = url.searchParams.get('start');
    const end = url.searchParams.get('end');
    const limit = parseInt(url.searchParams.get('limit') || '100');

    if (!sensorId && !facilityId) {
      return new Response(superjson.stringify({ error: 'sensorId or facilityId required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify access
    if (facilityId) {
      const hasAccess = await userHasFacilityAccess(payload.userId, parseInt(facilityId));
      if (!hasAccess) {
        return new Response(superjson.stringify({ error: 'Access denied' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    let query = db.selectFrom('sensorReadings')
      .innerJoin('sensors', 'sensors.id', 'sensorReadings.sensorId')
      .select([
        'sensorReadings.id',
        'sensorReadings.sensorId',
        'sensors.name as sensorName',
        'sensorReadings.value',
        'sensorReadings.timestamp',
        'sensorReadings.quality',
      ])
      .orderBy('sensorReadings.timestamp', 'desc')
      .limit(limit);

    if (sensorId) {
      query = query.where('sensorReadings.sensorId', '=', parseInt(sensorId));
    }

    if (facilityId) {
      query = query.where('sensors.facilityId', '=', parseInt(facilityId));
    }

    if (start) {
      query = query.where('sensorReadings.timestamp', '>=', start);
    }

    if (end) {
      query = query.where('sensorReadings.timestamp', '<=', end);
    }

    const readings = await query.execute();

    return new Response(superjson.stringify({ readings }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch readings';
    return new Response(superjson.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
