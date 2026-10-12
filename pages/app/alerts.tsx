import { useState, useEffect, useCallback } from 'react';
import { useAuth, useAuthFetch } from '../../helpers/useAuth';
import { useRealtimeReadings } from '../../helpers/useRealtimeReadings';
import { Button } from '../../components/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/Dialog';
import { Input } from '../../components/Input';
import { Badge } from '../../components/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/Tabs';
import { Plus, Bell, BellOff, AlertTriangle, AlertCircle, Info, Check, Clock, Wifi, WifiOff, Zap, TestTube } from 'lucide-react';
import superjson from 'superjson';
import { format } from 'date-fns';
import styles from './alerts.module.css';

interface Sensor {
  id: number;
  name: string;
  sensorType: string;
  unit: string;
}

interface Alert {
  id: number;
  message: string;
  severity: 'critical' | 'warning' | 'info';
  status: 'active' | 'acknowledged' | 'resolved';
  sensorName: string;
  value: number;
  unit: string;
  createdAt: string;
}

interface AlertRule {
  id: number;
  name: string;
  condition: string;
  threshold: number;
  severity: 'critical' | 'warning' | 'info';
  enabled: boolean;
  sensorName?: string;
}

export default function AlertsPage() {
  const { currentFacilityId } = useAuth();
  const authFetch = useAuthFetch();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddRule, setShowAddRule] = useState(false);
  const [showTestAlert, setShowTestAlert] = useState(false);
  const [testValue, setTestValue] = useState(120);
  const [testSensorId, setTestSensorId] = useState<number | null>(null);
  const [testing, setTesting] = useState(false);
  const [newRule, setNewRule] = useState({
    name: '',
    sensorId: null as number | null,
    condition: 'above',
    threshold: 100,
    severity: 'warning' as const,
  });

  // Handle real-time alerts from WebSocket
  const handleAlert = useCallback((alert: Alert) => {
    setAlerts(prev => {
      // Avoid duplicates
      if (prev.some(a => a.id === alert.id)) return prev;
      return [{ ...alert, status: 'active', createdAt: new Date().toISOString() }, ...prev];
    });
  }, []);

  // WebSocket for live alerts
  const { connected } = useRealtimeReadings({
    facilityId: currentFacilityId,
    onAlert: handleAlert,
    enabled: true,
  });

  useEffect(() => {
    if (!currentFacilityId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [alertsRes, rulesRes, sensorsRes] = await Promise.all([
          authFetch(`/_api/alerts?facilityId=${currentFacilityId}`),
          authFetch(`/_api/alerts/rules?facilityId=${currentFacilityId}`),
          authFetch(`/_api/sensors?facilityId=${currentFacilityId}`),
        ]);

        if (alertsRes.ok) {
          const data = superjson.parse(await alertsRes.text());
          setAlerts(data.alerts || []);
        }
        if (rulesRes.ok) {
          const data = superjson.parse(await rulesRes.text());
          setRules(data.rules || []);
        }
        if (sensorsRes.ok) {
          const data = superjson.parse(await sensorsRes.text());
          setSensors(data.sensors || []);
          // Set default test sensor
          if (data.sensors?.length > 0) {
            setTestSensorId(data.sensors[0].id);
          }
        }
      } catch (error) {
        console.error('Failed to fetch alerts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentFacilityId, authFetch]);

  // Create new alert rule
  const createRule = async () => {
    if (!currentFacilityId || !newRule.name || !newRule.sensorId) return;

    try {
      const response = await authFetch('/_api/alerts/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: superjson.stringify({
          facilityId: currentFacilityId,
          sensorId: newRule.sensorId,
          name: newRule.name,
          condition: newRule.condition,
          threshold: newRule.threshold,
          severity: newRule.severity,
        }),
      });

      if (response.ok) {
        const data = superjson.parse(await response.text());
        const sensor = sensors.find(s => s.id === newRule.sensorId);
        setRules(prev => [...prev, { ...data.rule, sensorName: sensor?.name, enabled: true }]);
        setShowAddRule(false);
        setNewRule({ name: '', sensorId: null, condition: 'above', threshold: 100, severity: 'warning' });
      }
    } catch (error) {
      console.error('Failed to create rule:', error);
    }
  };

  // Test alert by sending a sensor reading that triggers the rule
  const testAlert = async () => {
    if (!testSensorId) return;

    setTesting(true);
    try {
      // Get the sensor's API key (we'll need to add an endpoint for this or use a test endpoint)
      const sensor = sensors.find(s => s.id === testSensorId);

      // Post a test reading via a test endpoint
      const response = await authFetch('/_api/readings/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sensorId: testSensorId,
          value: testValue,
          facilityId: currentFacilityId,
        }),
      });

      if (response.ok) {
        // Alert should appear via WebSocket if rule triggers
        console.log('Test reading sent successfully');
      }
    } catch (error) {
      console.error('Failed to send test reading:', error);
    } finally {
      setTesting(false);
      setShowTestAlert(false);
    }
  };

  const acknowledgeAlert = async (alertId: number) => {
    try {
      await authFetch(`/_api/alerts/${alertId}/acknowledge`, { method: 'POST' });
      setAlerts(prev =>
        prev.map(a => (a.id === alertId ? { ...a, status: 'acknowledged' } : a))
      );
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle size={18} />;
      case 'warning':
        return <AlertTriangle size={18} />;
      default:
        return <Info size={18} />;
    }
  };

  const activeAlerts = alerts.filter(a => a.status === 'active');
  const acknowledgedAlerts = alerts.filter(a => a.status === 'acknowledged');
  const resolvedAlerts = alerts.filter(a => a.status === 'resolved');

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Alerts</h1>
          <p className={styles.subtitle}>Monitor and manage system alerts</p>
        </div>
        <div className={styles.headerActions}>
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

          {/* Test Alert Dialog */}
          <Dialog open={showTestAlert} onOpenChange={setShowTestAlert}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <TestTube size={18} />
                Test Alert
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Test Alert Trigger</DialogTitle>
              </DialogHeader>
              <div className={styles.form}>
                <p className={styles.testDescription}>
                  Send a test reading to trigger alert rules. If the value matches a rule's condition,
                  an alert will be generated and appear in real-time.
                </p>
                <div className={styles.field}>
                  <label>Sensor</label>
                  <select
                    value={testSensorId || ''}
                    onChange={e => setTestSensorId(parseInt(e.target.value))}
                    className={styles.select}
                  >
                    {sensors.map(sensor => (
                      <option key={sensor.id} value={sensor.id}>
                        {sensor.name} ({sensor.unit})
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.field}>
                  <label>Test Value</label>
                  <Input
                    type="number"
                    value={testValue}
                    onChange={e => setTestValue(parseFloat(e.target.value))}
                  />
                  <span className={styles.hint}>
                    Set a value that will trigger one of your alert rules
                  </span>
                </div>
                <Button onClick={testAlert} disabled={testing || !testSensorId}>
                  <Zap size={16} />
                  {testing ? 'Sending...' : 'Send Test Reading'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* New Rule Dialog */}
          <Dialog open={showAddRule} onOpenChange={setShowAddRule}>
            <DialogTrigger asChild>
              <Button>
                <Plus size={18} />
                New Rule
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Alert Rule</DialogTitle>
              </DialogHeader>
              <div className={styles.form}>
                <div className={styles.field}>
                  <label>Rule Name</label>
                  <Input
                    value={newRule.name}
                    onChange={e => setNewRule(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., High Pressure Alert"
                  />
                </div>
                <div className={styles.field}>
                  <label>Sensor</label>
                  <select
                    value={newRule.sensorId || ''}
                    onChange={e => setNewRule(prev => ({ ...prev, sensorId: parseInt(e.target.value) }))}
                    className={styles.select}
                  >
                    <option value="">-- Select a sensor --</option>
                    {sensors.map(sensor => (
                      <option key={sensor.id} value={sensor.id}>
                        {sensor.name} ({sensor.unit})
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.row}>
                  <div className={styles.field}>
                    <label>Condition</label>
                    <select
                      value={newRule.condition}
                      onChange={e => setNewRule(prev => ({ ...prev, condition: e.target.value }))}
                      className={styles.select}
                    >
                      <option value="above">Above</option>
                      <option value="below">Below</option>
                      <option value="equal">Equal to</option>
                    </select>
                  </div>
                  <div className={styles.field}>
                    <label>Threshold</label>
                    <Input
                      type="number"
                      value={newRule.threshold}
                      onChange={e => setNewRule(prev => ({ ...prev, threshold: parseFloat(e.target.value) }))}
                    />
                  </div>
                </div>
                <div className={styles.field}>
                  <label>Severity</label>
                  <select
                    value={newRule.severity}
                    onChange={e => setNewRule(prev => ({ ...prev, severity: e.target.value as any }))}
                    className={styles.select}
                  >
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <Button onClick={createRule} disabled={!newRule.name || !newRule.sensorId}>
                  Create Rule
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">
            Active <Badge variant="destructive">{activeAlerts.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="acknowledged">
            Acknowledged <Badge variant="secondary">{acknowledgedAlerts.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="rules">
            Rules <Badge variant="outline">{rules.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <div className={styles.alertList}>
            {activeAlerts.length === 0 ? (
              <div className={styles.empty}>
                <Bell size={48} strokeWidth={1.5} />
                <h3>No active alerts</h3>
                <p>All systems are operating normally.</p>
              </div>
            ) : (
              activeAlerts.map(alert => (
                <div key={alert.id} className={`${styles.alertCard} ${styles[alert.severity]}`}>
                  <div className={styles.alertIcon}>
                    {getSeverityIcon(alert.severity)}
                  </div>
                  <div className={styles.alertContent}>
                    <h3>{alert.message}</h3>
                    <p>
                      {alert.sensorName}: {alert.value} {alert.unit}
                    </p>
                    <span className={styles.alertTime}>
                      <Clock size={14} />
                      {format(new Date(alert.createdAt), 'MMM d, h:mm a')}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => acknowledgeAlert(alert.id)}
                  >
                    <Check size={16} />
                    Acknowledge
                  </Button>
                </div>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="acknowledged">
          <div className={styles.alertList}>
            {acknowledgedAlerts.length === 0 ? (
              <div className={styles.empty}>
                <BellOff size={48} strokeWidth={1.5} />
                <h3>No acknowledged alerts</h3>
              </div>
            ) : (
              acknowledgedAlerts.map(alert => (
                <div key={alert.id} className={`${styles.alertCard} ${styles.acknowledged}`}>
                  <div className={styles.alertIcon}>
                    {getSeverityIcon(alert.severity)}
                  </div>
                  <div className={styles.alertContent}>
                    <h3>{alert.message}</h3>
                    <p>
                      {alert.sensorName}: {alert.value} {alert.unit}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="rules">
          <div className={styles.ruleList}>
            {rules.length === 0 ? (
              <div className={styles.empty}>
                <AlertTriangle size={48} strokeWidth={1.5} />
                <h3>No alert rules configured</h3>
                <p>Create rules to monitor your system automatically.</p>
                <Button onClick={() => setShowAddRule(true)}>
                  <Plus size={18} />
                  Create Rule
                </Button>
              </div>
            ) : (
              rules.map(rule => (
                <div key={rule.id} className={styles.ruleCard}>
                  <div className={styles.ruleHeader}>
                    <h3>{rule.name}</h3>
                    <Badge variant={rule.enabled ? 'default' : 'secondary'}>
                      {rule.enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  <p className={styles.ruleCondition}>
                    Trigger when value is <strong>{rule.condition}</strong>{' '}
                    <strong>{rule.threshold}</strong>
                  </p>
                  <div className={styles.ruleMeta}>
                    <Badge variant={rule.severity === 'critical' ? 'destructive' : 'outline'}>
                      {rule.severity}
                    </Badge>
                    {rule.sensorName && <span>{rule.sensorName}</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
