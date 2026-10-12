import { useState, useEffect, useCallback } from 'react';
import { useAuthFetch } from '../../helpers/useAuth';
import { Button } from '../../components/Button';
import { ArrowLeft, Download } from 'lucide-react';
import superjson from 'superjson';
import styles from './crm.module.css';

interface Account {
  id: number; account: string; parent?: string; segment?: string; relationship?: string; utility?: string; cities?: string;
  firstYear?: number; lastYear?: number; engagements?: number; feesOnRecord?: number; invoiced2024To2026?: number;
  lastSupplySideStudy?: string; nextSupplySideEligible?: string; supplySideStatus?: string;
  lastDemandSideStudy?: string; nextDemandSideEligible?: string; demandSideStatus?: string;
  lastLeakSubmission?: string; nextLeakEligible?: string; openXcelOids?: number; xcelAccountManager?: string; aliases?: string; notes?: string;
}
interface Summary {
  byRelationship: { relationship: string; n: number; invoiced: number }[];
  byUtility: { utility: string; n: number }[];
  bySegment: { segment: string; n: number }[];
  eligibleNow: { account: string; relationship: string; lastSupplySideStudy: string; xcelAccountManager: string }[];
  calendar: { quarter: string; opportunity: string; n: number; fees: number; weighted: number }[];
  forecastTotal: { weighted: number; fees: number; n: number };
  utilities: Record<string, any>[];
  prospects: Record<string, any>[];
  engagementsByYear: { year: number; n: number; fees: number }[];
}
interface Detail {
  account: Account | null;
  sites: Record<string, any>[];
  engagements: Record<string, any>[];
  contacts: Record<string, any>[];
  eligibility: Record<string, any>[];
}

const money = (v?: number | null) => (v ? `$${Math.round(v).toLocaleString()}` : '');
const num = (v?: number | null) => (v ? Math.round(v).toLocaleString() : '');

function toCsv(rows: Record<string, any>[]): string {
  if (!rows.length) return '';
  const cols = Object.keys(rows[0]);
  const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return [cols.join(','), ...rows.map(r => cols.map(c => esc(r[c])).join(','))].join('\n');
}

