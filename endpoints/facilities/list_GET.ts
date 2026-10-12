import superjson from 'superjson';
import { db } from '../../helpers/db';
import { verifyToken, extractTokenFromHeader } from '../../helpers/auth';

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

    const facilities = await db.selectFrom('userFacilityAccess')
      .innerJoin('facilities', 'facilities.id', 'userFacilityAccess.facilityId')
      .select([
        'facilities.id',
        'facilities.name',
        'facilities.address',
        'facilities.timezone',
        'userFacilityAccess.accessLevel',
      ])
      .where('userFacilityAccess.userId', '=', payload.userId)
      .execute();

    return new Response(superjson.stringify({ facilities }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch facilities';
    return new Response(superjson.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
