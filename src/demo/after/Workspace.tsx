import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import {
  Accordion,
  AccordionItem,
  Button,
  Checkbox,
  InlineNotification,
  Modal,
  ProgressIndicator,
  ProgressStep,
  RadioButton,
  RadioButtonGroup,
  Table,
  TableBody,
  TableCell,
  TableExpandedRow,
  TableExpandHeader,
  TableExpandRow,
  TableHead,
  TableHeader,
  TableRow,
  TextInput,
} from '@carbon/react';
import { ArrowDown, ArrowRight, CheckmarkFilled, CheckmarkOutline, ChevronDown, DocumentDownload, Search as SearchIcon, View, Warning } from '@carbon/icons-react';
import { useDemo } from '../DemoContext';
import { usePersistentState } from '../../app/state/ConsoleStore';
import { ASSET_CLASS_LABEL, PEOPLE, fmtMoney, fmtPct, personById, type Person, type ScenarioId } from '../data';
import { ROLE_LABEL, STEPS, USERS, nowStamp, useAfterRequest, useAudit, type Place, type RequestModel, type Section, type YN } from './state';
import { ANCHOR, guidance } from './guidance';
import { appState, gatesStep, itemsOf, type Item } from './lifecycle';
import { AcknowledgmentModal, EVAL_STATUS, landOn } from './Evaluation';
import { Check, KV, Money, SelectField, StatusTag, Tag, TextField, cx } from './ui';
import type { Route } from './AfterApp';

/*
 * Loan Request — the original four steps (Customer Information, Co-borrowers,
 * Loan Information, Collaterals) with their original sections, in their original
 * order, and the original footer (Back / Next, Submit on Collaterals). Carbon
 * modernizes the presentation; progress sits on the left and the application
 * status on the right.
 */

const PLACE_LABEL: Record<Place, string> = { evaluation: 'Evaluation', customer: '1. Customer Information', parties: '2. Co-borrowers', loan: '3. Loan Information', collateral: '4. Collaterals', acknowledgment: 'Acknowledgment' };
const PLACE_ORDER: Place[] = ['evaluation', 'customer', 'parties', 'loan', 'collateral', 'acknowledgment'];
const yn = [{ value: 'Yes', label: 'Yes' }, { value: 'No', label: 'No' }];

/** THEO-02: land on a section after a jump. landOn (Evaluation.tsx) scrolls only #after-main, never the demo frame, and marks the target so it shows where the user arrived. */
/** Screen-reader status of a step. Before a Submit attempt, open items are shown calmly (IRIS-05), so they are announced as "Incomplete", not "Invalid". */
const STEP_STATUS: { [id: string]: string } = { 'carbon.progress-step.complete': 'Complete', 'carbon.progress-step.incomplete': 'Incomplete', 'carbon.progress-step.current': 'Current', 'carbon.progress-step.invalid': 'Invalid' };
const stepStatusText = (id: string, attempted: boolean) => (id === 'carbon.progress-step.invalid' && !attempted ? 'Incomplete' : STEP_STATUS[id] ?? id);

function focusAnchor(id: string, delay = 60) {
  window.setTimeout(() => landOn(document.getElementById(id)), delay);
}

/** Where a fix link landed and what to show there (rendered inside the matching StepSection). */
const FixCtx = createContext<{ anchor?: string; node?: ReactNode }>({});
const LOCKED_STATUSES = ['submitted', 'approved', 'declined'];

export function Workspace({ route, onRoute }: { route: { page: 'request'; id: ScenarioId; section: Section; fix?: string } | { page: 'confirmation'; id: ScenarioId }; onRoute: (r: Route) => void }) {
  const m = useAfterRequest(route.id);
  const { s, req, update } = m;
  const section: Section = route.page === 'request' ? route.section : 'collateral';
  const { scenario, adoptScenario } = useDemo();
  const [ackOpen, setAckOpen] = useState(false);
  // A blocked Submit (step 4) switches open items from "incomplete" to "error" in the
  // progress, the blocker list and the status panel together: one severity per state.
  const [attempted, setAttempted] = useState(false);
  useEffect(() => { if (section !== 'collateral') setAttempted(false); }, [section]);
  // KENJI-03: below lg the step list folds into one "Step n of 4" line (expandable).
  const [stepsOpen, setStepsOpen] = useState(false);
  useEffect(() => { setStepsOpen(false); }, [section]);

  useEffect(() => {
    if (scenario !== route.id) adoptScenario(route.id);
  }, [route.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (route.page !== 'request') return;
    update({ section, visited: req.visited.includes(section) ? req.visited : [...req.visited, section] });
  }, [section]); // eslint-disable-line react-hooks/exhaustive-deps

  const pendingAnchor = useRef<string | null>(null);
  /** Go to where an item is resolved: a step (focus moves to the section), the Evaluation, or the acknowledgment. */
  const go = (place: Place, anchor?: string) => {
    if (place === 'acknowledgment') { setAckOpen(true); return; }
    if (place === 'evaluation') { onRoute({ page: 'evaluation', id: route.id }); if (anchor) focusAnchor(anchor, 150); return; }
    if (place === section) { if (anchor) focusAnchor(anchor); else document.getElementById('after-main')?.scrollTo({ top: 0 }); return; }
    pendingAnchor.current = anchor ?? null;
    onRoute({ page: 'request', id: route.id, section: place });
  };
  useEffect(() => {
    const a = pendingAnchor.current;
    if (a) { pendingAnchor.current = null; focusAnchor(a); }
  }, [section]);

  const fix = route.page === 'request' ? route.fix : undefined;
  const items = itemsOf(m);
  const fixItem = fix && fix !== 'submit' ? items.find((i) => i.id === fix) : undefined;
  // Remember what the fix link pointed at, so the callout can confirm it once resolved.
  const fixMemo = useRef<{ id?: string; item?: Item }>({});
  if (fix && fixItem) fixMemo.current = { id: fix, item: fixItem };
  if (fix && fixMemo.current.id !== fix && !fixItem) fixMemo.current = { id: fix };
  const fixAnchor = fix === 'submit' ? 'collaterals' : (fixItem ?? fixMemo.current.item)?.anchor;
  // Land on the exact field and mark it until the user moves on.
  useEffect(() => {
    if (!fixAnchor || route.page !== 'request') return;
    const t = window.setTimeout(() => {
      const el = document.getElementById(fix === 'submit' ? 'submit-request' : fixAnchor);
      if (!el) return;
      el.setAttribute('data-fix', fixItem?.kind === 'correction' ? 'correction' : 'task');
      landOn(document.getElementById(fixAnchor) ?? el);
    }, 80);
    return () => { window.clearTimeout(t); document.querySelectorAll('[data-fix]').forEach((n) => n.removeAttribute('data-fix')); };
  }, [fix, section]); // eslint-disable-line react-hooks/exhaustive-deps

  if (route.page === 'confirmation') return <Confirmation m={m} onRoute={onRoute} />;
  const locked = LOCKED_STATUSES.includes(req.status);
  const st = appState(m);
  const step = STEPS.find((x) => x.key === section)!;
  const idx = STEPS.indexOf(step);
  // Prerequisites: a step's own required items must be complete before moving on to the steps that depend on it.
  const gating = (k: Section) => items.filter((i) => i.place === k && gatesStep(i) && i.kind !== 'waiting');
  const stepOpen = gating(section);
  const canNext = locked || stepOpen.length === 0;
  const firstBlocked = STEPS.findIndex((x) => gating(x.key).length > 0);
  const reachable = (i: number) => locked || firstBlocked < 0 || i <= firstBlocked || i <= idx;
  const next = () => {
    if (!canNext) return;
    update({ completed: (req.completed ?? []).includes(section) ? req.completed : [...(req.completed ?? []), section] });
    onRoute({ page: 'request', id: route.id, section: STEPS[idx + 1].key });
  };
  const back = () => (idx === 0 ? onRoute({ page: 'evaluation', id: route.id }) : onRoute({ page: 'request', id: route.id, section: STEPS[idx - 1].key }));
  const goItem = (i: Item) => onRoute(i.route);

  const fixNode = fix && route.page === 'request' ? (
    <FixCallout fix={fix} item={fixItem} resolvedItem={!fixItem ? fixMemo.current.item : undefined} next={st.next} open={items.length} onGo={(r) => onRoute(r)} />
  ) : null;

  return (
    <FixCtx.Provider value={{ anchor: fixAnchor, node: fixNode }}>
    <div className="px-4 sm:px-8 pt-6">
      <header className="mb-6">
        <p className="t-label-01 text-[var(--cds-text-secondary)]">Loan Request · {s.entityName ?? s.primary.name} · {s.requestId}</p>
        <div className="flex flex-wrap items-center gap-3 mt-1">
          <h1 className="t-heading-05">{step.n}. {step.label}</h1>
          <StatusTag status={st.status} />
        </div>
        <p className="t-body-01 text-[var(--cds-text-secondary)] mt-1">{st.detail !== st.status && !st.why.startsWith(st.detail) ? `${st.detail}. ` : ''}{st.why}</p>
      </header>
      {locked && (
        <InlineNotification kind="info" lowContrast hideCloseButton className="!max-w-none mb-6" title={req.status === 'submitted' ? 'Submitted to underwriting' : req.status === 'approved' ? 'Approved' : 'Declined'} subtitle={`${req.status === 'submitted' ? `Submitted ${req.submittedAt}` : req.status === 'approved' ? `Approved ${req.approvedAt}` : `Declined ${req.declinedAt}`}. This request is read-only; the submitted information is shown below.`} />
      )}
      {req.status === 'returned' && <ReturnedBanner m={m} items={items} onGo={goItem} />}
      {(req.history ?? []).length > 0 && <SubmissionHistory m={m} />}
      <div className="grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[224px_minmax(0,1fr)_340px] gap-8 items-start">
        {/* KENJI-03: compact step line below lg — the full list is one tap away, and the status panel one jump away. */}
        <div className="step-compact lg:hidden">
          <button type="button" className="step-compact__toggle" aria-expanded={stepsOpen} aria-controls="loan-request-steps" onClick={() => setStepsOpen(!stepsOpen)}>
            <span className="t-heading-compact-01">Step {idx + 1} of {STEPS.length}</span>
            <ChevronDown size={16} aria-hidden="true" className={cx('transition-transform motion-reduce:transition-none', stepsOpen && 'rotate-180')} />
          </button>
          <a href="#application-status" className="step-compact__status cds--link" onClick={(e) => { e.preventDefault(); landOn(document.getElementById('application-status')); }}>
            Application status{items.length > 0 && <span className="tabular-nums"> · {items.length} open</span>}
            <ArrowDown size={16} aria-hidden="true" />
          </a>
        </div>
        <nav id="loan-request-steps" aria-label="Loan request steps" className={cx('lg:sticky lg:top-6 lg:block', stepsOpen ? 'block' : 'hidden', 'progress-calm')}>
          <ProgressIndicator vertical currentIndex={idx} onChange={(i: number) => { if (reachable(i)) go(STEPS[i].key); }} spaceEqually={false}>
            {STEPS.map((stp, i) => {
              const state = m.sectionState(stp.key);
              const open = items.filter((r) => r.place === stp.key).length;
              const current = i === idx;
              const can = reachable(i);
              return (
                <ProgressStep
                  key={stp.key}
                  label={stp.label}
                  secondaryLabel={current ? 'In progress' : !can ? `Complete ${STEPS[firstBlocked].label} first` : state === 'complete' ? 'Completed' : open ? `${open} open item${open > 1 ? 's' : ''}` : 'Not started'}
                  complete={!current && state === 'complete'}
                  invalid={!current && can && state === 'attention'}
                  disabled={!can}
                  translateWithId={(mid: string) => stepStatusText(mid, false)}
                />
              );
            })}
          </ProgressIndicator>
        </nav>
        <div className="min-w-0">
          <fieldset disabled={locked} className="min-w-0">
            <legend className="sr-only">{step.label}</legend>
            <div className="mx-auto w-record">
              {section === 'customer' && <CustomerStep m={m} onGo={go} />}
              {section === 'parties' && <PartiesStep m={m} />}
              {section === 'loan' && <LoanStep m={m} />}
              {section === 'collateral' && <CollateralStep m={m} onGo={go} items={items} onGoItem={goItem} onSubmitted={() => onRoute({ page: 'confirmation', id: route.id })} />}
            </div>
          </fieldset>
        </div>
        <StatusPanel m={m} onGo={go} />
      </div>
      {section !== 'collateral' && (
        <footer className="step-footer step-footer--wide">
          <Button kind="ghost" size="md" onClick={back}>{idx === 0 ? 'Back to Evaluation' : 'Back'}</Button>
          <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-1">
            <p id="next-help" className="t-helper-01 text-[var(--cds-text-secondary)] max-w-md text-right" aria-live="polite">
              {canNext ? 'Changes are saved automatically.' : (
                <>
                  To continue, complete {stepOpen.length} item{stepOpen.length > 1 ? 's' : ''} on this step:{' '}
                  {stepOpen.slice(0, 2).map((i, k) => (
                    <span key={i.id}>{k > 0 && '; '}<button type="button" className="cds--link t-helper-01" onClick={() => goItem(i)}>{i.label}</button></span>
                  ))}
                  {stepOpen.length > 2 && ` and ${stepOpen.length - 2} more`}. Your draft is saved.
                </>
              )}
            </p>
            <Button size="md" onClick={next} disabled={!canNext} aria-describedby="next-help">Next</Button>
          </div>
        </footer>
      )}
      <div id="step-footer-slot" />
      <AcknowledgmentModal m={m} open={ackOpen} onClose={() => setAckOpen(false)} onStart={() => setAckOpen(false)} startLabel="Save acknowledgment" />
    </div>
    </FixCtx.Provider>
  );
}

