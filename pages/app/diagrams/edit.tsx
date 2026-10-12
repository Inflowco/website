import { useState, useCallback, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Panel,
  Connection,
  Edge,
  Node,
  NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useAuth, useAuthFetch } from '../../../helpers/useAuth';
import { useRealtimeReadings } from '../../../helpers/useRealtimeReadings';
import { Button } from '../../../components/Button';
import { Save, ArrowLeft, Plus, Trash2, Wifi, WifiOff } from 'lucide-react';
import superjson from 'superjson';
import { CompressorNode, DryerNode, SensorNode, ReceiverNode, FilterNode } from '../../../components/diagram/nodes';
import styles from './edit.module.css';

interface Sensor {
  id: number;
  name: string;
  sensorType: string;
  unit: string;
}

const nodeTypes: NodeTypes = {
  compressor: CompressorNode,
  dryer: DryerNode,
  sensor: SensorNode,
  receiver: ReceiverNode,
  filter: FilterNode,
};

const nodeTemplates = [
  { type: 'compressor', label: 'Compressor', icon: '🔵' },
  { type: 'dryer', label: 'Dryer', icon: '❄️' },
  { type: 'receiver', label: 'Receiver', icon: '🛢️' },
  { type: 'filter', label: 'Filter', icon: '🔲' },
  { type: 'sensor', label: 'Sensor', icon: '📊' },
];

