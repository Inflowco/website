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
    const status = url.searchParams.get('status');

    if (facilityId) {
      const hasAccess = await userHasFacilityAccess(payload.userId, parseInt(facilityId));
      if (!hasAccess) {
        return new Response(superjson.stringify({ error: 'Access denied' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    let query = db.selectFrom('alerts')
      .innerJoin('alertRules', 'alertRules.id', 'alerts.alertRuleId')
      .innerJoin('sensors', 'sensors.id', 'alerts.sensorId')
      .select([
        'alerts.id',
        'alerts.message',
        'alerts.value',
        'alerts.status',
        'alerts.createdAt',
        'alertRules.severity',
        'sensors.name as sensorName',
        'sensors.unit',
      ])
      .orderBy('alerts.createdAt', 'desc')
      .limit(100);

    if (facilityId) {
      query = query.where('alerts.facilityId', '=', parseInt(facilityId));
    }

    if (status) {
      query = query.where('alerts.status', '=', status as any);
    }

    const alerts = await query.execute();

    return new Response(superjson.stringify({ alerts }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch alerts';
    return new Response(superjson.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
