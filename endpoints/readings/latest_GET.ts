import superjson from 'superjson';
import { db } from '../../helpers/db';
import { verifyToken, extractTokenFromHeader, userHasFacilityAccess } from '../../helpers/auth';
import { sql } from 'kysely';

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
    const facilityId = url.searchParams.get('facilityId');

    if (!facilityId) {
      return new Response(superjson.stringify({ error: 'facilityId required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const hasAccess = await userHasFacilityAccess(payload.userId, parseInt(facilityId));
    if (!hasAccess) {
      return new Response(superjson.stringify({ error: 'Access denied' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get latest reading for each sensor in the facility
    const readings = await db.selectFrom('sensors')
      .leftJoin('sensorReadings', (join) =>
        join
          .onRef('sensorReadings.sensorId', '=', 'sensors.id')
          .on('sensorReadings.id', '=', sql`(
            SELECT id FROM sensor_readings sr2
            WHERE sr2.sensor_id = sensors.id
            ORDER BY sr2.timestamp DESC
            LIMIT 1
          )`)
      )
      .select([
        'sensors.id as sensorId',
        'sensors.name as sensorName',
        'sensors.sensorType',
        'sensors.unit',
        'sensorReadings.value',
        'sensorReadings.timestamp',
        'sensorReadings.quality',
      ])
      .where('sensors.facilityId', '=', parseInt(facilityId))
      .execute();

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