/** What a fix link is about, shown inside the section it points at. Confirms when resolved and offers the next item. */
function FixCallout({ fix, item, resolvedItem, next, open, onGo }: { fix: string; item?: Item; resolvedItem?: Item; next?: { label: string; route: Route; explain: string }; open: number; onGo: (r: Route) => void }) {
  if (fix === 'submit') {
    return open
      ? <InlineNotification kind="warning" lowContrast hideCloseButton className="!max-w-none mb-4" title={`${open} item${open > 1 ? 's' : ''} to complete before you can submit`} subtitle="They are listed below with links to each one." />
      : <InlineNotification kind="success" lowContrast hideCloseButton className="!max-w-none mb-4" title="Ready to submit" subtitle="Every readiness check is complete. Review the collaterals, then select Submit." />;
  }
  if (item) {
    return (
      <div className="fix-callout mb-4" role="status" data-kind={item.kind}>
        <InlineNotification kind={item.kind === 'correction' ? 'warning' : 'info'} lowContrast hideCloseButton className="!max-w-none" title={item.kind === 'correction' ? `Action required: ${item.problem ?? item.label}` : item.label} subtitle={item.explain} />
      </div>
    );
  }
  if (resolvedItem) {
    return (
      <div className="fix-callout mb-4 flex flex-wrap items-center gap-4" role="status">
        <InlineNotification kind="success" lowContrast hideCloseButton className="!max-w-none flex-1" title={`Done: ${resolvedItem.label}`} subtitle={open ? `${open} item${open > 1 ? 's' : ''} still open.` : 'Every readiness check is complete.'} />
        {next && <Button size="md" renderIcon={ArrowRight} onClick={() => onGo(next.route)}>{`Next: ${next.label}`}</Button>}
      </div>
    );
  }
  return null;
}

/** Returned for correction: why, what to change (editable), and what was submitted before (read-only). */
function ReturnedBanner({ m, items, onGo }: { m: RequestModel; items: Item[]; onGo: (i: Item) => void }) {
  const { req } = m;
  const corrections = req.corrections ?? [];
  const snap = req.snapshot;
  return (
    <section aria-labelledby="returned-h" className="returned-banner mb-6">
      <InlineNotification kind="warning" lowContrast hideCloseButton className="!max-w-none" title="Returned for correction" subtitle={`Credit Underwriting returned this request ${req.returnedAt}. Correct the items below, then resubmit from Collaterals. Everything else you submitted is kept.`} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        <div>
          <h2 id="returned-h" className="t-heading-compact-01">To correct (editable)</h2>
          <ul className="mt-2 space-y-2">
            {corrections.map((c) => {
              const open = items.find((i) => i.id === `ret-${c.id}`);
              return (
                <li key={c.id} className="t-body-01 flex items-start gap-2">
                  <span className="flex-1"><span className="font-semibold">{c.short}.</span> {c.text}</span>
                  {open ? <Button kind="tertiary" size="sm" onClick={() => onGo(open)}>Correct</Button> : <Tag tone="success">Corrected</Tag>}
                </li>
              );
            })}
          </ul>
        </div>
        {snap && (
          <div>
            <h2 className="t-heading-compact-01">Previously submitted ({snap.at.split(',')[0]}, read-only)</h2>
            <dl className="mt-2 grid grid-cols-2 gap-x-6 gap-y-2">
              <KV label="Requested Loan Amount" value={fmtMoney(snap.requested)} mono />
              <KV label="Total Maximum Borrowing Power" value={fmtMoney(snap.power)} mono />
              <KV label="Primary Source of Repayment" value={snap.repay1 || '—'} />
              <KV label="Primary Source of Wealth" value={snap.wealth1 || '—'} />
              <KV label="Collaterals selected" value={String(snap.pledged)} />
              <KV label="Booking Cost Center" value={snap.costCenter} />
            </dl>
          </div>
        )}
      </div>
    </section>
  );
}

