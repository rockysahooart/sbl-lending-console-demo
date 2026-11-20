/**
 * Indicative borrowing-power engine — FICTIONAL RULES for a portfolio demo.
 *
 * Results are preliminary estimates used during origination. They are NOT
 * credit decisions; approval happens only in underwriting.
 *
 * Rules
 *  1. Lendable value = market value × advance rate for the holding's class
 *     (cash 100%, money market/T-bills 80%, fixed income 80%, equities 70%,
 *      mutual funds/other 60%, restricted stock 0%).
 *  2. A single-issuer position above 40% of the total pledged collateral is
 *     "concentrated": the system applies half the normal rate (35% for
 *     equities) and flags it for manual review. A reviewer may set a rate
 *     between 35% and 60% with a documented reason.
 *  3. Restricted stock is ineligible (0%) and cannot be overridden here.
 *  4. Estimated borrowing power = sum of lendable value of pledged accounts.
 */
import {
  ADVANCE_RATES,
  CONCENTRATION_LIMIT,
  CONCENTRATION_REVIEW_RANGE,
  type Account,
  type AssetClass,
  type Scenario,
} from './data';

export type EvalStatus = 'auto' | 'review' | 'reviewed' | 'ineligible' | 'excluded';

export interface ManualReview {
  rate: number; // decimal, within CONCENTRATION_REVIEW_RANGE
  reason: string;
  reviewer: string;
  at: string;
}

export interface HoldingEval {
  label: string;
  assetClass: AssetClass;
  value: number;
  baseRate: number;
  appliedRate: number;
  lendable: number;
  concentrated: boolean;
}

export interface AccountEval {
  account: Account;
  pledged: boolean;
  value: number;
  lendable: number;
  status: EvalStatus;
  explanation: string;
  holdings: HoldingEval[];
}

export const accountValue = (a: Account) => a.holdings.reduce((s, h) => s + h.value, 0);

export function evaluate(
  accounts: Account[],
  pledged: Record<string, boolean>,
  reviews: Record<string, ManualReview | undefined> = {},
): { rows: AccountEval[]; total: number; pledgedValue: number; needsReview: number; ineligible: number } {
  const pledgedValue = accounts.filter((a) => pledged[a.id]).reduce((s, a) => s + accountValue(a), 0);
  const rows: AccountEval[] = accounts.map((a) => {
    const isPledged = !!pledged[a.id];
    const review = reviews[a.id];
    let anyConcentrated = false;
    let allRestricted = true;
    const holdings: HoldingEval[] = a.holdings.map((h) => {
      const baseRate = ADVANCE_RATES[h.assetClass];
      if (h.assetClass !== 'restricted') allRestricted = false;
      const concentrated = isPledged && !!h.singleIssuer && pledgedValue > 0 && h.value / pledgedValue > CONCENTRATION_LIMIT;
      if (concentrated) anyConcentrated = true;
      const appliedRate = concentrated ? (review ? review.rate : baseRate / 2) : baseRate;
      return { label: h.label, assetClass: h.assetClass, value: h.value, baseRate, appliedRate, lendable: h.value * appliedRate, concentrated };
    });
    const value = accountValue(a);
    const lendable = holdings.reduce((s, h) => s + h.lendable, 0);
    let status: EvalStatus = 'auto';
    let explanation = 'Valued at the standard advance rate for its asset class.';
    if (allRestricted) {
      status = 'ineligible';
      explanation = 'Restricted stock (Rule 144) is not eligible collateral. It adds no eligible collateral value.';
    } else if (!isPledged) {
      status = 'excluded';
      explanation = 'Not pledged. Excluded from estimated borrowing power.';
    } else if (anyConcentrated && !review) {
      status = 'review';
      explanation = `Single-issuer position exceeds ${Math.round(CONCENTRATION_LIMIT * 100)}% of pledged market value. A provisional 35% advance rate applies until a credit officer review is complete.`;
    } else if (anyConcentrated && review) {
      status = 'reviewed';
      explanation = `Credit officer review: ${Math.round(review.rate * 100)}% advance rate set by ${review.reviewer} on ${review.at}. Rationale: ${review.reason}`;
    }
    return { account: a, pledged: isPledged, value, lendable: isPledged && status !== 'ineligible' ? lendable : 0, status, explanation, holdings };
  });
  return {
    rows,
    total: rows.reduce((s, r) => s + r.lendable, 0),
    pledgedValue,
    needsReview: rows.filter((r) => r.status === 'review').length,
    ineligible: rows.filter((r) => r.status === 'ineligible').length,
  };
}

/** Auto value shown by the BEFORE app: a single number with no explanation. */
export function legacyAutoValue(a: Account, all: Account[]) {
  const pledged = Object.fromEntries(all.map((x) => [x.id, true]));
  const row = evaluate(all, pledged).rows.find((r) => r.account.id === a.id)!;
  return Math.round(row.status === 'ineligible' ? 0 : row.holdings.reduce((s, h) => s + h.lendable, 0));
}

export const reviewBounds = CONCENTRATION_REVIEW_RANGE;

export interface ReadinessItem {
  id: string;
  label: string;
  done: boolean;
  step: 'customer' | 'parties' | 'loan' | 'collateral' | 'evaluation' | 'acknowledgment';
  severity: 'blocker' | 'info';
}

export function isExpired(mmddyyyy: string, today = new Date(2025, 10, 19)) {
  const [m, d, y] = mmddyyyy.split('/').map(Number);
  if (!m || !d || !y) return false;
  return new Date(y, m - 1, d) < today;
}

export const scenarioPledgeDefaults = (s: Scenario) =>
  Object.fromEntries(s.accounts.map((a) => [a.id, a.holdings.every((h) => h.assetClass !== 'restricted')]));
