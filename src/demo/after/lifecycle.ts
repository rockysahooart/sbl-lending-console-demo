/*
 * One lifecycle model for every application in the After experience.
 *
 * Status, queue (tab), outstanding items, the specific next action, the exact
 * place it is resolved and the explanation shown there all come from here, so
 * the Console, Pending Review, Active Credit, the request steps, the progress
 * navigation and the Application status panel can never disagree.
 */
import { CheckmarkFilled, CheckmarkOutline, CircleDash, InProgress, Misuse, Pending, SendFilled, TaskComplete, WarningAltFilled } from '@carbon/icons-react';
import { fmtMoney, personById, type ScenarioId } from '../data';
import { isExpired } from '../engine';
import { ACTION, ANCHOR } from './guidance';
import type { Place, RequestModel } from './state';
import type { PendingRef, SubmittedRef } from './records';
import type { Route } from './AfterApp';

export type Status = 'Not Started' | 'In Progress' | 'Action Required' | 'Ready to Submit' | 'Submitted' | 'Under Review' | 'Approved' | 'Declined' | 'Completed';
export type Queue = 'pending' | 'evaluations' | 'submitted';

/** Colour (Carbon tag type), icon and meaning for each status. Colour is never the only signal: every tag shows its icon and its words. */
export const STATUS_META: Record<Status, { tag: string; Icon: typeof CheckmarkFilled; meaning: string }> = {
  'Not Started': { tag: 'gray', Icon: CircleDash, meaning: 'Opportunity created; nothing has been evaluated yet.' },
  'In Progress': { tag: 'blue', Icon: InProgress, meaning: 'Being evaluated or completed; no correction is blocking it.' },
  'Action Required': { tag: 'magenta', Icon: WarningAltFilled, meaning: 'Something specific must be corrected or provided before it can move on.' },
  'Ready to Submit': { tag: 'teal', Icon: CheckmarkOutline, meaning: 'Every readiness check is complete.' },
  Submitted: { tag: 'cyan', Icon: SendFilled, meaning: 'With Credit Underwriting, awaiting pickup.' },
  'Under Review': { tag: 'purple', Icon: Pending, meaning: 'Credit Underwriting or the credit committee is reviewing it.' },
  Approved: { tag: 'green', Icon: CheckmarkFilled, meaning: 'Approved; documents are being signed.' },
  Declined: { tag: 'red', Icon: Misuse, meaning: 'Declined by Credit Underwriting.' },
  Completed: { tag: 'cool-gray', Icon: TaskComplete, meaning: 'Booked; the line is active.' },
};
export const STATUS_ORDER = Object.keys(STATUS_META) as Status[];

export const QUEUE_LABEL: Record<Queue, string> = { pending: 'Pending Evaluations', evaluations: 'Evaluations', submitted: 'Submitted Applications' };

export type ItemKind = 'task' | 'correction' | 'waiting';
export interface Item {
  id: string;
  label: string;
  place: Place;
  kind: ItemKind;
  /** Short name of the problem for the status detail ("Expired co-borrower ID"). */
  problem?: string;
  /** What exactly to do, shown at the field. */
  explain: string;
  route: Route;
  /** Element id the route lands on. */
  anchor?: string;
}

export interface Next { label: string; route: Route; explain: string }

export interface AppState {
  status: Status;
  /** Why it is in this status, in a few words ("Expired co-borrower ID"). */
  detail: string;
  queue: Queue;
  /** One sentence: where it is, why, and what happens next. */
  why: string;
  next?: Next;
  /** Outstanding items, in workflow order (corrections are also flagged). */
  items: Item[];
  /** Is it with underwriting (Pending Review)? */
  inUnderwriting: boolean;
}

/** Workflow order used to pick the next item and to gate dependent steps. */
export const PLACE_ORDER: Place[] = ['evaluation', 'acknowledgment', 'customer', 'parties', 'loan', 'collateral'];
const STEP_ORDER: Place[] = ['customer', 'parties', 'loan', 'collateral'];

/** Items that block advancing past a step (dependent steps). The collateral coverage check gates submission only. */
export const gatesStep = (i: { id: string; place: Place }) => STEP_ORDER.includes(i.place) && i.id !== 'coverage';

