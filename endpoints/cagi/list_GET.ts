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

    const sheets = await db.selectFrom('cagiDataSheets')
      .select([
        'id', 'manufacturer', 'model', 'compressorType',
        'capacityCfm', 'fullLoadPowerKw', 'ratedPressurePsi', 'specificPower',
        'partLoad25', 'partLoad50', 'partLoad75', 'partLoad100',
        'testDate', 'sourceFile', 'createdAt'
      ])
      .where('facilityId', '=', facilityId)
      .orderBy('createdAt', 'desc')
      .execute();

    return new Response(superjson.stringify({ sheets }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch CAGI data';
    return new Response(superjson.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
