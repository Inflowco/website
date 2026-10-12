import type { Generated, ColumnType } from 'kysely';

// Core Tables
export interface OrganizationsTable {
  id: Generated<number>;
  name: string;
  slug: string;
  createdAt: ColumnType<Date, string | undefined, never>;
}

export interface FacilitiesTable {
  id: Generated<number>;
  organizationId: number;
  name: string;
  address: string | null;
  timezone: string;
  createdAt: ColumnType<Date, string | undefined, never>;
}

export interface UsersTable {
  id: Generated<number>;
  organizationId: number;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'manager' | 'viewer';
  createdAt: ColumnType<Date, string | undefined, never>;
}

export interface SessionsTable {
  id: Generated<number>;
  userId: number;
  token: string;
  expiresAt: ColumnType<Date, string, never>;
  createdAt: ColumnType<Date, string | undefined, never>;
}

export interface UserFacilityAccessTable {
  id: Generated<number>;
  userId: number;
  facilityId: number;
  accessLevel: 'full' | 'readonly';
  createdAt: ColumnType<Date, string | undefined, never>;
}

// IoT Tables
export interface EquipmentTable {
  id: Generated<number>;
  facilityId: number;
  name: string;
  type: 'compressor' | 'dryer' | 'filter' | 'receiver' | 'other';
  manufacturer: string | null;
  model: string | null;
  serialNumber: string | null;
  installDate: ColumnType<Date, string | undefined, never> | null;
  metadata: string | null; // JSON string
  createdAt: ColumnType<Date, string | undefined, never>;
}

export interface SensorsTable {
  id: Generated<number>;
  facilityId: number;
  equipmentId: number | null;
  name: string;
  sensorType: 'pressure' | 'temperature' | 'flow' | 'power' | 'humidity' | 'dewpoint' | 'vibration';
  unit: string;
  apiKey: string;
  minValue: number | null;
  maxValue: number | null;
  createdAt: ColumnType<Date, string | undefined, never>;
}

export interface SensorReadingsTable {
  id: Generated<number>;
  sensorId: number;
  value: number;
  timestamp: ColumnType<Date, string, never>;
  quality: 'good' | 'suspect' | 'bad' | null;
}

export interface SensorReadingsHourlyTable {
  id: Generated<number>;
  sensorId: number;
  hourStart: ColumnType<Date, string, never>;
  avgValue: number;
  minValue: number;
  maxValue: number;
  sampleCount: number;
}

// Alert Tables
export interface AlertRulesTable {
  id: Generated<number>;
  facilityId: number;
  sensorId: number | null;
  name: string;
  condition: 'above' | 'below' | 'equal' | 'change_rate';
  threshold: number;
  duration: number; // seconds
  severity: 'critical' | 'warning' | 'info';
  enabled: number; // SQLite boolean
  createdAt: ColumnType<Date, string | undefined, never>;
}

export interface AlertsTable {
  id: Generated<number>;
  alertRuleId: number;
  sensorId: number;
  facilityId: number;
  value: number;
  message: string;
  status: 'active' | 'acknowledged' | 'resolved';
  acknowledgedBy: number | null;
  acknowledgedAt: ColumnType<Date, string | undefined, never> | null;
  resolvedAt: ColumnType<Date, string | undefined, never> | null;
  createdAt: ColumnType<Date, string | undefined, never>;
}

export interface NotificationsTable {
  id: Generated<number>;
  userId: number;
  alertId: number;
  type: 'email' | 'sms' | 'push' | 'in_app';
  status: 'pending' | 'sent' | 'failed';
  sentAt: ColumnType<Date, string | undefined, never> | null;
  createdAt: ColumnType<Date, string | undefined, never>;
}

export interface NotificationPreferencesTable {
  id: Generated<number>;
  userId: number;
  facilityId: number | null;
  emailEnabled: number; // SQLite boolean
  smsEnabled: number;
  pushEnabled: number;
  minSeverity: 'critical' | 'warning' | 'info';
  quietHoursStart: string | null; // HH:MM format
  quietHoursEnd: string | null;
}

