import superjson from 'superjson';
import { db } from '../../helpers/db';
import { verifyToken, extractTokenFromHeader } from '../../helpers/auth';
import fs from 'fs/promises';

export async function handle(request: Request, documentId: string) {
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

    // Verify document belongs to user's organization
    const document = await db.selectFrom('documents')
      .select(['id', 'filePath', 'organizationId'])
      .where('id', '=', parseInt(documentId))
      .executeTakeFirst();

    if (!document) {
      return new Response(superjson.stringify({ error: 'Document not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (document.organizationId !== payload.organizationId) {
      return new Response(superjson.stringify({ error: 'Access denied' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Delete file from disk
    try {
      await fs.unlink(document.filePath);
    } catch (err) {
      // File might not exist, continue anyway
    }

    // Delete from database (cascades to chunks)
    await db.deleteFrom('documents')
      .where('id', '=', parseInt(documentId))
      .execute();

    return new Response(superjson.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete document';
    return new Response(superjson.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
