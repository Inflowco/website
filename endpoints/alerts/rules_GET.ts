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
    const facilityId = url.searchParams.get('facilityId');

    if (facilityId) {
      const hasAccess = await userHasFacilityAccess(payload.userId, parseInt(facilityId));
      if (!hasAccess) {
        return new Response(superjson.stringify({ error: 'Access denied' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    const rules = await db.selectFrom('alertRules')
      .leftJoin('sensors', 'sensors.id', 'alertRules.sensorId')
      .select([
        'alertRules.id',
        'alertRules.name',
        'alertRules.condition',
        'alertRules.threshold',
        'alertRules.duration',
        'alertRules.severity',
        'alertRules.enabled',
        'sensors.name as sensorName',
      ])
      .where('alertRules.facilityId', '=', parseInt(facilityId || '0'))
      .execute();

    return new Response(superjson.stringify({ rules }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch rules';
    return new Response(superjson.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
