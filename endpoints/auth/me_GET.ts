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
      return new Response(superjson.stringify({ error: 'Invalid or expired token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get fresh user data
    const user = await db.selectFrom('users')
      .innerJoin('organizations', 'organizations.id', 'users.organizationId')
      .select([
        'users.id',
        'users.email',
        'users.firstName',
        'users.lastName',
        'users.role',
        'users.organizationId',
        'organizations.name as organizationName',
      ])
      .where('users.id', '=', payload.userId)
      .executeTakeFirst();

    if (!user) {
      return new Response(superjson.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get user's facilities
    const facilities = await db.selectFrom('userFacilityAccess')
      .innerJoin('facilities', 'facilities.id', 'userFacilityAccess.facilityId')
      .select([
        'facilities.id',
        'facilities.name',
        'facilities.timezone',
        'userFacilityAccess.accessLevel',
      ])
      .where('userFacilityAccess.userId', '=', user.id)
      .execute();

    return new Response(superjson.stringify({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        organizationId: user.organizationId,
        organizationName: user.organizationName,
      },
      facilities,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get user';
    return new Response(superjson.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