/** Every submission, return, condition and decision, oldest first. Kept across resubmission. */
function SubmissionHistory({ m }: { m: RequestModel }) {
  const h = m.req.history ?? [];
  return (
    <Accordion className="mb-6">
      <AccordionItem title={`Submission history (${h.length})`}>
        <ol className="space-y-2">
          {h.map((e, i) => (
            <li key={i} className="grid grid-cols-[150px_1fr] gap-4 t-body-01">
              <span className="tabular-nums text-[var(--cds-text-secondary)]">{e.at}</span>
              <span><span className="font-semibold">{e.event}</span> · {e.by}{e.detail && <span className="block t-helper-01 text-[var(--cds-text-secondary)]">{e.detail}</span>}</span>
            </li>
          ))}
        </ol>
      </AccordionItem>
    </Accordion>
  );
}

/* ------------------------------- Shared pieces ------------------------------- */

/** A titled section of a step; the id is where "go to" links land. */
function StepSection({ id, title, right, children, description }: { id: string; title: string; right?: ReactNode; children: ReactNode; description?: ReactNode }) {
  const fx = useContext(FixCtx);
  const showFix = !!fx.node && (fx.anchor === id || (id === 'co-search' && fx.anchor === 'co-details'));
  return (
    <section aria-labelledby={`${id}-h`} className="step-section">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h2 id={`${id}-h`} className="t-heading-03">{title}</h2>
          {description && <p className="t-body-01 text-[var(--cds-text-secondary)] mt-1 max-w-3xl">{description}</p>}
        </div>
        {right}
      </div>
      {showFix && fx.node}
      <div id={id} tabIndex={-1} className="focus:outline-none">{children}</div>
    </section>
  );
}

/** A yes/no question laid out as in the original: question on the left, answers on the right. */
function QuestionRow({ name, question, value, onChange, options = yn }: { name: string; question: string; value: string; onChange: (v: string) => void; options?: { value: string; label: string }[] }) {
  return (
    <div className="question-row">
      <p className="t-body-01" aria-hidden="true">{question}</p>
      <RadioButtonGroup name={name} legendText={<span className="sr-only">{question}</span>} valueSelected={value || undefined} onChange={(v: string | number | undefined) => onChange(String(v))}>
        {options.map((o) => <RadioButton key={o.value} id={`${name}-${o.value}`} labelText={o.label} value={o.value} />)}
      </RadioButtonGroup>
    </div>
  );
}

/** Masked identifier with an audited, reason-required reveal (simulated least-privilege pattern). */
function MaskedId({ person, requestId }: { person: Person; requestId: string }) {
  const { role, log } = useAudit();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [err, setErr] = useState('');
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    if (!revealed) return;
    const t = setTimeout(() => setRevealed(false), 30000);
    return () => clearTimeout(t);
  }, [revealed]);
  const allowed = role === 'Relationship Banker';
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <span className="t-code">{revealed && person.ssnFull ? person.ssnFull : person.ssn}</span>
      {revealed ? (
        <Button kind="ghost" size="sm" onClick={() => setRevealed(false)}>Hide</Button>
      ) : (
        <Button kind="ghost" size="sm" renderIcon={View} onClick={() => { setOpen(true); setErr(''); }}>View</Button>
      )}
      <Modal
        open={open}
        size="xs"
        modalHeading={allowed ? 'View full Social Security number' : 'Full identifier not available'}
        primaryButtonText={allowed ? 'View number' : 'Close'}
        secondaryButtonText={allowed ? 'Cancel' : undefined}
        onRequestClose={() => setOpen(false)}
        onRequestSubmit={() => {
          if (!allowed) { setOpen(false); return; }
          if (!reason) { setErr('Select a reason to continue.'); return; }
          log('Sensitive data viewed', `Full SSN of ${person.name} viewed. Reason: ${reason}`, requestId);
          setRevealed(true);
          setOpen(false);
          setReason('');
        }}
      >
        {allowed ? (
          <div className="space-y-4">
            <p className="t-body-01">This action is recorded in the audit trail. The number is hidden again after 30 seconds.</p>
            <SelectField label="Reason for access" options={['Identity verification', 'Client request', 'Compliance review']} value={reason} onChange={(v) => { setReason(v); setErr(''); }} invalidText={err || undefined} />
          </div>
        ) : (
          <p className="t-body-01">Your role ({role}) can view masked identifiers only. Contact the loan officer if the full number is required.</p>
        )}
      </Modal>
    </span>
  );
}

/** ADA-08: one verification date (the client record's) for every party; an expired ID is never shown as "verified". */
/** Before's ID-card profile, modernised: credential band, portrait block, identifiers, ID footer. */
/** Renders a step's footer in the full-width slot below the workspace, so Next/Submit sit at the far right. */
function FooterSlot({ children }: { children: ReactNode }) {
  const [el, setEl] = useState<HTMLElement | null>(null);
  useEffect(() => { setEl(document.getElementById('step-footer-slot')); }, []);
  return el ? createPortal(children, el) : null;
}

function IdCard({ role, person, sub, requestId, idNumber, expires, expired, verification }: { role: string; person: Person; sub?: string; requestId: string; idNumber: string; expires: string; expired: boolean; verification?: ReactNode }) {
  const initials = person.name.split(' ').map((x) => x[0]).join('').slice(0, 2);
  return (
    <section className={`id-card${expired ? ' is-expired' : ''}`} aria-label={`${role} identification card: ${person.name}`}>
      <div className="id-card__band"><span>{role}</span><span>Client record · 11/18/2025</span></div>
      <div className="id-card__body">
        <span className="id-card__photo" aria-hidden="true">{initials}</span>
        <div className="id-card__main">
          <p className="t-heading-03">{person.name}</p>
          {sub && <p className="t-helper-01 text-[var(--cds-text-secondary)]">{sub}</p>}
          {/* Entity-level statuses belong to the person they describe: a verification cluster under the name. */}
          {verification && <div className="id-card__verify" role="group" aria-label={`Verification for ${person.name}`}>{verification}</div>}
          {/* Same field positions as the original card: DOB | MDM ID, SSN | Power ID, then Phone and Email full width. */}
          <dl className="id-card__ids grid grid-cols-2 gap-x-6 gap-y-3">
            <KV label="DOB" value={person.dob} mono />
            <KV label="MDM ID" value={person.mdmId} mono />
            <KV label="SSN" value={<MaskedId person={person} requestId={requestId} />} />
            <KV label="Power ID" value={person.powerId} mono />
            <KV label="Phone" value={person.phone} />
            <KV label="Email" value={<>{person.email.split('@')[0]}<wbr />@{person.email.split('@').slice(1).join('@')}</>} />
          </dl>
        </div>
      </div>
    </section>
  );
}

function Screening({ date = '11/18/2025', idExpired = false }: { date?: string; idExpired?: boolean }) {
  return (
    <span className="inline-flex flex-wrap gap-2">
      {/* The expiry itself is stated once, on the ID field and its notification; here the record is neutral. */}
      {idExpired ? <Tag tone="neutral">Identity on file {date}</Tag> : <Tag tone="success">Identity verified {date}</Tag>}
      <Tag tone="success">Sanctions screening: no match {date}</Tag>
    </span>
  );
}

