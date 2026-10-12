// GET /_api/crm/account?name=  -> account, sites, engagements, contacts, eligibility
import { requireUser, query, ok, fail } from './_auth';

export async function handle(request: Request) {
  const denied = requireUser(request);
  if (denied) return denied;
  try {
    const name = new URL(request.url).searchParams.get('name') || '';
    if (!name) return ok({ error: 'name required' });
    const account = query('SELECT * FROM crm_accounts WHERE account = ?', [name])[0] || null;
    const sites = query('SELECT * FROM crm_sites WHERE account = ? ORDER BY city', [name]);
    const engagements = query('SELECT * FROM crm_engagements WHERE account = ? ORDER BY year DESC, date DESC', [name]);
    const contacts = query('SELECT * FROM crm_contacts WHERE account = ? ORDER BY role, name', [name]);
    const eligibility = query('SELECT * FROM crm_eligibility WHERE account = ? ORDER BY eligible_date', [name]);
    return ok({ account, sites, engagements, contacts, eligibility });
  } catch (e) {
    return fail(e, 'Failed to fetch CRM account');
  }
}