// Diagram Tables
export interface DiagramsTable {
  id: Generated<number>;
  facilityId: number;
  name: string;
  description: string | null;
  createdBy: number;
  updatedAt: ColumnType<Date, string, string>;
  createdAt: ColumnType<Date, string | undefined, never>;
}

export interface DiagramNodesTable {
  id: Generated<number>;
  diagramId: number;
  nodeId: string; // React Flow node ID
  type: 'compressor' | 'dryer' | 'filter' | 'receiver' | 'sensor' | 'pipe' | 'valve' | 'custom';
  label: string;
  positionX: number;
  positionY: number;
  width: number | null;
  height: number | null;
  equipmentId: number | null;
  sensorId: number | null;
  data: string | null; // JSON string
}

export interface DiagramEdgesTable {
  id: Generated<number>;
  diagramId: number;
  edgeId: string; // React Flow edge ID
  sourceNodeId: string;
  targetNodeId: string;
  sourceHandle: string | null;
  targetHandle: string | null;
  type: 'pipe' | 'electrical' | 'signal' | 'default';
  data: string | null; // JSON string
}

// Self-Install Tables
export interface InstallKitsTable {
  id: Generated<number>;
  facilityId: number;
  status: 'created' | 'shipped' | 'received' | 'installing' | 'completed' | 'support_needed';
  trackingNumber: string | null;
  shippedAt: ColumnType<Date, string | undefined, never> | null;
  completedAt: ColumnType<Date, string | undefined, never> | null;
  notes: string | null;
  createdAt: ColumnType<Date, string | undefined, never>;
}

export interface InstallKitItemsTable {
  id: Generated<number>;
  installKitId: number;
  sensorId: number | null;
  itemType: string;
  description: string;
  quantity: number;
  installedAt: ColumnType<Date, string | undefined, never> | null;
}

export interface RemoteSessionsTable {
  id: Generated<number>;
  facilityId: number;
  userId: number;
  status: 'requested' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  scheduledAt: ColumnType<Date, string | undefined, never> | null;
  startedAt: ColumnType<Date, string | undefined, never> | null;
  endedAt: ColumnType<Date, string | undefined, never> | null;
  notes: string | null;
  createdAt: ColumnType<Date, string | undefined, never>;
}

// AI Knowledge Base Tables
export interface DocumentsTable {
  id: Generated<number>;
  organizationId: number;
  name: string;
  filePath: string;
  fileType: 'pdf' | 'docx' | 'txt' | 'md';
  category: 'standards' | 'manuals' | 'best-practices' | 'specifications' | 'other';
  status: 'processing' | 'ready' | 'failed';
  chunkCount: number;
  createdBy: number;
  createdAt: ColumnType<Date, string | undefined, never>;
}

export interface DocumentChunksTable {
  id: Generated<number>;
  documentId: number;
  content: string;
  embedding: string | null; // JSON array of floats for SQLite
  chunkIndex: number;
  metadata: string | null; // JSON string
}

export interface ChatSessionsTable {
  id: Generated<number>;
  userId: number;
  facilityId: number | null;
  title: string | null;
  createdAt: ColumnType<Date, string | undefined, never>;
}

export interface ChatMessagesTable {
  id: Generated<number>;
  sessionId: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  sources: string | null; // JSON array of document chunk IDs
  createdAt: ColumnType<Date, string | undefined, never>;
}

// Contact form (existing)
export interface ContactSubmissionsTable {
  id: Generated<number>;
  name: string;
  email: string;
  company: string | null;
  phone: string | null;
  message: string;
  createdAt: ColumnType<Date, string | undefined, never>;
}

