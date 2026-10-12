import superjson from 'superjson';
import { db } from '../../helpers/db';
import { verifyToken, extractTokenFromHeader, userHasFacilityAccess } from '../../helpers/auth';

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
      .select(['id', 'facilityId', 'name', 'description', 'updatedAt', 'createdAt'])
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

    // Get nodes
    const dbNodes = await db.selectFrom('diagramNodes')
      .select(['nodeId', 'type', 'label', 'positionX', 'positionY', 'width', 'height', 'equipmentId', 'sensorId', 'data'])
      .where('diagramId', '=', parseInt(diagramId))
      .execute();

    // Get edges
    const dbEdges = await db.selectFrom('diagramEdges')
      .select(['edgeId', 'sourceNodeId', 'targetNodeId', 'sourceHandle', 'targetHandle', 'type', 'data'])
      .where('diagramId', '=', parseInt(diagramId))
      .execute();

    // Convert to React Flow format
    const nodes = dbNodes.map(n => ({
      id: n.nodeId,
      type: n.type,
      position: { x: n.positionX, y: n.positionY },
      data: {
        label: n.label,
        sensorId: n.sensorId || null,
        equipmentId: n.equipmentId || null,
        ...(n.data ? JSON.parse(n.data) : {}),
      },
      width: n.width,
      height: n.height,
    }));

    const edges = dbEdges.map(e => ({
      id: e.edgeId,
      source: e.sourceNodeId,
      target: e.targetNodeId,
      sourceHandle: e.sourceHandle,
      targetHandle: e.targetHandle,
      type: 'smoothstep',
    }));

    return new Response(superjson.stringify({ diagram, nodes, edges }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch diagram';
    return new Response(superjson.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