export default function DiagramEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const authFetch = useAuthFetch();
  const { currentFacilityId } = useAuth();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [diagramName, setDiagramName] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [sensors, setSensors] = useState<Sensor[]>([]);

  // WebSocket for live sensor data
  const { connected, readings } = useRealtimeReadings({
    facilityId: currentFacilityId,
    enabled: true,
  });

  // Update nodes with live sensor data
  useEffect(() => {
    if (readings.length === 0) return;

    setNodes((currentNodes) =>
      currentNodes.map((node) => {
        const linkedSensorId = node.data.sensorId;
        if (!linkedSensorId) return node;

        const reading = readings.find((r) => r.sensorId === linkedSensorId);
        if (!reading) return node;

        return {
          ...node,
          data: {
            ...node.data,
            value: reading.value.toFixed(1),
            unit: reading.unit,
            status: 'online',
          },
        };
      })
    );
  }, [readings, setNodes]);

  // Fetch sensors for the facility
  useEffect(() => {
    if (!currentFacilityId) return;

    const fetchSensors = async () => {
      try {
        const response = await authFetch(`/_api/sensors?facilityId=${currentFacilityId}`);
        if (response.ok) {
          const data = superjson.parse(await response.text());
          setSensors(data.sensors || []);
        }
      } catch (error) {
        console.error('Failed to fetch sensors:', error);
      }
    };

    fetchSensors();
  }, [currentFacilityId, authFetch]);

  // Load diagram
  useEffect(() => {
    if (!id || id === 'new') return;

    const loadDiagram = async () => {
      try {
        const response = await authFetch(`/_api/diagrams/${id}`);
        if (response.ok) {
          const data = superjson.parse(await response.text());
          setDiagramName(data.diagram.name);
          setNodes(data.nodes || []);
          setEdges(data.edges || []);
        }
      } catch (error) {
        console.error('Failed to load diagram:', error);
      }
    };

    loadDiagram();
  }, [id, authFetch, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, type: 'smoothstep' }, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const addNode = useCallback((type: string) => {
    const newNode: Node = {
      id: `${type}-${Date.now()}`,
      type,
      position: { x: 250, y: 250 },
      data: {
        label: type.charAt(0).toUpperCase() + type.slice(1),
        status: 'online',
      },
    };
    setNodes((nds) => [...nds, newNode]);
  }, [setNodes]);

  const deleteSelectedNode = useCallback(() => {
    if (!selectedNode) return;
    setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
    setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
    setSelectedNode(null);
  }, [selectedNode, setNodes, setEdges]);

  const saveDiagram = async () => {
    setSaving(true);
    try {
      const response = await authFetch(`/_api/diagrams/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: superjson.stringify({
          nodes: nodes.map((n) => ({
            nodeId: n.id,
            type: n.type,
            label: n.data.label,
            positionX: n.position.x,
            positionY: n.position.y,
            sensorId: n.data.sensorId || null,
            data: n.data,
          })),
          edges: edges.map((e) => ({
            edgeId: e.id,
            sourceNodeId: e.source,
            targetNodeId: e.target,
            sourceHandle: e.sourceHandle,
            targetHandle: e.targetHandle,
            type: 'pipe',
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save');
      }
    } catch (error) {
      console.error('Failed to save diagram:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <Button variant="ghost" onClick={() => navigate('/app/diagrams')}>
          <ArrowLeft size={18} />
          Back
        </Button>
        <h1 className={styles.title}>{diagramName || 'Untitled Diagram'}</h1>
        <div className={styles.toolbarActions}>
          <div className={styles.connectionStatus}>
            {connected ? (
              <span className={styles.connected}>
                <Wifi size={14} /> Live
              </span>
            ) : (
              <span className={styles.disconnected}>
                <WifiOff size={14} /> Offline
              </span>
            )}
          </div>
          {selectedNode && (
            <Button variant="ghost" onClick={deleteSelectedNode}>
              <Trash2 size={18} />
              Delete
            </Button>
          )}
          <Button onClick={saveDiagram} disabled={saving}>
            <Save size={18} />
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      <div className={styles.editorWrapper}>
        <div className={styles.sidebar}>
          <h3 className={styles.sidebarTitle}>Components</h3>
          <div className={styles.componentList}>
            {nodeTemplates.map((template) => (
              <button
                key={template.type}
                className={styles.componentButton}
                onClick={() => addNode(template.type)}
              >
                <span className={styles.componentIcon}>{template.icon}</span>
                <span>{template.label}</span>
                <Plus size={14} />
              </button>
            ))}
          </div>

          {selectedNode && (
            <div className={styles.propertiesPanel}>
              <h3 className={styles.sidebarTitle}>Properties</h3>
              <div className={styles.property}>
                <label>Label</label>
                <input
                  type="text"
                  value={selectedNode.data.label || ''}
                  onChange={(e) => {
                    setNodes((nds) =>
                      nds.map((n) =>
                        n.id === selectedNode.id
                          ? { ...n, data: { ...n.data, label: e.target.value } }
                          : n
                      )
                    );
                  }}
                  className={styles.input}
                />
              </div>
              <div className={styles.property}>
                <label>Type</label>
                <input
                  type="text"
                  value={selectedNode.type}
                  disabled
                  className={styles.input}
                />
              </div>
              <div className={styles.property}>
                <label>Link Sensor</label>
                <select
                  value={selectedNode.data.sensorId || ''}
                  onChange={(e) => {
                    const sensorId = e.target.value ? parseInt(e.target.value) : null;
                    const sensor = sensors.find((s) => s.id === sensorId);
                    setNodes((nds) =>
                      nds.map((n) =>
                        n.id === selectedNode.id
                          ? {
                              ...n,
                              data: {
                                ...n.data,
                                sensorId,
                                unit: sensor?.unit,
                                sensorType: sensor?.sensorType,
                              },
                            }
                          : n
                      )
                    );
                  }}
                  className={styles.select}
                >
                  <option value="">-- No sensor --</option>
                  {sensors.map((sensor) => (
                    <option key={sensor.id} value={sensor.id}>
                      {sensor.name} ({sensor.unit})
                    </option>
                  ))}
                </select>
              </div>
              {selectedNode.data.sensorId && (
                <div className={styles.liveValue}>
                  <span className={styles.liveLabel}>Live Value:</span>
                  <span className={styles.liveNumber}>
                    {selectedNode.data.value ?? '--'} {selectedNode.data.unit}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className={styles.canvas}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            fitView
            snapToGrid
            snapGrid={[15, 15]}
          >
            <Controls />
            <MiniMap />
            <Background gap={15} size={1} />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
}
