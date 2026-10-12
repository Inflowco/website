import { useState, useEffect, useCallback, useRef } from 'react';

interface SensorReading {
  sensorId: number;
  sensorName: string;
  sensorType: string;
  value: number;
  unit: string;
  timestamp: string;
}

interface Alert {
  id: number;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  sensorName?: string;
  value?: number;
  unit?: string;
}

interface WebSocketMessage {
  type: string;
  channel?: string;
  data?: any;
  timestamp?: string;
}

interface UseRealtimeReadingsOptions {
  facilityId: number | null;
  onReading?: (reading: SensorReading) => void;
  onAlert?: (alert: Alert) => void;
  enabled?: boolean;
}

export function useRealtimeReadings({
  facilityId,
  onReading,
  onAlert,
  enabled = true,
}: UseRealtimeReadingsOptions) {
  const [connected, setConnected] = useState(false);
  const [readings, setReadings] = useState<Map<number, SensorReading>>(new Map());
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);

  const connect = useCallback(() => {
    if (!enabled || facilityId === null) return;

    // Determine WebSocket URL
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    console.log('Connecting to WebSocket:', wsUrl);

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
      setConnected(true);
      setError(null);
      reconnectAttempts.current = 0;

      // Subscribe to facility channel
      ws.send(JSON.stringify({
        type: 'subscribe',
        channel: `facility:${facilityId}`,
      }));
    };

    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);

        switch (message.type) {
          case 'sensor_reading':
            if (message.data) {
              const reading = message.data as SensorReading;
              setReadings(prev => new Map(prev).set(reading.sensorId, reading));
              onReading?.(reading);
            }
            break;

          case 'alert':
            if (message.data) {
              const alert = message.data as Alert;
              setAlerts(prev => [alert, ...prev].slice(0, 50)); // Keep last 50 alerts
              onAlert?.(alert);
            }
            break;

          case 'connected':
            console.log('Server acknowledged connection');
            break;

          case 'subscribed':
            console.log('Subscribed to channel:', message.channel);
            break;

          default:
            // Ignore other message types
            break;
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setConnected(false);
      wsRef.current = null;

      // Attempt to reconnect with exponential backoff
      if (enabled && reconnectAttempts.current < 10) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
        reconnectAttempts.current++;

        console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current})`);
        reconnectTimeoutRef.current = setTimeout(connect, delay);
      }
    };

    ws.onerror = (event) => {
      console.error('WebSocket error:', event);
      setError('Connection error');
    };
  }, [enabled, facilityId, onReading, onAlert]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setConnected(false);
  }, []);

  // Connect when component mounts and facility changes
  useEffect(() => {
    if (enabled && facilityId !== null) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, facilityId, connect, disconnect]);

  // Clear alerts
  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  // Dismiss a specific alert
  const dismissAlert = useCallback((alertId: number) => {
    setAlerts(prev => prev.filter(a => a.id !== alertId));
  }, []);

  // Get all readings as array
  const readingsArray = Array.from(readings.values());

  return {
    connected,
    readings: readingsArray,
    readingsMap: readings,
    alerts,
    error,
    clearAlerts,
    dismissAlert,
    reconnect: connect,
  };
}

// Hook for just connection status (useful for status indicators)
export function useWebSocketStatus() {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);

    // Just ping to check connection
    const interval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);

    return () => {
      clearInterval(interval);
      ws.close();
    };
  }, []);

  return connected;
}