// Complete Database interface
export interface DB {
  organizations: OrganizationsTable;
  facilities: FacilitiesTable;
  users: UsersTable;
  sessions: SessionsTable;
  userFacilityAccess: UserFacilityAccessTable;
  equipment: EquipmentTable;
  sensors: SensorsTable;
  sensorReadings: SensorReadingsTable;
  sensorReadingsHourly: SensorReadingsHourlyTable;
  alertRules: AlertRulesTable;
  alerts: AlertsTable;
  notifications: NotificationsTable;
  notificationPreferences: NotificationPreferencesTable;
  diagrams: DiagramsTable;
  diagramNodes: DiagramNodesTable;
  diagramEdges: DiagramEdgesTable;
  installKits: InstallKitsTable;
  installKitItems: InstallKitItemsTable;
  remoteSessions: RemoteSessionsTable;
  documents: DocumentsTable;
  documentChunks: DocumentChunksTable;
  chatSessions: ChatSessionsTable;
  chatMessages: ChatMessagesTable;
  contactSubmissions: ContactSubmissionsTable;
}

// CRM tables (Inflow customer database, seeded from Dropbox build_customer_db.py)
export interface CrmAccountsTable {
  id: Generated<number>;
  account: string;
  parent: string | null;
  segment: string | null;
  relationship: string | null;
  utility: string | null;
  cities: string | null;
  firstYear: number | null;
  lastYear: number | null;
  engagements: number | null;
  paidEngagements: number | null;
  feesOnRecord: number | null;
  invoiced2024To2026: number | null;
  lastSupplySideStudy: string | null;
  nextSupplySideEligible: string | null;
  supplySideStatus: string | null;
  lastDemandSideStudy: string | null;
  nextDemandSideEligible: string | null;
  demandSideStatus: string | null;
  lastLeakSubmission: string | null;
  nextLeakEligible: string | null;
  openXcelOids: number | null;
  xcelAccountManager: string | null;
  aliases: string | null;
  notes: string | null;
}

export interface CrmSitesTable {
  id: Generated<number>;
  account: string;
  city: string | null;
  address: string | null;
  zip: string | null;
  utility: string | null;
  utilityBasis: string | null;
  sic: string | null;
  sicDesc: string | null;
  annualKw: number | null;
  annualKwh: number | null;
  compressorHp: number | null;
  lastStudyAnyVendor: number | null;
  lastVendor: string | null;
  contact: string | null;
  knownClient: number;
}

export interface CrmEngagementsTable {
  id: Generated<number>;
  account: string;
  rawName: string | null;
  title: string | null;
  etype: string | null;
  fee: number | null;
  year: number | null;
  date: string | null;
  status: string | null;
  xcelOid: string | null;
  rebate: number | null;
  source: string | null;
  folder: string | null;
}

export interface CrmContactsTable {
  id: Generated<number>;
  account: string;
  name: string;
  title: string | null;
  phone: string | null;
  email: string | null;
  role: string | null;
  source: string | null;
  notes: string | null;
}

export interface CrmEligibilityTable {
  id: Generated<number>;
  account: string;
  opportunity: string;
  eligibleDate: string | null;
  quarter: string | null;
  typicalFee: number | null;
  probability: number | null;
  weighted: number | null;
  relationship: string | null;
  xcelRep: string | null;
}

export interface CrmUtilityProgramsTable {
  id: Generated<number>;
  utility: string;
  territory: string | null;
  caStudyFunding: string | null;
  leakIncentive: string | null;
  customProgram: string | null;
  strength: string | null;
  contact: string | null;
  source: string | null;
}

export interface CrmProspectsTable {
  id: Generated<number>;
  account: string;
  city: string | null;
  address: string | null;
  zip: string | null;
  utility: string | null;
  sic: string | null;
  sicDesc: string | null;
  annualKw: number | null;
  annualKwh: number | null;
  compressorHp: number | null;
  lastStudyAnyVendor: number | null;
  lastVendor: string | null;
  contact: string | null;
  score: number | null;
  eligibleNow: string | null;
}

export interface CrmDB {
  crmAccounts: CrmAccountsTable;
  crmSites: CrmSitesTable;
  crmEngagements: CrmEngagementsTable;
  crmContacts: CrmContactsTable;
  crmEligibility: CrmEligibilityTable;
  crmUtilityPrograms: CrmUtilityProgramsTable;
  crmProspects: CrmProspectsTable;
}
