import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import styles from './MetricCard.module.css';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  icon?: React.ReactNode;
  status?: 'normal' | 'warning' | 'critical';
  loading?: boolean;
}

export function MetricCard({
  title,
  value,
  unit,
  trend,
  trendValue,
  icon,
  status = 'normal',
  loading = false,
}: MetricCardProps) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  return (
    <div className={`${styles.card} ${styles[status]}`}>
      <div className={styles.header}>
        <span className={styles.title}>{title}</span>
        {icon && <span className={styles.icon}>{icon}</span>}
      </div>

      <div className={styles.content}>
        {loading ? (
          <div className={styles.skeleton} />
        ) : (
          <>
            <span className={styles.value}>{value}</span>
            {unit && <span className={styles.unit}>{unit}</span>}
          </>
        )}
      </div>

      {trend && trendValue && (
        <div className={`${styles.trend} ${styles[`trend${trend.charAt(0).toUpperCase() + trend.slice(1)}`]}`}>
          <TrendIcon size={14} />
          <span>{trendValue}</span>
        </div>
      )}
    </div>
  );
}
