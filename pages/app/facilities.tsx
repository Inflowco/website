import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth, useAuthFetch } from '../../helpers/useAuth';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/Dialog';
import { Plus, Settings, Trash2, Gauge, ChevronRight } from 'lucide-react';
import superjson from 'superjson';
import styles from './facilities.module.css';

interface Sensor {
  id: number;
  name: string;
  sensorType: string;
  unit: string;
  apiKey: string;
}

interface Equipment {
  id: number;
  name: string;
  type: string;
  manufacturer?: string;
  model?: string;
  sensors: Sensor[];
}

export default function FacilitiesPage() {
  const { id } = useParams<{ id: string }>();
  const { currentFacilityId, facilities } = useAuth();
  const authFetch = useAuthFetch();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddSensor, setShowAddSensor] = useState(false);
  const [newSensor, setNewSensor] = useState({
    name: '',
    sensorType: 'pressure',
    unit: 'PSI',
  });

  const facilityId = id ? parseInt(id, 10) : currentFacilityId;
  const facility = facilities.find(f => f.id === facilityId);

  useEffect(() => {
    if (!facilityId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await authFetch(`/_api/sensors?facilityId=${facilityId}`);
        if (response.ok) {
          const data = superjson.parse(await response.text());
          setSensors(data.sensors || []);
          setEquipment(data.equipment || []);
        }
      } catch (error) {
        console.error('Failed to fetch sensors:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [facilityId, authFetch]);

  const handleAddSensor = async () => {
    try {
      const response = await authFetch('/_api/sensors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: superjson.stringify({
          ...newSensor,
          facilityId,
        }),
      });

      if (response.ok) {
        const data = superjson.parse(await response.text());
        setSensors(prev => [...prev, data.sensor]);
        setShowAddSensor(false);
        setNewSensor({ name: '', sensorType: 'pressure', unit: 'PSI' });
      }
    } catch (error) {
      console.error('Failed to add sensor:', error);
    }
  };

  const sensorTypes = [
    { value: 'pressure', label: 'Pressure', defaultUnit: 'PSI' },
    { value: 'temperature', label: 'Temperature', defaultUnit: '°F' },
    { value: 'flow', label: 'Flow', defaultUnit: 'CFM' },
    { value: 'power', label: 'Power', defaultUnit: 'kW' },
    { value: 'humidity', label: 'Humidity', defaultUnit: '%' },
    { value: 'dewpoint', label: 'Dewpoint', defaultUnit: '°F' },
    { value: 'vibration', label: 'Vibration', defaultUnit: 'mm/s' },
  ];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{facility?.name || 'Facility'}</h1>
          <p className={styles.subtitle}>Manage sensors and equipment</p>
        </div>
        <Dialog open={showAddSensor} onOpenChange={setShowAddSensor}>
          <DialogTrigger asChild>
            <Button>
              <Plus size={18} />
              Add Sensor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Sensor</DialogTitle>
            </DialogHeader>
            <div className={styles.form}>
              <div className={styles.field}>
                <label>Sensor Name</label>
                <Input
                  value={newSensor.name}
                  onChange={e => setNewSensor(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Discharge Pressure"
                />
              </div>
              <div className={styles.field}>
                <label>Type</label>
                <select
                  value={newSensor.sensorType}
                  onChange={e => {
                    const type = sensorTypes.find(t => t.value === e.target.value);
                    setNewSensor(prev => ({
                      ...prev,
                      sensorType: e.target.value,
                      unit: type?.defaultUnit || prev.unit,
                    }));
                  }}
                  className={styles.select}
                >
                  {sensorTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              <div className={styles.field}>
                <label>Unit</label>
                <Input
                  value={newSensor.unit}
                  onChange={e => setNewSensor(prev => ({ ...prev, unit: e.target.value }))}
                />
              </div>
              <Button onClick={handleAddSensor} disabled={!newSensor.name}>
                Add Sensor
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      {loading ? (
        <div className={styles.loading}>Loading...</div>
      ) : (
        <>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Sensors ({sensors.length})</h2>
            <div className={styles.sensorGrid}>
              {sensors.map(sensor => (
                <div key={sensor.id} className={styles.sensorCard}>
                  <div className={styles.sensorIcon}>
                    <Gauge size={24} />
                  </div>
                  <div className={styles.sensorInfo}>
                    <h3>{sensor.name}</h3>
                    <p>{sensor.sensorType} • {sensor.unit}</p>
                  </div>
                  <div className={styles.sensorActions}>
                    <Button variant="ghost" size="sm">
                      <Settings size={16} />
                    </Button>
                  </div>
                </div>
              ))}
              {sensors.length === 0 && (
                <div className={styles.empty}>
                  <p>No sensors configured yet.</p>
                  <Button variant="outline" onClick={() => setShowAddSensor(true)}>
                    <Plus size={16} />
                    Add your first sensor
                  </Button>
                </div>
              )}
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Equipment</h2>
            <div className={styles.equipmentList}>
              {equipment.map(eq => (
                <div key={eq.id} className={styles.equipmentCard}>
                  <div className={styles.equipmentHeader}>
                    <h3>{eq.name}</h3>
                    <span className={styles.equipmentType}>{eq.type}</span>
                  </div>
                  {eq.manufacturer && (
                    <p className={styles.equipmentMeta}>
                      {eq.manufacturer} {eq.model && `• ${eq.model}`}
                    </p>
                  )}
                  <div className={styles.equipmentSensors}>
                    <span>{eq.sensors?.length || 0} sensors attached</span>
                    <ChevronRight size={16} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