/* --------------------------- 1. Customer Information --------------------------- */
function CustomerStep({ m, onGo }: { m: RequestModel; onGo: (p: Place, a?: string) => void }) {
  const { s, req, update, ev, log } = m;
  const p = s.primary;
  const [reported, setReported] = useState(false);
  const over = req.requested - ev.total;
  return (
    <>
      <StepSection id="requested-amount" title="Confirm Requested Loan Amount">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <TextField
            id="requested-loan-amount"
            label="Requested Loan Amount (USD)"
            inputMode="numeric"
            value={req.requested ? req.requested.toLocaleString('en-US') : ''}
            onChange={(v) => update({ requested: Number(v.replace(/[^0-9]/g, '')) || 0 })}
            invalidText={over > 0 ? `Exceeds the total maximum borrowing power by ${fmtMoney(over)}. Reduce the amount or select more collateral in Evaluation.` : undefined}
            helper={over > 0 ? undefined : `Within the total maximum borrowing power (${fmtMoney(-over)} available).`}
          />
          <div>
            <p className="t-label-01 text-[var(--cds-text-secondary)]">Total Maximum Borrowing Power</p>
            <p className="t-heading-05 tabular-nums mt-1"><Money value={ev.total} /></p>
            <p className="t-helper-01 text-[var(--cds-text-secondary)] mt-1">
              Carried over from Total Evaluation.{' '}
              <button type="button" className="t-helper-01 text-[var(--cds-link-primary)] hover:underline" onClick={() => onGo('evaluation', 'total-evaluation')}>View Evaluation</button>
            </p>
          </div>
        </div>
      </StepSection>

      <StepSection id="customer-info" title="Customer Information" description="From the client record of 11/18/2025. Read-only; request a correction if anything is out of date.">
        <IdCard
          role={s.entityName ? 'Authorized Signer' : 'Primary Borrower'}
          person={p}
          sub={s.entityName}
          requestId={s.requestId}
          idNumber={p.idNumber}
          expires={p.idExpires}
          expired={false}
          verification={<Screening />}
        />
        {/* Spatial familiarity: the original's three rows (address · identity · employment) keep their order and
            grouping, so each row starts where bankers expect it; only the column count adapts to the narrower record. */}
        <dl className="familiar-grid mt-6" aria-label="Address">
          <KV label="Address Line 1" value={p.address1} />
          <KV label="Address Line 2" value={p.address2 || '—'} />
          <KV label="City" value={p.city} />
          <KV label="State" value={p.state} />
          <KV label="ZIP Code" value={p.zip} mono />
          <KV label="Customer Since" value={p.customerSince} mono />
        </dl>
        <dl className="familiar-grid mt-5" aria-label="Identity">
          <KV label="Proof of Identity" value={p.idType} />
          <KV label="ID Number" value={p.idNumber} mono />
          <KV label="Place of Issuance" value={p.idPlace} />
          <KV label="Date Issued" value={p.idIssued} mono />
          <KV label="Date of Expiration" value={<span className="inline-flex flex-wrap items-center gap-2"><span className="tabular-nums">{p.idExpires}</span><Tag tone="success">Valid</Tag></span>} />
        </dl>
        <dl className="familiar-grid mt-5" aria-label="Employment">
          <KV label="Employment Status" value={p.employmentStatus} />
          <KV label="Employment Title" value={p.employmentTitle} />
          <KV label="Citizenship Status" value={p.citizenship} />
        </dl>
        <div className="mt-6">
          {reported ? (
            <InlineNotification kind="success" lowContrast hideCloseButton title="Correction request sent" subtitle="Client Data Maintenance will review the record. The current record remains in use." />
          ) : (
            <Button kind="ghost" size="sm" className="!px-0" onClick={() => { setReported(true); log('Record correction requested', `Correction requested for ${p.name}`, s.requestId); }}>Request a record correction</Button>
          )}
        </div>
      </StepSection>

      <StepSection id="additional-info" title="Additional Information" description="No answers are preselected.">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6 w-field-pair">
          <SelectField label="Is the person politically exposed?" options={['Yes', 'No']} value={req.pep} onChange={(v) => update({ pep: v as YN })} />
          <SelectField label="Marital Status" options={['Married', 'Unmarried', 'Separated']} value={req.marital} onChange={(v) => update({ marital: v })} helper="From the client record. Change only if out of date." />
        </div>
        <QuestionRow name="q1" question="Is the client engaged in the sale (wholesale or retail), manufacture or distribution of weapons, ammunition, components, or special nuclear weapons as contracted by the US Government?" value={req.q1} onChange={(v) => update({ q1: v as YN })} />
        {req.q1 === 'Yes' && <div className="py-4 max-w-xl"><TextField label="Describe the activity and the contracting agency" value={req.q1Explain} onChange={(v) => update({ q1Explain: v })} /></div>}
        <QuestionRow name="q2" question="Should PNC expect repayment from anyone other than the borrower(s)?" value={req.q2} onChange={(v) => update({ q2: v as YN })} />
        <QuestionRow name="q3" question="Is the source of repayment inconsistent with the customer’s profile or industry?" value={req.q3} onChange={(v) => update({ q3: v as YN })} />
      </StepSection>
    </>
  );
}

