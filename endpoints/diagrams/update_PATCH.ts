import { z } from 'zod';
import superjson from 'superjson';
import { db } from '../../helpers/db';
import { verifyToken, extractTokenFromHeader, userHasFacilityAccess } from '../../helpers/auth';

const nodeSchema = z.object({
  nodeId: z.string(),
  type: z.string(),
  label: z.string(),
  positionX: z.number(),
  positionY: z.number(),
  width: z.number().optional(),
  height: z.number().optional(),
  equipmentId: z.number().optional(),
  sensorId: z.number().optional(),
  data: z.record(z.any()).optional(),
});

const edgeSchema = z.object({
  edgeId: z.string(),
  sourceNodeId: z.string(),
  targetNodeId: z.string(),
  sourceHandle: z.string().optional(),
  targetHandle: z.string().optional(),
  type: z.enum(['pipe', 'electrical', 'signal', 'default']).optional(),
});

const schema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  nodes: z.array(nodeSchema).optional(),
  edges: z.array(edgeSchema).optional(),
});

export async function handle(request: Request, diagramId: string) {
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

    const diagram = await db.selectFrom('diagrams')
      .select(['facilityId'])
      .where('id', '=', parseInt(diagramId))
      .executeTakeFirst();

    if (!diagram) {
      return new Response(superjson.stringify({ error: 'Diagram not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const hasAccess = await userHasFacilityAccess(payload.userId, diagram.facilityId);
    if (!hasAccess) {
      return new Response(superjson.stringify({ error: 'Access denied' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const text = await request.text();
    const json = superjson.parse(text);
    const data = schema.parse(json);

    // Update diagram metadata
    await db.updateTable('diagrams')
      .set({
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        updatedAt: new Date().toISOString(),
      })
      .where('id', '=', parseInt(diagramId))
      .execute();

    // Update nodes if provided
    if (data.nodes) {
      // Delete existing nodes
      await db.deleteFrom('diagramNodes')
        .where('diagramId', '=', parseInt(diagramId))
        .execute();

      // Insert new nodes
      if (data.nodes.length > 0) {
        await db.insertInto('diagramNodes')
          .values(
            data.nodes.map(n => ({
              diagramId: parseInt(diagramId),
              nodeId: n.nodeId,
              type: n.type as any,
              label: n.label,
              positionX: n.positionX,
              positionY: n.positionY,
              width: n.width || null,
              height: n.height || null,
              equipmentId: n.equipmentId || null,
              sensorId: n.sensorId || null,
              data: n.data ? JSON.stringify(n.data) : null,
            }))
          )
          .execute();
      }
    }

    // Update edges if provided
    if (data.edges) {
      // Delete existing edges
      await db.deleteFrom('diagramEdges')
        .where('diagramId', '=', parseInt(diagramId))
        .execute();

      // Insert new edges
      if (data.edges.length > 0) {
        await db.insertInto('diagramEdges')
          .values(
            data.edges.map(e => ({
              diagramId: parseInt(diagramId),
              edgeId: e.edgeId,
              sourceNodeId: e.sourceNodeId,
              targetNodeId: e.targetNodeId,
              sourceHandle: e.sourceHandle || null,
              targetHandle: e.targetHandle || null,
              type: (e.type as any) || 'default',
            }))
          )
          .execute();
      }
    }

    return new Response(superjson.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update diagram';
    return new Response(superjson.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
