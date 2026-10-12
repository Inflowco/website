import { AlertTriangle, AlertCircle, Info, X, Check } from 'lucide-react';
import { Button } from './Button';
import styles from './AlertBanner.module.css';

interface Alert {
  id: number;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  sensorName?: string;
  value?: number;
  unit?: string;
  createdAt: string;
}

interface AlertBannerProps {
  alerts: Alert[];
  onAcknowledge?: (alertId: number) => void;
  onDismiss?: (alertId: number) => void;
}

export function AlertBanner({ alerts, onAcknowledge, onDismiss }: AlertBannerProps) {
  if (alerts.length === 0) return null;

  const getIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle size={20} />;
      case 'warning':
        return <AlertTriangle size={20} />;
      default:
        return <Info size={20} />;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={styles.container}>
      {alerts.map(alert => (
        <div key={alert.id} className={`${styles.alert} ${styles[alert.severity]}`}>
          <div className={styles.icon}>
            {getIcon(alert.severity)}
          </div>
          <div className={styles.content}>
            <span className={styles.message}>{alert.message}</span>
            {alert.sensorName && (
              <span className={styles.details}>
                {alert.sensorName}
                {alert.value !== undefined && `: ${alert.value}${alert.unit || ''}`}
              </span>
            )}
            <span className={styles.time}>{formatTime(alert.createdAt)}</span>
          </div>
          <div className={styles.actions}>
            {onAcknowledge && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onAcknowledge(alert.id)}
                className={styles.acknowledgeButton}
              >
                <Check size={16} />
                Acknowledge
              </Button>
            )}
            {onDismiss && (
              <button
                className={styles.dismissButton}
                onClick={() => onDismiss(alert.id)}
                aria-label="Dismiss"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
