import { z } from 'zod';
import { db, saveDb } from '../../helpers/db';
import { wsHub } from '../../helpers/websocket';
import { verifyToken, extractTokenFromHeader, userHasFacilityAccess } from '../../helpers/auth';

const schema = z.object({
  sensorId: z.number(),
  value: z.number(),
  facilityId: z.number(),
});

export async function handle(request: Request) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('Authorization');
    const token = extractTokenFromHeader(authHeader || undefined);

    if (!token) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const json = await request.json();
    const data = schema.parse(json);

    // Verify user has access to the facility
    const hasAccess = await userHasFacilityAccess(payload.userId, data.facilityId);
    if (!hasAccess) {
      return new Response(JSON.stringify({ error: 'Access denied' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get sensor details
    const sensor = await db.selectFrom('sensors')
      .select(['id', 'facilityId', 'name', 'sensorType', 'unit'])
      .where('id', '=', data.sensorId)
      .where('facilityId', '=', data.facilityId)
      .executeTakeFirst();

    if (!sensor) {
      return new Response(JSON.stringify({ error: 'Sensor not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const timestamp = new Date().toISOString();

    // Insert test reading
    await db.insertInto('sensorReadings')
      .values({
        sensorId: sensor.id,
        value: data.value,
        timestamp,
        quality: 'good',
      })
      .execute();

    saveDb();

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

    const triggeredAlerts: any[] = [];

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

        saveDb();

        const alert = {
          id: alertResult.id,
          severity: rule.severity as 'critical' | 'warning' | 'info',
          message: `${sensor.name} ${rule.condition} ${rule.threshold} ${sensor.unit} (current: ${data.value})`,
          sensorName: sensor.name,
          value: data.value,
          unit: sensor.unit,
        };

        // Broadcast alert via WebSocket
        wsHub.broadcastAlert(sensor.facilityId, alert);
        triggeredAlerts.push(alert);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      sensorId: sensor.id,
      value: data.value,
      timestamp,
      alertsTriggered: triggeredAlerts.length,
      alerts: triggeredAlerts,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to send test reading';
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
