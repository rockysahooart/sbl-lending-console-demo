/*
 * Context-aware Before ↔ After synchronization.
 *
 * Each experience reports where the user is as a Loc (screen + application +
 * tab + expanded row + step). The toggle converts that Loc through the explicit
 * map below into the other experience's equivalent, falling back to the closest
 * meaningful parent where no equivalent exists. The application is never
 * dropped: when the target can't show it, it is carried so toggling back
 * restores it.
 */
import { BASELINE_PENDING, BASELINE_REVIEW, BASELINE_SUBMITTED } from './beforeData';
import { SCENARIOS, type Mode } from './data';
import type { Stage } from './DemoContext';

export type ConsoleTab = 'pending' | 'evaluations' | 'submitted';
export type Screen =
  | 'console'        // queue tabs (Before dashboard / After Console)
  | 'overview'       // Before: "View" overview of a submitted application
  | 'record'         // After: read-only record of an additional fictional application
  | 'evaluation'
  | 'acknowledgment'
  | 'step'           // Loan Request step 1–4
  | 'submitted'      // Loan Request Submitted
  | 'review'         // Pending Review (post-underwriting queue)
  | 'credit';        // After: Active Credit

export interface Loc {
  screen: Screen;
  appId?: string;
  tab?: ConsoleTab;
  /** Application ID of the expanded queue row. */
  expanded?: string;
  step?: 1 | 2 | 3 | 4;
  /** After-only section anchor inside a step (e.g. beneficial ownership). */
  section?: string;
}

export const HOME: Loc = { screen: 'console', tab: 'pending' };

const BEFORE_PENDING = new Set(BASELINE_PENDING.map((l) => l.applicationId));
const BEFORE_SUBMITTED = new Set(BASELINE_SUBMITTED.map((l) => l.applicationId));
const BEFORE_REVIEW = new Set(BASELINE_REVIEW.map((l) => l.applicationId));
const SCENARIO_IDS = new Set(SCENARIOS.map((s) => s.requestId));
const inBeforeTab = (tab: ConsoleTab | undefined, id?: string) => !!id && (tab === 'submitted' ? BEFORE_SUBMITTED : BEFORE_PENDING).has(id);

/** Before's queue row id for an application ID (scenario rows use the scenario id). */
export const beforeRowId = (appId: string) => [...BASELINE_PENDING, ...BASELINE_SUBMITTED].find((l) => l.applicationId === appId)?.id;
export const scenarioOfApp = (appId?: string) => SCENARIOS.find((s) => s.requestId === appId)?.id;

/** The canonical stage of a location, for metrics. */
export function stageOfLoc(l: Loc): Stage {
  switch (l.screen) {
    case 'evaluation': return 'evaluation';
    case 'acknowledgment': return 'acknowledgment';
    case 'step': return (['customer', 'parties', 'loan', 'collateral'] as Stage[])[(l.step ?? 1) - 1];
    case 'submitted': return 'submitted';
    case 'review': case 'credit': return 'servicing';
    default: return 'dashboard';
  }
}

/** After → Before. */
export function toBefore(l: Loc): Loc {
  switch (l.screen) {
    case 'console':
      return { screen: 'console', tab: l.tab ?? 'pending', expanded: inBeforeTab(l.tab, l.expanded) ? l.expanded : undefined };
    case 'record':
      // Additional fictional records exist only in After: closest parent is the queue they came from.
      return { screen: 'console', tab: 'pending' };
    case 'evaluation':
    case 'acknowledgment':
      return BEFORE_PENDING.has(l.appId ?? '') ? { screen: l.screen, appId: l.appId } : { screen: 'console', tab: 'pending' };
    case 'step':
      // Before has no beneficial-ownership section; its parent step (Co-borrowers) is the equivalent.
      return BEFORE_PENDING.has(l.appId ?? '') ? { screen: 'step', appId: l.appId, step: l.step ?? 1 } : { screen: 'console', tab: 'pending' };
    case 'submitted':
      return { screen: 'submitted', appId: l.appId };
    case 'review':
      return { screen: 'review', appId: BEFORE_REVIEW.has(l.appId ?? '') ? l.appId : undefined };
    case 'credit':
      // Before has no Active Credit screen; booked lines appear in Submitted Applications.
      return { screen: 'console', tab: 'submitted', expanded: BEFORE_SUBMITTED.has(l.appId ?? '') ? l.appId : undefined };
    default:
      return { screen: 'console', tab: 'pending' };
  }
}

