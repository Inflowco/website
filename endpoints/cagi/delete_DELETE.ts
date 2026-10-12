import superjson from 'superjson';
import { db, saveDb } from '../../helpers/db';
import { verifyToken, extractTokenFromHeader, userHasFacilityAccess } from '../../helpers/auth';

export async function handle(request: Request, sheetId: string) {
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

    // Get the sheet to check facility access
    const sheet = await db.selectFrom('cagiDataSheets')
      .select(['facilityId'])
      .where('id', '=', parseInt(sheetId))
      .executeTakeFirst();

    if (!sheet) {
      return new Response(superjson.stringify({ error: 'Sheet not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const hasAccess = await userHasFacilityAccess(payload.userId, sheet.facilityId);
    if (!hasAccess) {
      return new Response(superjson.stringify({ error: 'Access denied' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await db.deleteFrom('cagiDataSheets')
      .where('id', '=', parseInt(sheetId))
      .execute();

    saveDb();

    return new Response(superjson.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete sheet';
    return new Response(superjson.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
