import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { format } from 'date-fns';
import styles from './LiveChart.module.css';

interface DataPoint {
  timestamp: string | Date;
  value: number;
}

interface LiveChartProps {
  data: DataPoint[];
  title?: string;
  unit?: string;
  color?: string;
  minValue?: number;
  maxValue?: number;
  warningThreshold?: number;
  criticalThreshold?: number;
  height?: number;
  showGrid?: boolean;
  animate?: boolean;
}

export function LiveChart({
  data,
  title,
  unit = '',
  color = 'var(--color-primary)',
  minValue,
  maxValue,
  warningThreshold,
  criticalThreshold,
  height = 200,
  showGrid = true,
  animate = true,
}: LiveChartProps) {
  const chartData = useMemo(() => {
    return data.map(point => ({
      ...point,
      timestamp: typeof point.timestamp === 'string' ? new Date(point.timestamp) : point.timestamp,
      displayTime: format(
        typeof point.timestamp === 'string' ? new Date(point.timestamp) : point.timestamp,
        'HH:mm:ss'
      ),
    }));
  }, [data]);

  const domain = useMemo(() => {
    if (minValue !== undefined && maxValue !== undefined) {
      return [minValue, maxValue];
    }

    if (chartData.length === 0) return [0, 100];

    const values = chartData.map(d => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = (max - min) * 0.1 || 10;

    return [
      minValue !== undefined ? minValue : Math.floor(min - padding),
      maxValue !== undefined ? maxValue : Math.ceil(max + padding),
    ];
  }, [chartData, minValue, maxValue]);

  const formatTooltipValue = (value: number) => {
    return `${value.toFixed(2)} ${unit}`;
  };

  return (
    <div className={styles.container}>
      {title && <h3 className={styles.title}>{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
          {showGrid && (
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          )}
          <XAxis
            dataKey="displayTime"
            stroke="var(--color-muted-foreground)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            domain={domain as [number, number]}
            stroke="var(--color-muted-foreground)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            width={50}
            tickFormatter={(value) => `${value}${unit ? ` ${unit}` : ''}`}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              return (
                <div className={styles.tooltip}>
                  <p className={styles.tooltipLabel}>{label}</p>
                  <p className={styles.tooltipValue}>
                    {formatTooltipValue(payload[0].value as number)}
                  </p>
                </div>
              );
            }}
          />
          {warningThreshold !== undefined && (
            <ReferenceLine
              y={warningThreshold}
              stroke="var(--color-warning)"
              strokeDasharray="5 5"
              label={{
                value: 'Warning',
                fill: 'var(--color-warning)',
                fontSize: 10,
                position: 'right',
              }}
            />
          )}
          {criticalThreshold !== undefined && (
            <ReferenceLine
              y={criticalThreshold}
              stroke="var(--color-destructive)"
              strokeDasharray="5 5"
              label={{
                value: 'Critical',
                fill: 'var(--color-destructive)',
                fontSize: 10,
                position: 'right',
              }}
            />
          )}
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
            isAnimationActive={animate}
            animationDuration={300}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
