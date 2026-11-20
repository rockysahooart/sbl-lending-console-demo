import { useEffect, useState, type ReactNode } from 'react';
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
import { ATTESTATIONS, nowStamp, useAfterRequest, type RequestModel } from './state';
import { reviewUpside } from './guidance';
import { KV, Money, Tag, TextField, cx, type Tone } from './ui';
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

/** Collapsible section with the heading on the left and its Maximum Borrowing Power on the right, as in the original. */
export function EvalSection({ id, title, metric, children, defaultOpen = true }: { id: string; title: string; metric?: number; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section id={id} tabIndex={-1} aria-labelledby={`${id}-h`} className="eval-section focus:outline-none">
      <div className="eval-section__head flex items-center justify-between gap-4 px-6 py-4">
        <button type="button" className="eval-toggle flex items-center gap-2 text-left" aria-expanded={open} aria-controls={`${id}-body`} onClick={() => setOpen(!open)}>
          <ChevronDown size={20} aria-hidden="true" className={cx('transition-transform', !open && '-rotate-90')} />
          <h2 id={`${id}-h`} className="t-heading-03">{title}</h2>
        </button>
        {metric != null && (
          <div className="text-right">
            <p className="t-label-01 text-[var(--cds-text-secondary)]">Maximum Borrowing Power</p>
            <p className="t-heading-03 tabular-nums !font-semibold"><Money value={metric} /></p>
          </div>
        )}
      </div>
      {open && <div id={`${id}-body`} className="eval-section__body">{children}</div>}
    </section>
  );
}

export function Evaluation({ id, onRoute, ack: ackOpen = false, onAck }: { id: ScenarioId; onRoute: (r: Route) => void; ack?: boolean; onAck?: (open: boolean) => void }) {
  const m = useAfterRequest(id);
  const { s, req, ev, changeEstimate, acknowledged, update } = m;
  const { scenario, adoptScenario } = useDemo();
  const [ack, setAckState] = useState(ackOpen);
  const setAck = (open: boolean) => { setAckState(open); onAck?.(open); };
  const [pdf, setPdf] = useState(false);
  useEffect(() => { if (scenario !== id) adoptScenario(id); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const started = acknowledged || req.visited.length > 0;
  const locked = req.status !== 'draft';
  const autoRows = ev.rows;
  const manualRows = ev.rows.filter((r) => r.status === 'review' || r.status === 'reviewed');
  const autoTotal = ev.rows.filter((r) => r.status === 'auto').reduce((t, r) => t + r.lendable, 0);
  const manualTotal = manualRows.reduce((t, r) => t + r.lendable, 0);
  const selectable = ev.rows.filter((r) => r.status !== 'ineligible');
  const selected = ev.rows.filter((r) => r.pledged).length;
  const allSelected = selectable.every((r) => r.pledged);
  const toggleAll = () => {
    const next = { ...req.pledged };
    selectable.forEach((r) => { next[r.account.id] = !allSelected; });
    changeEstimate({ pledged: next }, allSelected ? 'Deselected all accounts' : 'Selected all accounts');
  };
  const start = () => {
    if (locked) { onRoute({ page: 'review', id: s.requestId }); return; }
    if (acknowledged) onRoute({ page: 'request', id, section: req.section });
    else setAck(true);
  };

  return (
    <div className="px-4 sm:px-8 pt-6 w-page mx-auto">
      <fieldset disabled={locked} className="min-w-0">
        <legend className="sr-only">Evaluation for {s.requestId}</legend>
        {locked && <InlineNotification kind="info" lowContrast hideCloseButton className="!max-w-none mb-4" title="Submitted to underwriting" subtitle={`Submitted ${req.submittedAt}. This evaluation is read-only.`} />}

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
                <li key={r.account.id} className={cx('eval-tile p-4 border', r.pledged ? 'is-selected' : '', r.status === 'ineligible' && 'opacity-90')}>
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

        <EvalSection id="total-evaluation" title="Total Evaluation" metric={ev.total}>
          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              ['Auto Evaluation', autoTotal],
              ['Manual Evaluation', manualTotal],
              ['Total Evaluations', ev.total],
            ].map(([l, v]) => (
              <div key={l as string}>
                <dt className="t-body-01">{l}<span className="block t-label-01 text-[var(--cds-text-secondary)]">Maximum Borrowing Power</span></dt>
                <dd className="t-heading-05 tabular-nums mt-1 text-[var(--cds-link-primary)]"><Money value={v as number} /></dd>
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
        <Button kind="ghost" size="md" onClick={() => onRoute({ page: 'console' })}>Back</Button>
        <div className="flex flex-wrap items-center justify-end gap-4">
          {pdf && <p className="t-helper-01 text-[var(--cds-text-secondary)]" role="status">Evaluation PDF prepared (simulated)</p>}
          <Button kind="tertiary" size="md" renderIcon={DocumentPdf} onClick={() => { setPdf(true); m.log('Evaluation PDF generated (simulated)', `Total Maximum Borrowing Power ${fmtMoney(ev.total)}`, s.requestId); }}>Generate PDF</Button>
          <Button size="md" onClick={start}>{locked ? 'View in Pending Review' : started ? 'Continue Request' : 'Start Request'}</Button>
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
  const [reviewing, setReviewing] = useState<string | null>(null);
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
                  <TableHead><TableRow><TableHeader>Data</TableHeader><TableHeader className="num">Collateral Value</TableHeader><TableHeader className="num">Advance rate</TableHeader><TableHeader className="num">Lendable Value</TableHeader></TableRow></TableHead>
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
                  <p className="t-helper-01 text-[var(--cds-text-secondary)] max-w-3xl">{r.explanation}</p>
                  {r.status === 'review' && role === 'Relationship Banker' && (requested ? (
                    <Tag tone="pending">Awaiting credit officer review</Tag>
                  ) : (
                    <Button kind="tertiary" size="sm" onClick={() => { update({ reviewRequested: { ...req.reviewRequested, [r.account.id]: nowStamp() } }); log('Collateral review requested', `${r.account.name} ${r.account.number}`, s.requestId); }}>Request credit officer review</Button>
                  ))}
                  {role === 'Credit Officer' && (
                    <Button kind={r.status === 'review' ? 'primary' : 'tertiary'} size="sm" onClick={() => setReviewing(r.account.id)}>{r.status === 'review' ? 'Complete review' : 'Revise review'}</Button>
                  )}
                </div>
              </div>
            );
          })}
        </>
      )}
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