/** Before → After. */
export function toAfter(l: Loc): Loc {
  switch (l.screen) {
    case 'console':
      return { screen: 'console', tab: l.tab ?? 'pending', expanded: l.expanded };
    case 'overview':
      // Before's "View" on a submitted application: After opens the same record where it is serviced.
      return (l.appId ?? '').startsWith('LOC-') ? { screen: 'credit', appId: l.appId } : { screen: 'review', appId: l.appId };
    case 'evaluation':
    case 'acknowledgment':
      return SCENARIO_IDS.has(l.appId ?? '') ? { screen: l.screen, appId: l.appId } : { screen: 'console', tab: 'pending' };
    case 'step':
      return SCENARIO_IDS.has(l.appId ?? '') ? { screen: 'step', appId: l.appId, step: l.step ?? 1 } : { screen: 'console', tab: 'pending' };
    case 'submitted':
      return { screen: 'submitted', appId: l.appId };
    case 'review':
      return { screen: 'review', appId: l.appId };
    default:
      return { screen: 'console', tab: 'pending' };
  }
}

export const mapLoc = (from: Mode, l: Loc) => (from === 'after' ? toBefore(l) : toAfter(l));

/** Two locations are the same place if screen, application, tab, expanded row and step agree. */
export const sameLoc = (a?: Loc, b?: Loc) =>
  !!a && !!b && a.screen === b.screen && (a.appId ?? '') === (b.appId ?? '') && (a.tab ?? '') === (b.tab ?? '') && (a.expanded ?? '') === (b.expanded ?? '') && (a.step ?? 0) === (b.step ?? 0);

/* ---------------------------- URL (browser history) ---------------------------- */

/** #/after/step/SBL-24-10871?step=2  ·  #/before/console?tab=submitted&expanded=LOC-77104 */
export function toHash(mode: Mode, l: Loc) {
  const q = new URLSearchParams();
  if (l.tab && l.screen === 'console') q.set('tab', l.tab);
  if (l.expanded) q.set('expanded', l.expanded);
  if (l.step) q.set('step', String(l.step));
  if (l.section) q.set('section', l.section);
  const qs = q.toString();
  return `#/${mode}/${l.screen}${l.appId ? '/' + encodeURIComponent(l.appId) : ''}${qs ? '?' + qs : ''}`;
}

export function fromHash(hash: string): { mode: Mode; loc: Loc } | null {
  const m = hash.match(/^#\/(before|after)\/([a-z]+)(?:\/([^?]+))?(?:\?(.*))?$/);
  if (!m) return null;
  const q = new URLSearchParams(m[4] ?? '');
  const step = Number(q.get('step'));
  return {
    mode: m[1] as Mode,
    loc: {
      screen: m[2] as Screen,
      appId: m[3] ? decodeURIComponent(m[3]) : undefined,
      tab: (q.get('tab') as ConsoleTab) || undefined,
      expanded: q.get('expanded') || undefined,
      step: step >= 1 && step <= 4 ? (step as 1 | 2 | 3 | 4) : undefined,
      section: q.get('section') || undefined,
    },
  };
}

/* ------------------------------ Documented mapping ------------------------------ */

/** The explicit screen map (also rendered in the README and Figma). */
export const TRANSITIONS: { before: string; after: string; rule: string }[] = [
  { before: 'Console tab (Pending Evaluations / Evaluations / Submitted Applications) + expanded row', after: 'Console, same tab + same expanded row', rule: 'Exact. After opens the page that holds the row; a request already submitted in After opens under Submitted Applications.' },
  { before: 'Console (no equivalent row)', after: 'Read-only record of an additional fictional application', rule: 'Closest parent: Pending Evaluations. The application is carried, so toggling back reopens the record.' },
  { before: 'Evaluation of an application', after: 'Evaluation of the same application', rule: 'Exact.' },
  { before: 'Acknowledgment Required dialog', after: 'Evaluation with Acknowledgment Required open', rule: 'Exact.' },
  { before: '1. Customer Information', after: '1. Customer Information', rule: 'Exact, same borrower.' },
  { before: '2. Co-borrowers', after: '2. Co-borrowers (including Beneficial / Trust Ownership)', rule: 'Exact. Before has no ownership section, so After’s ownership section maps to its parent step.' },
  { before: '3. Loan Information', after: '3. Loan Information', rule: 'Exact.' },
  { before: '4. Collaterals', after: '4. Collaterals', rule: 'Exact.' },
  { before: 'Loan Request Submitted', after: 'Loan Request Submitted', rule: 'Exact when both are submitted; otherwise step 4, where Submit lives.' },
  { before: '“View” on a submitted application', after: 'Pending Review with the application open (LOC lines: Active Credit)', rule: 'Equivalent: the place that application is serviced.' },
  { before: 'Pending Review + Evaluate (decision dialog)', after: 'Pending Review with the same application open', rule: 'Exact where the application is in both queues; otherwise the queue.' },
  { before: 'Submitted Applications with a booked line expanded', after: 'Active Credit with that line open', rule: 'After → Before: Before has no Active Credit, so the line opens expanded in Submitted Applications. Toggling back reopens Active Credit.' },
];