/* ------------------------------- 2. Co-borrowers ------------------------------- */
function PartiesStep({ m }: { m: RequestModel }) {
  const { s, req, update, co, coIdExpired, needsOwners, isEntity, owners, pledgesTrust, log } = m;
  const p = s.primary;
  const joint = req.appType === 'Joint';
  return (
    <>
      <StepSection id="app-type" title="Confirm Application Type">
        {isEntity ? (
          <p className="t-body-01 pb-4">Borrower: <b className="font-semibold">{s.entityName}</b>. Authorized signer: {p.name}. Entity applications have no co-borrower.</p>
        ) : (
          <QuestionRow name="joint" question="Is this a joint application?" value={joint ? 'Yes' : 'No'} onChange={(v) => update({ appType: v === 'Yes' ? 'Joint' : 'Individual' })} />
        )}
        {joint && (
          <QuestionRow name="perm" question="Have the co-applicant(s) given you permission to apply jointly on their behalf?" value={req.permAns ?? (req.jointPermission ? 'Yes' : '')} onChange={(v) => update({ jointPermission: v === 'Yes', permAns: v as YN })} />
        )}
        <QuestionRow
          name="consent"
          question="How did the customer authorize this application?"
          value={req.consentMethod}
          onChange={(v) => { update({ consentMethod: v }); log('Client authorization recorded', v, s.requestId); }}
          options={[{ value: 'In person', label: 'In person' }, { value: 'Online', label: 'Online' }, { value: 'Via phone', label: 'Via phone' }]}
        />
      </StepSection>

      {!isEntity && (
        <StepSection id="co-search" title="Search for Co-Borrower Details">
          {!joint ? (
            <p className="t-body-01 text-[var(--cds-text-secondary)]">Not needed for an individual application. Answer Yes to “Is this a joint application?” to add a co-borrower.</p>
          ) : co ? (
            <CoBorrowerDetails m={m} />
          ) : (
            <CoBorrowerSearch m={m} />
          )}
        </StepSection>
      )}

      {!isEntity && (
        <StepSection id="co-additional" title="Additional Information" description={co ? `For the co-borrower, ${co.name}.` : undefined}>
          {co ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-field-pair">
              <SelectField label="Is the person politically exposed?" options={['Yes', 'No']} value={req.coPep} onChange={(v) => update({ coPep: v as YN })} />
              <SelectField label="Marital Status" options={['Married', 'Unmarried', 'Separated']} value={req.coMarital} onChange={(v) => update({ coMarital: v })} optional />
            </div>
          ) : (
            <p className="t-body-01 text-[var(--cds-text-secondary)]">Completed for each co-borrower after they are added.</p>
          )}
        </StepSection>
      )}

      {needsOwners && (
        <StepSection
          id="owners"
          title={isEntity ? 'Beneficial Ownership' : 'Trust Ownership'}
          description={isEntity ? `Individuals owning 25% or more of ${s.entityName}, and the individual with significant control, from the entity record.` : 'Required because a trust account is pledged as collateral. Trustees from the trust record.'}
        >
          <Table size="md" aria-label="Owners">
            <TableHead><TableRow><TableHeader>Name</TableHeader><TableHeader>Role</TableHeader><TableHeader className="num">{isEntity ? 'Ownership' : 'Share'}</TableHeader><TableHeader>Verification</TableHeader></TableRow></TableHead>
            <TableBody>
              {owners.map((o) => {
                const per = personById(o.personId);
                return (
                  <TableRow key={o.personId}>
                    <TableCell>{per.name}</TableCell>
                    <TableCell>{per.id === p.id ? (isEntity ? 'Managing member (control person)' : 'Trustee') : isEntity ? 'Member' : 'Co-trustee'}</TableCell>
                    <TableCell className="num">{o.pct}%</TableCell>
                    <TableCell><Screening idExpired={!!co && per.id === co.id && coIdExpired} /></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <div className="mt-6">
            <Check id="owners-certified" checked={req.ownersCertified} onChange={(b) => { update({ ownersCertified: b }); if (b) log('Ownership certified', isEntity ? 'Beneficial ownership certified' : 'Trust ownership certified', s.requestId); }} label={isEntity ? 'I certify that the beneficial ownership information was obtained from the client and is accurate.' : `I certify the trust ownership information${pledgesTrust ? ' for the pledged trust account' : ''} with the client.`} />
          </div>
        </StepSection>
      )}
    </>
  );
}

function CoBorrowerSearch({ m }: { m: RequestModel }) {
  const { s, update, log } = m;
  const [by, setBy] = useState<'mdm' | 'power' | 'ssn'>('mdm');
  const [q, setQ] = useState('');
  const [searched, setSearched] = useState<string | null>(null);
  const household = s.coBorrowerId ? personById(s.coBorrowerId) : undefined;
  const digits = (t: string) => t.replace(/[^0-9]/g, '');
  const results = searched == null ? [] : PEOPLE.filter((p) => p.id !== s.primary.id && (by === 'mdm' ? digits(p.mdmId) === digits(searched) : by === 'power' ? digits(p.powerId) === digits(searched) : !!digits(searched) && digits(p.ssnFull ?? p.ssn).endsWith(digits(searched))));
  const add = (id: string) => { update({ coBorrowerId: id }); log('Co-borrower added', `${personById(id).name} added; identity and sanctions screening completed`, s.requestId); };
  const label = by === 'mdm' ? 'MDM ID' : by === 'power' ? 'Power ID' : 'SSN/Tax ID';
  return (
    <div className="space-y-6">
      {household && (
        <InlineNotification kind="info" lowContrast hideCloseButton className="!max-w-none" title="Household member found" subtitle={`${household.name} is a joint owner of account ${s.accounts.find((a) => a.relationship === 'Joint')?.number ?? ''} (MDM ID ${household.mdmId}).`}>
        </InlineNotification>
      )}
      {household && <Button kind="tertiary" size="md" onClick={() => add(household.id)}>Add {household.name} as co-borrower</Button>}
      <form className="flex flex-wrap items-end gap-4" onSubmit={(e) => { e.preventDefault(); setSearched(q); }}>
        <RadioButtonGroup legendText="Search by" name="co-by" valueSelected={by} onChange={(v: string | number | undefined) => { setBy(v as typeof by); setSearched(null); }}>
          <RadioButton id="co-by-mdm" labelText="MDM ID" value="mdm" />
          <RadioButton id="co-by-power" labelText="Power ID" value="power" />
          <RadioButton id="co-by-ssn" labelText="SSN/Tax ID" value="ssn" />
        </RadioButtonGroup>
        <div className="w-[min(20rem,100%)]">
          <TextInput id="co-q" labelText={label} placeholder={`Enter ${label}`} value={q} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQ(e.target.value)} helperText={by === 'ssn' ? 'Last four digits or the full number.' : undefined} />
        </div>
        <Button type="submit" size="md" renderIcon={SearchIcon}>Search</Button>
      </form>
      {searched != null && (
        <div aria-live="polite">
          {results.length === 0 ? (
            <p className="t-body-01">No customer matches {label} “{searched}”. Check the number and search again.</p>
          ) : (
            <ul className="border border-[var(--cds-border-subtle-01)] max-w-2xl">
              {results.map((p) => (
                <li key={p.id} className="px-4 py-2 flex items-center justify-between gap-4 border-b border-[var(--cds-border-subtle-01)] last:border-0">
                  <span className="t-body-01">{p.name} <span className="t-helper-01 text-[var(--cds-text-secondary)]">MDM ID {p.mdmId} · Power ID {p.powerId}</span></span>
                  <Button kind="ghost" size="sm" onClick={() => add(p.id)} aria-label={`Add ${p.name} as co-borrower`}>Add</Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function CoBorrowerDetails({ m }: { m: RequestModel }) {
  const { s, req, update, co, coIdExpired, log } = m;
  const [err, setErr] = useState('');
  const [confirmRemove, setConfirmRemove] = useState(false);
  const { track } = useDemo();
  if (!co) return null;
  const saveId = () => {
    const okDate = /^\d{2}\/\d{2}\/\d{4}$/.test(req.coIdUpdate.expires);
    const [mm, dd, yy] = req.coIdUpdate.expires.split('/').map(Number);
    const future = okDate && new Date(yy, mm - 1, dd) > new Date(2025, 10, 19);
    if (!req.coIdUpdate.number.trim()) { setErr('number'); track('error', 'after'); return; }
    if (!future) { setErr('date'); track('error', 'after'); return; }
    setErr('');
    update({ coIdUpdate: { ...req.coIdUpdate, saved: true } });
    log('Identification updated', `${co.name}: ID ${req.coIdUpdate.number}, valid until ${req.coIdUpdate.expires}`, s.requestId);
  };
  return (
    <div id="co-details" tabIndex={-1} className="space-y-6 focus:outline-none">
      <IdCard
        role="Co-Borrower"
        person={co}
        requestId={s.requestId}
        idNumber={req.coIdUpdate.saved ? req.coIdUpdate.number : co.idNumber}
        expires={req.coIdUpdate.saved ? req.coIdUpdate.expires : co.idExpires}
        expired={coIdExpired}
        verification={<Screening idExpired={coIdExpired} />}
      />
      {/* The ID facts, the expiry problem and its fix stay at the card's width, so they read as part of this person's record. */}
      <div className="id-card-width space-y-6">
      <dl className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-5">
        <KV label="Proof of Identity" value={co.idType} />
        <KV label="ID Number" value={req.coIdUpdate.saved ? req.coIdUpdate.number : co.idNumber} mono />
        <KV label="Place of Issuance" value={co.idPlace} />
        <KV label="Date of Expiration" value={<span className="inline-flex flex-wrap items-center gap-2"><span className="tabular-nums">{req.coIdUpdate.saved ? req.coIdUpdate.expires : co.idExpires}</span><Tag tone={coIdExpired ? 'error' : 'success'}>{coIdExpired ? 'Expired' : 'Valid'}</Tag></span>} />
      </dl>
      {coIdExpired && (
        <div>
          <InlineNotification kind="error" lowContrast hideCloseButton className="!max-w-none" title="Identification expired" subtitle="Record a current, unexpired government-issued ID before you submit this request." />
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4 items-end mt-4">
            <TextField label="ID number" value={req.coIdUpdate.number} onChange={(v) => update({ coIdUpdate: { ...req.coIdUpdate, number: v } })} invalidText={err === 'number' ? 'Enter the ID number.' : undefined} />
            <TextField label="Expiration date" placeholder="MM/DD/YYYY" helper="Format: MM/DD/YYYY" value={req.coIdUpdate.expires} onChange={(v) => update({ coIdUpdate: { ...req.coIdUpdate, expires: v } })} invalidText={err === 'date' ? 'Enter a future date in MM/DD/YYYY format.' : undefined} />
            <Button size="md" onClick={saveId}>Save identification</Button>
          </div>
        </div>
      )}
      </div>
      <Button kind="danger--tertiary" size="sm" onClick={() => setConfirmRemove(true)}>Remove co-borrower</Button>
      <Modal
        open={confirmRemove}
        danger
        size="xs"
        modalHeading={`Remove ${co.name} as co-borrower?`}
        primaryButtonText="Remove"
        secondaryButtonText="Cancel"
        onRequestClose={() => setConfirmRemove(false)}
        onRequestSubmit={() => { log('Co-borrower removed', `${co.name} removed`, s.requestId); update({ coBorrowerId: '', coIdUpdate: { number: '', expires: '', saved: false }, jointPermission: false, permAns: '', coPep: '', coMarital: '' }); setConfirmRemove(false); }}
      >
        <p className="t-body-01">The co-borrower’s identification update, permission answer and additional information will be cleared.</p>
      </Modal>
    </div>
  );
}

/* ------------------------------- 3. Loan Information ------------------------------- */
function LoanStep({ m }: { m: RequestModel }) {
  const { s, req, update, ev } = m;
  const over = req.requested - ev.total;
  const deposits = s.accounts.filter((a) => a.holdings.some((h) => h.assetClass === 'cash' || h.assetClass === 'liquid')).map((a) => a.number);
  return (
    <>
      <StepSection id="loan-details" title="Loan Details">
        <div className="field-grid grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-6">
          <SelectField label="Method of Application" options={['In Branch', 'Digital Assisted', 'Relationship Manager Initiated']} value={req.method} onChange={(v) => update({ method: v })} helper="From the opportunity." />
          <SelectField label="Primary Source of Wealth" options={['Business Income', 'Investments', 'Real Estate', 'Inheritance']} value={req.wealth1} onChange={(v) => update({ wealth1: v })} />
          <SelectField label="Secondary Source of Wealth" optional options={['Investments', 'Spouse Income', 'Other']} value={req.wealth2} onChange={(v) => update({ wealth2: v })} />
          <SelectField label="Primary Source of Repayment" options={['Business Cash Flow', 'Personal Income', 'Investment Income']} value={req.repay1} onChange={(v) => update({ repay1: v })} />
          <SelectField label="Secondary Source of Repayment" optional options={['Guarantor', 'Asset Liquidation']} value={req.repay2} onChange={(v) => update({ repay2: v })} />
          <SelectField label="Is the Relationship Manager for this request correct?" optional options={['Yes', 'No']} value={req.rmCorrect ?? ''} onChange={(v) => update({ rmCorrect: v as YN })} helper={`Relationship Manager: ${s.createdBy}`} />
          <TextField
            id="loan-amount"
            label="Loan Amount (USD)"
            inputMode="numeric"
            value={req.requested ? req.requested.toLocaleString('en-US') : ''}
            onChange={(v) => update({ requested: Number(v.replace(/[^0-9]/g, '')) || 0 })}
            invalidText={over > 0 ? `Exceeds the total maximum borrowing power by ${fmtMoney(over)}.` : undefined}
            helper={over > 0 ? undefined : 'Same as the requested loan amount in Customer Information.'}
          />
          <SelectField label="Pricing Exception Requested?" options={['Yes', 'No']} value={req.pricing === 'exception' ? 'Yes' : 'No'} placeholder="" onChange={(v) => update({ pricing: v === 'Yes' ? 'exception' : 'standard' })} helper={req.pricing === 'exception' ? 'Pricing reviews exceptions separately.' : 'Standard pricing: SOFR daily plus product spread.'} />
          <TextField label="Spread over COF (%)" inputMode="decimal" value={req.spread} onChange={(v) => update({ spread: v.replace(/[^0-9.]/g, '') })} disabled={req.pricing !== 'exception'} helper={req.pricing === 'exception' ? undefined : 'Applies to a pricing exception.'} />
        </div>
        {req.pricing === 'exception' && (
          <div className="mt-6 max-w-xl">
            <TextField label="Pricing exception justification" value={req.pricingWhy} onChange={(v) => update({ pricingWhy: v })} helper="Reviewed by Pricing. Approval is not guaranteed." />
          </div>
        )}
      </StepSection>

      <StepSection id="use-of-proceeds" title="Use of Proceeds" description="Regulation U: credit secured by margin stock.">
        <RadioButtonGroup
          legendText="How will the loan proceeds be used?"
          name="proceeds"
          orientation="vertical"
          valueSelected={req.useOfProceeds || undefined}
          onChange={(v: string | number | undefined) => update({ useOfProceeds: v as 'non-purpose' | 'purpose', purposeStatement: v === 'purpose' ? false : req.purposeStatement })}
        >
          <RadioButton id="proceeds-non" labelText="Non-purpose: proceeds will not buy or carry margin stock" value="non-purpose" />
          <RadioButton id="proceeds-purpose" labelText="Purpose: proceeds will buy or carry margin stock" value="purpose" />
        </RadioButtonGroup>
        {req.useOfProceeds === 'purpose' && (
          <InlineNotification kind="error" lowContrast hideCloseButton className="!max-w-none mt-4" title="Not available for this product" subtitle="This line of credit supports non-purpose lending only. Confirm the use of proceeds with the client or contact Credit Administration." />
        )}
        {req.useOfProceeds === 'non-purpose' && (
          <div className="mt-4"><Check id="purpose-statement" checked={req.purposeStatement} onChange={(b) => update({ purposeStatement: b })} label="The client completed and signed the purpose statement (Form FR U-1)." /></div>
        )}
      </StepSection>

      <StepSection id="product" title="Product Details" description="Set by the product. Read-only.">
        <dl className="familiar-grid" aria-label="Product">
          <KV label="Product Category" value="Line of Credit" />
          <KV label="Product Type" value="QLP 2" />
          <KV label="Personal Loan Purpose" value="Personal Only" />
          <KV label="Primary Loan Purpose" value={req.purpose} />
          <KV label="Loan Secured By" value="Marketable securities" />
          <KV label="RM Officer" value={s.createdBy} />
        </dl>
        <dl className="familiar-grid mt-5" aria-label="Rate and disclosures">
          <KV label="Interest Rate Type" value="Variable" />
          <KV label="Rate Index" value="SOFR - Daily" />
          <KV label="Payment Structure" value="Interest Only" />
          <KV label="Credit Action" value="New" />
          <KV label="Disclosure Notification Sent" value={s.opportunityDate} mono />
          <KV label="Data Disclosure Sent" value={s.opportunityDate} mono />
        </dl>
      </StepSection>

      <StepSection id="booking" title="Booking">
        <div className="field-grid grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <SelectField label="Booking Cost Center" options={['Commercial Lending', 'Small Business Banking', 'Private Banking']} value={req.costCenter} onChange={(v) => update({ costCenter: v })} helper="From your banker profile." />
          <TextField label="RM Memo" optional value={req.memo} onChange={(v) => update({ memo: v })} />
          <SelectField label="Should this be reviewed for Sustainability Requirements?" options={['Yes', 'No']} value={req.sustainability} onChange={(v) => update({ sustainability: v as YN })} />
        </div>
      </StepSection>

      <StepSection id="ach" title="ACH Auto Pay Option">
        <div className="field-grid grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-end">
          <RadioButtonGroup legendText="Pay automatically by ACH?" name="ach" valueSelected={req.ach ? 'Yes' : 'No'} onChange={(v: string | number | undefined) => update({ ach: v === 'Yes' })}>
            <RadioButton id="ach-yes" labelText="Yes" value="Yes" />
            <RadioButton id="ach-no" labelText="No" value="No" />
          </RadioButtonGroup>
          {req.ach && <div><SelectField label="Debit Account" options={[...deposits, 'Other account on file']} value={req.achAccount} onChange={(v) => update({ achAccount: v })} /></div>}
        </div>
      </StepSection>
    </>
  );
}

/* --------------------------------- 4. Collaterals --------------------------------- */
function CollateralStep({ m, onGo, items, onGoItem, onSubmitted }: { m: RequestModel; onGo: (p: Place, a?: string) => void; items: Item[]; onGoItem: (i: Item) => void; onSubmitted: () => void }) {
  const { s, req, ev, changeEstimate, readiness, setReq, role, log } = m;
  const { track, recordGaps } = useDemo();
  const { setGlobal } = useAudit();
  const switchToLoanOfficer = () => {
    setGlobal((g) => ({ ...g, role: 'Relationship Banker', audit: [{ at: nowStamp(), user: USERS['Relationship Banker'], role: ROLE_LABEL['Relationship Banker'], event: 'Role changed', detail: `Signed in as ${ROLE_LABEL['Relationship Banker']}` }, ...g.audit] }));
    setTimeout(() => document.getElementById('submit-request')?.focus(), 60);
  };
  const [, setSubmittedMap] = usePersistentState<Record<string, boolean>>('after:submitted', () => ({}));
  const [expanded, setExpanded] = useState<string[]>([]);
  const [confirm, setConfirm] = useState(false);
  const open = items;
  const resubmit = req.status === 'returned';
  const selectable = ev.rows.filter((r) => r.status !== 'ineligible');
  const allSelected = selectable.every((r) => r.pledged);
  const selected = ev.rows.filter((r) => r.pledged).length;
  // The owner line earns its place only when accounts belong to different parties (joint, trust).
  const mixedOwners = new Set(ev.rows.map((r) => `${r.account.owner} · ${r.account.relationship}`)).size > 1;
  const locked = LOCKED_STATUSES.includes(req.status);
  const toggleAll = () => {
    const next = { ...req.pledged };
    selectable.forEach((r) => { next[r.account.id] = !allSelected; });
    changeEstimate({ pledged: next }, allSelected ? 'Deselected all collaterals' : 'Selected all collaterals');
  };
  const trySubmit = () => {
    if (open.length) { track('error', 'after'); focusAnchor('submit-blockers'); return; }
    setConfirm(true);
  };
  const submit = () => {
    recordGaps('after', 0);
    const at = nowStamp();
    const event = resubmit ? 'Resubmitted to underwriting' : 'Submitted to underwriting';
    const detail = `Requested ${fmtMoney(req.requested)}; total maximum borrowing power ${fmtMoney(ev.total)}`;
    log(event, detail, s.requestId);
    setReq((p) => ({
      ...p,
      status: 'submitted',
      uwStage: 'awaiting',
      submittedAt: at,
      corrections: [],
      snapshot: { at, requested: p.requested, power: ev.total, pledged: selected, repay1: p.repay1, wealth1: p.wealth1, costCenter: p.costCenter },
      history: [...(p.history ?? []), { at, event, detail, by: 'S. Mitchell · Loan Officer' }],
      completed: [...new Set([...(p.completed ?? []), 'collateral' as Section])],
    }));
    setSubmittedMap((p) => ({ ...p, [s.id]: true }));
    setConfirm(false);
    onSubmitted();
  };
  return (
    <>
      {!locked && open.length > 0 && (
        <div id="submit-blockers" tabIndex={-1} className="mb-6 focus:outline-none">
          <h2 className="t-heading-compact-01">Before you can submit: {open.length} item{open.length > 1 ? 's' : ''}</h2>
          <ul className="mt-2 border-t border-[var(--cds-border-subtle-01)]">
            {open.map((r) => (
              <li key={r.id} className="flex items-center gap-4 py-2 border-b border-[var(--cds-border-subtle-01)] t-body-01">
                <span className="flex-1">
                  {r.kind === 'correction' && <span className="mr-2 align-middle"><Tag tone="warning">Action required</Tag></span>}
                  {r.kind === 'waiting' && <span className="mr-2 align-middle"><Tag tone="pending">Waiting</Tag></span>}
                  {r.label}<span className="t-helper-01 text-[var(--cds-text-secondary)] ml-2">{PLACE_LABEL[r.place]}</span>
                </span>
                {r.kind !== 'waiting' && <Button kind="ghost" size="sm" onClick={() => onGoItem(r)} aria-label={`Go to: ${r.label}`}>Go to</Button>}
              </li>
            ))}
          </ul>
        </div>
      )}
      <StepSection id="collaterals" title="Collaterals" description="The accounts selected in Evaluation. Changes here update the evaluation.">
        <div className="flex flex-wrap items-center gap-4 mb-3">
          <Button kind="ghost" size="sm" className="!px-0" onClick={toggleAll}>{allSelected ? 'Deselect All' : 'Select All'}</Button>
        </div>
        <div className="overflow-x-auto">
          <Table aria-label="Collaterals" size="md" className="collateral-table min-w-[760px]">
            <TableHead>
              <TableRow>
                <TableExpandHeader aria-label="Expand row" />
                <TableHeader><span className="sr-only">Select</span></TableHeader>
                <TableHeader>Collateral Name</TableHeader>
                <TableHeader>Collateral Account Number</TableHeader>
                <TableHeader className="num">Estimated Collateral Value</TableHeader>
                <TableHeader className="num">Maximum Borrowing Power</TableHeader>
                <TableHeader>Status</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {ev.rows.map((r) => {
                const isOpen = expanded.includes(r.account.id);
                const st = EVAL_STATUS[r.status];
                return [
                  <TableExpandRow
                    key={r.account.id}
                    isExpanded={isOpen}
                    isSelected={r.pledged}
                    onExpand={() => setExpanded(isOpen ? expanded.filter((k) => k !== r.account.id) : [...expanded, r.account.id])}
                    aria-label={isOpen ? `Collapse ${r.account.name}` : `Expand ${r.account.name}`}
                    expandIconDescription={isOpen ? 'Collapse row' : 'Expand row'}
                    className={cx(r.pledged && 'is-selected-row')}
                  >
                    <TableCell>
                      <Checkbox
                        id={`pledge-${r.account.id}`}
                        hideLabel
                        labelText={`Select ${r.account.name} ${r.account.number}`}
                        checked={r.pledged}
                        disabled={r.status === 'ineligible'}
                        onChange={(_: unknown, { checked }: { checked: boolean }) => changeEstimate({ pledged: { ...req.pledged, [r.account.id]: checked } }, `${checked ? 'Selected' : 'Deselected'}: ${r.account.name} ${r.account.number}`)}
                      />
                    </TableCell>
                    <TableCell className="font-semibold">{r.account.name}{mixedOwners && <span className="block t-helper-01 font-normal text-[var(--cds-text-secondary)]">{r.account.owner} · {r.account.relationship}</span>}</TableCell>
                    <TableCell className="t-code">{r.account.number}</TableCell>
                    <TableCell className="num"><Money value={r.value} /></TableCell>
                    <TableCell className="num font-semibold"><Money value={r.lendable} /></TableCell>
                    <TableCell><Tag tone={st.tone}>{st.label}</Tag></TableCell>
                  </TableExpandRow>,
                  isOpen ? (
                    <TableExpandedRow key={r.account.id + '-x'} colSpan={7}>
                      <div className="py-3">
                        <ul className="space-y-1 t-body-01">
                          {r.holdings.map((h) => (
                            <li key={h.label} className="flex flex-wrap gap-x-6"><span className="min-w-[14rem]">{h.label}</span><span className="text-[var(--cds-text-secondary)]">{ASSET_CLASS_LABEL[h.assetClass]}</span><span className="tabular-nums">{fmtMoney(h.value)} × {fmtPct(h.appliedRate)}</span></li>
                          ))}
                        </ul>
                        <p className="t-helper-01 text-[var(--cds-text-secondary)] mt-2">{r.explanation}</p>
                        {(r.status === 'review' || r.status === 'reviewed') && <Button kind="ghost" size="sm" className="!px-0 mt-1" onClick={() => onGo('evaluation', 'manual-evaluation')}>Open Manual Evaluation</Button>}
                      </div>
                    </TableExpandedRow>
                  ) : null,
                ];
              })}
              <TableRow className="totals-row">
                <TableCell />
                <TableCell />
                <TableCell colSpan={2}><span className="font-semibold">Total selected</span> <span className="t-helper-01 text-[var(--cds-text-secondary)]">({selected} of {ev.rows.length})</span></TableCell>
                <TableCell className="num font-semibold"><Money value={ev.pledgedValue} /></TableCell>
                <TableCell className="num font-semibold"><Money value={ev.total} /></TableCell>
                <TableCell><span className="t-helper-01 text-[var(--cds-text-secondary)]">Total Maximum Borrowing Power</span></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </StepSection>
      <FooterSlot>
      <footer className="step-footer step-footer--wide">
        <Button kind="ghost" size="md" onClick={() => onGo('loan')}>Back</Button>
        <div className="flex items-center gap-4">
          <p id="submit-help" className="t-helper-01 text-[var(--cds-text-secondary)] max-w-xs text-right" aria-live="polite">
            {selected} of {ev.rows.length}<span className="hidden sm:inline"> collaterals</span> selected.{' '}
            {!locked && (open.length ? <>Submit is available when the {open.length} item{open.length > 1 ? 's' : ''} above {open.length > 1 ? 'are' : 'is'} complete.</> : 'Every readiness check is complete.')}
          </p>
          {!locked && role === 'Relationship Banker' && <Button id="submit-request" size="md" onClick={trySubmit} disabled={open.length > 0} aria-describedby="submit-help">{resubmit ? 'Resubmit' : 'Submit'}</Button>}
          {!locked && role === 'Credit Officer' && <p className="t-helper-01 text-[var(--cds-text-secondary)]">The loan officer submits this request.</p>}
          {/* PAUL-F1: the same role hand-back as Evaluation, so the Credit Officer path never ends without a next action. */}
          {!locked && role === 'Credit Officer' && <Button kind="tertiary" size="md" onClick={switchToLoanOfficer}>Switch to Loan Officer</Button>}
        </div>
      </footer>
      </FooterSlot>
      <Modal open={confirm} size="sm" modalHeading={resubmit ? "Resubmit loan request to underwriting?" : "Submit loan request to underwriting?"} primaryButtonText={resubmit ? "Resubmit" : "Submit"} secondaryButtonText="Cancel" onRequestSubmit={submit} onRequestClose={() => setConfirm(false)}>
        <dl className="grid grid-cols-2 gap-4 mb-4">
          <KV label="Application" value={`${s.requestId}, ${s.entityName ?? s.primary.name}`} />
          <KV label="Requested Loan Amount" value={fmtMoney(req.requested)} mono />
          <KV label="Total Maximum Borrowing Power" value={fmtMoney(ev.total)} mono />
          <KV label="Collaterals selected" value={String(selected)} />
        </dl>
        <p className="t-body-01">After submission, the request is read-only. Underwriting makes the credit decision and sets any approved credit limit.</p>
      </Modal>
    </>
  );
}

/* ------------------------------- Application status ------------------------------- */
function StatusPanel({ m, onGo, blocked = false }: { m: RequestModel; onGo: (p: Place, a?: string) => void; blocked?: boolean }) {
  const { req, ev, readiness, s } = m;
  const g = guidance(m);
  const { audit } = useAudit();
  const [trail, setTrail] = useState(false);
  const cov = g.coverage;
  const diff = g.margin;
  const done = readiness.filter((r) => r.done).length;
  const events = audit.filter((e) => e.requestId === s.requestId);
  return (
    <aside id="application-status" tabIndex={-1} aria-label="Application status" className="status-panel xl:sticky xl:top-6 lg:col-start-2 xl:col-start-auto focus:outline-none">
      <section aria-labelledby="fin-h" className="px-4 pt-4 pb-4 space-y-3 border-b border-[var(--cds-border-subtle-01)]">
        <h2 id="fin-h" className="t-heading-02">Application status</h2>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 items-end">
          <div><dt className="t-label-01 text-[var(--cds-text-secondary)]">Requested Loan Amount</dt><dd className="t-heading-03 tabular-nums mt-0.5"><Money value={req.requested} /></dd></div>
          <div><dt className="t-label-01 text-[var(--cds-text-secondary)]">Total Maximum Borrowing Power</dt><dd className="t-heading-03 tabular-nums !font-semibold mt-0.5" aria-live="polite"><Money value={ev.total} /></dd></div>
        </dl>
        <div className="relative h-1 bg-[var(--cds-border-subtle-01)]" aria-hidden="true">
          <div className={cx('h-full', cov >= 1 ? 'bg-[var(--cds-support-success)]' : 'bg-[var(--cds-support-error)]')} style={{ width: `${Math.min(cov / 1.5, 1) * 100}%` }} />
          <div className="absolute -top-1 h-3 w-px bg-[var(--cds-text-primary)]" style={{ left: `${(1 / 1.5) * 100}%` }} />
        </div>
        <p className={cx('t-helper-01', diff >= 0 ? 'text-[var(--cds-text-secondary)]' : 'text-[var(--cds-text-error)]')}>
          {fmtPct(cov)} of the request · {diff >= 0 ? `${fmtMoney(diff)} available` : `${fmtMoney(-diff)} short`}. Submission needs 100%.
        </p>
        <p className="t-helper-01 text-[var(--cds-text-secondary)]">Indicative estimate. Not a credit decision or an offer of credit.</p>
      </section>
      <section aria-labelledby="ready-h" className="px-4 py-4">
        <div className="flex justify-between items-baseline">
          <h2 id="ready-h" className="t-heading-02">Submission readiness</h2>
          <span className="t-helper-01 tabular-nums text-[var(--cds-text-secondary)]">{done} of {readiness.length} complete</span>
        </div>
        <div className="h-1 bg-[var(--cds-border-subtle-01)] mt-2" aria-hidden="true"><div className="h-full bg-[var(--cds-interactive)]" style={{ width: `${(done / readiness.length) * 100}%` }} /></div>
        {blocked && done < readiness.length && <p className="t-helper-01 text-[var(--cds-text-secondary)] mt-3">{readiness.length - done} open: listed in the main column.</p>}
        <ul className="mt-3">
          {PLACE_ORDER.map((place) => {
            const items = readiness.filter((r) => r.step === place);
            if (!items.length) return null;
            const openItems = items.filter((r) => !r.done);
            return (
              <li key={place} className="py-2 border-b border-[var(--cds-border-subtle-01)] last:border-0">
                <p className="flex items-center gap-2 t-heading-compact-01">
                  {!openItems.length ? <CheckmarkFilled size={16} className="fill-[var(--cds-support-success)]" aria-hidden="true" /> : <Warning size={16} className={blocked ? 'fill-[var(--cds-support-error)]' : 'fill-[var(--cds-icon-secondary)]'} aria-hidden="true" />}
                  {PLACE_LABEL[place]}
                  <span className="ml-auto t-helper-01 font-normal text-[var(--cds-text-secondary)]">{openItems.length ? `${openItems.length} open` : 'Complete'}</span>
                </p>
                {openItems.length > 0 && !blocked && (
                  <ul className="mt-1 pl-6 space-y-1">
                    {openItems.map((r) => (
                      <li key={r.id}><button type="button" className="text-left t-body-compact-01 text-[var(--cds-link-primary)] hover:underline" onClick={() => onGo(r.step, ANCHOR[r.id])}>{r.label}</button></li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
        {g.warnings.length > 0 && (
          <div className="mt-3">
            <p className="t-label-01 text-[var(--cds-text-secondary)]">Warnings ({g.warnings.length}) · don’t block submission</p>
            <ul className="mt-1 space-y-1">
              {g.warnings.map((w) => <li key={w.id}><button type="button" className="text-left t-body-compact-01 text-[var(--cds-link-primary)] hover:underline" onClick={() => onGo(w.section, w.anchor)}>{w.label}</button></li>)}
            </ul>
          </div>
        )}
        <Button kind="ghost" size="sm" className="mt-3 !px-0" onClick={() => setTrail(true)}>View audit trail ({events.length})</Button>
      </section>
      <Modal open={trail} passiveModal size="lg" modalHeading={`Audit trail · ${s.requestId}`} onRequestClose={() => setTrail(false)}>
        {events.length === 0 ? (
          <p className="t-body-01">No events recorded yet.</p>
        ) : (
          <Table size="sm" aria-label="Audit trail">
            <TableHead><TableRow><TableHeader>Time</TableHeader><TableHeader>User</TableHeader><TableHeader>Role</TableHeader><TableHeader>Event</TableHeader><TableHeader>Details</TableHeader></TableRow></TableHead>
            <TableBody>
              {events.map((e, i) => (
                <TableRow key={i}><TableCell className="whitespace-nowrap">{e.at}</TableCell><TableCell>{e.user}</TableCell><TableCell>{e.role}</TableCell><TableCell>{e.event}</TableCell><TableCell>{e.detail}</TableCell></TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Modal>
    </aside>
  );
}

/* ------------------------------- Loan Request Submitted ------------------------------- */
const NEXT_STEPS = [
  ['Initial Review and Underwriting', 'Our underwriting team will conduct a preliminary assessment of the application, reviewing financial statements, collateral valuations, and customer credit history. Additional documentation may be requested during this phase.'],
  ['Credit Decisioning', 'The credit committee will evaluate the complete underwriting package and render a decision on the loan request. This includes assessment of credit risk, pricing structure, terms and conditions, and any required covenants or guarantees.'],
  ['Documentation and Closing', 'Upon approval, loan documents will be prepared including the credit agreement, security agreements, promissory notes, and any ancillary documentation. The borrower will review, execute, and return all required documents to finalize the transaction.'],
  ['Funding', 'After all documentation has been executed and conditions precedent have been satisfied, the loan will be funded according to the agreed disbursement schedule.'],
];

function Confirmation({ m, onRoute }: { m: RequestModel; onRoute: (r: Route) => void }) {
  const { s, req } = m;
  const [pdf, setPdf] = useState(false);
  return (
    <div className="px-4 sm:px-8 pt-6 w-form mx-auto">
      <h1 className="t-heading-05">Loan Request Submitted</h1>
      <div className="mt-6 pb-2">
        <div className="flex gap-4 items-start">
          <CheckmarkOutline size={32} className="shrink-0 fill-[var(--cds-support-success)]" aria-hidden="true" />
          <div>
            <h2 className="t-heading-04">Your loan request has been successfully submitted</h2>
            <p className="t-body-02 mt-2">
              Application <b className="font-semibold">{s.requestId}</b> for <b className="font-semibold">{s.entityName ?? s.primary.name}</b> requesting <b className="font-semibold">{fmtMoney(req.requested)} USD</b> has been received by our underwriting team. You will be notified as the application progresses through each stage of review.
            </p>
            <p className="t-helper-01 text-[var(--cds-text-secondary)] mt-2">Submitted {req.submittedAt}.</p>
          </div>
        </div>
        <div className="band mt-8 flex flex-wrap items-center justify-between gap-4 p-4">
          <div>
            <p className="t-heading-compact-01">Full Loan Summary Package</p>
            <p className="t-helper-01 text-[var(--cds-text-secondary)]">Complete application details and supporting documentation</p>
            {pdf && <p className="t-helper-01 mt-1" role="status">Package prepared (simulated). No file is downloaded in this demo.</p>}
          </div>
          <Button size="md" renderIcon={DocumentDownload} onClick={() => setPdf(true)}>Download PDF</Button>
        </div>
        <h2 className="t-heading-03 mt-8">What happens next</h2>
        <ol className="mt-4 space-y-5">
          {NEXT_STEPS.map(([t, d], i) => (
            <li key={t} className="grid grid-cols-[2rem_1fr] gap-4">
              <span className="w-8 h-8 inline-flex items-center justify-center rounded-full bg-[var(--cds-interactive)] text-[var(--cds-text-on-color)] t-heading-compact-01" aria-hidden="true">{i + 1}</span>
              <div>
                <p className="t-heading-compact-01">{t}</p>
                <p className="t-body-01 text-[var(--cds-text-secondary)] mt-1">{d}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
      <footer className="step-footer">
        <Button kind="ghost" size="md" onClick={() => onRoute({ page: 'request', id: s.id, section: 'customer' })}>View Loan Details</Button>
        <Button size="md" onClick={() => onRoute({ page: 'console', tab: 'submitted', expanded: s.requestId })}>Return to Console</Button>
      </footer>
    </div>
  );
}
