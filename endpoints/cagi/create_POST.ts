import { z } from 'zod';
import superjson from 'superjson';
import { db, saveDb } from '../../helpers/db';
import { verifyToken, extractTokenFromHeader, userHasFacilityAccess } from '../../helpers/auth';

const schema = z.object({
  facilityId: z.number(),
  manufacturer: z.string().min(1),
  model: z.string().min(1),
  compressorType: z.string().optional(),
  capacityCfm: z.number().positive(),
  fullLoadPowerKw: z.number().positive(),
  ratedPressurePsi: z.number().positive(),
  partLoad25: z.number().optional(),
  partLoad50: z.number().optional(),
  partLoad75: z.number().optional(),
  partLoad100: z.number().optional(),
  testDate: z.string().optional(),
  sourceFile: z.string().optional(),
});

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

    const text = await request.text();
    let json;
    try {
      const parsed = superjson.parse(text);
      json = parsed !== undefined ? parsed : JSON.parse(text);
    } catch {
      json = JSON.parse(text);
    }

    const data = schema.parse(json);

    const hasAccess = await userHasFacilityAccess(payload.userId, data.facilityId);
    if (!hasAccess) {
      return new Response(superjson.stringify({ error: 'Access denied' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Calculate specific power
    const specificPower = parseFloat((data.capacityCfm / data.fullLoadPowerKw).toFixed(2));

    const sheet = await db.insertInto('cagiDataSheets')
      .values({
        facilityId: data.facilityId,
        manufacturer: data.manufacturer,
        model: data.model,
        compressorType: data.compressorType || null,
        capacityCfm: data.capacityCfm,
        fullLoadPowerKw: data.fullLoadPowerKw,
        ratedPressurePsi: data.ratedPressurePsi,
        specificPower,
        partLoad25: data.partLoad25 || null,
        partLoad50: data.partLoad50 || null,
        partLoad75: data.partLoad75 || null,
        partLoad100: data.partLoad100 || null,
        testDate: data.testDate || null,
        sourceFile: data.sourceFile || null,
        createdBy: payload.userId,
      })
      .returning([
        'id', 'manufacturer', 'model', 'compressorType',
        'capacityCfm', 'fullLoadPowerKw', 'ratedPressurePsi', 'specificPower'
      ])
      .executeTakeFirstOrThrow();

    saveDb();

    return new Response(superjson.stringify({ sheet }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save CAGI data';
    return new Response(superjson.stringify({ error: message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
