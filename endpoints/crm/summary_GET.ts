// GET /_api/crm/summary -> counts, eligibility calendar by quarter, forecast, utilities, top prospects
import { requireUser, query, ok, fail } from './_auth';

export async function handle(request: Request) {
  const denied = requireUser(request);
  if (denied) return denied;
  try {
    const byRelationship = query('SELECT relationship, COUNT(*) AS n, SUM(invoiced_2024_to_2026) AS invoiced FROM crm_accounts GROUP BY relationship ORDER BY n DESC');
    const byUtility = query('SELECT utility, COUNT(*) AS n FROM crm_accounts GROUP BY utility ORDER BY n DESC');
    const bySegment = query("SELECT COALESCE(NULLIF(segment, ''), 'Other') AS segment, COUNT(*) AS n FROM crm_accounts WHERE relationship LIKE 'Client%' GROUP BY 1 ORDER BY n DESC LIMIT 15");
    const eligibleNow = query("SELECT account, relationship, last_supply_side_study, xcel_account_manager FROM crm_accounts WHERE supply_side_status = 'ELIGIBLE NOW' AND relationship LIKE 'Client%' ORDER BY last_year DESC");
    const calendar = query("SELECT quarter, opportunity, COUNT(*) AS n, SUM(typical_fee) AS fees, SUM(weighted) AS weighted FROM crm_eligibility WHERE quarter != 'each year' GROUP BY quarter, opportunity ORDER BY quarter");
    const forecastTotal = query("SELECT SUM(weighted) AS weighted, SUM(typical_fee) AS fees, COUNT(*) AS n FROM crm_eligibility WHERE quarter != 'each year'")[0];
    const utilities = query('SELECT * FROM crm_utility_programs');
    const prospects = query('SELECT * FROM crm_prospects ORDER BY score DESC LIMIT 50');
    const engagementsByYear = query("SELECT year, COUNT(*) AS n, SUM(fee) AS fees FROM crm_engagements WHERE year IS NOT NULL AND source IN ('Customers-FOLDER', 'QuickBooks invoices') GROUP BY year ORDER BY year");
    return ok({ byRelationship, byUtility, bySegment, eligibleNow, calendar, forecastTotal, utilities, prospects, engagementsByYear });
  } catch (e) {
    return fail(e, 'Failed to build CRM summary');
  }
}
