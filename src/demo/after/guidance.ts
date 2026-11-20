/*
 * Decision guidance for a request: what needs attention, why, what to do next
 * and who owns it. Derived only from the request's real readiness and
 * collateral state, so the Pipeline and the request workspace always agree.
 */
import { fmtMoney, fmtPct, personById } from '../data';
import { isExpired, reviewBounds, type ReadinessItem } from '../engine';
import type { RequestModel, Section } from './state';

export type Attention = 'action' | 'ready' | 'waiting';

export interface NextStep {
  /** Task-oriented button label, e.g. "Review collateral". */
  label: string;
  /** One sentence: why this matters now. */
  detail: string;
  section: Section;
  /** Element id inside the section to bring into view. */
  anchor?: string;
}

export interface Warning {
  id: string;
  label: string;
  detail: string;
  section: Section;
  anchor?: string;
}

export interface Guidance {
  attention: Attention;
  /** Who the request is waiting on, when attention is "waiting". */
  waitingOn?: string;
  next?: NextStep;
  exceptions: string[];
  blocking: ReadinessItem[];
  warnings: Warning[];
  coverage: number;
  /** Positive = surplus, negative = shortfall. */
  margin: number;
}

/** Where each readiness item is resolved. */
export const ANCHOR: Record<string, string> = {
  pep: 'compliance', questions: 'compliance',
  co: 'co', coid: 'co', perm: 'co',
  owners: 'owners',
  pledge: 'collateral', review: 'collateral', coverage: 'collateral',
  proceeds: 'amount', wealth: 'sources', repay: 'sources',
  sustain: 'pricing', pricing: 'pricing', ach: 'pricing',
  consent: 'attest', attest: 'attest',
};

const ACTION: Record<string, string> = {
  pep: 'Complete client questions', questions: 'Complete client questions',
  co: 'Add the co-borrower', coid: 'Update co-borrower ID', perm: 'Confirm joint application',
  pledge: 'Select collateral', review: 'Review collateral', coverage: 'Resolve the shortfall',
  proceeds: 'Complete loan structure', wealth: 'Complete loan structure', repay: 'Complete loan structure',
  sustain: 'Complete loan structure', pricing: 'Complete loan structure', ach: 'Complete loan structure',
  consent: 'Complete attestations', attest: 'Complete attestations',
};

/** Additional eligible value a credit officer review could add, at the top of the permitted range. */
export function reviewUpside(m: RequestModel) {
  return m.ev.rows
    .filter((r) => r.status === 'review')
    .reduce((s, r) => s + r.holdings.filter((h) => h.concentrated).reduce((t, h) => t + h.value * (reviewBounds.max - h.appliedRate), 0), 0);
}