const routeFor = (id: ScenarioId, place: Place, fix: string): Route =>
  place === 'evaluation' ? { page: 'evaluation', id, fix } : place === 'acknowledgment' ? { page: 'evaluation', id, ack: true } : { page: 'request', id, section: place, fix };

/** The specific, human explanation for an outstanding item. */
function explain(m: RequestModel, id: string, label: string): { explain: string; problem?: string; kind: ItemKind } {
  const { ev, req, co, s, isEntity } = m;
  const review = ev.rows.find((r) => r.status === 'review');
  const requested = review ? !!req.reviewRequested[review.account.id] : false;
  const household = s.coBorrowerId ? personById(s.coBorrowerId) : undefined;
  switch (id) {
    case 'coid':
      return { kind: 'correction', problem: 'Expired co-borrower ID', explain: `${co!.name}’s ${co!.idType} expired ${co!.idExpires}. Enter a current ID number and expiration date, then select Save identification.` };
    case 'co':
      return household && isExpired(household.idExpires)
        ? { kind: 'correction', problem: 'Expired co-borrower ID', explain: `Add ${household.name} as co-borrower; their ID on file expired ${household.idExpires}, so record a current ID before submitting.` }
        : { kind: 'task', explain: 'This is a joint application: add the co-borrower from the client directory.' };
    case 'coverage':
      return { kind: review && requested ? 'waiting' : 'correction', problem: 'Collateral shortfall', explain: `Total Maximum Borrowing Power (${fmtMoney(ev.total)}) is ${fmtMoney(req.requested - ev.total)} short of the Requested Loan Amount (${fmtMoney(req.requested)}). Reduce the amount, select more collateral, or complete the manual evaluation.` };
    case 'review':
      return review && requested
        ? { kind: 'waiting', problem: 'Waiting on credit officer review', explain: `A credit officer is setting the advance rate for ${review.account.name} ${review.account.number}. Nothing is needed from you until the review is recorded.` }
        : { kind: 'correction', problem: 'Collateral review needed', explain: `${review ? `${review.account.name} ${review.account.number}` : 'A position'} is over the 40% single-issuer limit. Select Request credit officer review in Manual Evaluation.` };
    case 'owners':
      return { kind: 'correction', problem: isEntity ? 'Beneficial ownership incomplete' : 'Trust ownership not certified', explain: isEntity ? 'Confirm each owner of 25% or more and the control person, then select the beneficial-ownership certification.' : 'Confirm the trustees from the trust record, then select the trust-ownership certification.' };
    case 'pledge':
      return { kind: 'task', explain: 'Select at least one eligible account in Auto Evaluation.' };
    case 'attest':
      return { kind: 'task', explain: 'Complete both steps of Acknowledgment Required: select the five acknowledgements, then open the full acknowledgement.' };
    default: {
      if (id.startsWith('ret-')) {
        const c = (req.corrections ?? []).find((x) => `ret-${x.id}` === id);
        return { kind: 'correction', problem: 'Returned for correction', explain: c ? `${c.text} Previously submitted: “${c.previous || '—'}”.` : label };
      }
      return { kind: 'task', explain: `${label}.` };
    }
  }
}

/** Outstanding items for a scenario request, in workflow order. */
export function itemsOf(m: RequestModel): Item[] {
  const sid = m.s.id;
  return m.readiness
    .filter((r) => !r.done)
    .map((r) => {
      const e = explain(m, r.id, r.label);
      const anchor = r.id.startsWith('ret-') ? (m.req.corrections ?? []).find((c) => `ret-${c.id}` === r.id)?.anchor : ANCHOR[r.id];
      return { id: r.id, label: r.label, place: r.step, ...e, anchor, route: routeFor(sid, r.step, r.id) };
    })
    .sort((a, b) => PLACE_ORDER.indexOf(a.place) - PLACE_ORDER.indexOf(b.place));
}

const actionLabel = (i: Item) => (i.id.startsWith('ret-') ? i.label : i.id === 'owners' ? i.label : i.id === 'review' && i.kind === 'waiting' ? 'View review status' : ACTION[i.id] ?? 'Continue application');

