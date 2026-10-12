import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import styles from './nodes.module.css';

interface BaseNodeData {
  label: string;
  status?: 'online' | 'offline' | 'warning';
  value?: number;
  unit?: string;
}

// Base node wrapper
function BaseNode({
  children,
  data,
  selected,
  type,
}: {
  children: React.ReactNode;
  data: BaseNodeData;
  selected: boolean;
  type: string;
}) {
  return (
    <div className={`${styles.node} ${styles[type]} ${selected ? styles.selected : ''}`}>
      <Handle type="target" position={Position.Left} className={styles.handle} />
      {children}
      <Handle type="source" position={Position.Right} className={styles.handle} />
      <div className={styles.label}>{data.label}</div>
      {data.status && (
        <div className={`${styles.status} ${styles[data.status]}`} />
      )}
    </div>
  );
}

// Compressor Node
export const CompressorNode = memo(({ data, selected }: NodeProps) => {
  return (
    <BaseNode data={data as BaseNodeData} selected={selected} type="compressor">
      <div className={styles.icon}>
        <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="24" cy="24" r="16" />
          <path d="M24 12V36M12 24h24" />
          <circle cx="24" cy="24" r="8" fill="currentColor" opacity="0.2" />
        </svg>
      </div>
      {(data as BaseNodeData).value !== undefined && (
        <div className={styles.value}>
          {(data as BaseNodeData).value} {(data as BaseNodeData).unit}
        </div>
      )}
    </BaseNode>
  );
});
CompressorNode.displayName = 'CompressorNode';

// Dryer Node
export const DryerNode = memo(({ data, selected }: NodeProps) => {
  return (
    <BaseNode data={data as BaseNodeData} selected={selected} type="dryer">
      <div className={styles.icon}>
        <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="10" y="8" width="28" height="32" rx="2" />
          <path d="M18 16v16M24 12v20M30 16v16" strokeLinecap="round" />
        </svg>
      </div>
      {(data as BaseNodeData).value !== undefined && (
        <div className={styles.value}>
          {(data as BaseNodeData).value} {(data as BaseNodeData).unit}
        </div>
      )}
    </BaseNode>
  );
});
DryerNode.displayName = 'DryerNode';

// Receiver (Tank) Node
export const ReceiverNode = memo(({ data, selected }: NodeProps) => {
  return (
    <BaseNode data={data as BaseNodeData} selected={selected} type="receiver">
      <div className={styles.icon}>
        <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
          <ellipse cx="24" cy="10" rx="12" ry="4" />
          <ellipse cx="24" cy="38" rx="12" ry="4" />
          <path d="M12 10v28M36 10v28" />
        </svg>
      </div>
      {(data as BaseNodeData).value !== undefined && (
        <div className={styles.value}>
          {(data as BaseNodeData).value} {(data as BaseNodeData).unit}
        </div>
      )}
    </BaseNode>
  );
});
ReceiverNode.displayName = 'ReceiverNode';

// Filter Node
export const FilterNode = memo(({ data, selected }: NodeProps) => {
  return (
    <BaseNode data={data as BaseNodeData} selected={selected} type="filter">
      <div className={styles.icon}>
        <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="14" y="8" width="20" height="32" rx="2" />
          <path d="M18 16h12M18 24h12M18 32h12" strokeDasharray="2 2" />
        </svg>
      </div>
    </BaseNode>
  );
});
FilterNode.displayName = 'FilterNode';

// Sensor Node
export const SensorNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as BaseNodeData & { sensorType?: string };
  return (
    <BaseNode data={data as BaseNodeData} selected={selected} type="sensor">
      <div className={styles.sensorIcon}>
        <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="24" cy="24" r="14" />
          <path d="M24 14v10l6 4" strokeLinecap="round" />
        </svg>
      </div>
      {nodeData.value !== undefined && (
        <div className={styles.sensorValue}>
          <span className={styles.sensorNumber}>{nodeData.value}</span>
          <span className={styles.sensorUnit}>{nodeData.unit}</span>
        </div>
      )}
    </BaseNode>
  );
});
SensorNode.displayName = 'SensorNode';