export function guidance(m: RequestModel): Guidance {
  const { req, ev, readiness, s, co, coIdExpired, isEntity, role } = m;
  const coverage = req.requested > 0 ? ev.total / req.requested : 0;
  const margin = ev.total - req.requested;
  const blocking = readiness.filter((r) => !r.done);
  const reviewPending = ev.rows.filter((r) => r.status === 'review');
  const reviewRequested = reviewPending.length > 0 && reviewPending.every((r) => req.reviewRequested[r.account.id]);

  // Exceptions: conditions outside the standard path that someone must decide on.
  const exceptions: string[] = [];
  if (reviewPending.length) exceptions.push(reviewRequested ? 'Concentration review requested' : 'Concentration review needed');
  const ineligiblePledged = ev.rows.filter((r) => r.status === 'ineligible').length;
  if (ineligiblePledged) exceptions.push(`${ineligiblePledged} ineligible account${ineligiblePledged > 1 ? 's' : ''}`);
  const household = s.coBorrowerId ? personById(s.coBorrowerId) : undefined;
  const idExpired = req.appType === 'Joint' && (co ? coIdExpired : !!household && isExpired(household.idExpires) && !req.coIdUpdate.saved);
  if (idExpired) exceptions.push('Co-borrower ID expired');
  if (req.pricing === 'exception') exceptions.push('Pricing exception');

  // Non-blocking warnings, shown before submission.
  const warnings: Warning[] = [];
  if (coverage >= 1 && coverage < 1.1) warnings.push({ id: 'thin', label: 'Coverage margin is thin', detail: `Estimated borrowing power exceeds the request by ${fmtMoney(margin)} (${fmtPct(coverage)}). A market decline before approval could create a shortfall.`, section: 'collateral', anchor: 'collateral' });
  if (req.pricing === 'exception') warnings.push({ id: 'pricing-ex', label: 'Pricing exception requested', detail: 'Pricing reviews exceptions separately. Approval is not guaranteed and can extend underwriting time.', section: 'structure', anchor: 'pricing' });
  for (const r of ev.rows.filter((x) => x.status === 'reviewed')) {
    const rate = r.holdings.find((h) => h.concentrated)?.appliedRate;
    warnings.push({ id: `reviewed-${r.account.id}`, label: 'Concentrated position at a reviewed rate', detail: `${r.account.name} ${r.account.number} is valued at ${rate != null ? fmtPct(rate) : 'a reviewed rate'} set by a credit officer. Underwriting sees the rationale.`, section: 'collateral', anchor: 'collateral' });
  }

  if (req.status === 'submitted') return { attention: 'waiting', waitingOn: 'Credit Underwriting', exceptions, blocking: [], warnings, coverage, margin };
  if (req.status === 'approved') return { attention: 'waiting', waitingOn: 'Servicing', exceptions, blocking: [], warnings, coverage, margin };

  const step = (r: ReadinessItem): NextStep => {
    const label = r.id === 'owners' ? (isEntity ? 'Certify beneficial ownership' : 'Certify trust ownership') : ACTION[r.id] ?? 'Continue request';
    return { label, detail: r.label + '.', section: r.step, anchor: ANCHOR[r.id] };
  };

  if (role === 'Credit Officer') {
    if (reviewPending.length) {
      const a = reviewPending[0].account;
      return { attention: 'action', next: { label: 'Complete collateral review', detail: `${a.name} ${a.number} exceeds the 40% single-issuer limit and needs an advance rate from 35% to 60%.`, section: 'collateral', anchor: 'collateral' }, exceptions, blocking, warnings, coverage, margin };
    }
    return { attention: 'waiting', waitingOn: 'Relationship banker', exceptions, blocking, warnings, coverage, margin };
  }

  if (!blocking.length) return { attention: 'ready', next: { label: 'Review and submit', detail: 'All readiness checks are complete. Confirm the summary and submit to underwriting.', section: 'review', anchor: 'readiness' }, exceptions, blocking, warnings, coverage, margin };

  // Priority: exceptions the banker can move forward, then the first open item in workflow order.
  const pick = (id: string) => blocking.find((b) => b.id === id);
  if (reviewPending.length && !reviewRequested) {
    const a = reviewPending[0].account;
    return { attention: 'action', next: { label: 'Review collateral', detail: `${a.name} ${a.number} is over the 40% single-issuer limit. Request a credit officer review to set its advance rate.`, section: 'collateral', anchor: 'collateral' }, exceptions, blocking, warnings, coverage, margin };
  }
  if (pick('coverage') && !reviewRequested) {
    return { attention: 'action', next: { label: 'Resolve the shortfall', detail: `Estimated borrowing power is ${fmtMoney(-margin)} below the requested amount. Pledge more collateral or reduce the request.`, section: 'collateral', anchor: 'collateral' }, exceptions, blocking, warnings, coverage, margin };
  }
  const own = blocking.filter((b) => !(reviewRequested && (b.id === 'review' || b.id === 'coverage')));
  if (!own.length) return { attention: 'waiting', waitingOn: 'Credit officer', exceptions, blocking, warnings, coverage, margin };
  if (idExpired && !co && household && pick('co')) {
    return { attention: 'action', next: { label: 'Add the co-borrower', detail: `${household.name}’s ID expired ${household.idExpires}. Add ${household.name} as co-borrower and record a current ID.`, section: 'client', anchor: 'co' }, exceptions, blocking, warnings, coverage, margin };
  }
  const first = pick('coid') ?? own[0];
  return { attention: 'action', next: step(first), exceptions, blocking, warnings, coverage, margin };
}

/** "95% · $96,000 short" — coverage stated with its consequence, never as a bare bar. */
export function coverageText(coverage: number, margin: number) {
  return margin >= 0 ? `${fmtPct(coverage)} · ${fmtMoney(margin)} surplus` : `${fmtPct(coverage)} · ${fmtMoney(-margin)} short`;
}
