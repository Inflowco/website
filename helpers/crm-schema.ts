// DDL for the CRM tables. Used by db-init.ts and seed-crm.ts.
export const crmSchema = `
CREATE TABLE IF NOT EXISTS crm_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account TEXT NOT NULL UNIQUE,
  parent TEXT, segment TEXT, relationship TEXT, utility TEXT, cities TEXT,
  first_year INTEGER, last_year INTEGER, engagements INTEGER, paid_engagements INTEGER,
  fees_on_record REAL, invoiced_2024_to_2026 REAL,
  last_supply_side_study TEXT, next_supply_side_eligible TEXT, supply_side_status TEXT,
  last_demand_side_study TEXT, next_demand_side_eligible TEXT, demand_side_status TEXT,
  last_leak_submission TEXT, next_leak_eligible TEXT,
  open_xcel_oids INTEGER, xcel_account_manager TEXT, aliases TEXT, notes TEXT
);
CREATE TABLE IF NOT EXISTS crm_sites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account TEXT NOT NULL, city TEXT, address TEXT, zip TEXT, utility TEXT, utility_basis TEXT,
  sic TEXT, sic_desc TEXT, annual_kw REAL, annual_kwh REAL, compressor_hp REAL,
  last_study_any_vendor INTEGER, last_vendor TEXT, contact TEXT, known_client INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_crm_sites_account ON crm_sites(account);
CREATE TABLE IF NOT EXISTS crm_engagements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account TEXT NOT NULL, raw_name TEXT, title TEXT, etype TEXT, fee REAL, year INTEGER, date TEXT,
  status TEXT, xcel_oid TEXT, rebate REAL, source TEXT, folder TEXT
);
CREATE INDEX IF NOT EXISTS idx_crm_engagements_account ON crm_engagements(account);
CREATE TABLE IF NOT EXISTS crm_contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account TEXT NOT NULL, name TEXT NOT NULL, title TEXT, phone TEXT, email TEXT, role TEXT, source TEXT, notes TEXT
);
CREATE TABLE IF NOT EXISTS crm_eligibility (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account TEXT NOT NULL, opportunity TEXT NOT NULL, eligible_date TEXT, quarter TEXT,
  typical_fee REAL, probability REAL, weighted REAL, relationship TEXT, xcel_rep TEXT
);
CREATE TABLE IF NOT EXISTS crm_utility_programs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  utility TEXT NOT NULL, territory TEXT, ca_study_funding TEXT, leak_incentive TEXT,
  custom_program TEXT, strength TEXT, contact TEXT, source TEXT
);
CREATE TABLE IF NOT EXISTS crm_prospects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account TEXT NOT NULL, city TEXT, address TEXT, zip TEXT, utility TEXT, sic TEXT, sic_desc TEXT,
  annual_kw REAL, annual_kwh REAL, compressor_hp REAL, last_study_any_vendor INTEGER, last_vendor TEXT,
  contact TEXT, score REAL, eligible_now TEXT
);
`;
