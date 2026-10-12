import { z } from 'zod';
import superjson from 'superjson';
import { db } from '../../helpers/db';
import { wsHub } from '../../helpers/websocket';

const schema = z.object({
  apiKey: z.string().uuid(),
  value: z.number(),
  timestamp: z.string().optional(),
  quality: z.enum(['good', 'suspect', 'bad']).optional(),
});

const batchSchema = z.object({
  apiKey: z.string().uuid(),
  readings: z.array(z.object({
    value: z.number(),
    timestamp: z.string(),
    quality: z.enum(['good', 'suspect', 'bad']).optional(),
  })),
});

export async function handle(request: Request) {
  try {
    const text = await request.text();
    let json: any;

    try {
      const parsed = superjson.parse(text);
      // superjson returns undefined for regular JSON, so fallback
      json = parsed !== undefined ? parsed : JSON.parse(text);
    } catch {
      json = JSON.parse(text);
    }

    // Check if batch or single reading
    if (json.readings) {
      // Batch insert
      const data = batchSchema.parse(json);

      // Verify API key
      const sensor = await db.selectFrom('sensors')
        .select(['id', 'facilityId'])
        .where('apiKey', '=', data.apiKey)
        .executeTakeFirst();

      if (!sensor) {
        return new Response(JSON.stringify({ error: 'Invalid API key' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Insert readings
      const readings = data.readings.map(r => ({
        sensorId: sensor.id,
        value: r.value,
        timestamp: r.timestamp,
        quality: r.quality || null,
      }));

      await db.insertInto('sensorReadings')
        .values(readings)
        .execute();

      return new Response(JSON.stringify({
        success: true,
        count: readings.length,
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      // Single reading
      const data = schema.parse(json);

      // Verify API key and get sensor details
      const sensor = await db.selectFrom('sensors')
        .select(['id', 'facilityId', 'name', 'sensorType', 'unit'])
        .where('apiKey', '=', data.apiKey)
        .executeTakeFirst();

      if (!sensor) {
        return new Response(JSON.stringify({ error: 'Invalid API key' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const timestamp = data.timestamp || new Date().toISOString();

      await db.insertInto('sensorReadings')
        .values({
          sensorId: sensor.id,
          value: data.value,
          timestamp,
          quality: data.quality || null,
        })
        .execute();

      // Broadcast to WebSocket subscribers
      wsHub.broadcastSensorReading(sensor.facilityId, {
        sensorId: sensor.id,
        sensorName: sensor.name,
        sensorType: sensor.sensorType,
        value: data.value,
        unit: sensor.unit,
        timestamp,
      });

      // Check alert rules
      const alertRules = await db.selectFrom('alertRules')
        .select(['id', 'name', 'condition', 'threshold', 'severity'])
        .where('facilityId', '=', sensor.facilityId)
        .where('sensorId', '=', sensor.id)
        .where('enabled', '=', 1)
        .execute();

      for (const rule of alertRules) {
        let triggered = false;
        if (rule.condition === 'above' && data.value > rule.threshold) triggered = true;
        if (rule.condition === 'below' && data.value < rule.threshold) triggered = true;
        if (rule.condition === 'equal' && data.value === rule.threshold) triggered = true;

        if (triggered) {
          // Insert alert
          const alertResult = await db.insertInto('alerts')
            .values({
              alertRuleId: rule.id,
              sensorId: sensor.id,
              facilityId: sensor.facilityId,
              value: data.value,
              message: `${sensor.name} ${rule.condition} ${rule.threshold} ${sensor.unit} (current: ${data.value})`,
              status: 'active',
            })
            .executeTakeFirstOrThrow();

          // Broadcast alert via WebSocket
          wsHub.broadcastAlert(sensor.facilityId, {
            id: alertResult.id,
            severity: rule.severity as 'critical' | 'warning' | 'info',
            message: `${sensor.name} ${rule.condition} ${rule.threshold} ${sensor.unit} (current: ${data.value})`,
            sensorName: sensor.name,
            value: data.value,
            unit: sensor.unit,
          });
        }
      }

      return new Response(JSON.stringify({
        success: true,
        sensorId: sensor.id,
        timestamp,
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to ingest reading';
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
