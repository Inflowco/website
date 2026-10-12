import { useState, useEffect } from 'react';
import { useAuth, useAuthFetch } from '../../helpers/useAuth';
import { Button } from '../../components/Button';
import { LiveChart } from '../../components/LiveChart';
import { MetricCard } from '../../components/MetricCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/Tabs';
import {
  Download,
  Calendar,
  TrendingUp,
  Zap,
  Wind,
  DollarSign,
  ArrowLeftRight,
  FileCheck,
  Settings,
  Search,
  Factory,
  Plus,
  Trash2,
  FlaskConical,
  FileSpreadsheet,
  Upload,
  Play,
  RotateCcw,
  RefreshCw,
  Clock
} from 'lucide-react';
import superjson from 'superjson';
import styles from './reports.module.css';

interface ProductionEntry {
  id: number;
  date: string;
  shift: 'day' | 'swing' | 'night' | 'all';
  productType: string;
  unitsProduced: number;
  runtimeHours: number | null;
  energyKwh: number | null;
  airCfmAvg: number | null;
  notes: string | null;
}

interface ProductionSummary {
  totalUnits: number;
  totalEnergy: number;
  avgCfm: number;
  energyPerUnit: string;
  cfmPerUnit: string;
}

interface CAGISheet {
  id: number;
  manufacturer: string;
  model: string;
  compressorType: string | null;
  capacityCfm: number;
  fullLoadPowerKw: number;
  ratedPressurePsi: number;
  specificPower: number;
  partLoad25: number | null;
  partLoad50: number | null;
  partLoad75: number | null;
  partLoad100: number | null;
  testDate: string | null;
  sourceFile: string | null;
}

interface ParsedCAGI {
  manufacturer: string;
  model: string;
  compressorType: string;
  capacityCfm: number | null;
  fullLoadPowerKw: number | null;
  ratedPressurePsi: number | null;
  specificPower: number | null;
  partLoad25: number | null;
  partLoad50: number | null;
  partLoad75: number | null;
  partLoad100: number | null;
  testDate: string | null;
}

// Generate demo chart data
function generateHistoricalData(days: number) {
  const data = [];
  const now = new Date();
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    data.push({
      timestamp: date.toISOString(),
      value: 100 + Math.random() * 20 - 10,
    });
  }
  return data;
}

