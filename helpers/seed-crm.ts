// Seed the CRM tables from data/crm/*.json (exported by the Dropbox build script
// CLAUDE PROJECTS\claude-memory\customer-database\build_customer_db.py).
// Run: pnpm tsx helpers/seed-crm.ts   (or pnpm db:seed-crm)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDb, saveDb } from './db.js';
import { crmSchema } from './crm-schema.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(__dirname, '..', 'data', 'crm');

function load(name: string): Record<string, any>[] {
  const p = path.join(dir, name);
  if (!fs.existsSync(p)) {
    console.warn(`missing ${p}`);
    return [];
  }
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

const snake = (s: string) => s.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
const clean = (v: any) => (v === undefined || v === null || Number.isNaN(v) || v === 'NaN' ? null : v);

// JSON keys from pandas are already snake_case; some have digits that snake() would not touch.
const TABLES: Array<[string, string, string[]]> = [
  ['crm_accounts', 'accounts.json', ['account', 'parent', 'segment', 'relationship', 'utility', 'cities', 'first_year', 'last_year', 'engagements', 'paid_engagements', 'fees_on_record', 'invoiced_2024_to_2026', 'last_supply_side_study', 'next_supply_side_eligible', 'supply_side_status', 'last_demand_side_study', 'next_demand_side_eligible', 'demand_side_status', 'last_leak_submission', 'next_leak_eligible', 'open_xcel_oids', 'xcel_account_manager', 'aliases', 'Notes']],
  ['crm_sites', 'sites.json', ['account', 'city', 'address', 'zip', 'utility', 'utility_basis', 'sic', 'sic_desc', 'annual_kw', 'annual_kwh', 'compressor_hp', 'last_study_any_vendor', 'last_vendor', 'contact', 'known_client']],
  ['crm_engagements', 'engagements.json', ['account', 'raw_name', 'title', 'etype', 'fee', 'year', 'date', 'status', 'xcel_oid', 'rebate', 'source', 'folder']],
  ['crm_contacts', 'contacts.json', ['account', 'name', 'title', 'phone', 'email', 'role', 'source', 'notes']],
  ['crm_eligibility', 'eligibility.json', ['account', 'opportunity', 'eligible_date', 'quarter', 'typical_fee', 'probability', 'weighted', 'relationship', 'xcel_rep']],
  ['crm_utility_programs', 'utilities.json', ['utility', 'territory', 'ca_study_funding', 'leak_incentive', 'custom_program', 'strength', 'contact', 'source']],
  ['crm_prospects', 'prospects.json', ['account', 'city', 'address', 'zip', 'utility', 'sic', 'sic_desc', 'annual_kw', 'annual_kwh', 'compressor_hp', 'last_study_any_vendor', 'last_vendor', 'contact', 'score', 'eligible_now']],
];

async function main() {
  const db = await initDb();
  db.exec(crmSchema);
  for (const [table, file, cols] of TABLES) {
    const rows = load(file);
    db.run(`DELETE FROM ${table}`);
    const colNames = cols.map(c => (c === 'Notes' ? 'notes' : snake(c)));
    const stmt = db.prepare(`INSERT INTO ${table} (${colNames.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`);
    let n = 0;
    for (const r of rows) {
      const vals = cols.map(c => {
        let v = clean(r[c]);
        if (typeof v === 'boolean') v = v ? 1 : 0;
        return v;
      });
      stmt.run(vals);
      n++;
    }
    stmt.free();
    console.log(`${table}: ${n} rows`);
  }
  saveDb();
  console.log('CRM seed complete');
}

main().catch(e => { console.error(e); process.exit(1); });
