import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../helpers/useAuth';
import { useRealtimeReadings } from '../../helpers/useRealtimeReadings';
import { MetricCard } from '../../components/MetricCard';
import { AlertBanner } from '../../components/AlertBanner';
import { LiveChart } from '../../components/LiveChart';
import { Gauge, Thermometer, Zap, Wind, Droplets, Activity, TreePine, Leaf, Wifi, WifiOff } from 'lucide-react';
import styles from './dashboard.module.css';

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
  createdAt?: string;
}

// Demo data generator
function generateDemoData(): SensorReading[] {
  return [
    {
      sensorId: 1,
      sensorName: 'Discharge Pressure',
      sensorType: 'pressure',
      value: 105 + Math.random() * 10,
      unit: 'PSI',
      timestamp: new Date().toISOString(),
    },
    {
      sensorId: 2,
      sensorName: 'Discharge Temperature',
      sensorType: 'temperature',
      value: 185 + Math.random() * 15,
      unit: '°F',
      timestamp: new Date().toISOString(),
    },
    {
      sensorId: 3,
      sensorName: 'Power Consumption',
      sensorType: 'power',
      value: 72 + Math.random() * 8,
      unit: 'kW',
      timestamp: new Date().toISOString(),
    },
    {
      sensorId: 4,
      sensorName: 'Dryer Inlet Dewpoint',
      sensorType: 'dewpoint',
      value: 45 + Math.random() * 10,
      unit: '°F',
      timestamp: new Date().toISOString(),
    },
    {
      sensorId: 5,
      sensorName: 'Dryer Outlet Dewpoint',
      sensorType: 'dewpoint',
      value: 35 + Math.random() * 5,
      unit: '°F',
      timestamp: new Date().toISOString(),
    },
    {
      sensorId: 6,
      sensorName: 'System Flow',
      sensorType: 'flow',
      value: 850 + Math.random() * 100,
      unit: 'CFM',
      timestamp: new Date().toISOString(),
    },
  ];
}

function getIcon(type: string) {
  switch (type) {
    case 'pressure':
      return <Gauge size={20} />;
    case 'temperature':
      return <Thermometer size={20} />;
    case 'power':
      return <Zap size={20} />;
    case 'flow':
      return <Wind size={20} />;
    case 'dewpoint':
    case 'humidity':
      return <Droplets size={20} />;
    default:
      return <Activity size={20} />;
  }
}

// Carbon footprint calculations
// Average: 1 tree absorbs ~48 lbs (21.77 kg) of CO2 per year
// 1 kWh = ~0.92 lbs CO2 (US average grid)
function calculateTreesEquivalent(kWhSaved: number): number {
  const co2SavedLbs = kWhSaved * 0.92;
  const treesEquivalent = co2SavedLbs / 48;
  return treesEquivalent;
}

