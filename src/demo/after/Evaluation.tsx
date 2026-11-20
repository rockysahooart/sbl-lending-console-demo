import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Accordion,
  AccordionItem,
  Button,
  Checkbox,
  InlineNotification,
  Modal,
  StructuredListBody,
  StructuredListCell,
  StructuredListRow,
  StructuredListWrapper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TextArea,
} from '@carbon/react';
import { ChevronDown, DocumentPdf } from '@carbon/icons-react';
import { useDemo } from '../DemoContext';
import { ASSET_CLASS_LABEL, fmtMoney, fmtPct, type ScenarioId } from '../data';
import { reviewBounds } from '../engine';
import { OUTSIDE_CATS, OUTSIDE_ROWS, CONCENTRATION_CAP, PROVISIONAL_RATE, ATTESTATIONS, ROLE_LABEL, USERS, nowStamp, useAfterRequest, useAudit, type RequestModel } from './state';
import { reviewUpside } from './guidance';
import { appState } from './lifecycle';
import { KV, Money, StatusTag, Tag, TextField, cx, type Tone } from './ui';
import type { Route } from './AfterApp';

/*
 * Evaluation — same four sections as the original screen (Customer Details,
 * Auto Evaluation, Manual Evaluation, Total Evaluation) and the same footer
 * (Back, Generate PDF, Start Request). Selecting accounts here is the same
 * selection the Collaterals step shows; values come from the evaluation engine.
 */

export const EVAL_STATUS: Record<string, { tone: Tone; label: string }> = {
  auto: { tone: 'success', label: 'Auto evaluated' },
  review: { tone: 'review', label: 'Manual evaluation' },
  reviewed: { tone: 'info', label: 'Manually evaluated' },
  ineligible: { tone: 'error', label: 'Not eligible' },
  excluded: { tone: 'neutral', label: 'Not selected' },
};

/**
 * Land on an element after a jump (THEO-05 / THEO-02 counterpart / MARA-01).
 * Scrolls only the After content area (#after-main), never the demo frame around it,
 * then focuses the element and marks it `data-landed` so it shows where the user arrived
 * (outline: team/theo.scss; one-time cue: team/mara.scss). The mark clears on blur.
 * 'nearest' moves as little as possible, keeping what the user acted on in view when it fits.
 */
export function landOn(el: HTMLElement | null, mode: 'start' | 'nearest' = 'start') {
  if (!el) return;
  const main = document.getElementById('after-main');
  if (main) {
    const m = main.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const gap = 16;
    // Keep the landing clear of the sticky step footer too (WCAG 2.4.11; its height is main's scroll padding).
    const end = Math.max(gap, parseFloat(getComputedStyle(main).scrollPaddingBottom) || 0);
    let delta = r.top - m.top - gap;
    if (mode === 'nearest') {
      if (r.top >= m.top + gap && r.bottom <= m.bottom - end) delta = 0;
      else if (r.top > m.top && r.height <= m.height - gap - end) delta = r.bottom - m.bottom + end;
    }
    if (delta) main.scrollTo({ top: main.scrollTop + delta });
  }
  markLanded(el);
  el.focus({ preventScroll: true });
}

function markLanded(el: HTMLElement) {
  if (el.hasAttribute('data-landed')) { el.removeAttribute('data-landed'); void el.offsetWidth; }
  el.setAttribute('data-landed', '');
  // The cue has done its job once the user moves on (Tab away) or works inside the target (click).
  const clear = () => { el.removeAttribute('data-landed'); el.removeEventListener('blur', clear); el.removeEventListener('pointerdown', clear); };
  el.addEventListener('blur', clear);
  el.addEventListener('pointerdown', clear);
}