/** Lifecycle state of a scenario request. */
export function appState(m: RequestModel, signed = false): AppState {
  const { s, req } = m;
  const id = s.id;
  const openCond = (req.conditions ?? []).filter((c) => c.status === 'open');
  const toReview: Route = { page: 'review', id: s.requestId };
  if (req.status === 'submitted') {
    if (openCond.length) {
      const c = openCond.find((x) => x.kind === 'decision') ?? openCond.find((x) => x.kind === 'question') ?? openCond[0];
      const [detail, label, lead] = c.kind === 'decision' ? ['Decision needs acknowledgment', 'Record borrower response', 'Credit Underwriting decided:'] : c.kind === 'question' ? ['Question from underwriting', 'Answer question', 'Credit Underwriting asked:'] : ['Additional information requested', 'Respond to condition', 'Credit Underwriting asked for:'];
      return { status: 'Action Required', detail, queue: 'submitted', inUnderwriting: true, items: [], why: `${lead} ${c.text}`, next: { label, route: { page: 'review', id: s.requestId, fix: 'conditions' }, explain: c.text } };
    }
    if (req.uwStage === 'review') return { status: 'Under Review', detail: 'In credit underwriting', queue: 'submitted', inUnderwriting: true, items: [], why: 'Credit Underwriting is reviewing the request. Nothing is needed from you.', next: { label: 'View underwriting status', route: toReview, explain: '' } };
    return { status: 'Submitted', detail: 'Awaiting underwriting', queue: 'submitted', inUnderwriting: true, items: [], why: `Submitted ${req.submittedAt}. Waiting for Credit Underwriting to pick it up.`, next: { label: 'View underwriting status', route: toReview, explain: '' } };
  }
  if (req.status === 'approved') {
    return signed
      ? { status: 'Completed', detail: 'Line active', queue: 'submitted', inUnderwriting: false, items: [], why: 'Approved, documents signed, and the line is active.', next: { label: 'View credit line', route: { page: 'credit', id: s.requestId }, explain: '' } }
      : { status: 'Approved', detail: 'Documents pending signature', queue: 'submitted', inUnderwriting: true, items: [], why: `Approved ${req.approvedAt}. Credit agreement and pledge agreement are awaiting signature.`, next: { label: 'View credit line', route: { page: 'credit', id: s.requestId }, explain: '' } };
  }
  if (req.status === 'declined') return { status: 'Declined', detail: 'Declined by underwriting', queue: 'submitted', inUnderwriting: true, items: [], why: `Declined ${req.declinedAt}.`, next: { label: 'View decision', route: toReview, explain: '' } };

  const items = itemsOf(m);
  const started = m.acknowledged || req.visited.length > 0 || req.status === 'returned';
  const evalStarted = !!req.evalOpened || req.estimateLog.length > 0;
  const nextOf = (i: Item): Next => ({ label: actionLabel(i), route: i.route, explain: i.explain });

  if (!started && !evalStarted) return { status: 'Not Started', detail: 'No evaluation yet', queue: 'pending', inUnderwriting: false, items, why: 'Opportunity created; the evaluation hasn’t been started.', next: { label: 'Start Application', route: { page: 'evaluation', id }, explain: 'Start with the Evaluation: select the accounts to pledge.' } };

  const corrections = items.filter((i) => i.kind === 'correction');
  const tasks = items.filter((i) => i.kind === 'task');
  const waiting = items.filter((i) => i.kind === 'waiting');
  const queue: Queue = started ? 'evaluations' : 'pending';

  if (req.status === 'returned') {
    const ret = items.filter((i) => i.id.startsWith('ret-'));
    const first = ret[0] ?? corrections[0] ?? tasks[0];
    if (!items.length) return { status: 'Ready to Submit', detail: 'Corrections made · ready to resubmit', queue: 'evaluations', inUnderwriting: false, items, why: `Returned ${req.returnedAt}; every correction is made.`, next: { label: 'Resubmit Application', route: { page: 'request', id, section: 'collateral', fix: 'submit' }, explain: 'Every correction is made. Resubmit from Collaterals.' } };
    return { status: 'Action Required', detail: 'Returned for correction', queue: 'evaluations', inUnderwriting: false, items, why: `Credit Underwriting returned it ${req.returnedAt}: ${items.length} item${items.length > 1 ? 's' : ''} to correct.`, next: first ? nextOf(first) : undefined };
  }
  if (!items.length) return { status: 'Ready to Submit', detail: 'All checks complete', queue: 'evaluations', inUnderwriting: false, items, why: 'Every readiness check is complete.', next: { label: 'Submit Application', route: { page: 'request', id, section: 'collateral', fix: 'submit' }, explain: 'Every readiness check is complete. Submit from Collaterals.' } };
  if (corrections.length) return { status: 'Action Required', detail: corrections[0].problem ?? 'Correction needed', queue, inUnderwriting: false, items, why: `${corrections[0].problem}: ${corrections[0].explain}`, next: nextOf(corrections[0]) };
  if (!tasks.length && waiting.length) return { status: 'In Progress', detail: 'Waiting on credit officer review', queue, inUnderwriting: false, items, why: waiting[0].explain, next: nextOf(waiting[0]) };
  const first = tasks[0] ?? waiting[0];
  return { status: 'In Progress', detail: started ? `${items.length} item${items.length > 1 ? 's' : ''} open` : 'Evaluation started', queue, inUnderwriting: false, items, why: first.explain, next: nextOf(first) };
}

