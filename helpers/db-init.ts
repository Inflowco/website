import { initDb, getDb, saveDb } from './db.js';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { crmSchema } from './crm-schema.js';

const schema = `
-- Core Tables
CREATE TABLE IF NOT EXISTS organizations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS facilities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  address TEXT,
  timezone TEXT DEFAULT 'UTC',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES organizations(id),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role TEXT CHECK(role IN ('admin', 'manager', 'viewer')) DEFAULT 'viewer',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  token TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS user_facility_access (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  facility_id INTEGER NOT NULL REFERENCES facilities(id),
  access_level TEXT CHECK(access_level IN ('full', 'readonly')) DEFAULT 'readonly',
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, facility_id)
);

-- IoT Tables
CREATE TABLE IF NOT EXISTS equipment (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  facility_id INTEGER NOT NULL REFERENCES facilities(id),
  name TEXT NOT NULL,
  type TEXT CHECK(type IN ('compressor', 'dryer', 'filter', 'receiver', 'other')) NOT NULL,
  manufacturer TEXT,
  model TEXT,
  serial_number TEXT,
  install_date TEXT,
  metadata TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sensors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  facility_id INTEGER NOT NULL REFERENCES facilities(id),
  equipment_id INTEGER REFERENCES equipment(id),
  name TEXT NOT NULL,
  sensor_type TEXT CHECK(sensor_type IN ('pressure', 'temperature', 'flow', 'power', 'humidity', 'dewpoint', 'vibration')) NOT NULL,
  unit TEXT NOT NULL,
  api_key TEXT NOT NULL UNIQUE,
  min_value REAL,
  max_value REAL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sensor_readings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sensor_id INTEGER NOT NULL REFERENCES sensors(id),
  value REAL NOT NULL,
  timestamp TEXT NOT NULL,
  quality TEXT CHECK(quality IN ('good', 'suspect', 'bad'))
);

CREATE INDEX IF NOT EXISTS idx_sensor_readings_sensor_timestamp ON sensor_readings(sensor_id, timestamp);

CREATE TABLE IF NOT EXISTS sensor_readings_hourly (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sensor_id INTEGER NOT NULL REFERENCES sensors(id),
  hour_start TEXT NOT NULL,
  avg_value REAL NOT NULL,
  min_value REAL NOT NULL,
  max_value REAL NOT NULL,
  sample_count INTEGER NOT NULL,
  UNIQUE(sensor_id, hour_start)
);

-- Alert Tables
CREATE TABLE IF NOT EXISTS alert_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  facility_id INTEGER NOT NULL REFERENCES facilities(id),
  sensor_id INTEGER REFERENCES sensors(id),
  name TEXT NOT NULL,
  condition TEXT CHECK(condition IN ('above', 'below', 'equal', 'change_rate')) NOT NULL,
  threshold REAL NOT NULL,
  duration INTEGER DEFAULT 0,
  severity TEXT CHECK(severity IN ('critical', 'warning', 'info')) DEFAULT 'warning',
  enabled INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  alert_rule_id INTEGER NOT NULL REFERENCES alert_rules(id),
  sensor_id INTEGER NOT NULL REFERENCES sensors(id),
  facility_id INTEGER NOT NULL REFERENCES facilities(id),
  value REAL NOT NULL,
  message TEXT NOT NULL,
  status TEXT CHECK(status IN ('active', 'acknowledged', 'resolved')) DEFAULT 'active',
  acknowledged_by INTEGER REFERENCES users(id),
  acknowledged_at TEXT,
  resolved_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  alert_id INTEGER NOT NULL REFERENCES alerts(id),
  type TEXT CHECK(type IN ('email', 'sms', 'push', 'in_app')) NOT NULL,
  status TEXT CHECK(status IN ('pending', 'sent', 'failed')) DEFAULT 'pending',
  sent_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS notification_preferences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  facility_id INTEGER REFERENCES facilities(id),
  email_enabled INTEGER DEFAULT 1,
  sms_enabled INTEGER DEFAULT 0,
  push_enabled INTEGER DEFAULT 1,
  min_severity TEXT CHECK(min_severity IN ('critical', 'warning', 'info')) DEFAULT 'warning',
  quiet_hours_start TEXT,
  quiet_hours_end TEXT,
  UNIQUE(user_id, facility_id)
);

-- Diagram Tables
CREATE TABLE IF NOT EXISTS diagrams (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  facility_id INTEGER NOT NULL REFERENCES facilities(id),
  name TEXT NOT NULL,
  description TEXT,
  created_by INTEGER NOT NULL REFERENCES users(id),
  updated_at TEXT DEFAULT (datetime('now')),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS diagram_nodes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  diagram_id INTEGER NOT NULL REFERENCES diagrams(id) ON DELETE CASCADE,
  node_id TEXT NOT NULL,
  type TEXT CHECK(type IN ('compressor', 'dryer', 'filter', 'receiver', 'sensor', 'pipe', 'valve', 'custom')) NOT NULL,
  label TEXT NOT NULL,
  position_x REAL NOT NULL,
  position_y REAL NOT NULL,
  width REAL,
  height REAL,
  equipment_id INTEGER REFERENCES equipment(id),
  sensor_id INTEGER REFERENCES sensors(id),
  data TEXT,
  UNIQUE(diagram_id, node_id)
);

CREATE TABLE IF NOT EXISTS diagram_edges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  diagram_id INTEGER NOT NULL REFERENCES diagrams(id) ON DELETE CASCADE,
  edge_id TEXT NOT NULL,
  source_node_id TEXT NOT NULL,
  target_node_id TEXT NOT NULL,
  source_handle TEXT,
  target_handle TEXT,
  type TEXT CHECK(type IN ('pipe', 'electrical', 'signal', 'default')) DEFAULT 'default',
  data TEXT,
  UNIQUE(diagram_id, edge_id)
);

-- Self-Install Tables
CREATE TABLE IF NOT EXISTS install_kits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  facility_id INTEGER NOT NULL REFERENCES facilities(id),
  status TEXT CHECK(status IN ('created', 'shipped', 'received', 'installing', 'completed', 'support_needed')) DEFAULT 'created',
  tracking_number TEXT,
  shipped_at TEXT,
  completed_at TEXT,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS install_kit_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  install_kit_id INTEGER NOT NULL REFERENCES install_kits(id) ON DELETE CASCADE,
  sensor_id INTEGER REFERENCES sensors(id),
  item_type TEXT NOT NULL,
  description TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  installed_at TEXT
);

CREATE TABLE IF NOT EXISTS remote_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  facility_id INTEGER NOT NULL REFERENCES facilities(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  status TEXT CHECK(status IN ('requested', 'scheduled', 'in_progress', 'completed', 'cancelled')) DEFAULT 'requested',
  scheduled_at TEXT,
  started_at TEXT,
  ended_at TEXT,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- AI Knowledge Base Tables
CREATE TABLE IF NOT EXISTS documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT CHECK(file_type IN ('pdf', 'docx', 'txt', 'md')),
  category TEXT CHECK(category IN ('standards', 'manuals', 'best-practices', 'specifications', 'other')) DEFAULT 'other',
  status TEXT CHECK(status IN ('processing', 'ready', 'failed')) DEFAULT 'processing',
  chunk_count INTEGER DEFAULT 0,
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS document_chunks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding TEXT,
  chunk_index INTEGER NOT NULL,
  metadata TEXT
);

CREATE INDEX IF NOT EXISTS idx_document_chunks_document ON document_chunks(document_id);

CREATE TABLE IF NOT EXISTS chat_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  facility_id INTEGER REFERENCES facilities(id),
  title TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role TEXT CHECK(role IN ('user', 'assistant', 'system')) NOT NULL,
  content TEXT NOT NULL,
  sources TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Contact form (existing)
CREATE TABLE IF NOT EXISTS contact_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  phone TEXT,
  message TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Production Data Tables
CREATE TABLE IF NOT EXISTS production_data (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  facility_id INTEGER NOT NULL REFERENCES facilities(id),
  date TEXT NOT NULL,
  shift TEXT CHECK(shift IN ('day', 'swing', 'night', 'all')) DEFAULT 'all',
  product_type TEXT NOT NULL,
  units_produced INTEGER NOT NULL,
  runtime_hours REAL,
  energy_kwh REAL,
  air_cfm_avg REAL,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  created_by INTEGER REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_production_data_facility_date ON production_data(facility_id, date);

-- CAGI Data Sheet Tables
CREATE TABLE IF NOT EXISTS cagi_data_sheets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  facility_id INTEGER NOT NULL REFERENCES facilities(id),
  manufacturer TEXT NOT NULL,
  model TEXT NOT NULL,
  compressor_type TEXT,
  capacity_cfm REAL NOT NULL,
  full_load_power_kw REAL NOT NULL,
  rated_pressure_psi REAL NOT NULL,
  specific_power REAL,
  part_load25 REAL,
  part_load50 REAL,
  part_load75 REAL,
  part_load100 REAL,
  test_date TEXT,
  source_file TEXT,
  raw_data TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  created_by INTEGER REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_cagi_data_sheets_facility ON cagi_data_sheets(facility_id);
`;