export default function CrmPage() {
  const authFetch = useAuthFetch();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [relationship, setRelationship] = useState('');
  const [utility, setUtility] = useState('');
  const [eligible, setEligible] = useState('');

  const fetchAccounts = useCallback(async () => {
    const params = new URLSearchParams({ q, relationship, utility, eligible });
    const res = await authFetch(`/_api/crm/accounts?${params.toString()}`);
    if (res.ok) {
      const data = superjson.parse<{ accounts: Account[] }>(await res.text());
      setAccounts(data.accounts || []);
    }
  }, [authFetch, q, relationship, utility, eligible]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await authFetch('/_api/crm/summary');
        if (res.ok) setSummary(superjson.parse<Summary>(await res.text()));
        await fetchAccounts();
      } catch (e) {
        console.error('CRM load failed', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [authFetch, fetchAccounts]);

  const openAccount = async (name: string) => {
    const res = await authFetch(`/_api/crm/account?name=${encodeURIComponent(name)}`);
    if (res.ok) setDetail(superjson.parse<Detail>(await res.text()));
  };

  const exportCsv = () => {
    const blob = new Blob([toCsv(accounts)], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'inflow-accounts.csv';
    a.click();
  };

  if (loading) return <div className={styles.loading}>Loading customer database...</div>;

  const clients = summary?.byRelationship.filter(r => (r.relationship || '').startsWith('Client')).reduce((s, r) => s + r.n, 0) || 0;
  const active = summary?.byRelationship.find(r => r.relationship === 'Client, active')?.n || 0;
  const xcel = summary?.byUtility.filter(u => (u.utility || '').includes('Xcel')).reduce((s, u) => s + u.n, 0) || 0;

  if (detail && detail.account) {
    const a = detail.account;
    return (
      <div className={styles.container}>
        <Button variant="ghost" onClick={() => setDetail(null)}><ArrowLeft size={16} /> All accounts</Button>
        <div className={styles.detail}>
          <h3>{a.account}</h3>
          <p className={styles.muted}>{[a.parent, a.segment, a.relationship, a.utility].filter(Boolean).join(' | ')}</p>
          <dl className={styles.kv}>
            <dt>Cities</dt><dd>{a.cities || ''}</dd>
            <dt>Years</dt><dd>{a.firstYear || ''} to {a.lastYear || ''} ({a.engagements} engagements)</dd>
            <dt>Fees on record</dt><dd>{money(a.feesOnRecord)}; invoiced 2024 to 2026 {money(a.invoiced2024To2026)}</dd>
            <dt>Supply side study</dt><dd>{a.lastSupplySideStudy || 'none'}; next eligible {a.nextSupplySideEligible || ''} <span className={`${styles.pill} ${a.supplySideStatus === 'ELIGIBLE NOW' ? styles.pillNow : ''}`}>{a.supplySideStatus}</span></dd>
            <dt>Demand side study</dt><dd>{a.lastDemandSideStudy || 'none'}; next eligible {a.nextDemandSideEligible || ''}</dd>
            <dt>Leak submission</dt><dd>{a.lastLeakSubmission || 'none'}; next {a.nextLeakEligible || ''}</dd>
            <dt>Open Xcel OIDs</dt><dd>{a.openXcelOids || 0}</dd>
            <dt>Xcel account manager</dt><dd>{a.xcelAccountManager || ''}</dd>
            <dt>Aliases</dt><dd className={styles.muted}>{a.aliases}</dd>
            {a.notes ? (<><dt>Notes</dt><dd>{a.notes}</dd></>) : null}
          </dl>
          <h4>Sites</h4>
          <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>City</th><th>Address</th><th>Utility</th><th>SIC</th><th>kW</th><th>kWh</th><th>HP</th><th>Last study (any vendor)</th><th>Contact</th></tr></thead>
            <tbody>{detail.sites.map(s => <tr key={s.id}><td>{s.city}</td><td>{s.address}</td><td>{s.utility}</td><td>{s.sic} {s.sicDesc}</td><td>{num(s.annualKw)}</td><td>{num(s.annualKwh)}</td><td>{num(s.compressorHp)}</td><td>{s.lastStudyAnyVendor || ''} {s.lastVendor || ''}</td><td>{s.contact}</td></tr>)}</tbody></table></div>
          <h4>Engagements</h4>
          <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Year</th><th>Title</th><th>Type</th><th>Fee</th><th>Status</th><th>Xcel OID</th><th>Rebate</th><th>Source</th></tr></thead>
            <tbody>{detail.engagements.map(e => <tr key={e.id}><td>{e.year || ''}</td><td>{e.title}</td><td>{e.etype}</td><td>{money(e.fee)}</td><td>{e.status}</td><td>{e.xcelOid}</td><td>{money(e.rebate)}</td><td className={styles.muted}>{e.source}</td></tr>)}</tbody></table></div>
          <h4>Contacts</h4>
          <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Name</th><th>Role</th><th>Phone</th><th>Email</th><th>Source</th><th>Notes</th></tr></thead>
            <tbody>{detail.contacts.map(c => <tr key={c.id}><td>{c.name}</td><td>{c.role}</td><td>{c.phone}</td><td>{c.email}</td><td className={styles.muted}>{c.source}</td><td>{c.notes}</td></tr>)}</tbody></table></div>
          <h4>Forecast</h4>
          <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Opportunity</th><th>Eligible</th><th>Quarter</th><th>Typical fee</th><th>Probability</th><th>Weighted</th></tr></thead>
            <tbody>{detail.eligibility.map(f => <tr key={f.id}><td>{f.opportunity}</td><td>{f.eligibleDate}</td><td>{f.quarter}</td><td>{money(f.typicalFee)}</td><td>{Math.round((f.probability || 0) * 100)}%</td><td>{money(f.weighted)}</td></tr>)}</tbody></table></div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Customers</h1>
          <p className={styles.subtitle}>Inflow customer database: accounts, Xcel study eligibility, forecast and prospects. Seeded from Dropbox (build_customer_db.py).</p>
        </div>
        <Button variant="outline" onClick={exportCsv}><Download size={16} /> Export CSV</Button>
      </div>

      <div className={styles.tiles}>
        <div className={styles.tile}><div className={styles.tileValue}>{clients}</div><div className={styles.tileLabel}>client accounts</div></div>
        <div className={styles.tile}><div className={styles.tileValue}>{active}</div><div className={styles.tileLabel}>active now</div></div>
        <div className={styles.tile}><div className={styles.tileValue}>{xcel}</div><div className={styles.tileLabel}>Xcel accounts</div></div>
        <div className={styles.tile}><div className={styles.tileValue}>{summary?.eligibleNow.length || 0}</div><div className={styles.tileLabel}>clients eligible for a study now</div></div>
        <div className={styles.tile}><div className={styles.tileValue}>{money(summary?.forecastTotal?.weighted)}</div><div className={styles.tileLabel}>weighted re-eligibility forecast, 3 yr</div></div>
      </div>

      <div className={styles.filters}>
        <input placeholder="Search account, alias or city" value={q} onChange={e => setQ(e.target.value)} />
        <select value={relationship} onChange={e => setRelationship(e.target.value)}>
          <option value="">All relationships</option>
          <option value="Client, active">Client, active</option>
          <option value="Client, recent">Client, recent</option>
          <option value="Client, open folder">Client, open folder (verify)</option>
          <option value="Client, past">Client, past</option>
          <option value="Prospect">Prospect, quoted</option>
          <option value="Historic">Historic contact</option>
          <option value="Lost">Lost</option>
        </select>
        <select value={utility} onChange={e => setUtility(e.target.value)}>
          <option value="">All utilities</option>
          <option value="Xcel">Xcel Energy</option>
          <option value="Unknown">Unknown</option>
        </select>
        <select value={eligible} onChange={e => setEligible(e.target.value)}>
          <option value="">Any eligibility</option>
          <option value="now">Supply side eligible now</option>
          <option value="12mo">Eligible within 12 months</option>
        </select>
        <span className={styles.muted}>{accounts.length} accounts</span>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead><tr><th>Account</th><th>Relationship</th><th>Segment</th><th>Utility</th><th>Cities</th><th>Last year</th><th>Invoiced 24 to 26</th><th>Supply side</th><th>Next eligible</th><th>Open OIDs</th><th>Xcel AM</th></tr></thead>
          <tbody>
            {accounts.map(a => (
              <tr key={a.id}>
                <td><button className={styles.link} onClick={() => openAccount(a.account)}>{a.account}</button></td>
                <td>{a.relationship}</td><td>{a.segment}</td><td>{(a.utility || '').replace(' (confirmed by Xcel records)', '')}</td><td>{a.cities}</td>
                <td>{a.lastYear || ''}</td><td>{money(a.invoiced2024To2026)}</td>
                <td><span className={`${styles.pill} ${a.supplySideStatus === 'ELIGIBLE NOW' ? styles.pillNow : ''}`}>{a.supplySideStatus || ''}</span></td>
                <td>{a.nextSupplySideEligible || ''}</td><td>{a.openXcelOids || ''}</td><td>{a.xcelAccountManager || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {summary && (
        <div className={styles.section}>
          <div className={styles.grid2}>
            <div>
              <h2 className={styles.sectionTitle}>Re-eligibility calendar (5 year Xcel rule)</h2>
              <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Quarter</th><th>Opportunity</th><th>Accounts</th><th>Fees</th><th>Weighted</th></tr></thead>
                <tbody>{summary.calendar.map((c, i) => <tr key={i}><td>{c.quarter}</td><td>{c.opportunity}</td><td>{c.n}</td><td>{money(c.fees)}</td><td>{money(c.weighted)}</td></tr>)}</tbody></table></div>
            </div>
            <div>
              <h2 className={styles.sectionTitle}>Clients eligible for a supply side study now</h2>
              <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Account</th><th>Relationship</th><th>Last study</th><th>Xcel AM</th></tr></thead>
                <tbody>{summary.eligibleNow.map((e, i) => <tr key={i}><td><button className={styles.link} onClick={() => openAccount(e.account)}>{e.account}</button></td><td>{e.relationship}</td><td>{e.lastSupplySideStudy}</td><td>{e.xcelAccountManager}</td></tr>)}</tbody></table></div>
            </div>
          </div>
          <div className={styles.grid2} style={{ marginTop: 'var(--spacing-6)' }}>
            <div>
              <h2 className={styles.sectionTitle}>Engagements and fees by year</h2>
              <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Year</th><th>Engagements</th><th>Fees on record</th></tr></thead>
                <tbody>{summary.engagementsByYear.map(y => <tr key={y.year}><td>{y.year}</td><td>{y.n}</td><td>{money(y.fees)}</td></tr>)}</tbody></table></div>
            </div>
            <div>
              <h2 className={styles.sectionTitle}>Top prospects (Xcel accounts, not yet clients)</h2>
              <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Account</th><th>City</th><th>SIC</th><th>kWh</th><th>HP</th><th>Last study</th><th>Score</th></tr></thead>
                <tbody>{summary.prospects.map(p => <tr key={p.id}><td>{p.account}</td><td>{p.city}</td><td>{p.sic} {p.sicDesc}</td><td>{num(p.annualKwh)}</td><td>{num(p.compressorHp)}</td><td>{p.lastStudyAnyVendor || ''} {p.lastVendor || ''}</td><td>{p.score}</td></tr>)}</tbody></table></div>
            </div>
          </div>
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Minnesota utility programs</h2>
            <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Utility</th><th>Territory</th><th>Compressed air study funding</th><th>Leak incentive</th><th>Custom program</th><th>Strength vs Xcel</th></tr></thead>
              <tbody>{summary.utilities.map(u => <tr key={u.id}><td>{u.utility}</td><td>{u.territory}</td><td>{u.caStudyFunding}</td><td>{u.leakIncentive}</td><td>{u.customProgram}</td><td>{u.strength}</td></tr>)}</tbody></table></div>
          </div>
        </div>
      )}
    </div>
  );
}