/* ------------------------------- Reference records ------------------------------- */

const refKind = (label: string): ItemKind => (/awaiting|requested — /i.test(label) ? 'waiting' : /expired|short|beneficial|over the 40%|manual evaluation|trust ownership|ineligible|keep the requested amount|returned/i.test(label) ? 'correction' : 'task');
const refProblem = (label: string) =>
  /expired/i.test(label) ? 'Expired co-borrower ID' : /beneficial/i.test(label) ? 'Beneficial ownership incomplete' : /trust ownership/i.test(label) ? 'Trust ownership not certified' : /manual evaluation/i.test(label) ? 'Collateral review needed' : /keep the requested amount/i.test(label) ? 'Collateral shortfall' : /returned|correct/i.test(label) ? 'Returned for correction' : undefined;
const STEP_PLACE: Record<string, Place> = { Evaluation: 'evaluation', 'Customer Information': 'customer', 'Co-borrowers': 'parties', 'Loan Information': 'loan', Collaterals: 'collateral' };

/** Lifecycle state of an additional fictional reference application (read-only record). */
export function refState(r: PendingRef, resolved: string[] = [], startedRefs: string[] = []): AppState {
  const items: Item[] = r.openItems
    .map((o, i) => ({ o, i }))
    .filter(({ i }) => !resolved.includes(`${r.id}:${i}`))
    .map(({ o, i }) => {
      const kind = refKind(o.label);
      return { id: `${r.id}:${i}`, label: o.label, place: STEP_PLACE[o.step] ?? 'customer', kind, problem: kind === 'correction' ? refProblem(o.label) : undefined, explain: o.explain ?? `${o.label}.`, route: { page: 'record', id: r.id, fix: `${r.id}:${i}` } as Route };
    })
    .sort((a, b) => PLACE_ORDER.indexOf(a.place) - PLACE_ORDER.indexOf(b.place));
  // While a credit officer review is pending, the shortfall it may close is waiting too, not a correction.
  if (items.some((i) => i.kind === 'waiting')) items.forEach((i) => { if (i.problem === 'Collateral shortfall') { i.kind = 'waiting'; i.problem = undefined; } });
  const progress = startedRefs.includes(r.id) && r.progress === 'not-started' ? 'evaluating' : r.progress;
  const nextOf = (i: Item): Next => ({ label: i.kind === 'waiting' ? 'View review status' : ACTION_REF(i.label), route: i.route, explain: i.explain });
  if (progress === 'not-started') return { status: 'Not Started', detail: 'No evaluation yet', queue: 'pending', inUnderwriting: false, items, why: 'Opportunity created; the evaluation hasn’t been started.', next: { label: 'Start Application', route: { page: 'record', id: r.id, fix: 'start' }, explain: 'Start with the Evaluation.' } };
  const queue: Queue = progress === 'evaluating' ? 'pending' : 'evaluations';
  const corrections = items.filter((i) => i.kind === 'correction');
  const tasks = items.filter((i) => i.kind === 'task');
  if (r.returned) {
    if (!items.length) return { status: 'Ready to Submit', detail: 'Corrections made · ready to resubmit', queue: 'evaluations', inUnderwriting: false, items, why: `Returned ${r.returned.returnedAt}; every correction is made.`, next: { label: 'Resubmit Application', route: { page: 'record', id: r.id, fix: 'submit' }, explain: '' } };
    return { status: 'Action Required', detail: 'Returned for correction', queue: 'evaluations', inUnderwriting: false, items, why: `Credit Underwriting returned it ${r.returned.returnedAt}: ${r.returned.reason}`, next: nextOf(items[0]) };
  }
  if (!items.length) return { status: 'Ready to Submit', detail: 'All checks complete', queue: 'evaluations', inUnderwriting: false, items, why: 'Every readiness check is complete.', next: { label: 'Submit Application', route: { page: 'record', id: r.id, fix: 'submit' }, explain: '' } };
  if (corrections.length) return { status: 'Action Required', detail: corrections[0].problem ?? 'Correction needed', queue, inUnderwriting: false, items, why: corrections[0].explain, next: nextOf(corrections[0]) };
  if (!tasks.length) return { status: 'In Progress', detail: 'Waiting on credit officer review', queue, inUnderwriting: false, items, why: items[0].explain, next: nextOf(items[0]) };
  return { status: 'In Progress', detail: progress === 'evaluating' ? 'Evaluation started' : `${items.length} item${items.length > 1 ? 's' : ''} open`, queue, inUnderwriting: false, items, why: tasks[0].explain, next: nextOf(tasks[0]) };
}

