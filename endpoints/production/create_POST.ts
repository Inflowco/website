import { z } from 'zod';
import superjson from 'superjson';
import { db, saveDb } from '../../helpers/db';
import { verifyToken, extractTokenFromHeader, userHasFacilityAccess } from '../../helpers/auth';

const schema = z.object({
  facilityId: z.number(),
  date: z.string(),
  shift: z.enum(['day', 'swing', 'night', 'all']).default('all'),
  productType: z.string().min(1),
  unitsProduced: z.number().min(0),
  runtimeHours: z.number().min(0).optional(),
  energyKwh: z.number().min(0).optional(),
  airCfmAvg: z.number().min(0).optional(),
  notes: z.string().optional(),
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

    // If energy not provided, estimate from sensor readings for that date
    let energyKwh = data.energyKwh;
    if (!energyKwh && data.runtimeHours) {
      // Get average power from sensor readings for the date
      const powerReadings = await db.selectFrom('sensorReadings')
        .select(['value'])
        .leftJoin('sensors', 'sensors.id', 'sensorReadings.sensorId')
        .where('sensors.facilityId', '=', data.facilityId)
        .where('sensors.sensorType', '=', 'power')
        .where('sensorReadings.timestamp', 'like', `${data.date}%`)
        .execute();

      if (powerReadings.length > 0) {
        const avgPower = powerReadings.reduce((sum, r) => sum + r.value, 0) / powerReadings.length;
        energyKwh = avgPower * data.runtimeHours;
      }
    }

    // If CFM not provided, estimate from sensor readings
    let airCfmAvg = data.airCfmAvg;
    if (!airCfmAvg) {
      const flowReadings = await db.selectFrom('sensorReadings')
        .select(['value'])
        .leftJoin('sensors', 'sensors.id', 'sensorReadings.sensorId')
        .where('sensors.facilityId', '=', data.facilityId)
        .where('sensors.sensorType', '=', 'flow')
        .where('sensorReadings.timestamp', 'like', `${data.date}%`)
        .execute();

      if (flowReadings.length > 0) {
        airCfmAvg = flowReadings.reduce((sum, r) => sum + r.value, 0) / flowReadings.length;
      }
    }

    const entry = await db.insertInto('productionData')
      .values({
        facilityId: data.facilityId,
        date: data.date,
        shift: data.shift,
        productType: data.productType,
        unitsProduced: data.unitsProduced,
        runtimeHours: data.runtimeHours || null,
        energyKwh: energyKwh || null,
        airCfmAvg: airCfmAvg || null,
        notes: data.notes || null,
        createdBy: payload.userId,
      })
      .returning(['id', 'date', 'shift', 'productType', 'unitsProduced', 'runtimeHours', 'energyKwh', 'airCfmAvg'])
      .executeTakeFirstOrThrow();

    saveDb();

    return new Response(superjson.stringify({ entry }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create production entry';
    return new Response(superjson.stringify({ error: message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
