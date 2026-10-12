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
    const facilityId = parseInt(url.searchParams.get('facilityId') || '0');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    if (!facilityId) {
      return new Response(superjson.stringify({ error: 'facilityId required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const hasAccess = await userHasFacilityAccess(payload.userId, facilityId);
    if (!hasAccess) {
      return new Response(superjson.stringify({ error: 'Access denied' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let query = db.selectFrom('productionData')
      .select([
        'id', 'facilityId', 'date', 'shift', 'productType',
        'unitsProduced', 'runtimeHours', 'energyKwh', 'airCfmAvg', 'notes', 'createdAt'
      ])
      .where('facilityId', '=', facilityId)
      .orderBy('date', 'desc');

    if (startDate) {
      query = query.where('date', '>=', startDate);
    }
    if (endDate) {
      query = query.where('date', '<=', endDate);
    }

    const entries = await query.limit(100).execute();

    // Calculate summary stats
    const totalUnits = entries.reduce((sum, e) => sum + (e.unitsProduced || 0), 0);
    const totalEnergy = entries.reduce((sum, e) => sum + (e.energyKwh || 0), 0);
    const avgCfm = entries.length > 0
      ? entries.reduce((sum, e) => sum + (e.airCfmAvg || 0), 0) / entries.length
      : 0;

    return new Response(superjson.stringify({
      entries,
      summary: {
        totalUnits,
        totalEnergy: Math.round(totalEnergy),
        avgCfm: Math.round(avgCfm),
        energyPerUnit: totalUnits > 0 ? (totalEnergy / totalUnits).toFixed(3) : 0,
        cfmPerUnit: totalUnits > 0 ? (avgCfm * entries.length * 8 / totalUnits).toFixed(4) : 0, // Rough estimate
      },
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch production data';
    return new Response(superjson.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