export default function ReportsPage() {
  const { facilities, currentFacilityId } = useAuth();
  const authFetch = useAuthFetch();
  const [dateRange, setDateRange] = useState('7d');
  const [activeTab, setActiveTab] = useState('overview');

  // Production data state
  const [productionEntries, setProductionEntries] = useState<ProductionEntry[]>([]);
  const [productionSummary, setProductionSummary] = useState<ProductionSummary | null>(null);
  const [loadingProduction, setLoadingProduction] = useState(false);
  const [newEntry, setNewEntry] = useState({
    date: new Date().toISOString().split('T')[0],
    shift: 'day' as const,
    productType: '',
    unitsProduced: '',
    runtimeHours: '8',
    energyKwh: '',
    airCfmAvg: '',
    notes: '',
  });

  // Virtual System state
  const [virtualScenario, setVirtualScenario] = useState({
    pressureSetpoint: 105,
    newCompressorHp: 100,
    leakReduction: 15,
    hoursPerDay: 16,
    daysPerWeek: 5,
    electricRate: 0.12,
  });
  const [scenarioResults, setScenarioResults] = useState<null | {
    currentCost: number;
    projectedCost: number;
    savings: number;
    payback: number;
  }>(null);

  // CAGI data sheets state
  const [cagiSheets, setCagiSheets] = useState<CAGISheet[]>([]);
  const [loadingCagi, setLoadingCagi] = useState(false);
  const [uploadingCagi, setUploadingCagi] = useState(false);
  const [parsedCagi, setParsedCagi] = useState<ParsedCAGI | null>(null);
  const [parsedFileName, setParsedFileName] = useState('');
  const [showParsedReview, setShowParsedReview] = useState(false);
  const [newCagi, setNewCagi] = useState({
    manufacturer: '',
    model: '',
    compressorType: '',
    capacityCfm: '',
    fullLoadPowerKw: '',
    ratedPressurePsi: '',
  });

  const runVirtualScenario = () => {
    // Simplified calculation for demo
    const currentAnnualCost = 74 * virtualScenario.hoursPerDay * (virtualScenario.daysPerWeek * 52) * virtualScenario.electricRate;
    const efficiencyGain = (virtualScenario.leakReduction / 100) * 0.5 + ((110 - virtualScenario.pressureSetpoint) / 10) * 0.05;
    const projectedCost = currentAnnualCost * (1 - efficiencyGain);
    const savings = currentAnnualCost - projectedCost;
    const equipmentCost = virtualScenario.newCompressorHp * 150; // $150 per HP estimate
    const payback = equipmentCost / savings;

    setScenarioResults({
      currentCost: Math.round(currentAnnualCost),
      projectedCost: Math.round(projectedCost),
      savings: Math.round(savings),
      payback: parseFloat(payback.toFixed(1)),
    });
  };

  // Fetch CAGI data
  const fetchCagiData = async () => {
    if (!currentFacilityId) return;

    setLoadingCagi(true);
    try {
      const response = await authFetch(`/_api/cagi?facilityId=${currentFacilityId}`);
      if (response.ok) {
        const data = superjson.parse(await response.text());
        setCagiSheets(data.sheets || []);
      }
    } catch (error) {
      console.error('Failed to fetch CAGI data:', error);
    } finally {
      setLoadingCagi(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'cagi' && currentFacilityId) {
      fetchCagiData();
    }
  }, [activeTab, currentFacilityId]);

  const handleCagiUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentFacilityId) return;

    setUploadingCagi(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('facilityId', String(currentFacilityId));

      const response = await authFetch('/_api/cagi/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = superjson.parse(await response.text());
        setParsedCagi(data.parsed);
        setParsedFileName(data.fileName);
        setShowParsedReview(true);
      } else {
        const error = superjson.parse(await response.text());
        alert(error.error || 'Failed to parse PDF');
      }
    } catch (error) {
      console.error('Failed to upload CAGI PDF:', error);
      alert('Failed to upload PDF');
    } finally {
      setUploadingCagi(false);
      // Reset file input
      e.target.value = '';
    }
  };

  const saveParsedCagi = async () => {
    if (!parsedCagi || !currentFacilityId) return;

    try {
      const response = await authFetch('/_api/cagi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: superjson.stringify({
          facilityId: currentFacilityId,
          manufacturer: parsedCagi.manufacturer,
          model: parsedCagi.model,
          compressorType: parsedCagi.compressorType || undefined,
          capacityCfm: parsedCagi.capacityCfm,
          fullLoadPowerKw: parsedCagi.fullLoadPowerKw,
          ratedPressurePsi: parsedCagi.ratedPressurePsi,
          partLoad25: parsedCagi.partLoad25 || undefined,
          partLoad50: parsedCagi.partLoad50 || undefined,
          partLoad75: parsedCagi.partLoad75 || undefined,
          partLoad100: parsedCagi.partLoad100 || undefined,
          testDate: parsedCagi.testDate || undefined,
          sourceFile: parsedFileName || undefined,
        }),
      });

      if (response.ok) {
        setShowParsedReview(false);
        setParsedCagi(null);
        fetchCagiData();
      }
    } catch (error) {
      console.error('Failed to save CAGI data:', error);
    }
  };

  const addCagiSheet = async () => {
    if (!currentFacilityId || !newCagi.manufacturer || !newCagi.model || !newCagi.capacityCfm || !newCagi.fullLoadPowerKw) return;

    try {
      const response = await authFetch('/_api/cagi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: superjson.stringify({
          facilityId: currentFacilityId,
          manufacturer: newCagi.manufacturer,
          model: newCagi.model,
          compressorType: newCagi.compressorType || undefined,
          capacityCfm: parseFloat(newCagi.capacityCfm),
          fullLoadPowerKw: parseFloat(newCagi.fullLoadPowerKw),
          ratedPressurePsi: parseFloat(newCagi.ratedPressurePsi) || 125,
        }),
      });

      if (response.ok) {
        setNewCagi({ manufacturer: '', model: '', compressorType: '', capacityCfm: '', fullLoadPowerKw: '', ratedPressurePsi: '' });
        fetchCagiData();
      }
    } catch (error) {
      console.error('Failed to add CAGI sheet:', error);
    }
  };

  const removeCagiSheet = async (id: number) => {
    try {
      const response = await authFetch(`/_api/cagi/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setCagiSheets(prev => prev.filter(c => c.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete CAGI sheet:', error);
    }
  };

  const facility = facilities.find(f => f.id === currentFacilityId);

  const pressureData = generateHistoricalData(parseInt(dateRange) || 7);
  const energyData = generateHistoricalData(parseInt(dateRange) || 7).map(d => ({
    ...d,
    value: 70 + Math.random() * 15,
  }));
  const flowData = generateHistoricalData(parseInt(dateRange) || 7).map(d => ({
    ...d,
    value: 800 + Math.random() * 200,
  }));

  // Fetch production data
  const fetchProductionData = async () => {
    if (!currentFacilityId) return;

    setLoadingProduction(true);
    try {
      const response = await authFetch(`/_api/production?facilityId=${currentFacilityId}`);
      if (response.ok) {
        const data = superjson.parse(await response.text());
        setProductionEntries(data.entries || []);
        setProductionSummary(data.summary || null);
      }
    } catch (error) {
      console.error('Failed to fetch production data:', error);
    } finally {
      setLoadingProduction(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'production' && currentFacilityId) {
      fetchProductionData();
    }
  }, [activeTab, currentFacilityId]);

  const addProductionEntry = async () => {
    if (!currentFacilityId || !newEntry.date || !newEntry.productType || !newEntry.unitsProduced) return;

    try {
      const response = await authFetch('/_api/production', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: superjson.stringify({
          facilityId: currentFacilityId,
          date: newEntry.date,
          shift: newEntry.shift,
          productType: newEntry.productType,
          unitsProduced: parseInt(newEntry.unitsProduced),
          runtimeHours: newEntry.runtimeHours ? parseFloat(newEntry.runtimeHours) : undefined,
          energyKwh: newEntry.energyKwh ? parseFloat(newEntry.energyKwh) : undefined,
          airCfmAvg: newEntry.airCfmAvg ? parseFloat(newEntry.airCfmAvg) : undefined,
          notes: newEntry.notes || undefined,
        }),
      });

      if (response.ok) {
        const data = superjson.parse(await response.text());
        setProductionEntries(prev => [data.entry, ...prev]);
        setNewEntry({
          date: new Date().toISOString().split('T')[0],
          shift: 'day',
          productType: '',
          unitsProduced: '',
          runtimeHours: '8',
          energyKwh: '',
          airCfmAvg: '',
          notes: '',
        });
        // Refresh to get updated summary
        fetchProductionData();
      }
    } catch (error) {
      console.error('Failed to add production entry:', error);
    }
  };

  const removeProductionEntry = async (id: number) => {
    try {
      const response = await authFetch(`/_api/production/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setProductionEntries(prev => prev.filter(e => e.id !== id));
        fetchProductionData(); // Refresh summary
      }
    } catch (error) {
      console.error('Failed to delete production entry:', error);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Reports</h1>
          <p className={styles.subtitle}>
            Comprehensive reporting and analytics for {facility?.name || 'facility'}
          </p>
        </div>
        <div className={styles.actions}>
          <select
            value={dateRange}
            onChange={e => setDateRange(e.target.value)}
            className={styles.select}
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
          <Button variant="outline">
            <Download size={18} />
            Export
          </Button>
        </div>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className={styles.tabs}>
        <TabsList className={styles.tabsList}>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="comparison">Before/After</TabsTrigger>
          <TabsTrigger value="iso50001">ISO 50001</TabsTrigger>
          <TabsTrigger value="behavioral">Utility Behavioral</TabsTrigger>
          <TabsTrigger value="leaks">Leak Detection</TabsTrigger>
          <TabsTrigger value="production">Production Data</TabsTrigger>
          <TabsTrigger value="virtual">Virtual System</TabsTrigger>
          <TabsTrigger value="cagi">CAGI Data</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <section className={styles.metricsGrid}>
            <MetricCard
              title="Avg. System Pressure"
              value="105.3"
              unit="PSI"
              icon={<Wind size={20} />}
              trend="up"
              trendValue="+2.1%"
            />
            <MetricCard
              title="Avg. Power Consumption"
              value="74.8"
              unit="kW"
              icon={<Zap size={20} />}
              trend="down"
              trendValue="-5.2%"
            />
            <MetricCard
              title="System Efficiency"
              value="92.4"
              unit="%"
              icon={<TrendingUp size={20} />}
              trend="up"
              trendValue="+1.8%"
            />
            <MetricCard
              title="Est. Monthly Cost"
              value="$4,285"
              icon={<DollarSign size={20} />}
              trend="down"
              trendValue="-$320"
            />
          </section>

          <div className={styles.chartSection}>
            <div className={styles.chartHeader}>
              <h2>Power Consumption Over Time</h2>
              <p>Daily average power consumption in kW</p>
            </div>
            <LiveChart
              data={energyData}
              unit="kW"
              color="var(--color-warning)"
              height={300}
              animate={false}
            />
          </div>
        </TabsContent>

        {/* Before/After Comparison Tab */}
        <TabsContent value="comparison">
          <div className={styles.comparisonHeader}>
            <ArrowLeftRight size={24} />
            <h2>Before/After Comparison Report</h2>
          </div>
          <p className={styles.sectionDesc}>
            Compare system performance metrics before and after improvements or changes.
          </p>

          <div className={styles.comparisonPeriods}>
            <div className={styles.periodSelector}>
              <label>Before Period</label>
              <input type="date" className={styles.dateInput} defaultValue="2025-12-01" />
              <span>to</span>
              <input type="date" className={styles.dateInput} defaultValue="2025-12-31" />
            </div>
            <div className={styles.periodSelector}>
              <label>After Period</label>
              <input type="date" className={styles.dateInput} defaultValue="2026-01-01" />
              <span>to</span>
              <input type="date" className={styles.dateInput} defaultValue="2026-01-31" />
            </div>
          </div>

          <div className={styles.comparisonGrid}>
            <div className={styles.comparisonCard}>
              <h3>Energy Consumption</h3>
              <div className={styles.comparisonValues}>
                <div className={styles.beforeValue}>
                  <span className={styles.label}>Before</span>
                  <span className={styles.value}>18,450 kWh</span>
                </div>
                <div className={styles.afterValue}>
                  <span className={styles.label}>After</span>
                  <span className={styles.value}>15,230 kWh</span>
                </div>
              </div>
              <div className={styles.improvement}>
                <TrendingUp size={16} />
                <span>17.5% Improvement</span>
              </div>
            </div>

            <div className={styles.comparisonCard}>
              <h3>System Efficiency</h3>
              <div className={styles.comparisonValues}>
                <div className={styles.beforeValue}>
                  <span className={styles.label}>Before</span>
                  <span className={styles.value}>4.2 CFM/kW</span>
                </div>
                <div className={styles.afterValue}>
                  <span className={styles.label}>After</span>
                  <span className={styles.value}>5.1 CFM/kW</span>
                </div>
              </div>
              <div className={styles.improvement}>
                <TrendingUp size={16} />
                <span>21.4% Improvement</span>
              </div>
            </div>

            <div className={styles.comparisonCard}>
              <h3>Average Pressure</h3>
              <div className={styles.comparisonValues}>
                <div className={styles.beforeValue}>
                  <span className={styles.label}>Before</span>
                  <span className={styles.value}>112 PSI</span>
                </div>
                <div className={styles.afterValue}>
                  <span className={styles.label}>After</span>
                  <span className={styles.value}>102 PSI</span>
                </div>
              </div>
              <div className={styles.improvement}>
                <TrendingUp size={16} />
                <span>Optimized (-10 PSI)</span>
              </div>
            </div>

            <div className={styles.comparisonCard}>
              <h3>Monthly Cost</h3>
              <div className={styles.comparisonValues}>
                <div className={styles.beforeValue}>
                  <span className={styles.label}>Before</span>
                  <span className={styles.value}>$5,120</span>
                </div>
                <div className={styles.afterValue}>
                  <span className={styles.label}>After</span>
                  <span className={styles.value}>$4,285</span>
                </div>
              </div>
              <div className={styles.improvement}>
                <DollarSign size={16} />
                <span>$835/mo Savings</span>
              </div>
            </div>
          </div>

          <Button variant="primary" className={styles.generateBtn}>
            <Download size={18} />
            Generate Comparison Report
          </Button>
        </TabsContent>

        {/* ISO 50001 Tab */}
        <TabsContent value="iso50001">
          <div className={styles.comparisonHeader}>
            <FileCheck size={24} />
            <h2>ISO 50001 Energy Management Reports</h2>
          </div>
          <p className={styles.sectionDesc}>
            Generate reports compliant with ISO 50001 Energy Management System requirements.
          </p>

          <div className={styles.isoGrid}>
            <div className={styles.isoCard}>
              <h3>Energy Performance Indicators (EnPIs)</h3>
              <p>Track and report on energy performance metrics</p>
              <ul className={styles.isoList}>
                <li>Specific Energy Consumption (SEC): <strong>0.092 kWh/CFM</strong></li>
                <li>Energy Intensity: <strong>18.2 kWh/unit produced</strong></li>
                <li>Baseline Comparison: <strong>+8.5% vs baseline</strong></li>
              </ul>
              <Button variant="outline" size="sm">
                <Download size={16} /> Export EnPI Report
              </Button>
            </div>

            <div className={styles.isoCard}>
              <h3>Energy Baseline</h3>
              <p>Establish and maintain energy baselines</p>
              <ul className={styles.isoList}>
                <li>Baseline Period: Jan 2025 - Dec 2025</li>
                <li>Baseline Energy: 198,450 kWh</li>
                <li>Current vs Baseline: -12.3%</li>
              </ul>
              <Button variant="outline" size="sm">
                <Download size={16} /> Export Baseline Report
              </Button>
            </div>

            <div className={styles.isoCard}>
              <h3>Energy Objectives & Targets</h3>
              <p>Document progress toward energy targets</p>
              <ul className={styles.isoList}>
                <li>2026 Target: 10% reduction</li>
                <li>Current Progress: 8.5% achieved</li>
                <li>Status: <span className={styles.onTrack}>On Track</span></li>
              </ul>
              <Button variant="outline" size="sm">
                <Download size={16} /> Export Progress Report
              </Button>
            </div>

            <div className={styles.isoCard}>
              <h3>Significant Energy Uses (SEUs)</h3>
              <p>Identify and monitor major energy consumers</p>
              <ul className={styles.isoList}>
                <li>Compressor #1: 45% of total</li>
                <li>Compressor #2: 32% of total</li>
                <li>Dryer System: 15% of total</li>
              </ul>
              <Button variant="outline" size="sm">
                <Download size={16} /> Export SEU Report
              </Button>
            </div>
          </div>

          <Button variant="primary" className={styles.generateBtn}>
            <FileCheck size={18} />
            Generate Full ISO 50001 Report Package
          </Button>
        </TabsContent>

        {/* Utility Behavioral Tab */}
        <TabsContent value="behavioral">
          <div className={styles.comparisonHeader}>
            <Settings size={24} />
            <h2>Utility Behavioral Reports</h2>
          </div>
          <p className={styles.sectionDesc}>
            Track system operational changes including setpoint adjustments and shutdown events.
          </p>

          <div className={styles.behavioralSection}>
            <h3>Setpoint Changes</h3>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>Date/Time</th>
                  <th>Parameter</th>
                  <th>Previous Value</th>
                  <th>New Value</th>
                  <th>Changed By</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>2026-02-05 14:23</td>
                  <td>Discharge Pressure Setpoint</td>
                  <td>110 PSI</td>
                  <td>105 PSI</td>
                  <td>Admin User</td>
                </tr>
                <tr>
                  <td>2026-02-03 09:15</td>
                  <td>Dryer Dewpoint Target</td>
                  <td>38°F</td>
                  <td>35°F</td>
                  <td>Admin User</td>
                </tr>
                <tr>
                  <td>2026-01-28 16:40</td>
                  <td>High Pressure Alarm</td>
                  <td>125 PSI</td>
                  <td>120 PSI</td>
                  <td>Admin User</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className={styles.behavioralSection}>
            <h3>System Shutdown Events</h3>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>Start Time</th>
                  <th>End Time</th>
                  <th>Duration</th>
                  <th>Equipment</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>2026-02-04 22:00</td>
                  <td>2026-02-05 06:00</td>
                  <td>8 hours</td>
                  <td>Compressor #2</td>
                  <td>Scheduled Maintenance</td>
                </tr>
                <tr>
                  <td>2026-02-01 03:15</td>
                  <td>2026-02-01 03:45</td>
                  <td>30 min</td>
                  <td>All Systems</td>
                  <td>Power Outage</td>
                </tr>
                <tr>
                  <td>2026-01-25 14:00</td>
                  <td>2026-01-25 18:00</td>
                  <td>4 hours</td>
                  <td>Dryer System</td>
                  <td>Filter Replacement</td>
                </tr>
              </tbody>
            </table>
          </div>

          <Button variant="primary" className={styles.generateBtn}>
            <Download size={18} />
            Generate Behavioral Report
          </Button>
        </TabsContent>

        {/* Leak Detection Tab */}
        <TabsContent value="leaks">
          <div className={styles.comparisonHeader}>
            <Search size={24} />
            <h2>Leak Detection Reports</h2>
          </div>
          <p className={styles.sectionDesc}>
            Document and track compressed air leaks identified during audits.
          </p>

          <div className={styles.leakSummary}>
            <div className={styles.leakStat}>
              <span className={styles.leakNumber}>23</span>
              <span className={styles.leakLabel}>Total Leaks Found</span>
            </div>
            <div className={styles.leakStat}>
              <span className={styles.leakNumber}>18</span>
              <span className={styles.leakLabel}>Leaks Repaired</span>
            </div>
            <div className={styles.leakStat}>
              <span className={styles.leakNumber}>5</span>
              <span className={styles.leakLabel}>Pending Repair</span>
            </div>
            <div className={styles.leakStat}>
              <span className={styles.leakNumber}>$8,420</span>
              <span className={styles.leakLabel}>Annual Savings (Est.)</span>
            </div>
          </div>

          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Tag #</th>
                <th>Location</th>
                <th>Est. CFM Loss</th>
                <th>Est. Annual Cost</th>
                <th>Priority</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>L-001</td>
                <td>Main Header - Joint 12</td>
                <td>2.5 CFM</td>
                <td>$520</td>
                <td><span className={styles.priorityHigh}>High</span></td>
                <td><span className={styles.statusRepaired}>Repaired</span></td>
              </tr>
              <tr>
                <td>L-002</td>
                <td>Assembly Line 3 - Drop</td>
                <td>1.8 CFM</td>
                <td>$375</td>
                <td><span className={styles.priorityMedium}>Medium</span></td>
                <td><span className={styles.statusRepaired}>Repaired</span></td>
              </tr>
              <tr>
                <td>L-003</td>
                <td>Paint Booth - FRL Unit</td>
                <td>3.2 CFM</td>
                <td>$665</td>
                <td><span className={styles.priorityHigh}>High</span></td>
                <td><span className={styles.statusPending}>Pending</span></td>
              </tr>
              <tr>
                <td>L-004</td>
                <td>Compressor Room - Drain</td>
                <td>0.8 CFM</td>
                <td>$166</td>
                <td><span className={styles.priorityLow}>Low</span></td>
                <td><span className={styles.statusPending}>Pending</span></td>
              </tr>
              <tr>
                <td>L-005</td>
                <td>Packaging - Quick Connect</td>
                <td>1.2 CFM</td>
                <td>$250</td>
                <td><span className={styles.priorityMedium}>Medium</span></td>
                <td><span className={styles.statusPending}>Pending</span></td>
              </tr>
            </tbody>
          </table>

          <div className={styles.buttonRow}>
            <Button variant="outline">
              <Plus size={18} />
              Add Leak Entry
            </Button>
            <Button variant="primary">
              <Download size={18} />
              Generate Leak Report
            </Button>
          </div>
        </TabsContent>

        {/* Production Data Tab */}
        <TabsContent value="production">
          <div className={styles.comparisonHeader}>
            <Factory size={24} />
            <h2>Production Data Input</h2>
            <Button variant="ghost" size="sm" onClick={fetchProductionData} disabled={loadingProduction}>
              <RefreshCw size={16} className={loadingProduction ? styles.spinning : ''} />
            </Button>
          </div>
          <p className={styles.sectionDesc}>
            Enter production data to correlate energy usage with output for efficiency calculations.
            Energy and air flow will be auto-calculated from sensor data when available.
          </p>

          <div className={styles.productionInput}>
            <h3>Add Production Entry</h3>
            <div className={styles.productionInputGrid}>
              <div className={styles.inputGroup}>
                <label>Date</label>
                <input
                  type="date"
                  className={styles.dateInput}
                  value={newEntry.date}
                  onChange={e => setNewEntry({ ...newEntry, date: e.target.value })}
                />
              </div>
              <div className={styles.inputGroup}>
                <label>Shift</label>
                <select
                  className={styles.select}
                  value={newEntry.shift}
                  onChange={e => setNewEntry({ ...newEntry, shift: e.target.value as any })}
                >
                  <option value="day">Day (6am-2pm)</option>
                  <option value="swing">Swing (2pm-10pm)</option>
                  <option value="night">Night (10pm-6am)</option>
                  <option value="all">Full Day</option>
                </select>
              </div>
              <div className={styles.inputGroup}>
                <label>Product Type</label>
                <input
                  type="text"
                  className={styles.textInput}
                  placeholder="e.g., Widget A"
                  value={newEntry.productType}
                  onChange={e => setNewEntry({ ...newEntry, productType: e.target.value })}
                />
              </div>
              <div className={styles.inputGroup}>
                <label>Units Produced</label>
                <input
                  type="number"
                  className={styles.textInput}
                  placeholder="e.g., 5000"
                  value={newEntry.unitsProduced}
                  onChange={e => setNewEntry({ ...newEntry, unitsProduced: e.target.value })}
                />
              </div>
              <div className={styles.inputGroup}>
                <label>Runtime (hrs)</label>
                <input
                  type="number"
                  step="0.5"
                  className={styles.textInput}
                  placeholder="8"
                  value={newEntry.runtimeHours}
                  onChange={e => setNewEntry({ ...newEntry, runtimeHours: e.target.value })}
                />
              </div>
              <div className={styles.inputGroup}>
                <label>Energy (kWh) <span className={styles.optional}>optional</span></label>
                <input
                  type="number"
                  className={styles.textInput}
                  placeholder="Auto from sensors"
                  value={newEntry.energyKwh}
                  onChange={e => setNewEntry({ ...newEntry, energyKwh: e.target.value })}
                />
              </div>
              <div className={styles.inputGroup}>
                <label>Avg CFM <span className={styles.optional}>optional</span></label>
                <input
                  type="number"
                  className={styles.textInput}
                  placeholder="Auto from sensors"
                  value={newEntry.airCfmAvg}
                  onChange={e => setNewEntry({ ...newEntry, airCfmAvg: e.target.value })}
                />
              </div>
              <div className={styles.inputGroup}>
                <label>Notes <span className={styles.optional}>optional</span></label>
                <input
                  type="text"
                  className={styles.textInput}
                  placeholder="Any notes..."
                  value={newEntry.notes}
                  onChange={e => setNewEntry({ ...newEntry, notes: e.target.value })}
                />
              </div>
            </div>
            <Button
              variant="primary"
              onClick={addProductionEntry}
              disabled={!newEntry.date || !newEntry.productType || !newEntry.unitsProduced}
            >
              <Plus size={18} />
              Add Entry
            </Button>
          </div>

          {productionSummary && (
            <div className={styles.productionMetrics}>
              <div className={styles.metricBox}>
                <h4>Total Production</h4>
                <span className={styles.metricValue}>{productionSummary.totalUnits.toLocaleString()} units</span>
              </div>
              <div className={styles.metricBox}>
                <h4>Total Energy</h4>
                <span className={styles.metricValue}>{productionSummary.totalEnergy.toLocaleString()} kWh</span>
              </div>
              <div className={styles.metricBox}>
                <h4>Avg CFM</h4>
                <span className={styles.metricValue}>{productionSummary.avgCfm.toLocaleString()} CFM</span>
              </div>
              <div className={styles.metricBox + ' ' + styles.highlight}>
                <h4>Energy per Unit</h4>
                <span className={styles.metricValue}>{productionSummary.energyPerUnit} kWh/unit</span>
              </div>
            </div>
          )}

          <div className={styles.productionTable}>
            <h3>Production History</h3>
            {loadingProduction ? (
              <div className={styles.loadingTable}>Loading...</div>
            ) : productionEntries.length === 0 ? (
              <div className={styles.emptyTable}>
                <Factory size={32} />
                <p>No production data yet. Add your first entry above.</p>
              </div>
            ) : (
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Shift</th>
                    <th>Product</th>
                    <th>Units</th>
                    <th>Runtime</th>
                    <th>Energy (kWh)</th>
                    <th>Avg CFM</th>
                    <th>kWh/Unit</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {productionEntries.map(entry => (
                    <tr key={entry.id}>
                      <td>{entry.date}</td>
                      <td>
                        <span className={styles.shiftBadge + ' ' + styles[entry.shift]}>
                          {entry.shift === 'all' ? 'Full' : entry.shift.charAt(0).toUpperCase() + entry.shift.slice(1)}
                        </span>
                      </td>
                      <td>{entry.productType}</td>
                      <td>{entry.unitsProduced.toLocaleString()}</td>
                      <td>{entry.runtimeHours ? `${entry.runtimeHours}h` : '-'}</td>
                      <td>{entry.energyKwh ? Math.round(entry.energyKwh).toLocaleString() : '-'}</td>
                      <td>{entry.airCfmAvg ? Math.round(entry.airCfmAvg) : '-'}</td>
                      <td>
                        {entry.energyKwh && entry.unitsProduced
                          ? (entry.energyKwh / entry.unitsProduced).toFixed(3)
                          : '-'}
                      </td>
                      <td>
                        <button
                          className={styles.deleteBtn}
                          onClick={() => removeProductionEntry(entry.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <Button variant="primary" className={styles.generateBtn}>
            <Download size={18} />
            Generate Production Report
          </Button>
        </TabsContent>

        {/* Virtual System Tab */}
        <TabsContent value="virtual">
          <div className={styles.comparisonHeader}>
            <FlaskConical size={24} />
            <h2>Virtual System / What-If Analysis</h2>
          </div>
          <p className={styles.sectionDesc}>
            Test future scenarios like new equipment, setpoint changes, or leak repairs without affecting your actual system data.
          </p>

          <div className={styles.virtualGrid}>
            <div className={styles.scenarioInputs}>
              <h3>Scenario Parameters</h3>

              <div className={styles.sliderGroup}>
                <label>
                  Pressure Setpoint: <strong>{virtualScenario.pressureSetpoint} PSI</strong>
                </label>
                <input
                  type="range"
                  min="90"
                  max="125"
                  value={virtualScenario.pressureSetpoint}
                  onChange={e => setVirtualScenario({ ...virtualScenario, pressureSetpoint: parseInt(e.target.value) })}
                  className={styles.slider}
                />
                <div className={styles.sliderLabels}>
                  <span>90 PSI</span>
                  <span>125 PSI</span>
                </div>
              </div>

              <div className={styles.sliderGroup}>
                <label>
                  Leak Reduction: <strong>{virtualScenario.leakReduction}%</strong>
                </label>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={virtualScenario.leakReduction}
                  onChange={e => setVirtualScenario({ ...virtualScenario, leakReduction: parseInt(e.target.value) })}
                  className={styles.slider}
                />
                <div className={styles.sliderLabels}>
                  <span>0%</span>
                  <span>50%</span>
                </div>
              </div>

              <div className={styles.inputRow}>
                <div className={styles.inputGroup}>
                  <label>New Compressor HP</label>
                  <input
                    type="number"
                    className={styles.textInput}
                    value={virtualScenario.newCompressorHp}
                    onChange={e => setVirtualScenario({ ...virtualScenario, newCompressorHp: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label>Hours/Day</label>
                  <input
                    type="number"
                    className={styles.textInput}
                    value={virtualScenario.hoursPerDay}
                    onChange={e => setVirtualScenario({ ...virtualScenario, hoursPerDay: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label>Days/Week</label>
                  <input
                    type="number"
                    className={styles.textInput}
                    value={virtualScenario.daysPerWeek}
                    onChange={e => setVirtualScenario({ ...virtualScenario, daysPerWeek: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label>$/kWh</label>
                  <input
                    type="number"
                    step="0.01"
                    className={styles.textInput}
                    value={virtualScenario.electricRate}
                    onChange={e => setVirtualScenario({ ...virtualScenario, electricRate: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className={styles.buttonRow}>
                <Button variant="primary" onClick={runVirtualScenario}>
                  <Play size={18} />
                  Run Scenario
                </Button>
                <Button variant="outline" onClick={() => setScenarioResults(null)}>
                  <RotateCcw size={18} />
                  Reset
                </Button>
              </div>
            </div>

            <div className={styles.scenarioResults}>
              <h3>Projected Results</h3>
              {scenarioResults ? (
                <div className={styles.resultsGrid}>
                  <div className={styles.resultCard}>
                    <span className={styles.resultLabel}>Current Annual Cost</span>
                    <span className={styles.resultValue}>${scenarioResults.currentCost.toLocaleString()}</span>
                  </div>
                  <div className={styles.resultCard}>
                    <span className={styles.resultLabel}>Projected Annual Cost</span>
                    <span className={styles.resultValue}>${scenarioResults.projectedCost.toLocaleString()}</span>
                  </div>
                  <div className={styles.resultCard + ' ' + styles.highlight}>
                    <span className={styles.resultLabel}>Annual Savings</span>
                    <span className={styles.resultValue}>${scenarioResults.savings.toLocaleString()}</span>
                  </div>
                  <div className={styles.resultCard}>
                    <span className={styles.resultLabel}>Payback Period</span>
                    <span className={styles.resultValue}>{scenarioResults.payback} years</span>
                  </div>
                </div>
              ) : (
                <div className={styles.noResults}>
                  <FlaskConical size={48} />
                  <p>Adjust parameters and click "Run Scenario" to see projected results</p>
                </div>
              )}
            </div>
          </div>

          <Button variant="primary" className={styles.generateBtn}>
            <Download size={18} />
            Export Scenario Report
          </Button>
        </TabsContent>

        {/* CAGI Data Tab */}
        <TabsContent value="cagi">
          <div className={styles.comparisonHeader}>
            <FileSpreadsheet size={24} />
            <h2>CAGI Data Sheets</h2>
            <Button variant="ghost" size="sm" onClick={fetchCagiData} disabled={loadingCagi}>
              <RefreshCw size={16} className={loadingCagi ? styles.spinning : ''} />
            </Button>
          </div>
          <p className={styles.sectionDesc}>
            Input compressor performance data from CAGI (Compressed Air and Gas Institute) data sheets for accurate efficiency analysis.
            <a href="https://youtu.be/jSifJ2fm5r4" target="_blank" rel="noopener noreferrer" className={styles.learnMoreLink}>
              Learn about CAGI data sheets
            </a>
          </p>

          {/* PDF Upload Section */}
          <div className={styles.uploadCard}>
            <div className={styles.uploadIcon}>
              <Upload size={32} />
            </div>
            <div className={styles.uploadText}>
              <h3>Upload CAGI Data Sheet PDF</h3>
              <p>Automatically extract compressor performance data from official CAGI PDF documents</p>
            </div>
            <label className={styles.uploadButton}>
              <input
                type="file"
                accept=".pdf"
                onChange={handleCagiUpload}
                disabled={uploadingCagi}
                style={{ display: 'none' }}
              />
              {uploadingCagi ? 'Processing...' : 'Choose PDF'}
            </label>
          </div>

          {/* Parsed Data Review Modal */}
          {showParsedReview && parsedCagi && (
            <div className={styles.reviewCard}>
              <h3>Review Extracted Data</h3>
              <p className={styles.reviewFileName}>Source: {parsedFileName}</p>
              <div className={styles.reviewGrid}>
                <div className={styles.reviewField}>
                  <label>Manufacturer</label>
                  <input
                    type="text"
                    className={styles.textInput}
                    value={parsedCagi.manufacturer}
                    onChange={e => setParsedCagi({ ...parsedCagi, manufacturer: e.target.value })}
                  />
                </div>
                <div className={styles.reviewField}>
                  <label>Model</label>
                  <input
                    type="text"
                    className={styles.textInput}
                    value={parsedCagi.model}
                    onChange={e => setParsedCagi({ ...parsedCagi, model: e.target.value })}
                  />
                </div>
                <div className={styles.reviewField}>
                  <label>Type</label>
                  <input
                    type="text"
                    className={styles.textInput}
                    value={parsedCagi.compressorType}
                    onChange={e => setParsedCagi({ ...parsedCagi, compressorType: e.target.value })}
                    placeholder="e.g., Rotary Screw"
                  />
                </div>
                <div className={styles.reviewField}>
                  <label>Capacity (CFM)</label>
                  <input
                    type="number"
                    className={styles.textInput}
                    value={parsedCagi.capacityCfm || ''}
                    onChange={e => setParsedCagi({ ...parsedCagi, capacityCfm: parseFloat(e.target.value) || null })}
                  />
                </div>
                <div className={styles.reviewField}>
                  <label>Full Load Power (kW)</label>
                  <input
                    type="number"
                    className={styles.textInput}
                    value={parsedCagi.fullLoadPowerKw || ''}
                    onChange={e => setParsedCagi({ ...parsedCagi, fullLoadPowerKw: parseFloat(e.target.value) || null })}
                  />
                </div>
                <div className={styles.reviewField}>
                  <label>Rated Pressure (PSI)</label>
                  <input
                    type="number"
                    className={styles.textInput}
                    value={parsedCagi.ratedPressurePsi || ''}
                    onChange={e => setParsedCagi({ ...parsedCagi, ratedPressurePsi: parseFloat(e.target.value) || null })}
                  />
                </div>
              </div>
              {parsedCagi.capacityCfm && parsedCagi.fullLoadPowerKw && (
                <div className={styles.reviewSpecific}>
                  Specific Power: <strong>{(parsedCagi.capacityCfm / parsedCagi.fullLoadPowerKw).toFixed(2)} CFM/kW</strong>
                </div>
              )}
              <div className={styles.reviewActions}>
                <Button variant="outline" onClick={() => setShowParsedReview(false)}>Cancel</Button>
                <Button
                  variant="primary"
                  onClick={saveParsedCagi}
                  disabled={!parsedCagi.manufacturer || !parsedCagi.model || !parsedCagi.capacityCfm || !parsedCagi.fullLoadPowerKw || !parsedCagi.ratedPressurePsi}
                >
                  Save to Library
                </Button>
              </div>
            </div>
          )}

          {/* Manual Entry */}
          <div className={styles.cagiInput}>
            <h3>Manual Entry</h3>
            <div className={styles.cagiInputGrid}>
              <div className={styles.inputGroup}>
                <label>Manufacturer</label>
                <input
                  type="text"
                  className={styles.textInput}
                  placeholder="e.g., Atlas Copco"
                  value={newCagi.manufacturer}
                  onChange={e => setNewCagi({ ...newCagi, manufacturer: e.target.value })}
                />
              </div>
              <div className={styles.inputGroup}>
                <label>Model</label>
                <input
                  type="text"
                  className={styles.textInput}
                  placeholder="e.g., GA 90+"
                  value={newCagi.model}
                  onChange={e => setNewCagi({ ...newCagi, model: e.target.value })}
                />
              </div>
              <div className={styles.inputGroup}>
                <label>Compressor Type</label>
                <select
                  className={styles.select}
                  value={newCagi.compressorType}
                  onChange={e => setNewCagi({ ...newCagi, compressorType: e.target.value })}
                >
                  <option value="">Select type...</option>
                  <option value="Rotary Screw">Rotary Screw</option>
                  <option value="Reciprocating">Reciprocating</option>
                  <option value="Centrifugal">Centrifugal</option>
                  <option value="Scroll">Scroll</option>
                </select>
              </div>
              <div className={styles.inputGroup}>
                <label>Capacity (CFM)</label>
                <input
                  type="number"
                  className={styles.textInput}
                  placeholder="e.g., 507"
                  value={newCagi.capacityCfm}
                  onChange={e => setNewCagi({ ...newCagi, capacityCfm: e.target.value })}
                />
              </div>
              <div className={styles.inputGroup}>
                <label>Full Load Power (kW)</label>
                <input
                  type="number"
                  className={styles.textInput}
                  placeholder="e.g., 90"
                  value={newCagi.fullLoadPowerKw}
                  onChange={e => setNewCagi({ ...newCagi, fullLoadPowerKw: e.target.value })}
                />
              </div>
              <div className={styles.inputGroup}>
                <label>Rated Pressure (PSI)</label>
                <input
                  type="number"
                  className={styles.textInput}
                  placeholder="e.g., 125"
                  value={newCagi.ratedPressurePsi}
                  onChange={e => setNewCagi({ ...newCagi, ratedPressurePsi: e.target.value })}
                />
              </div>
            </div>
            <Button
              variant="primary"
              onClick={addCagiSheet}
              disabled={!newCagi.manufacturer || !newCagi.model || !newCagi.capacityCfm || !newCagi.fullLoadPowerKw}
            >
              <Plus size={18} />
              Add to Library
            </Button>
          </div>

          <div className={styles.cagiTable}>
            <h3>Compressor Library</h3>
            {loadingCagi ? (
              <div className={styles.loadingTable}>Loading...</div>
            ) : cagiSheets.length === 0 ? (
              <div className={styles.emptyTable}>
                <FileSpreadsheet size={32} />
                <p>No CAGI data sheets yet. Upload a PDF or add manually above.</p>
              </div>
            ) : (
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>Manufacturer</th>
                    <th>Model</th>
                    <th>Type</th>
                    <th>Capacity (CFM)</th>
                    <th>Power (kW)</th>
                    <th>Pressure (PSI)</th>
                    <th>Specific Power</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {cagiSheets.map(sheet => (
                    <tr key={sheet.id}>
                      <td>{sheet.manufacturer}</td>
                      <td>{sheet.model}</td>
                      <td>{sheet.compressorType || '-'}</td>
                      <td>{sheet.capacityCfm}</td>
                      <td>{sheet.fullLoadPowerKw}</td>
                      <td>{sheet.ratedPressurePsi}</td>
                      <td>
                        <span className={sheet.specificPower >= 5 ? styles.goodEfficiency : styles.poorEfficiency}>
                          {sheet.specificPower.toFixed(2)} CFM/kW
                        </span>
                      </td>
                      <td>
                        <button className={styles.deleteBtn} onClick={() => removeCagiSheet(sheet.id)}>
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className={styles.cagiInfo}>
            <h4>What is CAGI?</h4>
            <p>
              The Compressed Air and Gas Institute (CAGI) provides standardized performance verification
              data sheets for compressors. These sheets allow for accurate comparison of different
              compressor models under standardized test conditions.
            </p>
            <ul>
              <li><strong>Capacity:</strong> Volume of air delivered at rated pressure (CFM)</li>
              <li><strong>Full Load Power:</strong> Power consumption at full capacity (kW)</li>
              <li><strong>Specific Power:</strong> Efficiency metric (CFM per kW) - higher is better (5+ is good)</li>
            </ul>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