/** Collapsible section with the heading on the left and its Maximum Borrowing Power on the right, as in the original. */
export function EvalSection({ id, title, metric, note, children, defaultOpen = true }: { id: string; title: string; metric?: number; note?: ReactNode; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const pointer = useRef(false);
  return (
    <section
      id={id}
      tabIndex={-1}
      aria-labelledby={`${id}-h`}
      className="eval-section focus:outline-none"
      onPointerDown={() => { pointer.current = true; }}
      onPointerUp={() => { pointer.current = false; }}
      onFocus={(e) => { if (e.target === e.currentTarget && !pointer.current) markLanded(e.currentTarget); }}
    >
      <div className="eval-section__head flex items-center justify-between gap-4 px-6 py-4">
        <button type="button" className="eval-toggle flex items-center gap-2 text-left" aria-expanded={open} aria-controls={open ? `${id}-body` : undefined} onClick={() => setOpen(!open)}>
          <ChevronDown size={20} aria-hidden="true" className={cx(!open && '-rotate-90')} />
          <h2 id={`${id}-h`} className="t-heading-03">{title}</h2>
        </button>
        {metric != null && (
          <div className="text-right">
            <p className="t-label-01 text-[var(--cds-text-secondary)]">Maximum Borrowing Power</p>
            <p className="t-heading-03 tabular-nums !font-semibold"><Money value={metric} /></p>
            {note}
          </div>
        )}
      </div>
      {open && <div id={`${id}-body`} className="eval-section__body">{children}</div>}
    </section>
  );
}

export function Evaluation({ id, onRoute, ack: ackOpen = false, onAck, fix }: { id: ScenarioId; onRoute: (r: Route) => void; ack?: boolean; onAck?: (open: boolean) => void; fix?: string }) {
  const m = useAfterRequest(id);
  const { s, req, ev, changeEstimate, acknowledged, update } = m;
  const { scenario, adoptScenario } = useDemo();
  const [ack, setAckState] = useState(ackOpen);
  const setAck = (open: boolean) => { setAckState(open); onAck?.(open); };
  const [pdf, setPdf] = useState(false);
  useEffect(() => { if (scenario !== id) adoptScenario(id); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps
  // Opening the Evaluation is the first step of the application: Not Started → In Progress.
  useEffect(() => { if (!req.evalOpened && req.status === 'draft') update({ evalOpened: true }); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const started = acknowledged || req.visited.length > 0;
  const locked = ['submitted', 'approved', 'declined'].includes(req.status);
  const st = appState(m);
  const fixItem = fix ? st.items.find((i) => i.id === fix) : undefined;
  const noCollateral = st.items.some((i) => i.id === 'pledge');
  // A fix link lands on the exact section and marks it.
  useEffect(() => {
    if (!fixItem?.anchor) return;
    const t = window.setTimeout(() => { const el = document.getElementById(fixItem.anchor!); if (el) { el.setAttribute('data-fix', fixItem.kind === 'correction' ? 'correction' : 'task'); landOn(el); } }, 120);
    return () => { window.clearTimeout(t); document.querySelectorAll('[data-fix]').forEach((n) => n.removeAttribute('data-fix')); };
  }, [fix]); // eslint-disable-line react-hooks/exhaustive-deps
  const autoRows = ev.rows;
  const manualRows = ev.rows.filter((r) => r.status === 'review' || r.status === 'reviewed');
  const autoTotal = ev.rows.filter((r) => r.status === 'auto').reduce((t, r) => t + r.lendable, 0);
  const manualTotal = manualRows.reduce((t, r) => t + r.lendable, 0) + ev.outside.lendable;
  const selectable = ev.rows.filter((r) => r.status !== 'ineligible');
  const selected = ev.rows.filter((r) => r.pledged).length;
  const allSelected = selectable.every((r) => r.pledged);
  const toggleAll = () => {
    const next = { ...req.pledged };
    selectable.forEach((r) => { next[r.account.id] = !allSelected; });
    changeEstimate({ pledged: next }, allSelected ? 'Deselected all accounts' : 'Selected all accounts');
  };
  const generatePdf = () => { setPdf(true); m.log('Evaluation PDF generated (simulated)', `Total Maximum Borrowing Power ${fmtMoney(ev.total)}`, s.requestId); };
  const start = () => {
    if (locked) { onRoute({ page: 'review', id: s.requestId }); return; }
    if (noCollateral) return;
    if (acknowledged) onRoute({ page: 'request', id, section: req.section });
    else setAck(true);
  };

  return (
    <div className="px-4 sm:px-8 pt-6 w-page mx-auto">
      <fieldset disabled={locked} className="min-w-0">
        <legend className="sr-only">Evaluation for {s.requestId}</legend>
        {locked && <InlineNotification kind="info" lowContrast hideCloseButton className="!max-w-none mb-4" title="Submitted to underwriting" subtitle={`Submitted ${req.submittedAt}. This evaluation is read-only.`} />}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <StatusTag status={st.status} />
          <p className="t-body-01 text-[var(--cds-text-secondary)]">{st.detail !== st.status ? `${st.detail}. ` : ''}{st.why}</p>
        </div>
        {fixItem && (
          <div className="mb-4" role="status">
            <InlineNotification kind={fixItem.kind === 'correction' ? 'warning' : 'info'} lowContrast hideCloseButton className="!max-w-none" title={fixItem.kind === 'correction' ? `Action required: ${fixItem.problem ?? fixItem.label}` : fixItem.label} subtitle={fixItem.explain} />
          </div>
        )}

        <EvalSection id="customer-details" title="Customer Details">
          <dl className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-x-8 gap-y-4">
            <KV label={s.entityName ? 'Business Name' : 'Customer Name'} value={s.entityName ?? s.primary.name} />
            {s.entityName && <KV label="Authorized Signer" value={s.primary.name} />}
            <KV label="Opportunity Date" value={s.opportunityDate} mono />
            <KV label="Customer Power ID" value={s.primary.powerId} mono />
            <KV label="Loan Purpose" value={req.purpose} />
            <KV label="Requested Loan Amount" value={`${fmtMoney(req.requested)} USD`} mono />
          </dl>
        </EvalSection>

        <EvalSection id="auto-evaluation" title="Auto Evaluation" metric={autoTotal}>
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <Button kind="ghost" size="sm" className="!px-0" onClick={toggleAll}>{allSelected ? 'Deselect All' : 'Select All'}</Button>
            <span className="t-body-01 text-[var(--cds-text-secondary)]" aria-live="polite">{selected} of {ev.rows.length} accounts selected</span>
          </div>
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(17rem,1fr))] gap-4">
            {autoRows.map((r) => {
              const potential = r.holdings.reduce((t, h) => t + h.lendable, 0);
              const st = EVAL_STATUS[r.status];
              const rate = r.status === 'ineligible' ? 0 : r.holdings[0].concentrated ? r.holdings[0].appliedRate : r.holdings[0].baseRate;
              return (
                <li key={r.account.id} className={cx('eval-tile p-4 border', r.pledged ? 'is-selected' : '', r.status === 'ineligible' && 'is-ineligible')}>
                  <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                    <Checkbox
                      id={`eval-${r.account.id}`}
                      labelText={<span><span className="font-semibold">{r.account.name}</span> <span className="t-code text-[var(--cds-text-secondary)]">{r.account.number}</span></span>}
                      checked={r.pledged}
                      disabled={r.status === 'ineligible'}
                      onChange={(_: unknown, { checked }: { checked: boolean }) => changeEstimate({ pledged: { ...req.pledged, [r.account.id]: checked } }, `${checked ? 'Selected' : 'Deselected'}: ${r.account.name} ${r.account.number}`)}
                    />
                    <Tag tone={st.tone}>{st.label}</Tag>
                  </div>
                  <p className="t-label-01 text-[var(--cds-text-secondary)] mt-3">Maximum Borrowing Power</p>
                  <p className="t-heading-03 tabular-nums !font-semibold"><Money value={r.pledged ? r.lendable : potential} /></p>
                  <p className="t-helper-01 text-[var(--cds-text-secondary)] mt-1">
                    {fmtMoney(r.value)} market value · {fmtPct(rate)} advance rate · {[...new Set(r.holdings.map((h) => ASSET_CLASS_LABEL[h.assetClass]))].join(', ')}
                  </p>
                  {(r.status === 'ineligible' || r.status === 'review') && <p className="t-helper-01 mt-2">{r.explanation}</p>}
                </li>
              );
            })}
          </ul>
        </EvalSection>

        <ManualEvaluation m={m} rows={manualRows} total={manualTotal} />

        {/* PAUL-04: the consequence sits with the total, visible where the decision is made. */}
        <EvalSection id="total-evaluation" title="Total Evaluation" metric={ev.total} note={ev.total < req.requested ? <p className="t-helper-01 tabular-nums text-[var(--cds-text-error)]">{fmtMoney(req.requested - ev.total)} short of {fmtMoney(req.requested)}</p> : null}>
          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              ['Auto Evaluation', autoTotal],
              ['Manual Evaluation', manualTotal],
              ['Total Evaluations', ev.total],
            ].map(([l, v], i) => (
              <div key={l as string}>
                <dt className="t-body-01">{l}<span className="block t-label-01 text-[var(--cds-text-secondary)]">Maximum Borrowing Power</span></dt>
                {/* IRIS-02: figures are information, not actions — primary text; the total carries weight, not colour. */}
                <dd className={cx('t-heading-05 tabular-nums mt-1', i === 2 && '!font-semibold')}><Money value={v as number} /></dd>
              </div>
            ))}
          </dl>
          <CoverageStatement m={m} />
          <Accordion className="mt-6">
            <AccordionItem title="Calculation details">
              <p className="t-body-01 mb-3">Maximum Borrowing Power = market value × advance rate, for each selected account.</p>
              <StructuredListWrapper isCondensed aria-label="Advance rates">
                <StructuredListBody>
                  {[['Cash and certificates of deposit at the bank', '100%'], ['Money market funds; Treasury bills under 7 years', '80%'], ['Fixed income', '80%'], ['Listed equities and ETFs', '70%'], ['Mutual funds and other assets', '60%'], ['Restricted stock', 'Not eligible'], ['Single-issuer position over 40% of selected market value', '35% until manually evaluated; range 35%–60%']].map(([a, b]) => (
                    <StructuredListRow key={a}><StructuredListCell>{a}</StructuredListCell><StructuredListCell className="tabular-nums">{b}</StructuredListCell></StructuredListRow>
                  ))}
                </StructuredListBody>
              </StructuredListWrapper>
              <p className="t-helper-01 text-[var(--cds-text-secondary)] mt-2">Advance rates are fictional values for this demonstration.</p>
            </AccordionItem>
            <AccordionItem title={`Evaluation history (${req.estimateLog.length})`}>
              {req.estimateLog.length === 0 ? (
                <p className="t-body-01">No changes yet. The evaluation reflects the default account selection.</p>
              ) : (
                <Table size="sm" aria-label="Evaluation history">
                  <TableHead><TableRow><TableHeader>Time</TableHeader><TableHeader>User</TableHeader><TableHeader>Change</TableHeader><TableHeader className="num">Before</TableHeader><TableHeader className="num">After</TableHeader></TableRow></TableHead>
                  <TableBody>
                    {req.estimateLog.map((e, i) => (
                      <TableRow key={i}><TableCell>{e.at}</TableCell><TableCell>{e.user}</TableCell><TableCell>{e.change}</TableCell><TableCell className="num"><Money value={e.from} /></TableCell><TableCell className="num"><Money value={e.to} /></TableCell></TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </AccordionItem>
          </Accordion>
        </EvalSection>
      </fieldset>

      <footer className="step-footer">
        <Button kind="ghost" size="md" onClick={() => onRoute({ page: 'console', tab: st.queue, expanded: s.requestId })}>Back</Button>
        {/* KENJI-08 (done by Ada): below sm, Generate PDF is icon-only and the row does not wrap, so the sticky footer stays one row. */}
        <div className="flex flex-nowrap sm:flex-wrap items-center justify-end gap-2 sm:gap-4">
          {pdf && <p className="t-helper-01 text-[var(--cds-text-secondary)] sr-only sm:not-sr-only" role="status">Evaluation PDF prepared (simulated)</p>}
          <Button kind="tertiary" size="md" hasIconOnly renderIcon={DocumentPdf} iconDescription="Generate PDF" tooltipPosition="top" className="sm:!hidden" onClick={generatePdf} />
          <Button kind="tertiary" size="md" renderIcon={DocumentPdf} className="max-sm:!hidden" onClick={generatePdf}>Generate PDF</Button>
          {noCollateral && !locked && <p id="start-help" className="t-helper-01 text-[var(--cds-text-secondary)] max-w-xs text-right" aria-live="polite">Select at least one eligible account in Auto Evaluation to start the request.</p>}
          <Button id="evaluation-primary" size="md" onClick={start} disabled={noCollateral && !locked} aria-describedby={noCollateral && !locked ? 'start-help' : undefined}>{locked ? 'View in Pending Review' : started ? 'Continue Request' : 'Start Request'}</Button>
        </div>
      </footer>
      <AcknowledgmentModal
        m={m}
        open={ack}
        onClose={() => setAck(false)}
        onStart={() => { setAck(false); update({ section: 'customer' }); onRoute({ page: 'request', id, section: 'customer' }); }}
      />
    </div>
  );
}

function ManualEvaluation({ m, rows, total }: { m: RequestModel; rows: RequestModel['ev']['rows']; total: number }) {
  const { s, req, update, role, log } = m;
  const { setGlobal } = useAudit();
  const [reviewing, setReviewing] = useState<string | null>(null);
  /** PAUL-02: demo shortcut for the role switch in the user menu (same state change and audit entry). */
  const switchToCreditOfficer = (accountId: string) => {
    setGlobal((g) => ({ ...g, role: 'Credit Officer', audit: [{ at: nowStamp(), user: USERS['Credit Officer'], role: 'Credit Officer', event: 'Role changed', detail: 'Signed in as Credit Officer' }, ...g.audit] }));
    setTimeout(() => document.getElementById(`complete-review-${accountId}`)?.focus(), 60);
  };
  // PAUL-F1: mirror of PAUL-02. Once the review is recorded, hand the request back to the loan officer
  // (same role state and audit entry as the user menu); focus lands on the footer's Start/Continue Request.
  const switchToLoanOfficer = () => {
    setGlobal((g) => ({ ...g, role: 'Relationship Banker', audit: [{ at: nowStamp(), user: USERS['Relationship Banker'], role: ROLE_LABEL['Relationship Banker'], event: 'Role changed', detail: `Signed in as ${ROLE_LABEL['Relationship Banker']}` }, ...g.audit] }));
    setTimeout(() => document.getElementById('evaluation-primary')?.focus(), 60);
  };
  return (
    <EvalSection id="manual-evaluation" title="Manual Evaluation" metric={total}>
      {rows.length === 0 ? (
        <p className="t-body-01">No selected account needs manual evaluation. Every selected account is valued at its standard advance rate in Auto Evaluation.</p>
      ) : (
        <>
          <p className="t-body-01 mb-4">Showing {rows.length} selected account{rows.length > 1 ? 's' : ''} that need{rows.length > 1 ? '' : 's'} manual evaluation. A credit officer sets the advance rate for a single-issuer position over 40% of the selected market value.</p>
          {rows.map((r) => {
            const requested = req.reviewRequested[r.account.id];
            return (
              <div key={r.account.id} className="border border-[var(--sbl-rule)] mb-4">
                <div className="band flex flex-wrap items-start justify-between gap-4 px-4 py-3">
                  <div className="t-heading-02 flex flex-wrap items-center gap-2">{r.account.name} <span className="t-code text-[var(--cds-text-secondary)]">{r.account.number}</span> <Tag tone={EVAL_STATUS[r.status].tone}>{EVAL_STATUS[r.status].label}</Tag></div>
                  <div className="text-right">
                    <p className="t-label-01 text-[var(--cds-text-secondary)]">Maximum Borrowing Power</p>
                    <p className="t-heading-02 tabular-nums"><Money value={r.lendable} /></p>
                  </div>
                </div>
                <Table size="md" aria-label={`Holdings in ${r.account.name}`}>
                  <TableHead><TableRow><TableHeader>Data</TableHeader><TableHeader className="num">Collateral Value</TableHeader><TableHeader className="num">Advance Rate</TableHeader><TableHeader className="num">Lendable Value</TableHeader></TableRow></TableHead>
                  <TableBody>
                    {r.holdings.map((h) => (
                      <TableRow key={h.label}>
                        <TableCell>{h.label}<span className="block t-helper-01 text-[var(--cds-text-secondary)]">{ASSET_CLASS_LABEL[h.assetClass]}{h.concentrated ? ' · single-issuer concentration' : ''}</span></TableCell>
                        <TableCell className="num"><Money value={h.value} /></TableCell>
                        <TableCell className="num">{fmtPct(h.appliedRate)}{h.concentrated && h.appliedRate !== h.baseRate ? <span className="block t-helper-01 text-[var(--cds-text-secondary)]">standard {fmtPct(h.baseRate)}</span> : null}</TableCell>
                        <TableCell className="num font-semibold"><Money value={h.lendable} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  {/* PAUL-04: while under review the tile above already states this rationale; keep it here only once reviewed. */}
                  {r.status === 'review' ? <span aria-hidden="true" /> : <p className="t-helper-01 text-[var(--cds-text-secondary)] max-w-3xl">{r.explanation}</p>}
                  {r.status === 'review' && role === 'Relationship Banker' && (requested ? (
                    <span className="inline-flex flex-wrap items-center gap-3">
                      <Tag tone="pending">Awaiting credit officer review</Tag>
                      <Button kind="tertiary" size="sm" onClick={() => switchToCreditOfficer(r.account.id)}>Switch to Credit Officer</Button>
                    </span>
                  ) : (
                    <Button kind="tertiary" size="sm" onClick={() => { update({ reviewRequested: { ...req.reviewRequested, [r.account.id]: nowStamp() } }); log('Collateral review requested', `${r.account.name} ${r.account.number}`, s.requestId); }}>Request credit officer review</Button>
                  ))}
                  {role === 'Credit Officer' && (r.status === 'review' ? (
                    <Button id={`complete-review-${r.account.id}`} kind="primary" size="sm" onClick={() => setReviewing(r.account.id)}>Complete review</Button>
                  ) : (
                    <span className="inline-flex flex-wrap items-center gap-3">
                      <Button id={`complete-review-${r.account.id}`} kind="tertiary" size="sm" onClick={() => setReviewing(r.account.id)}>Revise review</Button>
                      <Button kind="tertiary" size="sm" onClick={switchToLoanOfficer}>Switch to Loan Officer</Button>
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </>
      )}
      <OutsideCalculator m={m} />
      {reviewing && <ReviewModal m={m} accountId={reviewing} onClose={() => setReviewing(null)} />}
    </EvalSection>
  );
}

/** States the consequence of the selection against the requested amount, and how to close a gap. */
export function CoverageStatement({ m }: { m: RequestModel }) {
  const { ev, req } = m;
  const margin = ev.total - req.requested;
  const upside = reviewUpside(m);
  const review = ev.rows.find((r) => r.status === 'review');
  return (
    <div className="mt-6 pt-4 border-t border-[var(--cds-border-subtle-01)]">
      <p className="t-body-01">
        {margin >= 0 ? (
          <><span className="font-semibold">Covers the requested loan amount.</span> Total Maximum Borrowing Power is {fmtMoney(margin)} above the requested {fmtMoney(req.requested)}.</>
        ) : (
          <><span className="font-semibold text-[var(--cds-text-error)]">{fmtMoney(-margin)} short of the requested loan amount.</span> The request can’t be submitted until Total Maximum Borrowing Power reaches {fmtMoney(req.requested)}.</>
        )}
      </p>
      {margin < 0 && (
        <ul className="t-body-01 mt-2 list-disc pl-4 space-y-1">
          {review && <li>Complete the manual evaluation of {review.account.name} {review.account.number}. A rate of up to {Math.round(reviewBounds.max * 100)}% could add up to {fmtMoney(upside)}.</li>}
          {ev.rows.some((r) => !r.pledged && r.status !== 'ineligible') && <li>Select another eligible account in Auto Evaluation.</li>}
          <li>Reduce the requested loan amount in Customer Information.</li>
        </ul>
      )}
      <p className="t-helper-01 text-[var(--cds-text-secondary)] mt-2">Indicative estimate. Not a credit decision or an offer of credit.</p>
    </div>
  );
}

function ReviewModal({ m, accountId, onClose }: { m: RequestModel; accountId: string; onClose: () => void }) {
  const { req, ev, changeEstimate, user, log, s } = m;
  const { track } = useDemo();
  const existing = req.reviews[accountId];
  const row = ev.rows.find((r) => r.account.id === accountId)!;
  const [rate, setRate] = useState(existing ? String(Math.round(existing.rate * 100)) : '');
  const [reason, setReason] = useState(existing?.reason ?? '');
  const [errs, setErrs] = useState<{ rate?: string; reason?: string }>({});
  const share = row.value / (ev.pledgedValue || 1);
  const save = () => {
    const r = Number(rate) / 100;
    const e: typeof errs = {};
    if (!rate || !(r >= reviewBounds.min && r <= reviewBounds.max)) e.rate = `Enter a whole number from ${reviewBounds.min * 100} to ${reviewBounds.max * 100}.`;
    if (reason.trim().length < 20) e.reason = 'Enter a rationale of at least 20 characters.';
    setErrs(e);
    if (Object.keys(e).length) { track('error', 'after'); return; }
    changeEstimate({ reviews: { ...req.reviews, [accountId]: { rate: r, reason: reason.trim(), reviewer: user, at: nowStamp() } } }, `Manual evaluation: ${row.account.name} at ${Math.round(r * 100)}%`);
    log('Collateral review recorded', `${row.account.name} ${row.account.number}: ${Math.round(r * 100)}%. Rationale: ${reason.trim()}`, s.requestId);
    onClose();
  };
  return (
    <Modal open size="sm" modalHeading={`Manual evaluation: ${row.account.name} ${row.account.number}`} primaryButtonText="Record review" secondaryButtonText="Cancel" onRequestSubmit={save} onRequestClose={onClose}>
      <dl className="grid grid-cols-3 gap-4 mb-6">
        <KV label="Market value" value={fmtMoney(row.value)} mono />
        <KV label="Share of selected market value" value={fmtPct(share, 1)} mono />
        <KV label="Permitted range" value={`${reviewBounds.min * 100}%–${reviewBounds.max * 100}%`} />
      </dl>
      <div className="space-y-6">
        <TextField id="review-rate" label="Advance rate (%)" inputMode="numeric" value={rate} onChange={(v) => setRate(v.replace(/[^0-9]/g, ''))} invalidText={errs.rate} helper="Whole number within the permitted range." />
        <TextArea id="review-reason" labelText="Rationale" helperText="Recorded with your name and the time in the audit trail." rows={3} value={reason} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReason(e.target.value)} invalid={!!errs.reason} invalidText={errs.reason} />
      </div>
    </Modal>
  );
}

/**
 * Acknowledgment Required — the original two-step dialog: select all five
 * acknowledgements, then read the full acknowledgement, then Start Application.
 */
export function AcknowledgmentModal({ m, open, onClose, onStart, startLabel = 'Start Application' }: { m: RequestModel; open: boolean; onClose: () => void; onStart: () => void; startLabel?: string }) {
  const { req, update, log, s } = m;
  const count = ATTESTATIONS.filter((a) => req.attest[a.key]).length;
  const all = count === ATTESTATIONS.length;
  const ready = all && req.disclosureViewed;
  return (
    <Modal
      open={open}
      size="md"
      className="ack-modal"
      selectorPrimaryFocus="#attest-consent"
      modalHeading="Acknowledgment Required"
      primaryButtonText={startLabel}
      secondaryButtonText="Go back"
      primaryButtonDisabled={!ready}
      onRequestClose={onClose}
      onSecondarySubmit={onClose}
      onRequestSubmit={() => { if (!ready) return; log('Acknowledgment completed', 'All five acknowledgements selected and the full acknowledgement reviewed', s.requestId); onStart(); }}
    >
      <p className="t-body-01 mb-4">Before you start your Loan Request</p>
      <fieldset>
        <legend className="t-heading-02 mb-3">Required acknowledgements <span className="t-body-01 text-[var(--cds-text-secondary)] tabular-nums">({count} of {ATTESTATIONS.length} selected)</span></legend>
        <div className="space-y-1">
          {ATTESTATIONS.map((a) => (
            <Checkbox key={a.key} id={`attest-${a.key}`} labelText={a.text} checked={!!req.attest[a.key]} onChange={(_: unknown, { checked }: { checked: boolean }) => update({ attest: { ...req.attest, [a.key]: checked } })} />
          ))}
        </div>
      </fieldset>
      <Accordion className="mt-6">
        <AccordionItem
          title={req.disclosureViewed ? 'View full acknowledgement (reviewed)' : 'View full acknowledgement'}
          disabled={!all}
          onHeadingClick={({ isOpen }: { isOpen: boolean }) => { if (isOpen && !req.disclosureViewed) update({ disclosureViewed: true }); }}
        >
          <p className="t-body-01">By starting this application, the banking representative confirms that the evaluation data and customer information are accurate and complete; that the client consents to a formal loan application and to electronic records and signatures; and that the required disclosures, anti-money-laundering, KYC and credit decisioning requirements are understood. (Fictional text for demonstration.)</p>
        </AccordionItem>
      </Accordion>
      <p className="t-helper-01 text-[var(--cds-text-secondary)] mt-3" aria-live="polite">
        {!all ? `Step 1: Select all five acknowledgements to unlock the full acknowledgement. (${count} of 5 selected)` : !req.disclosureViewed ? 'Step 2: Open the full acknowledgement to read it.' : 'Both acknowledgement steps are complete.'}
      </p>
    </Modal>
  );
}

/** Before's Manual Evaluation calculator, kept: enter collateral held away by asset class; lendable value,
 *  concentration and total borrowing power update as you type, with the rule shown beside each figure. */
function OutsideCalculator({ m }: { m: RequestModel }) {
  const { req, update, ev, s, log } = m;
  const locked = req.status !== 'draft' && req.status !== 'returned';
  const [tab, setTab] = useState<(typeof OUTSIDE_CATS)[number]['key']>('highlyLiquid');
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [flash, setFlash] = useState('');
  const vals = req.outside ?? {};
  const set = (id: string, raw: string) => {
    setDraft((d) => ({ ...d, [id]: raw }));
    const n = Number(raw.replace(/[^0-9.]/g, '')) || 0;
    update({ outside: { ...vals, [id]: n } });
    setFlash(id);
  };
  const rows = ev.outside.rows.filter((r) => r.cat === tab);
  const capacity = ev.total - req.requested;
  return (
    <div className="calc mt-6" id="borrowing-calculator">
      <div className="calc__head">
        <h3 className="t-heading-02">Borrowing Power Calculator</h3>
        <p className="t-body-01 text-[var(--cds-text-secondary)] mt-1">Add collateral held away from the selected accounts. Lendable value = collateral value × advance rate. Mark a bond or equity row as a single issuer; if it is over {Math.round(CONCENTRATION_CAP * 100)}% of the selected market value, it is valued at {Math.round(PROVISIONAL_RATE * 100)}% until a credit officer reviews it.</p>
      </div>
      <div role="tablist" aria-label="Asset class" className="flex flex-wrap border-b border-[var(--cds-border-subtle-01)]">
        {OUTSIDE_CATS.map((c) => {
          const sum = ev.outside.rows.filter((r) => r.cat === c.key).reduce((t, r) => t + r.lendable, 0);
          const on = tab === c.key;
          return (
            <button key={c.key} type="button" role="tab" id={`calc-tab-${c.key}`} aria-selected={on} aria-controls="calc-panel" tabIndex={on ? 0 : -1}
              onClick={() => setTab(c.key)}
              onKeyDown={(e) => { const i = OUTSIDE_CATS.findIndex((x) => x.key === c.key); const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (d) { const n = OUTSIDE_CATS[(i + d + 4) % 4].key; setTab(n); setTimeout(() => document.getElementById(`calc-tab-${n}`)?.focus(), 0); } }}
              className={cx('px-4 py-3 t-body-compact-01 text-left border-b-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--cds-focus)] focus-visible:-outline-offset-2', on ? 'border-[var(--cds-interactive)] font-semibold' : 'border-transparent text-[var(--cds-text-secondary)]')}>
              {c.label}<span className="block t-helper-01 tabular-nums">{fmtMoney(sum)}</span>
            </button>
          );
        })}
      </div>
      <div role="tabpanel" id="calc-panel" aria-labelledby={`calc-tab-${tab}`} className="overflow-x-auto">
        <table>
          <thead><tr><th scope="col">Asset</th><th scope="col" className="num">Collateral Value (USD)</th><th scope="col" className="num">Advance Rate</th><th scope="col" className="num">Lendable Value</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.label}
                  {OUTSIDE_ROWS.find((x) => x.id === r.id)?.issuer && (
                    <label className="flex items-center gap-2 mt-1 t-helper-01">
                      <input type="checkbox" className="w-4 h-4" disabled={locked} checked={!!req.outsideIssuer?.[r.id]} onChange={(e) => update({ outsideIssuer: { ...(req.outsideIssuer ?? {}), [r.id]: e.target.checked } })} />
                      Single issuer
                    </label>
                  )}
                  {r.concentrated && <span className="block t-helper-01 text-[var(--cds-text-error)]">Over {Math.round(CONCENTRATION_CAP * 100)}% of selected market value · provisional {Math.round(PROVISIONAL_RATE * 100)}%</span>}</td>
                <td className="num">
                  <label className="sr-only" htmlFor={`calc-${r.id}`}>{r.label}: Collateral Value (USD)</label>
                  <input id={`calc-${r.id}`} className="calc__in" inputMode="decimal" disabled={locked} value={draft[r.id] ?? (vals[r.id] ? vals[r.id].toLocaleString('en-US') : '')} placeholder="0"
                    onChange={(e) => set(r.id, e.target.value)}
                    onBlur={() => { setDraft((d) => { const n = { ...d }; delete n[r.id]; return n; }); if (vals[r.id]) log('Calculator value entered', `${r.label}: ${fmtMoney(vals[r.id])}`, s.requestId); }} />
                </td>
                <td className="num">{fmtPct(r.rate)}{r.concentrated && <span className="block t-helper-01 text-[var(--cds-text-secondary)]">standard {fmtPct(r.baseRate)}</span>}</td>
                <td key={flash === r.id ? `${r.id}-${r.value}` : r.id} className={cx('num font-semibold', flash === r.id && 'calc__flash')}><Money value={r.lendable} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* One polite announcement of the outcome, not of the whole block (which also holds an input). */}
      <p className="sr-only" aria-live="polite">Total Maximum Borrowing Power {fmtMoney(ev.total)}. {capacity >= 0 ? `Remaining capacity ${fmtMoney(capacity)}` : `${fmtMoney(-capacity)} short of the Requested Loan Amount`}.</p>
      <div className="calc__totals">
        <dl><KV label="Held-away lendable value" value={<span className="t-heading-03 tabular-nums">{fmtMoney(ev.outside.lendable)}</span>} /></dl>
        <dl><KV label="Total Maximum Borrowing Power" value={<span className="t-heading-03 tabular-nums">{fmtMoney(ev.total)}</span>} /></dl>
        <div>
          <label htmlFor="calc-requested" className="t-label-01 text-[var(--cds-text-secondary)] block">Requested Loan Amount (USD)</label>
          <input id="calc-requested" className="calc__in mt-1 !w-full" inputMode="numeric" disabled={locked} value={req.requested ? req.requested.toLocaleString('en-US') : ''} onChange={(e) => update({ requested: Number(e.target.value.replace(/[^0-9]/g, '')) || 0 })} aria-describedby="calc-capacity" />
        </div>
        <dl><KV label={capacity >= 0 ? 'Remaining capacity' : 'Shortfall'} value={<span id="calc-capacity" className={cx('t-heading-03 tabular-nums', capacity < 0 && 'text-[var(--cds-text-error)]')}>{fmtMoney(Math.abs(capacity))}{capacity < 0 ? ' short' : ''}</span>} /></dl>
      </div>
    </div>
  );
}
