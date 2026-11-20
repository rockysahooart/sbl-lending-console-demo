import { createContext, createElement, useCallback, useContext, useMemo, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import { usePersistentState } from '../../app/state/ConsoleStore';
import { personById, scenarioById, type ScenarioId } from '../data';
import { evaluate, isExpired, scenarioPledgeDefaults, type ManualReview, type ReadinessItem } from '../engine';

/*
 * AFTER request model. Security and compliance behaviours here are SIMULATED
 * for a portfolio demonstration (fictional data, browser-only state). They do
 * not provide production security, regulatory compliance or certification.
 */

export type Section = 'client' | 'collateral' | 'structure' | 'review';
export type YN = '' | 'Yes' | 'No';
export type Role = 'Relationship Banker' | 'Credit Officer';

export const USERS: Record<Role, string> = { 'Relationship Banker': 'S. Mitchell', 'Credit Officer': 'M. Okonkwo' };

export interface AuditEvent {
  at: string;
  user: string;
  role: Role;
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
}

export interface AfterRequest {
  section: Section;
  visited: Section[];
  appType: 'Individual' | 'Joint' | 'Entity';
  coBorrowerId: string;
  coIdUpdate: { number: string; expires: string; saved: boolean };
  jointPermission: boolean;
  ownersCertified: boolean;
  pep: YN;
  marital: string;
  q1: YN;
  q1Explain: string;
  q2: YN;
  q3: YN;
  pledged: Record<string, boolean>;
  reviews: Record<string, ManualReview>;
  reviewRequested: Record<string, string>;
  requested: number;
  purpose: string;
  useOfProceeds: '' | 'non-purpose' | 'purpose';
  purposeStatement: boolean;
  method: string;
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
  estimateLog: EstimateEvent[];
  /** Underwriting conditions returned to the banker after submission. */
  conditions?: Condition[];
  status: 'draft' | 'submitted' | 'approved';
  submittedAt?: string;
  approvedAt?: string;
}

export const ATTESTATIONS = [
  { key: 'consent', text: 'The client authorized this credit application.' },
  { key: 'accuracy', text: 'I reviewed the client, collateral and loan information for accuracy and completeness.' },
  { key: 'disclosures', text: 'The client received the required disclosures for this product.' },
  { key: 'electronic', text: 'The client consented to electronic records and signatures.' },
  { key: 'compliance', text: 'Identity verification, sanctions screening and beneficial ownership requirements were completed.' },
];

/** Fixed fictional “today” (11/19/2025) so stamps match the scenario data; time of day is live. */
export const nowStamp = () => `11/19/2025, ${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;

export function initialRequest(id: ScenarioId): AfterRequest {
  const s = scenarioById(id);
  return {
    section: 'client',
    visited: [],
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
    pledged: scenarioPledgeDefaults(s),
    reviews: {},
    reviewRequested: {},
    requested: s.requestedAmount,
    purpose: s.purpose,
    useOfProceeds: '',
    purposeStatement: false,
    method: 'Relationship Manager Initiated',
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
      setGlobal((g) => ({ ...g, audit: [{ at: nowStamp(), user: USERS[g.role], role: g.role, event, detail, requestId }, ...g.audit] })),
    [setGlobal],
  );
  return { role: global.role, user: USERS[global.role], audit: global.audit, log, setGlobal, global };
}

export function useAfterRequest(id: ScenarioId) {
  const [req, setReq] = usePersistentState<AfterRequest>(`after:req:${id}`, () => initialRequest(id));
  const s = scenarioById(id);
  const { log, user, role } = useAudit();

  const update = useCallback((patch: Partial<AfterRequest>) => setReq((prev) => ({ ...prev, ...patch })), [setReq]);

  const ev = useMemo(() => evaluate(s.accounts, req.pledged, req.reviews), [s, req.pledged, req.reviews]);

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
    add('pep', 'Answer the politically exposed person question', !!req.pep, 'client');
    add('questions', 'Answer the three risk questions', !!req.q1 && !!req.q2 && !!req.q3 && (req.q1 !== 'Yes' || req.q1Explain.trim().length > 0), 'client');
    if (req.appType === 'Joint') {
      add('co', 'Add a co-borrower', !!co, 'client');
      if (co) add('coid', `Update ${co.name}’s identification`, !coIdExpired, 'client');
      add('perm', 'Confirm the co-applicant’s permission to apply jointly', req.jointPermission, 'client');
    }
    if (needsOwners) add('owners', isEntity ? 'Certify beneficial ownership' : 'Certify trust ownership', req.ownersCertified && owners.length > 0, 'client');
    add('pledge', 'Pledge at least one eligible account', ev.rows.some((r) => r.pledged && r.lendable > 0), 'collateral');
    add('review', 'Complete the credit officer review of flagged collateral', ev.needsReview === 0, 'collateral');
    add('coverage', 'Keep the requested amount within estimated borrowing power', req.requested > 0 && ev.total >= req.requested, 'collateral');
    add('proceeds', 'Confirm non-purpose use of proceeds and the purpose statement', req.useOfProceeds === 'non-purpose' && req.purposeStatement, 'structure');
    add('wealth', 'Select the primary source of wealth', !!req.wealth1, 'structure');
    add('repay', 'Select the primary source of repayment', !!req.repay1, 'structure');
    add('sustain', 'Answer the sustainability review question', !!req.sustainability, 'structure');
    if (req.pricing === 'exception') add('pricing', 'Enter the requested spread and justification', !!req.spread && req.pricingWhy.trim().length > 0, 'structure');
    if (req.ach) add('ach', 'Select the ACH debit account', !!req.achAccount, 'structure');
    add('consent', 'Record how the client authorized the application', !!req.consentMethod, 'review');
    add('attest', 'Complete the attestations and review the acknowledgment', ATTESTATIONS.every((a) => req.attest[a.key]) && req.disclosureViewed, 'review');
    return items;
  }, [req, ev, co, coIdExpired, needsOwners, isEntity, owners.length]);

  const sectionState = (sec: Section): 'complete' | 'attention' | 'todo' => {
    const its = readiness.filter((r) => r.step === sec);
    if (its.every((i) => i.done)) return 'complete';
    return req.visited.includes(sec) ? 'attention' : 'todo';
  };

  const openItems = readiness.filter((r) => !r.done).length;
  return { s, req, update, setReq, changeEstimate, ev, readiness, openItems, sectionState, needsOwners, isEntity, pledgesTrust, owners, co, coIdExpired, log, role, user };
}

export type RequestModel = ReturnType<typeof useAfterRequest>;
