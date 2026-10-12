// GET /_api/crm/accounts?q=&relationship=&utility=&eligible=now|12mo
import { requireUser, query, ok, fail } from './_auth';

export async function handle(request: Request) {
  const denied = requireUser(request);
  if (denied) return denied;
  try {
    const url = new URL(request.url);
    const q = (url.searchParams.get('q') || '').trim();
    const relationship = url.searchParams.get('relationship') || '';
    const utility = url.searchParams.get('utility') || '';
    const eligible = url.searchParams.get('eligible') || '';
    const where: string[] = [];
    const params: any[] = [];
    if (q) { where.push('(account LIKE ? OR aliases LIKE ? OR cities LIKE ?)'); params.push(`%${q}%`, `%${q}%`, `%${q}%`); }
    if (relationship) { where.push('relationship LIKE ?'); params.push(`${relationship}%`); }
    if (utility) { where.push('utility LIKE ?'); params.push(`%${utility}%`); }
    if (eligible === 'now') { where.push("supply_side_status = 'ELIGIBLE NOW'"); }
    if (eligible === '12mo') { where.push("next_supply_side_eligible > date('now') AND next_supply_side_eligible <= date('now', '+1 year')"); }
    const sql = `SELECT * FROM crm_accounts ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY relationship, last_year DESC, account`;
    const accounts = query(sql, params);
    return ok({ accounts, count: accounts.length });
  } catch (e) {
    return fail(e, 'Failed to fetch CRM accounts');
  }
}
