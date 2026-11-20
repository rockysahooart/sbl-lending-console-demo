import { createContext, createElement, useCallback, useContext, useMemo, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import { usePersistentState } from '../../app/state/ConsoleStore';
import { personById, scenarioById, type ScenarioId } from '../data';
import { evaluate, isExpired, scenarioPledgeDefaults, type ManualReview, type ReadinessItem } from '../engine';

/*
 * AFTER request model. Security and compliance behaviours here are SIMULATED
 * for a portfolio demonstration (fictional data, browser-only state). They do
 * not provide production security, regulatory compliance or certification.
 */

/** The four Loan Request steps, named and ordered as in the original console. */
export type Section = 'customer' | 'parties' | 'loan' | 'collateral';
export const STEPS: { key: Section; n: number; label: string }[] = [
  { key: 'customer', n: 1, label: 'Customer Information' },
  { key: 'parties', n: 2, label: 'Co-borrowers' },
  { key: 'loan', n: 3, label: 'Loan Information' },
  { key: 'collateral', n: 4, label: 'Collaterals' },
];
/** Where a readiness item is resolved: a step, the Evaluation screen, or the acknowledgment. */
export type Place = Section | 'evaluation' | 'acknowledgment';
const isSection = (v: unknown): v is Section => STEPS.some((x) => x.key === v);
export type YN = '' | 'Yes' | 'No';
export type Role = 'Relationship Banker' | 'Credit Officer';

export const USERS: Record<Role, string> = { 'Relationship Banker': 'S. Mitchell', 'Credit Officer': 'M. Okonkwo' };
/** Display names for roles. The banker role keeps Before's label, "Loan Officer" (Before header); the Role values stay as they are. */
export const ROLE_LABEL: Record<Role, string> = { 'Relationship Banker': 'Loan Officer', 'Credit Officer': 'Credit Officer' };

export interface AuditEvent {
  at: string;
  user: string;
  /** Display label of the role at the time of the event (ROLE_LABEL). */
  role: string;
  event: string;
  detail: string;
  requestId?: string;
}

export interface EstimateEvent {
  at: string;
  user: string;
  change: string;
  from: number;
  to: number;
}

export interface Condition {
  id: string;
  text: string;
  status: 'open' | 'provided';
  at: string;
  providedAt?: string;
  /** Finding type: a condition to satisfy, a question to answer, or a decision the banker must acknowledge. */
  kind?: 'condition' | 'question' | 'decision';
  /** The banker's written answer (question) or recorded borrower response (decision). */
  response?: string;
  /** Decision: the credit limit Credit Underwriting will approve (changed terms). */
  terms?: number;
}

export interface AfterRequest {
  section: Section;
  visited: Section[];
  appType: 'Individual' | 'Joint' | 'Entity';
  coBorrowerId: string;
  coIdUpdate: { number: string; expires: string; saved: boolean };
  jointPermission: boolean;
  /** The Yes/No answer to the joint-permission question, so a No stays selected. */
  permAns?: YN;
  ownersCertified: boolean;
  pep: YN;
  marital: string;
  q1: YN;
  q1Explain: string;
  q2: YN;
  q3: YN;
  /** Co-borrower "Additional Information" (step 2). */
  coPep: YN;
  coMarital: string;
  pledged: Record<string, boolean>;
  reviews: Record<string, ManualReview>;
  /** Before's Manual Evaluation calculator: collateral values entered for assets held away, by row id. */
  outside?: Record<string, number>;
  /** Calculator rows the banker marks as a single-issuer position (bond and equity rows only). */
  outsideIssuer?: Record<string, boolean>;
  reviewRequested: Record<string, string>;
  requested: number;
  purpose: string;
  useOfProceeds: '' | 'non-purpose' | 'purpose';
  purposeStatement: boolean;
  method: string;
  rmCorrect: YN;
  wealth1: string;
  wealth2: string;
  repay1: string;
  repay2: string;
  showSecondary: boolean;
  pricing: 'standard' | 'exception';
  spread: string;
  pricingWhy: string;
  costCenter: string;
  memo: string;
  sustainability: YN;
  ach: boolean;
  achAccount: string;
  consentMethod: string;
  attest: Record<string, boolean>;
  disclosureViewed: boolean;
  /** Steps saved with Next, as in the original step rail. */
  completed?: Section[];
  estimateLog: EstimateEvent[];
  /** Underwriting conditions returned to the banker after submission. */
  conditions?: Condition[];
  /**
   * Lifecycle. draft → submitted (uwStage awaiting → review) → approved | declined,
   * or → returned (back with the banker for named corrections) → submitted again.
   */
  status: 'draft' | 'submitted' | 'approved' | 'declined' | 'returned';
  submittedAt?: string;
  approvedAt?: string;
  declinedAt?: string;
  /** Underwriting stage while submitted: awaiting pickup, or under review. */
  uwStage?: 'awaiting' | 'review';
  /** The Evaluation screen has been opened (Evaluation In Progress). */
  evalOpened?: boolean;
  /** Submission history: every submit, return, condition and decision, oldest first. */
  history?: HistoryEvent[];
  /** What was submitted last time (shown as "Previously submitted" when returned). */
  snapshot?: { at: string; requested: number; power: number; pledged: number; repay1: string; wealth1: string; costCenter: string };
  /** Corrections underwriting asked for when it returned the request. */
  corrections?: Correction[];
  returnedAt?: string;
}

export interface HistoryEvent { at: string; event: string; detail: string; by: string }

/** A correction is resolved when its field no longer holds the previously submitted value. */
export interface Correction {
  id: string;
  /** Short readiness label, e.g. "Correct the primary source of repayment". */
  short: string;
  /** Underwriting's explanation. */
  text: string;
  field: 'repay1' | 'wealth1' | 'requested' | 'costCenter';
  previous: string;
  section: Section;
  anchor: string;
}

/** The five acknowledgements from the original "Acknowledgment Required" dialog, same wording and order. */
export const ATTESTATIONS = [
  { key: 'consent', text: 'Consent to proceed with formal loan application submission' },
  { key: 'accuracy', text: 'Confirmation that all evaluation data and customer information is accurate and complete' },
  { key: 'disclosures', text: 'Acknowledgment of all required regulatory disclosures and lending compliance requirements' },
  { key: 'electronic', text: 'Agreement to electronic record-keeping and digital signature authority for application processing' },
  { key: 'compliance', text: 'Compliance awareness regarding anti-money laundering, KYC verification, and credit decisioning protocols' },
];

/** Fixed fictional “today” (11/19/2025) so stamps match the scenario data; time of day is live. */
export const nowStamp = () => `11/19/2025, ${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;

export function initialRequest(id: ScenarioId): AfterRequest {
  const s = scenarioById(id);
  return {
    section: 'customer',
    visited: [],
    completed: [],
    appType: s.applicationType,
    coBorrowerId: '',
    coIdUpdate: { number: '', expires: '', saved: false },
    jointPermission: false,
    ownersCertified: false,
    pep: '',
    // Regulation B §1002.5(d)(1): only married / unmarried / separated may be used.
    marital: s.primary.maritalStatus === 'Married' ? 'Married' : s.primary.maritalStatus === 'Separated' ? 'Separated' : 'Unmarried',
    q1: '',
    q1Explain: '',
    q2: '',
    q3: '',
    coPep: '',
    coMarital: '',
    pledged: scenarioPledgeDefaults(s),
    reviews: {},
    reviewRequested: {},
    requested: s.requestedAmount,
    purpose: s.purpose,
    useOfProceeds: '',
    purposeStatement: false,
    method: 'Relationship Manager Initiated',
    rmCorrect: '',
    wealth1: '',
    wealth2: '',
    repay1: '',
    repay2: '',
    showSecondary: false,
    pricing: 'standard',
    spread: '',
    pricingWhy: '',
    costCenter: 'Private Banking',
    memo: '',
    sustainability: '',
    ach: true,
    achAccount: s.accounts.find((a) => a.holdings.some((h) => h.assetClass === 'cash' || h.assetClass === 'liquid'))?.number ?? '',
    consentMethod: '',
    attest: {},
    disclosureViewed: false,
    estimateLog: [],
    conditions: [],
    status: 'draft',
    // The complex request was already being evaluated in the original console ("Under Evaluation").
    evalOpened: s.id === 'complex',
    history: [],
  };
}

/** Session-wide state: role, audit trail, acknowledged alerts, signed documents. */
export interface AfterGlobal {
  role: Role;
  audit: AuditEvent[];
  acknowledgedAlerts: string[];
  signedLines: string[];
  /** Active lines with a document reminder sent this session. */
  remindersSent?: string[];
  /** Reference applications: items marked resolved ("refId:index") and applications started. */
  resolvedRefItems?: string[];
  startedRefs?: string[];
}
type GlobalValue = readonly [AfterGlobal, Dispatch<SetStateAction<AfterGlobal>>];
const GlobalCtx = createContext<GlobalValue | null>(null);

/** One shared copy of session state for every component in the After app (persisted across Before/After toggles). */
export function AfterGlobalProvider({ children }: { children: ReactNode }) {
  const value = usePersistentState<AfterGlobal>('after:global', () => ({ role: 'Relationship Banker', audit: [], acknowledgedAlerts: [], signedLines: [] }));
  return createElement(GlobalCtx.Provider, { value }, children);
}

export function useAfterGlobal(): GlobalValue {
  const v = useContext(GlobalCtx);
  if (!v) throw new Error('useAfterGlobal must be used inside AfterGlobalProvider');
  return v;
}

export function useAudit() {
  const [global, setGlobal] = useAfterGlobal();
  const log = useCallback(
    (event: string, detail: string, requestId?: string) =>
      setGlobal((g) => ({ ...g, audit: [{ at: nowStamp(), user: USERS[g.role], role: ROLE_LABEL[g.role], event, detail, requestId }, ...g.audit] })),
    [setGlobal],
  );
  return { role: global.role, user: USERS[global.role], audit: global.audit, log, setGlobal, global };
}

export function useAfterRequest(id: ScenarioId) {
  const [raw, setReq] = usePersistentState<AfterRequest>(`after:req:${id}`, () => initialRequest(id));
  // Requests saved by an earlier version of the prototype used different step names.
  const req = useMemo<AfterRequest>(() => {
    if (isSection(raw.section) && raw.completed) return raw;
    return { ...initialRequest(id), ...raw, section: isSection(raw.section) ? raw.section : 'customer', visited: raw.visited.filter(isSection), completed: raw.completed ?? [] };
  }, [raw, id]);
  const s = scenarioById(id);
  const { log, user, role } = useAudit();

  const update = useCallback((patch: Partial<AfterRequest>) => setReq((prev) => ({ ...prev, ...patch })), [setReq]);

  const ev = useMemo(() => {
    const base = evaluate(s.accounts, req.pledged, req.reviews);
    const calc = calcOutside(req.outside ?? {}, base.pledgedValue, req.outsideIssuer ?? {});
    return { ...base, outside: calc, total: base.total + calc.lendable };
  }, [s, req.pledged, req.reviews, req.outside, req.outsideIssuer]);

  /** Changes that alter the estimate are recorded with before/after values. */
  const changeEstimate = useCallback(
    (patch: Partial<AfterRequest>, change: string) => {
      setReq((prev) => {
        const before = evaluate(s.accounts, prev.pledged, prev.reviews).total;
        const next = { ...prev, ...patch };
        const after = evaluate(s.accounts, next.pledged, next.reviews).total;
        return { ...next, estimateLog: [{ at: nowStamp(), user, change, from: before, to: after }, ...prev.estimateLog] };
      });
      log('Estimate changed', change, s.requestId);
    },
    [setReq, s, user, log],
  );

  const pledgesTrust = s.accounts.some((a) => req.pledged[a.id] && a.relationship === 'Trust');
  const isEntity = req.appType === 'Entity';
  const needsOwners = isEntity || pledgesTrust;
  const owners = s.beneficialOwners ?? [];
  const co = req.coBorrowerId ? personById(req.coBorrowerId) : undefined;
  const coIdExpired = !!co && isExpired(co.idExpires) && !req.coIdUpdate.saved;

  const readiness: ReadinessItem[] = useMemo(() => {
    const items: ReadinessItem[] = [];
    const add = (rid: string, label: string, done: boolean, step: ReadinessItem['step']) => items.push({ id: rid, label, done, step, severity: 'blocker' });
    add('pep', 'Answer the politically exposed person question', !!req.pep, 'customer');
    add('questions', 'Answer the three risk questions', !!req.q1 && !!req.q2 && !!req.q3 && (req.q1 !== 'Yes' || req.q1Explain.trim().length > 0), 'customer');
    if (req.appType === 'Joint') {
      add('co', 'Add a co-borrower', !!co, 'parties');
      if (co) add('copep', `Answer the politically exposed person question for ${co.name}`, !!req.coPep, 'parties');
      if (co) add('coid', `Update ${co.name}’s identification`, !coIdExpired, 'parties');
      add('perm', 'Confirm the co-applicant’s permission to apply jointly', req.jointPermission, 'parties');
    }
    if (needsOwners) add('owners', isEntity ? 'Certify beneficial ownership' : 'Certify trust ownership', req.ownersCertified && owners.length > 0, 'parties');
    add('pledge', 'Pledge at least one eligible account', ev.rows.some((r) => r.pledged && r.lendable > 0), 'collateral');
    add('review', 'Complete the manual evaluation of flagged collateral', ev.needsReview === 0, 'evaluation');
    add('coverage', 'Keep the requested amount within the total maximum borrowing power', req.requested > 0 && ev.total >= req.requested, 'customer');
    add('proceeds', 'Confirm non-purpose use of proceeds and the purpose statement', req.useOfProceeds === 'non-purpose' && req.purposeStatement, 'loan');
    add('wealth', 'Select the primary source of wealth', !!req.wealth1, 'loan');
    add('repay', 'Select the primary source of repayment', !!req.repay1, 'loan');
    add('sustain', 'Answer the sustainability review question', !!req.sustainability, 'loan');
    if (req.pricing === 'exception') add('pricing', 'Enter the requested spread and justification', !!req.spread && req.pricingWhy.trim().length > 0, 'loan');
    if (req.ach) add('ach', 'Select the ACH debit account', !!req.achAccount, 'loan');
    add('consent', 'Record how the customer authorized this application', !!req.consentMethod, 'parties');
    add('attest', 'Complete the acknowledgment', ATTESTATIONS.every((a) => req.attest[a.key]) && req.disclosureViewed, 'acknowledgment');
    // Returned for correction: each correction underwriting named blocks resubmission until changed.
    if (req.status === 'returned') for (const c of req.corrections ?? []) add(`ret-${c.id}`, c.short, String(req[c.field]) !== c.previous, c.section);
    return items;
  }, [req, ev, co, coIdExpired, needsOwners, isEntity, owners.length]);

  /** Completed: saved with Next and nothing open. Attention: saved or visited with items open. */
  const sectionState = (sec: Section): 'complete' | 'attention' | 'todo' => {
    const its = readiness.filter((r) => r.step === sec);
    const saved = (req.completed ?? []).includes(sec);
    if (saved && its.every((i) => i.done)) return 'complete';
    return saved || req.visited.includes(sec) ? (its.every((i) => i.done) ? 'todo' : 'attention') : 'todo';
  };
  const acknowledged = ATTESTATIONS.every((a) => req.attest[a.key]) && req.disclosureViewed;

  const openItems = readiness.filter((r) => !r.done).length;
  return { s, req, update, acknowledged, setReq, changeEstimate, ev, readiness, openItems, sectionState, needsOwners, isEntity, pledgesTrust, owners, co, coIdExpired, log, role, user };
}

export type RequestModel = ReturnType<typeof useAfterRequest>;

/* ---------------- Borrowing-power calculator (Before: Manual Evaluation asset tabs) ---------------- */
export type OutsideCat = 'highlyLiquid' | 'fixedIncome' | 'equities' | 'otherAssets';
export const OUTSIDE_CATS: { key: OutsideCat; label: string }[] = [
  { key: 'highlyLiquid', label: 'Highly Liquid' },
  { key: 'fixedIncome', label: 'Fixed Income' },
  { key: 'equities', label: 'Equities' },
  { key: 'otherAssets', label: 'Other Assets' },
];
export const OUTSIDE_ROWS: { id: string; cat: OutsideCat; label: string; rate: number; issuer?: boolean }[] = [
  { id: 'hl1', cat: 'highlyLiquid', label: 'Cash, Bank Certificates of Deposit at PNC', rate: 1 },
  { id: 'hl2', cat: 'highlyLiquid', label: 'Money Market Funds and ETFs', rate: 0.8 },
  { id: 'hl3', cat: 'highlyLiquid', label: 'U.S. Treasury Bills Maturing in Less than 7 years', rate: 0.8 },
  { id: 'fi1', cat: 'fixedIncome', label: 'U.S. Treasury Notes and Bonds (7+ years)', rate: 0.8 },
  { id: 'fi2', cat: 'fixedIncome', label: 'Corporate Bonds', rate: 0.8, issuer: true },
  { id: 'eq1', cat: 'equities', label: 'U.S. Listed Equities', rate: 0.7, issuer: true },
  { id: 'eq2', cat: 'equities', label: 'International Listed Equities', rate: 0.7, issuer: true },
  { id: 'oa1', cat: 'otherAssets', label: 'Mutual Funds', rate: 0.6 },
  { id: 'oa2', cat: 'otherAssets', label: 'Other Assets', rate: 0.6 },
];
export const CONCENTRATION_CAP = 0.4;
export const PROVISIONAL_RATE = 0.35;
export interface OutsideRowEval { id: string; cat: OutsideCat; label: string; value: number; baseRate: number; rate: number; lendable: number; concentrated: boolean }
/**
 * Each row: value × advance rate. The single-issuer limit applies only to bond and equity rows the banker
 * marks as one issuer, measured — as in Manual Evaluation — against the selected market value
 * (selected accounts plus the held-away collateral entered here). Over 40% → provisional 35%.
 */
export function calcOutside(values: Record<string, number>, pledgedValue: number, issuer: Record<string, boolean> = {}) {
  const value = OUTSIDE_ROWS.reduce((t, r) => t + (values[r.id] || 0), 0);
  const selected = value + pledgedValue;
  const rows: OutsideRowEval[] = OUTSIDE_ROWS.map((r) => {
    const v = values[r.id] || 0;
    const concentrated = !!r.issuer && !!issuer[r.id] && selected > 0 && v / selected > CONCENTRATION_CAP;
    const rate = concentrated ? PROVISIONAL_RATE : r.rate;
    return { id: r.id, cat: r.cat, label: r.label, value: v, baseRate: r.rate, rate, lendable: v * rate, concentrated };
  });
  return { rows, value, lendable: rows.reduce((t, r) => t + r.lendable, 0), concentrated: rows.filter((r) => r.concentrated).length };
}