export default function DashboardPage() {
  const { currentFacilityId, facilities } = useAuth();
  const [chartData, setChartData] = useState<{ timestamp: string; value: number }[]>([]);
  const [carbonPeriod, setCarbonPeriod] = useState<'month' | 'quarter' | 'year'>('month');
  const [demoReadings, setDemoReadings] = useState<SensorReading[]>([]);

  // Demo efficiency savings data
  const efficiencySavings = {
    month: { kWhSaved: 3240, efficiencyGain: 8.5 },
    quarter: { kWhSaved: 9720, efficiencyGain: 7.8 },
    year: { kWhSaved: 38880, efficiencyGain: 12.3 },
  };

  const currentFacility = facilities.find(f => f.id === currentFacilityId);

  // Handle new readings from WebSocket
  const handleReading = useCallback((reading: SensorReading) => {
    // Update chart data with new reading (if it's pressure)
    if (reading.sensorType === 'pressure') {
      setChartData(prev => {
        const newPoint = {
          timestamp: reading.timestamp,
          value: reading.value,
        };
        const updated = [...prev, newPoint];
        return updated.slice(-30);
      });
    }
  }, []);

  // Use real-time WebSocket connection
  const {
    connected,
    readings: wsReadings,
    alerts: wsAlerts,
    dismissAlert,
    reconnect,
  } = useRealtimeReadings({
    facilityId: currentFacilityId,
    onReading: handleReading,
    enabled: true,
  });

  // Fallback to demo data when no real readings exist
  useEffect(() => {
    if (wsReadings.length === 0) {
      // Generate demo data for display
      const updateDemoData = () => {
        const newReadings = generateDemoData();
        setDemoReadings(newReadings);

        // Update chart data
        setChartData(prev => {
          const newPoint = {
            timestamp: new Date().toISOString(),
            value: newReadings[0].value,
          };
          const updated = [...prev, newPoint];
          return updated.slice(-30);
        });
      };

      updateDemoData();
      const interval = setInterval(updateDemoData, 5000);
      return () => clearInterval(interval);
    }
  }, [wsReadings.length]);

  // Use WebSocket readings if available, otherwise demo data
  const readings = wsReadings.length > 0 ? wsReadings : demoReadings;

  // Combine WebSocket alerts with demo alert when no real alerts
  const alerts: Alert[] = wsAlerts.length > 0 ? wsAlerts : [
    {
      id: 1,
      severity: 'warning',
      message: 'Pressure approaching high threshold (demo)',
      sensorName: 'Discharge Pressure',
      value: 118,
      unit: 'PSI',
    },
  ];

  const handleAcknowledge = (alertId: number) => {
    dismissAlert(alertId);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Dashboard</h1>
          <p className={styles.subtitle}>
            {currentFacility?.name || 'No facility selected'} • Real-time monitoring
          </p>
        </div>
        <div className={styles.connectionStatus}>
          {connected ? (
            <span className={styles.connected}>
              <Wifi size={16} /> Live
            </span>
          ) : (
            <span className={styles.disconnected} onClick={reconnect} title="Click to reconnect">
              <WifiOff size={16} /> Offline
            </span>
          )}
        </div>
      </header>

      <AlertBanner alerts={alerts} onAcknowledge={handleAcknowledge} />

      <section className={styles.metricsGrid}>
        {readings.map(reading => (
          <MetricCard
            key={reading.sensorId}
            title={reading.sensorName}
            value={reading.value.toFixed(1)}
            unit={reading.unit}
            icon={getIcon(reading.sensorType)}
            status={
              reading.sensorType === 'pressure' && reading.value > 115
                ? 'warning'
                : reading.sensorType === 'pressure' && reading.value > 130
                  ? 'critical'
                  : 'normal'
            }
          />
        ))}
      </section>

      {/* Carbon Footprint Section */}
      <section className={styles.carbonSection}>
        <div className={styles.carbonHeader}>
          <div className={styles.carbonTitle}>
            <TreePine size={24} className={styles.treeIcon} />
            <h2>Carbon Footprint Savings</h2>
          </div>
          <div className={styles.carbonPeriodSelector}>
            <button
              className={`${styles.periodBtn} ${carbonPeriod === 'month' ? styles.active : ''}`}
              onClick={() => setCarbonPeriod('month')}
            >
              Month
            </button>
            <button
              className={`${styles.periodBtn} ${carbonPeriod === 'quarter' ? styles.active : ''}`}
              onClick={() => setCarbonPeriod('quarter')}
            >
              Quarter
            </button>
            <button
              className={`${styles.periodBtn} ${carbonPeriod === 'year' ? styles.active : ''}`}
              onClick={() => setCarbonPeriod('year')}
            >
              Year
            </button>
          </div>
        </div>

        <div className={styles.carbonContent}>
          <div className={styles.treesDisplay}>
            <div className={styles.treesVisual}>
              {Array.from({ length: Math.min(Math.round(calculateTreesEquivalent(efficiencySavings[carbonPeriod].kWhSaved)), 20) }).map((_, i) => (
                <TreePine key={i} size={28} className={styles.treeIconSmall} />
              ))}
              {calculateTreesEquivalent(efficiencySavings[carbonPeriod].kWhSaved) > 20 && (
                <span className={styles.moreTreesIndicator}>+{Math.round(calculateTreesEquivalent(efficiencySavings[carbonPeriod].kWhSaved) - 20)} more</span>
              )}
            </div>
            <div className={styles.treesNumber}>
              <span className={styles.bigNumber}>
                {Math.round(calculateTreesEquivalent(efficiencySavings[carbonPeriod].kWhSaved))}
              </span>
              <span className={styles.treesLabel}>Trees Equivalent</span>
            </div>
          </div>

          <div className={styles.carbonStats}>
            <div className={styles.carbonStat}>
              <Zap size={18} />
              <div>
                <span className={styles.statValue}>{efficiencySavings[carbonPeriod].kWhSaved.toLocaleString()} kWh</span>
                <span className={styles.statLabel}>Energy Saved</span>
              </div>
            </div>
            <div className={styles.carbonStat}>
              <Leaf size={18} />
              <div>
                <span className={styles.statValue}>{Math.round(efficiencySavings[carbonPeriod].kWhSaved * 0.92).toLocaleString()} lbs</span>
                <span className={styles.statLabel}>CO₂ Avoided</span>
              </div>
            </div>
            <div className={styles.carbonStat}>
              <Activity size={18} />
              <div>
                <span className={styles.statValue}>+{efficiencySavings[carbonPeriod].efficiencyGain}%</span>
                <span className={styles.statLabel}>Efficiency Gain</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.chartsSection}>
        <div className={styles.chartCard}>
          <LiveChart
            data={chartData}
            title="Discharge Pressure (Live)"
            unit="PSI"
            color="var(--color-primary)"
            minValue={80}
            maxValue={150}
            warningThreshold={120}
            criticalThreshold={140}
            height={250}
          />
        </div>

        <div className={styles.chartCard}>
          <LiveChart
            data={chartData.map(d => ({
              timestamp: d.timestamp,
              value: 70 + Math.random() * 15,
            }))}
            title="Power Consumption (Live)"
            unit="kW"
            color="var(--color-secondary)"
            height={250}
          />
        </div>
      </section>

      <section className={styles.systemStatus}>
        <h2 className={styles.sectionTitle}>System Status</h2>
        <div className={styles.statusGrid}>
          <div className={styles.statusCard}>
            <div className={`${styles.statusIndicator} ${styles.online}`} />
            <div>
              <h3>Main Compressor #1</h3>
              <p>Online • Running at 85% capacity</p>
            </div>
          </div>
          <div className={styles.statusCard}>
            <div className={`${styles.statusIndicator} ${styles.online}`} />
            <div>
              <h3>Refrigerated Dryer</h3>
              <p>Online • Normal operation</p>
            </div>
          </div>
          <div className={styles.statusCard}>
            <div className={`${styles.statusIndicator} ${styles.standby}`} />
            <div>
              <h3>Backup Compressor</h3>
              <p>Standby • Ready</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