async function main() {
  console.log('Initializing database...');

  const db = await initDb();

  // Execute schema
  db.exec(schema);
  db.exec(crmSchema);
  saveDb();

  // Check if demo data exists
  const existingOrg = db.exec("SELECT id FROM organizations WHERE slug = 'demo'");

  if (existingOrg.length === 0 || existingOrg[0].values.length === 0) {
    console.log('Creating demo data...');

    // Create organization
    db.run('INSERT INTO organizations (name, slug) VALUES (?, ?)', ['Demo Company', 'demo']);
    const orgId = db.exec('SELECT last_insert_rowid() as id')[0].values[0][0] as number;

    // Create facility
    db.run(
      'INSERT INTO facilities (organization_id, name, address, timezone) VALUES (?, ?, ?, ?)',
      [orgId, 'Main Plant', '123 Industrial Way, Manufacturing City, MC 12345', 'America/New_York']
    );
    const facilityId = db.exec('SELECT last_insert_rowid() as id')[0].values[0][0] as number;

    // Create admin user (password: demo123)
    const passwordHash = bcrypt.hashSync('demo123', 10);
    db.run(
      'INSERT INTO users (organization_id, email, password_hash, first_name, last_name, role) VALUES (?, ?, ?, ?, ?, ?)',
      [orgId, 'admin@demo.com', passwordHash, 'Admin', 'User', 'admin']
    );
    const userId = db.exec('SELECT last_insert_rowid() as id')[0].values[0][0] as number;

    // Give user access to facility
    db.run(
      'INSERT INTO user_facility_access (user_id, facility_id, access_level) VALUES (?, ?, ?)',
      [userId, facilityId, 'full']
    );

    // Create sample equipment
    db.run(
      'INSERT INTO equipment (facility_id, name, type, manufacturer, model) VALUES (?, ?, ?, ?, ?)',
      [facilityId, 'Main Compressor #1', 'compressor', 'Atlas Copco', 'GA 90+']
    );
    const compressorId = db.exec('SELECT last_insert_rowid() as id')[0].values[0][0] as number;

    db.run(
      'INSERT INTO equipment (facility_id, name, type, manufacturer, model) VALUES (?, ?, ?, ?, ?)',
      [facilityId, 'Refrigerated Dryer', 'dryer', 'Ingersoll Rand', 'D850IN']
    );
    const dryerId = db.exec('SELECT last_insert_rowid() as id')[0].values[0][0] as number;

    // Create sample sensors
    const sensors = [
      { name: 'Discharge Pressure', type: 'pressure', unit: 'PSI', equipmentId: compressorId },
      { name: 'Discharge Temperature', type: 'temperature', unit: '°F', equipmentId: compressorId },
      { name: 'Power Consumption', type: 'power', unit: 'kW', equipmentId: compressorId },
      { name: 'Dryer Inlet Dewpoint', type: 'dewpoint', unit: '°F', equipmentId: dryerId },
      { name: 'Dryer Outlet Dewpoint', type: 'dewpoint', unit: '°F', equipmentId: dryerId },
      { name: 'System Flow', type: 'flow', unit: 'CFM', equipmentId: null },
    ];

    for (const sensor of sensors) {
      const apiKey = uuidv4();
      db.run(
        'INSERT INTO sensors (facility_id, equipment_id, name, sensor_type, unit, api_key) VALUES (?, ?, ?, ?, ?, ?)',
        [facilityId, sensor.equipmentId, sensor.name, sensor.type, sensor.unit, apiKey]
      );
    }

    // Create sample alert rules
    db.run(
      'INSERT INTO alert_rules (facility_id, name, condition, threshold, severity) VALUES (?, ?, ?, ?, ?)',
      [facilityId, 'High Pressure Alert', 'above', 125, 'warning']
    );

    db.run(
      'INSERT INTO alert_rules (facility_id, name, condition, threshold, severity) VALUES (?, ?, ?, ?, ?)',
      [facilityId, 'Critical Pressure Alert', 'above', 150, 'critical']
    );

    // Create sample diagram
    db.run(
      'INSERT INTO diagrams (facility_id, name, description, created_by) VALUES (?, ?, ?, ?)',
      [facilityId, 'Main Air System', 'Primary compressed air system diagram', userId]
    );

    saveDb();

    console.log('Demo data created successfully!');
    console.log('Login credentials: admin@demo.com / demo123');
  } else {
    console.log('Database already initialized.');
  }

  console.log('Database initialization complete!');
}

main().catch(console.error);