/** Specific action label for a reference item, from its wording. */
function ACTION_REF(label: string) {
  if (/expired/i.test(label)) return 'Update co-borrower ID';
  if (/beneficial/i.test(label)) return 'Certify beneficial ownership';
  if (/trust ownership/i.test(label)) return 'Certify trust ownership';
  if (/manual evaluation/i.test(label)) return 'Complete manual evaluation';
  if (/keep the requested amount/i.test(label)) return 'Resolve the shortfall';
  if (/politically exposed|risk questions/i.test(label)) return 'Complete additional information';
  if (/co-borrower|joint/i.test(label)) return 'Add the co-borrower';
  if (/spread|pricing/i.test(label)) return 'Complete pricing exception';
  if (/correct/i.test(label)) return label.replace(/\.$/, '');
  return 'Complete loan information';
}

/** Lifecycle state of a submitted reference application. */
export function submittedRefState(r: SubmittedRef): AppState {
  const toReview: Route = { page: 'review', id: r.id };
  switch (r.status) {
    case 'Condition Requested': return { status: 'Action Required', detail: 'Additional information requested', queue: 'submitted', inUnderwriting: true, items: [], why: r.conditions[0] ?? r.note, next: { label: 'Respond to condition', route: { page: 'review', id: r.id, fix: 'conditions' }, explain: r.conditions[0] ?? '' } };
    case 'Awaiting Underwriting': return { status: 'Submitted', detail: 'Awaiting underwriting', queue: 'submitted', inUnderwriting: true, items: [], why: r.note, next: { label: 'View underwriting status', route: toReview, explain: '' } };
    case 'Pending Credit Committee': return { status: 'Under Review', detail: 'Pending credit committee', queue: 'submitted', inUnderwriting: true, items: [], why: r.note, next: { label: 'View underwriting status', route: toReview, explain: '' } };
    case 'Underwriting Review Complete': return { status: 'Approved', detail: 'Documents pending signature', queue: 'submitted', inUnderwriting: true, items: [], why: r.note, next: { label: 'View decision', route: toReview, explain: '' } };
    case 'Declined': return { status: 'Declined', detail: 'Declined by underwriting', queue: 'submitted', inUnderwriting: true, items: [], why: r.note, next: { label: 'View decision', route: toReview, explain: '' } };
    default: return { status: 'Under Review', detail: 'In credit underwriting', queue: 'submitted', inUnderwriting: true, items: [], why: r.note, next: { label: 'View underwriting status', route: toReview, explain: '' } };
  }
}
