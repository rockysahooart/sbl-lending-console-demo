import { useEffect, useMemo, useState } from 'react';
import { ActionableNotification, Button, Checkbox, InlineNotification, Modal, Select, SelectItem, TextArea, TextInput, RadioButton, RadioButtonGroup, Pagination, Table, TableBody, TableCell, TableContainer, TableHead, TableHeader, TableRow } from '@carbon/react';
import { CheckmarkFilled, Time } from '@carbon/icons-react';
import { ACTIVE_LINES, PIPELINE, fmtMoney, fmtPct, type ActiveLine, type ScenarioId } from '../data';
import { nowStamp, useAfterRequest, useAudit, type Condition, type RequestModel } from './state';
import { KV, Money, PageHeader, StatusTag, Tag, cx } from './ui';
import { landOn } from './Evaluation';
import { ActionCell, ActiveFilters, ColHeader, useColumns, type Col } from './columns';
import { QueueToolbar, type SearchBy } from './Console';
import { appState, submittedRefState, STATUS_ORDER, type AppState } from './lifecycle';
import { LINE_REFS, SUBMITTED_REFS, type SubmittedRef } from './records';
import type { Route } from './AfterApp';

function useScenarioLines() {
  // Fixed order of hook calls (three scenarios).
  return (['single', 'joint', 'complex'] as ScenarioId[]).map((id) => ({ id, m: useAfterRequest(id) }));
}

/** Approved limit used by the simulated decision: lower of the Requested Loan Amount and Total Maximum Borrowing Power, rounded down to $10,000. */

/** Pending Review lists borrowers by name: drop the Console's "(Individual)" / "(Joint)" business-name suffix so every row reads the same (ADA-09). */
const borrowerName = (business: string) => business.replace(/ \((Individual|Joint)\)$/, '');

/** Simulated Credit Underwriting events are recorded as Credit Underwriting, not as the signed-in banker (ADA-11). */
const UNDERWRITING_ACTOR = { user: 'Credit Underwriting (simulated)', role: 'Credit Underwriting' };
const approvedLimit = (requested: number, power: number) => Math.floor(Math.min(requested, power) / 10000) * 10000;

export function Underwriting({ focusId, fix, onRoute, onSelect }: { focusId?: string; fix?: string; onRoute: (r: Route) => void; onSelect?: (id?: string) => void }) {
  const lines = useScenarioLines();
  const { log, setGlobal, global } = useAudit();
  const logUnderwriting = (event: string, detail: string, requestId: string) =>
    setGlobal((g) => ({ ...g, audit: [{ at: nowStamp(), ...UNDERWRITING_ACTOR, event, detail, requestId }, ...g.audit] }));
  const [confirmFor, setConfirmFor] = useState<string | null>(null);
  const rows = [
    ...lines.filter((l) => ['submitted', 'approved', 'declined'].includes(l.m.req.status)).map((l) => ({ key: l.m.s.requestId, client: l.m.s.entityName ?? l.m.s.primary.name, applicant: l.m.s.primary.name, requested: l.m.req.requested, power: l.m.ev.total, submitted: l.m.req.submittedAt ?? '', status: l.m.req.status, scenario: l, line: false, ref: undefined as SubmittedRef | undefined })),
    ...PIPELINE.filter((p) => p.status === 'In Underwriting').map((p) => ({ key: p.requestId, client: p.client, applicant: p.client, requested: p.requestedAmount, power: p.borrowingPower, submitted: '11/12/2025', status: 'submitted' as 'submitted' | 'approved', scenario: undefined, line: false, ref: undefined as SubmittedRef | undefined })),
    ...SUBMITTED_REFS.map((r) => ({ key: r.id, client: borrowerName(r.business), applicant: r.applicant, requested: r.requested, power: r.power, submitted: r.submitted, status: (r.decision === 'Approved' ? 'approved' : 'submitted') as 'submitted' | 'approved', scenario: undefined, line: false, ref: r as SubmittedRef | undefined })),
    ...ACTIVE_LINES.map((l) => ({ key: l.id, client: l.client, applicant: l.client, requested: l.limit, power: l.collateralValue, submitted: l.approvedOn, status: 'approved' as 'submitted' | 'approved', scenario: undefined, line: true, ref: undefined as SubmittedRef | undefined })),
  ];
  const [by, setBy] = useState<SearchBy>('id');
  const [q, setQ] = useState('');
  const [newest, setNewest] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  // Status, detail and next action come from lifecycle.ts, so this queue agrees with the Console.
  const life = (r: (typeof rows)[number]): AppState =>
    r.scenario ? appState(r.scenario.m, global.signedLines.includes(r.key))
      : r.ref ? submittedRefState(r.ref)
        : r.line ? { status: 'Completed', detail: 'Line active', queue: 'submitted', inUnderwriting: false, items: [], why: 'Approved, documents signed, and the line is active.' }
          : { status: 'Under Review', detail: 'In credit underwriting', queue: 'submitted', inUnderwriting: true, items: [], why: 'Credit Underwriting is reviewing the request. Nothing is needed from you.' };
  const underwriterStatus = (r: (typeof rows)[number]): string => life(r).status;
  const [statuses, setStatuses] = useState<string[]>([]);
  const shown = useMemo(() => {
    const n = q.trim().toLowerCase();
    const ts = (d: string) => { const [mm, dd, yy] = d.split(',')[0].split('/').map(Number); return new Date(yy, mm - 1, dd).getTime() || 0; };
    return rows
      .filter((r) => !n || (by === 'id' ? r.key : by === 'business' ? r.client : r.applicant).toLowerCase().includes(n))
      .filter((r) => !statuses.length || statuses.includes(underwriterStatus(r)))
      .sort((a, b) => (newest ? ts(b.submitted) - ts(a.submitted) : ts(a.submitted) - ts(b.submitted)));
  }, [rows, q, by, newest, statuses]); // eslint-disable-line react-hooks/exhaustive-deps
  const [sel, setSelState] = useState<string | undefined>(focusId && rows.some((r) => r.key === focusId) ? focusId : undefined);
  const setSel = (id?: string) => { setSelState(id); onSelect?.(id); };
  // Arriving with an application selected (Before/After toggle, history): bring its detail into view.
  useEffect(() => { if (sel) setTimeout(() => landOn(document.getElementById('review-detail')), 80); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const cur = rows.find((r) => r.key === sel);
  const refHeading = !cur?.ref ? '' : cur.ref.decision === 'Approved' ? `Approved by Credit Underwriting · ${fmtMoney(cur.ref.approvedLimit ?? 0)} limit` : cur.ref.decision === 'Declined' ? 'Declined by Credit Underwriting' : cur.ref.conditions.length ? `${cur.ref.conditions.length} open condition from Credit Underwriting` : cur.ref.status === 'Pending Credit Committee' ? 'Credit Committee' : 'Credit Underwriting · decision due in 2 business days';
  /** PAUL-08: return to this application's row in the queue (its page, in view, its Evaluate button focused). */
  const backToRow = (key: string) => {
    const i = shown.findIndex((r) => r.key === key);
    if (i >= 0) setPage(Math.floor(i / pageSize) + 1);
    requestAnimationFrame(() => { const btn = document.querySelector<HTMLElement>(`[aria-label="Evaluate ${key}"]`); if (btn) landOn(btn, 'nearest'); });
  };
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  type UR = (typeof rows)[number];
  const finalOf = (r: UR) => { const st = life(r).status; return st === 'Completed' ? 'Booked' : st === 'Approved' || st === 'Declined' ? st : 'Pending'; };
  const colsDef: Col<UR>[] = [
    { key: 'id', label: 'Application ID', type: 'text', get: (r) => r.key },
    { key: 'borrower', label: 'Borrower Name', type: 'text', get: (r) => r.client },
    { key: 'loan', label: 'Loan Type', type: 'enum', get: () => 'Securities-Based Line of Credit' },
    { key: 'requested', label: 'Requested Amount', type: 'number', num: true, money: true, get: (r) => r.requested },
    { key: 'status', label: 'Underwriter Status', type: 'enum', get: (r) => life(r).status },
    { key: 'final', label: 'Final Decision', type: 'enum', get: finalOf },
    { key: 'updated', label: 'Last Updated', type: 'date', get: (r) => r.submitted },
    { key: 'action', label: 'Actions', type: 'enum', noSort: true, get: (r) => (life(r).status === 'Action Required' ? 'Respond' : 'View') },
  ];
  const cols = useColumns(shown, colsDef, () => setPage(1));
  const pages = Math.max(1, Math.ceil(cols.rows.length / pageSize));
  const curPage = Math.min(page, pages);
  const visible = cols.rows.slice((curPage - 1) * pageSize, curPage * pageSize);
  const target = rows.find((r) => r.key === confirmFor);
  const [conditionFor, setConditionFor] = useState<string | null>(null);
  const openOf = (r?: (typeof rows)[number]) => (r?.scenario?.m.req.conditions ?? []).filter((c) => c.status === 'open');
  const condTarget = rows.find((r) => r.key === conditionFor);
  const [returnFor, setReturnFor] = useState<string | null>(null);
  const returnTarget = rows.find((r) => r.key === returnFor);
  /** A simulated underwriting event: changes the request and is recorded in its submission history. */
  const uwEvent = (r: (typeof rows)[number], event: string, detail: string, patch: (p: RequestModel['req']) => Partial<RequestModel['req']>) => {
    const at = nowStamp();
    r.scenario!.m.setReq((p) => ({ ...p, ...patch(p), history: [...(p.history ?? []), { at, event, detail, by: 'Credit Underwriting (simulated)' }] }));
    logUnderwriting(event, detail, r.key);
  };
  const issue = (r: (typeof rows)[number], kind: 'question' | 'decision', text: string, terms?: number) =>
    uwEvent(r, kind === 'question' ? 'Question from underwriting (simulated)' : 'Decision issued: approval on changed terms (simulated)', text, (p) => ({ uwStage: 'review', conditions: [...(p.conditions ?? []), { id: `c${(p.conditions ?? []).length + 1}`, kind, text, terms, status: 'open', at: nowStamp() }] }));
  // Arriving to respond to a condition: land on the conditions and mark them.
  useEffect(() => { if (fix === 'conditions') setTimeout(() => { const el = document.getElementById('conditions'); if (el) { el.setAttribute('data-fix', 'correction'); landOn(el); } }, 140); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  /** The banker's answer to a finding. Every response is kept in the submission history. */
  const respond = (r: (typeof rows)[number], c: Condition, resp: Resp) => {
    const at = nowStamp();
    const by = 'S. Mitchell · Loan Officer';
    r.scenario!.m.setReq((p) => {
      const conditions = (p.conditions ?? []).map((x) => (x.id === c.id ? { ...x, status: 'provided' as const, providedAt: at, response: resp.text } : x));
      const hist = [...(p.history ?? [])];
      if (c.kind === 'decision') {
        hist.push({ at, event: `Borrower response recorded: ${resp.decision}`, detail: `${resp.method}, communicated ${resp.date}. ${resp.text}`.trim(), by });
        if (resp.decision === 'Accept') {
          hist.push({ at, event: 'Approved on revised terms', detail: `Requested amount ${fmtMoney(p.requested)} → ${fmtMoney(c.terms ?? p.requested)}`, by: 'Credit Underwriting (simulated)' });
          return { ...p, conditions, history: hist, requested: c.terms ?? p.requested, status: 'approved', approvedAt: at };
        }
        if (resp.decision === 'Deny') return { ...p, conditions, history: hist, status: 'declined', declinedAt: at };
        return { ...p, conditions, history: hist, uwStage: 'review' };
      }
      hist.push({ at, event: c.kind === 'question' ? 'Question answered' : 'Condition provided', detail: resp.text ? `${c.text} — ${resp.text}` : c.text, by });
      return { ...p, conditions, history: hist, uwStage: 'review' };
    });
    log(c.kind === 'decision' ? 'Borrower response recorded' : c.kind === 'question' ? 'Question answered' : 'Condition provided', 'Response sent to Credit Underwriting', r.key);
  };

  return (
    <div className="px-4 sm:px-8 py-8 w-page mx-auto">
      <PageHeader title="Post-Underwriting Review Queue" description="Applications reviewed by underwriting awaiting final banker decisioning. Credit Underwriting owns the credit decision; conditions that need your response appear here." />
      <div className="grid grid-cols-1 gap-6 items-start">
        <section className="sbl-queue min-w-0" aria-label="Post-underwriting review queue">
          <QueueToolbar by={by} onBy={(v) => { setBy(v); setQ(''); setPage(1); }} q={q} onQ={(v) => { setQ(v); setPage(1); }} newest={newest} onSort={() => setNewest(!newest)} filterOpen={filterOpen} onFilter={() => setFilterOpen(!filterOpen)} filterCount={statuses.length} nameLabel="Borrower Name">
            {filterOpen && (
              <div className="queue-filters">
                <fieldset>
                  <legend className="t-label-01 text-[var(--cds-text-secondary)] mb-2">Underwriter Status</legend>
                  {STATUS_ORDER.filter((x) => rows.some((r) => underwriterStatus(r) === x)).map((st) => (
                    <Checkbox key={st} id={`uw-${st}`} labelText={st} checked={statuses.includes(st)} onChange={(_: unknown, { checked }: { checked: boolean }) => { setStatuses(checked ? [...statuses, st] : statuses.filter((x) => x !== st)); setPage(1); }} />
                  ))}
                </fieldset>
                {statuses.length > 0 && <Button kind="ghost" size="sm" className="self-end" onClick={() => { setStatuses([]); setPage(1); }}>Clear filters</Button>}
              </div>
            )}
          </QueueToolbar>
          <ActiveFilters st={cols} count={cols.rows.length} total={shown.length} noun="applications" />
          <div className="overflow-x-auto">
            <Table aria-label="Post-underwriting review queue" size="lg" className="queue-table min-w-[1120px]">
              <TableHead>
                <TableRow>
                  {colsDef.map((c) => <ColHeader key={c.key} st={cols} k={c.key} className={c.num ? 'num' : undefined} />)}
                </TableRow>
              </TableHead>
              <TableBody>
                {visible.length === 0 && (
                  <TableRow className="empty-row"><TableCell colSpan={8}><div className="py-8 text-center"><p className="t-heading-02">{rows.length ? 'No applications match' : 'No applications are in underwriting.'}</p>{rows.length > 0 && <><p className="t-body-01 text-[var(--cds-text-secondary)] mt-1">Check the spelling or clear the search and filters.</p><Button kind="tertiary" size="sm" className="mt-4" onClick={() => { setQ(''); setStatuses([]); cols.clearAll(); setPage(1); }}>Clear search and filters</Button></>}</div></TableCell></TableRow>
                )}
                {visible.map((r) => {
                  const lf = life(r);
                  const st = lf.status;
                  return (
                    <TableRow key={r.key} isSelected={sel === r.key}>
                      <TableCell className="font-semibold tabular-nums whitespace-nowrap">{r.key}</TableCell>
                      <TableCell>{r.client}</TableCell>
                      <TableCell className="cell-secondary whitespace-nowrap">Securities-Based Line of Credit</TableCell>
                      <TableCell className="num"><Money value={r.requested} /></TableCell>
                      <TableCell><StatusTag status={lf.status} detail={lf.detail} /></TableCell>
                      <TableCell>{st === 'Completed' ? 'Booked' : st === 'Approved' || st === 'Declined' ? st : <span className="cell-secondary">Pending</span>}</TableCell>
                      <TableCell className="cell-secondary tabular-nums whitespace-nowrap">{r.submitted.split(',')[0]}</TableCell>
                      <TableCell>
                        <ActionCell status={st} label={st === 'Action Required' ? 'Respond' : 'View'} id={r.key} pressed={sel === r.key} onClick={() => { setSel(r.key); setTimeout(() => landOn(document.getElementById('review-detail'), 'nearest'), 50); }} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <div className="queue-footer">
            <Pagination page={curPage} pageSize={pageSize} pageSizes={[10, 20, 50]} totalItems={cols.rows.length} size="md" itemsPerPageText="Applications per page" itemRangeText={(min: number, max: number, total: number) => `Showing ${min} to ${max} of ${total} applications`} pageRangeText={(_: number, total: number) => `of ${total} page${total === 1 ? '' : 's'}`} onChange={({ page: p, pageSize: z }: { page: number; pageSize: number }) => { setPage(p); setPageSize(z); }} />
          </div>
        </section>
        {cur && (
          <section id="review-detail" tabIndex={-1} aria-label={`Underwriting detail for ${cur.client}`} className="status-panel p-6 focus:outline-none">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="t-heading-03">{cur.client}</h2>
              <StatusTag status={life(cur).status} detail={life(cur).detail} />
            </div>
            <p className="t-helper-01 text-[var(--cds-text-secondary)]">{cur.key}</p>
            <p className="t-body-01 mt-2">{life(cur).why}</p>
            <div className="mt-6 callout px-4 py-3">
              {cur.ref ? (
                <>
                  <p className="t-label-01 text-[var(--cds-text-secondary)]">{cur.ref.decision !== 'Pending' ? 'Decision' : cur.ref.conditions.length ? 'Needs your response' : 'Waiting on'}</p>
                  <p className="t-heading-02 mt-0.5">{refHeading}</p>
                  {/* PAUL-08: don't repeat the heading in the note. */}
                  {!refHeading.toLowerCase().includes(cur.ref.note.toLowerCase().replace(/\.$/, '')) && <p className="t-body-01 mt-1">{cur.ref.note}</p>}
                </>
              ) : (
                <>
                  <p className="t-label-01 text-[var(--cds-text-secondary)]">{cur.status === 'approved' ? 'Decision' : openOf(cur).length ? 'Needs your response' : 'Waiting on'}</p>
                  <p className="t-heading-02 mt-0.5">{cur.status === 'approved' ? 'Approved by Credit Underwriting' : cur.status === 'declined' ? 'Declined by Credit Underwriting' : openOf(cur).length ? `${openOf(cur).length} open condition${openOf(cur).length > 1 ? 's' : ''} from Credit Underwriting` : cur.scenario?.m.req.uwStage === 'review' ? 'Credit Underwriting · under review' : 'Credit Underwriting · awaiting pickup'}</p>
                  <p className="t-body-01 mt-1">{cur.status === 'approved' ? 'Next: monitor documents and collateral in Active Credit.' : cur.status === 'declined' ? 'The request is closed.' : openOf(cur).length ? 'The decision follows once each condition is provided.' : 'No action is needed from you. Conditions, if any, will appear here.'}</p>
                </>
              )}
            </div>
            {(cur.scenario?.m.req.conditions ?? []).length > 0 && (
              <section id="conditions" tabIndex={-1} aria-labelledby="cond-h" className="mt-6 focus:outline-none">
                <h3 id="cond-h" className="t-heading-02">Underwriting findings</h3>
                <p className="t-helper-01 text-[var(--cds-text-secondary)] mt-1">Respond to each open finding. Bankers can’t approve or decline; Credit Underwriting owns the decision.</p>
                <ul className="mt-3 space-y-3">
                  {cur.scenario!.m.req.conditions!.map((c) => (
                    <li key={c.id}><Finding c={c} client={cur.client} requested={cur.requested} onRespond={(resp) => respond(cur, c, resp)} /></li>
                  ))}
                </ul>
              </section>
            )}
            {cur.ref && cur.ref.conditions.length > 0 && (
              <section id="conditions" tabIndex={-1} aria-labelledby="refcond-h" className="mt-6 focus:outline-none">
                <h3 id="refcond-h" className="t-heading-02">Conditions</h3>
                <ul className="mt-2 border-t border-[var(--cds-border-subtle-01)]">
                  {cur.ref.conditions.map((c) => (
                    <li key={c} className="py-3 border-b border-[var(--cds-border-subtle-01)] flex items-start justify-between gap-3"><p className="t-body-01">{c}</p><Tag tone="warning">Open</Tag></li>
                  ))}
                </ul>
              </section>
            )}
            <dl className="grid grid-cols-2 gap-4 mt-6">
              <KV label="Underwriter" value="Credit Underwriting" />
              <KV label="Submitted" value={cur.submitted ? cur.submitted.split(',')[0] : '—'} mono />
              <KV label="Requested amount" value={fmtMoney(cur.requested)} mono />
              <KV label={cur.line ? 'Collateral market value' : 'Total Maximum Borrowing Power'} value={fmtMoney(cur.power)} mono />
            </dl>
            <h3 className="t-heading-02 mt-6">Documentation</h3>
            <ul className="mt-2 space-y-2 t-body-01">
              {[
                ['Credit application', true],
                ['Collateral evaluation and reviews', true],
                ['Identification, screening and ownership records', true],
                ['Pledge and control agreement', cur.status === 'approved' && cur.ref?.decision !== 'Declined'],
              ].map(([d, ok]) => (
                <li key={d as string} className="flex items-center gap-2">
                  {ok ? <CheckmarkFilled size={16} className="fill-[var(--cds-support-success)]" aria-hidden="true" /> : <Time size={16} aria-hidden="true" />}
                  <span>{d}</span>
                  <span className="ml-auto t-helper-01 text-[var(--cds-text-secondary)]">{ok ? 'Received' : 'Issued after approval'}</span>
                </li>
              ))}
            </ul>
            {cur.scenario ? (
              cur.status === 'approved' ? (
                <InlineNotification kind="success" lowContrast hideCloseButton className="!max-w-none mt-6" title="Approved" subtitle={`Approved credit limit ${fmtMoney(approvedLimit(cur.requested, cur.power))}, ${cur.scenario.m.req.approvedAt}.`} />
              ) : cur.status === 'declined' ? (
                <InlineNotification kind="error" lowContrast hideCloseButton className="!max-w-none mt-6" title="Declined" subtitle={`Declined ${cur.scenario.m.req.declinedAt}. The submission history is kept on the request.`} />
              ) : (
                <section aria-labelledby="uw-sim-h" className="mt-6 border border-dashed border-[var(--cds-border-strong-01)] p-4">
                  <h3 id="uw-sim-h" className="t-heading-01">Credit Underwriting (simulated)</h3>
                  <p className="t-helper-01 text-[var(--cds-text-secondary)] mt-1">Demo controls that stand in for the underwriter. They are not banker actions: a banker can respond, correct and resubmit, but never approve.</p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    {cur.scenario.m.req.uwStage !== 'review' && <Button kind="ghost" size="sm" onClick={() => uwEvent(cur, 'Underwriting review started (simulated)', 'Assigned to an underwriter', () => ({ uwStage: 'review' }))}>Start review</Button>}
                    {openOf(cur).length === 0 && <>
                      <Button kind="ghost" size="sm" onClick={() => issue(cur, 'question', 'Explain the source of the $250,000 deposit to the pledged brokerage account on 10/02/2025.')}>Ask a question</Button>
                      <Button kind="ghost" size="sm" onClick={() => setConditionFor(cur.key)}>Add a condition</Button>
                      <Button kind="ghost" size="sm" onClick={() => setReturnFor(cur.key)}>Return for correction</Button>
                      <Button kind="ghost" size="sm" onClick={() => issue(cur, 'decision', `Approve at a reduced limit of ${fmtMoney(Math.round(cur.requested * 0.8 / 1000) * 1000)}: the collateral mix supports less than requested. The borrower must accept the revised terms.`, Math.round(cur.requested * 0.8 / 1000) * 1000)}>Approve with changed terms</Button>
                      <Button kind="ghost" size="sm" onClick={() => setConfirmFor(cur.key)}>Approve</Button>
                      <Button kind="ghost" size="sm" onClick={() => uwEvent(cur, 'Underwriting decision (simulated)', 'Declined: estimated borrowing power not supported after revaluation', () => ({ status: 'declined', declinedAt: nowStamp() }))}>Decline</Button>
                    </>}
                  </div>
                  {openOf(cur).length > 0 && <p className="t-helper-01 text-[var(--cds-text-secondary)] mt-2">Underwriting waits for your response to the open finding before its next step.</p>}
                </section>
              )
            ) : (
              <p className="t-helper-01 text-[var(--cds-text-secondary)] mt-6">Reference record{cur.line ? ': approved and booked as an active credit line' : ''}. Decisions can be simulated on the three scenario requests.</p>
            )}
            <div className="mt-6 flex flex-wrap gap-3">
              {cur.status === 'approved' && (cur.scenario || cur.line) && <Button size="sm" onClick={() => onRoute({ page: 'credit', id: cur.key })}>View credit line</Button>}
              {cur.scenario && <Button kind="ghost" size="sm" onClick={() => onRoute({ page: 'request', id: cur.scenario!.id, section: 'customer' })}>View loan details</Button>}
              <Button kind="ghost" size="sm" onClick={() => backToRow(cur.key)}>Back to Pending Review</Button>
            </div>
          </section>
        )}
      </div>
      <Modal
        open={!!condTarget}
        size="sm"
        modalHeading="Simulate an underwriting condition?"
        primaryButtonText="Simulate condition"
        secondaryButtonText="Cancel"
        onRequestClose={() => setConditionFor(null)}
        onRequestSubmit={() => {
          if (!condTarget?.scenario) return;
          const text = 'Provide the most recent month-end statement for each pledged account.';
          uwEvent(condTarget, 'Underwriting condition issued (simulated)', text, (p) => ({ uwStage: 'review', conditions: [...(p.conditions ?? []), { id: `c${(p.conditions ?? []).length + 1}`, kind: 'condition', text, status: 'open', at: nowStamp() }] }));
          setConditionFor(null);
        }}
      >
        {condTarget && <p className="t-body-01">Demo action. Credit Underwriting asks {condTarget.client}’s banker for the most recent month-end statement for each pledged account. The request shows Condition Requested in Submitted Applications and here. No real request is made.</p>}
      </Modal>
      <Modal
        open={!!returnTarget}
        size="sm"
        modalHeading="Simulate a return for correction?"
        primaryButtonText="Simulate return"
        secondaryButtonText="Cancel"
        onRequestClose={() => setReturnFor(null)}
        onRequestSubmit={() => {
          if (!returnTarget?.scenario) return;
          uwEvent(returnTarget, 'Returned for correction (simulated)', 'Source of repayment not supported by statements; requested amount above approval authority', (p) => ({
            status: 'returned',
            returnedAt: nowStamp(),
            uwStage: undefined,
            corrections: [
              { id: 'repay', short: 'Correct the primary source of repayment', text: 'Underwriting could not reconcile the primary source of repayment with the client’s statements. Select the source the documents support.', field: 'repay1', previous: p.repay1, section: 'loan', anchor: 'loan-details' },
              { id: 'amount', short: 'Correct the requested loan amount', text: 'The request is above the officer’s approval authority for this collateral mix. Reduce the Requested Loan Amount, or route the request to the credit committee.', field: 'requested', previous: String(p.requested), section: 'customer', anchor: 'requested-amount' },
            ],
          }));
          setReturnFor(null);
        }}
      >
        {returnTarget && <p className="t-body-01">Demo action. Credit Underwriting returns {returnTarget.client}’s request to the loan officer with two corrections. It moves back to Evaluations as Action Required, keeps its submission history, and can be resubmitted once both are corrected. No real request is made.</p>}
      </Modal>
      <Modal
        open={!!target}
        size="sm"
        modalHeading="Simulate an approval?"
        primaryButtonText="Simulate approval"
        secondaryButtonText="Cancel"
        onRequestClose={() => setConfirmFor(null)}
        onRequestSubmit={() => {
          if (!target?.scenario) return;
          const at = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
          uwEvent(target, 'Underwriting decision (simulated)', `Approved; credit limit ${fmtMoney(approvedLimit(target.requested, target.power))}`, () => ({ status: 'approved', approvedAt: `11/19/2025, ${at}` }));
          setConfirmFor(null);
        }}
      >
        {target && (
          <p className="t-body-01">Demo action. This records a simulated approval for {target.client} with an approved credit limit of {fmtMoney(approvedLimit(target.requested, target.power))} (the lower of the Requested Loan Amount and the Total Maximum Borrowing Power). No real credit decision is made.</p>
        )}
      </Modal>
    </div>
  );
}

interface LineVM extends ActiveLine { scenarioId?: ScenarioId }

export function ActiveCredit({ focusId, onRoute, onSelect }: { focusId?: string; onRoute: (r: Route) => void; onSelect?: (id?: string) => void }) {
  const lines = useScenarioLines();
  const { global, setGlobal, log } = useAudit();
  const [confirmSign, setConfirmSign] = useState<string | null>(null);
  const approved: LineVM[] = lines
    .filter((l) => l.m.req.status === 'approved')
    .map((l) => {
      const signed = global.signedLines.includes(l.m.s.requestId);
      return {
        id: l.m.s.requestId,
        scenarioId: l.id,
        client: l.m.s.entityName ?? l.m.s.primary.name,
        approvedOn: l.m.req.approvedAt ?? '',
        limit: approvedLimit(l.m.req.requested, l.m.ev.total),
        outstanding: 0,
        collateralValue: l.m.ev.pledgedValue,
        maintenanceLtv: 0.7,
        docs: [
          { name: 'Credit agreement', status: signed ? 'Complete' : 'Pending signature' },
          { name: 'Pledge and control agreement', status: signed ? 'Complete' : 'Pending signature' },
        ],
        collateral: l.m.ev.rows.filter((r) => r.pledged).map((r) => ({ account: `${r.account.name} ${r.account.number}`, value: r.value, change30d: 0 })),
      };
    });
  const all: LineVM[] = [...approved, ...ACTIVE_LINES, ...LINE_REFS];
  const [lp, setLp] = useState(1);
  const [lps, setLps] = useState(10);
  const ltv = (l: LineVM) => (l.collateralValue ? l.outstanding / l.collateralValue : 0);
  const nearCall = (l: LineVM) => ltv(l) >= l.maintenanceLtv - 0.1;
  const lineCols: Col<LineVM>[] = [
    { key: 'client', label: 'Client and line', type: 'text', get: (l) => `${l.client} ${l.id}` },
    { key: 'limit', label: 'Approved credit limit', type: 'number', num: true, money: true, get: (l) => l.limit },
    { key: 'out', label: 'Outstanding balance', type: 'number', num: true, money: true, get: (l) => l.outstanding },
    { key: 'avail', label: 'Available credit', type: 'number', num: true, money: true, get: (l) => l.limit - l.outstanding },
    { key: 'coll', label: 'Collateral market value', type: 'number', num: true, money: true, get: (l) => l.collateralValue },
    { key: 'ltv', label: 'LTV %', type: 'number', num: true, get: (l) => Math.round(ltv(l) * 1000) / 10 },
    { key: 'docs', label: 'Documents', type: 'enum', get: (l) => (l.docs.some((d) => d.status !== 'Complete') ? 'Outstanding' : 'Complete') },
    { key: 'mon', label: 'Monitoring', type: 'enum', get: (l) => (nearCall(l) ? (global.acknowledgedAlerts.includes(l.id) ? 'Alert acknowledged' : 'LTV alert') : 'Within limits') },
  ];
  const lc = useColumns(all, lineCols, () => setLp(1));
  const linePages = Math.max(1, Math.ceil(lc.rows.length / lps));
  const lineVisible = lc.rows.slice((Math.min(lp, linePages) - 1) * lps, Math.min(lp, linePages) * lps);
  const [sel, setSelState] = useState(focusId && all.some((l) => l.id === focusId) ? focusId : all[0].id);
  const setSel = (id: string) => { setSelState(id); onSelect?.(id); };
  /** THEO-04: one way to open a line, from the alerts or the table: select it and land on its detail. */
  const openLine = (id: string) => { setSel(id); requestAnimationFrame(() => landOn(document.getElementById('credit-detail'), 'nearest')); };
  useEffect(() => {
    if (!focusId || focusId !== sel) return;
    const i = all.findIndex((l) => l.id === focusId);
    if (i >= lps) setLp(Math.floor(i / lps) + 1);
    setTimeout(() => landOn(document.getElementById('credit-detail')), 80);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const cur = all.find((l) => l.id === sel) ?? all[0];
  const events = global.audit.filter((e) => e.requestId === cur.id);
  // Attention: an unacknowledged LTV alert outranks outstanding documents.
  const attention = all.flatMap((l) => {
    const out: { key: string; line: LineVM; tone: 'error' | 'warning'; tag: string; text: string; action: string; rank: number }[] = [];
    if (nearCall(l) && !global.acknowledgedAlerts.includes(l.id)) out.push({ key: `${l.id}-ltv`, line: l, tone: 'error', tag: 'LTV alert', text: `LTV is ${fmtPct(ltv(l), 1)}, ${((l.maintenanceLtv - ltv(l)) * 100).toFixed(1)} points below the ${fmtPct(l.maintenanceLtv)} maintenance threshold. Contact the client about adding collateral or paying down the balance.`, action: 'Review LTV alert', rank: 0 });
    const docs = l.docs.filter((d) => d.status !== 'Complete');
    if (docs.length) out.push({ key: `${l.id}-docs`, line: l, tone: 'warning', tag: `${docs.length} document${docs.length > 1 ? 's' : ''} outstanding`, text: docs.map((d) => `${d.name} (${d.status.toLowerCase()})`).join(', ') + '.', action: 'Follow up on documents', rank: 1 });
    return out;
  }).sort((a, b) => a.rank - b.rank);

  return (
    <div className="px-4 sm:px-8 py-8 w-page mx-auto">
      <PageHeader title="Active Credit" description="Approved credit lines you service. Lines that need attention come first." />
      <section aria-labelledby="attn-h" className="mb-10">
        <h2 id="attn-h" className="t-heading-03">Needs attention <span className="tabular-nums">({attention.length})</span></h2>
        {attention.length === 0 ? (
          <p className="t-body-01 mt-2">All lines are within limits and documentation is complete.</p>
        ) : (
          <ul className="mt-3 border-t border-[var(--cds-border-strong-01)]">
            {attention.map((a) => (
              <li key={a.key} className="grid grid-cols-1 md:grid-cols-[minmax(0,260px)_minmax(0,1fr)_auto] gap-x-8 gap-y-2 items-center py-4 border-b border-[var(--cds-border-subtle-00)]">
                <div><p className="t-heading-compact-01">{a.line.client}</p><p className="t-helper-01 text-[var(--cds-text-secondary)]">{a.line.id}</p></div>
                {/* IRIS-10: the tag has its own track, so every explanation starts on one edge. */}
                <div className="grid grid-cols-1 sm:grid-cols-[11rem_minmax(0,1fr)] items-start gap-x-3 gap-y-1">
                  <span><Tag tone={a.tone}>{a.tag}</Tag></span>
                  <p className="t-body-01">{a.text}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 md:justify-end">
                  {a.rank === 0 ? (
                    <Button kind="tertiary" size="sm" onClick={() => { setGlobal((g) => ({ ...g, acknowledgedAlerts: [...g.acknowledgedAlerts, a.line.id] })); log('Collateral alert acknowledged', 'Client outreach scheduled', a.line.id); }} aria-label={`Acknowledge and schedule outreach: ${a.line.client}`}>Acknowledge and schedule outreach</Button>
                  ) : (global.remindersSent ?? []).includes(a.line.id) ? (
                    <Tag tone="success">Reminder sent</Tag>
                  ) : (
                    <Button kind="ghost" size="sm" onClick={() => { setGlobal((g) => ({ ...g, remindersSent: [...(g.remindersSent ?? []), a.line.id] })); log('Document reminder sent', 'Reminder sent to the client', a.line.id); }} aria-label={`Send document reminder: ${a.line.client}`}>Send document reminder</Button>
                  )}
                  <Button kind="ghost" size="sm" onClick={() => openLine(a.line.id)} aria-label={`View line: ${a.line.client}`}>View line</Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
      {/* FELIX-08: an h2 (TableContainer's title renders h4 and skipped a level). */}
      <h2 id="lines-h" className="t-heading-03">All credit lines</h2>
      <p className="t-body-01 text-[var(--cds-text-secondary)] mt-1 mb-4">Loan-to-value (LTV) = outstanding balance ÷ collateral market value. A maintenance call may be issued at the maintenance threshold.</p>
      <TableContainer aria-labelledby="lines-h">
        <ActiveFilters st={lc} count={lc.rows.length} total={all.length} noun="credit lines" />
        <div className="overflow-x-auto">
          <Table aria-label="Credit lines" size="lg" className="queue-table min-w-[1040px]">
            <TableHead>
              <TableRow>
                {lineCols.map((c) => <ColHeader key={c.key} st={lc} k={c.key} className={c.num ? 'num' : undefined} />)}
              </TableRow>
            </TableHead>
            <TableBody>
              {lineVisible.map((l) => {
                const acked = global.acknowledgedAlerts.includes(l.id);
                const docsOpen = l.docs.filter((d) => d.status !== 'Complete').length;
                return (
                  <TableRow key={l.id} isSelected={sel === l.id}>
                    <TableCell>
                      <Button kind="ghost" size="sm" className="!px-0" onClick={() => openLine(l.id)} aria-pressed={sel === l.id}>{l.client}</Button>
                      <div className="t-helper-01 text-[var(--cds-text-secondary)]">{l.id}</div>
                    </TableCell>
                    <TableCell className="num"><Money value={l.limit} /></TableCell>
                    <TableCell className="num"><Money value={l.outstanding} /></TableCell>
                    <TableCell className="num font-semibold"><Money value={l.limit - l.outstanding} /></TableCell>
                    <TableCell className="num"><Money value={l.collateralValue} /></TableCell>
                    <TableCell className="num">
                      <div className={cx(nearCall(l) && 'text-[var(--cds-text-error)] font-semibold')}>{fmtPct(ltv(l), 1)}</div>
                      <div className="t-helper-01 text-[var(--cds-text-secondary)]">{((l.maintenanceLtv - ltv(l)) * 100).toFixed(1)} pts below {fmtPct(l.maintenanceLtv)} threshold</div>
                    </TableCell>
                    <TableCell>{docsOpen ? <Tag tone="warning">{docsOpen} outstanding</Tag> : <Tag tone="success">Complete</Tag>}</TableCell>
                    <TableCell>{nearCall(l) ? <Tag tone={acked ? 'neutral' : 'error'}>{acked ? 'Alert acknowledged' : 'LTV alert'}</Tag> : <Tag tone="success">Within limits</Tag>}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        <div className="queue-footer">
          <Pagination page={Math.min(lp, linePages)} pageSize={lps} pageSizes={[10, 20, 50]} totalItems={lc.rows.length} size="md" itemsPerPageText="Lines per page" itemRangeText={(min: number, max: number, total: number) => `Showing ${min} to ${max} of ${total} credit lines`} pageRangeText={(_: number, total: number) => `of ${total} page${total === 1 ? '' : 's'}`} onChange={({ page: p, pageSize: z }: { page: number; pageSize: number }) => { setLp(p); setLps(z); }} />
        </div>
      </TableContainer>

      <section id="credit-detail" tabIndex={-1} aria-label={`Detail for ${cur.client}`} className="mt-10 border-t border-[var(--sbl-rule-strong)] focus:outline-none scroll-mt-4">
        <div className="py-4 border-b border-[var(--cds-border-subtle-00)] flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="t-heading-03">{cur.client}</h2>
            <p className="t-helper-01 text-[var(--cds-text-secondary)]">{cur.id} · Approved {cur.approvedOn}</p>
          </div>
          {cur.scenarioId && <Button kind="ghost" size="sm" onClick={() => onRoute({ page: 'request', id: cur.scenarioId!, section: 'customer' })}>View loan details</Button>}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="py-6 lg:pr-0">
            <div className="status-panel p-5">
            <h3 className="t-heading-02 mb-3">Credit</h3>
            <dl className="space-y-2 t-body-01 tabular-nums">
              <div className="flex justify-between"><dt className="text-[var(--cds-text-secondary)]">Approved credit limit</dt><dd><Money value={cur.limit} /></dd></div>
              <div className="flex justify-between"><dt className="text-[var(--cds-text-secondary)]">Outstanding balance</dt><dd><Money value={cur.outstanding} /></dd></div>
              <div className="flex justify-between items-baseline font-semibold pt-1"><dt>Available credit</dt><dd className="t-heading-03 !font-semibold"><Money value={cur.limit - cur.outstanding} /></dd></div>
            </dl>
            <h3 className="t-heading-02 mt-6 mb-2">Collateral coverage</h3>
            <div className="relative h-2 bg-[var(--cds-border-subtle-01)]" role="img" aria-label={`LTV ${fmtPct(ltv(cur), 1)}; maintenance threshold ${fmtPct(cur.maintenanceLtv)}`}>
              <div className={cx('h-full', nearCall(cur) ? 'bg-[var(--cds-support-error)]' : 'bg-[var(--cds-support-success)]')} style={{ width: `${Math.min(ltv(cur), 1) * 100}%` }} />
              <div className="absolute -top-1 h-4 w-0.5 bg-[var(--cds-text-primary)]" style={{ left: `${cur.maintenanceLtv * 100}%` }} />
            </div>
            <p className="t-helper-01 text-[var(--cds-text-secondary)] mt-2">LTV {fmtPct(ltv(cur), 1)}. Maintenance threshold {fmtPct(cur.maintenanceLtv)}.</p>
            {nearCall(cur) && (
              global.acknowledgedAlerts.includes(cur.id) ? (
                <InlineNotification kind="info" lowContrast hideCloseButton className="!max-w-none mt-4" title="Alert acknowledged" subtitle="Client outreach is scheduled." />
              ) : (
                <ActionableNotification
                  kind="error"
                  lowContrast
                  inline
                  hideCloseButton
                  className="!max-w-none mt-4"
                  title="LTV near maintenance threshold"
                  subtitle={`LTV is ${fmtPct(ltv(cur), 1)}, within 10 percentage points of the ${fmtPct(cur.maintenanceLtv)} threshold.`}
                  actionButtonLabel="Acknowledge and schedule outreach"
                  onActionButtonClick={() => { setGlobal((g) => ({ ...g, acknowledgedAlerts: [...g.acknowledgedAlerts, cur.id] })); log('Collateral alert acknowledged', 'Client outreach scheduled', cur.id); }}
                />
              )
            )}
            </div>
          </div>
          <div className="py-6">
            <h3 className="t-heading-02 mb-3">Collateral monitoring</h3>
            <Table size="sm" aria-label="Collateral monitoring">
              <TableHead><TableRow><TableHeader>Account</TableHeader><TableHeader className="num">Market value</TableHeader><TableHeader className="num">30-day change</TableHeader></TableRow></TableHead>
              <TableBody>
                {cur.collateral.map((c) => (
                  <TableRow key={c.account}>
                    <TableCell>{maskAccount(c.account)}</TableCell>
                    <TableCell className="num"><Money value={c.value} /></TableCell>
                    <TableCell className={cx('num', c.change30d < -0.05 && 'text-[var(--cds-text-error)] font-semibold')}>{c.change30d === 0 ? '—' : `${c.change30d > 0 ? '+' : ''}${(c.change30d * 100).toFixed(1)}%`}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="py-6">
            <h3 className="t-heading-02 mb-3">Documentation</h3>
            <ul className="space-y-2 t-body-01">
              {cur.docs.map((d) => (
                <li key={d.name} className="flex items-center justify-between gap-3">
                  <span>{d.name}</span>
                  <Tag tone={d.status === 'Complete' ? 'success' : d.status === 'Pending signature' ? 'warning' : 'error'}>{d.status}</Tag>
                </li>
              ))}
            </ul>
            {cur.docs.some((d) => d.status !== 'Complete') && (
              <div className="mt-4 flex flex-wrap gap-3">
                <Button kind="tertiary" size="sm" onClick={() => log('Document reminder sent', 'Reminder sent to the client', cur.id)}>Send document reminder</Button>
                {cur.scenarioId && <Button kind="ghost" size="sm" onClick={() => setConfirmSign(cur.id)}>Simulate signatures</Button>}
              </div>
            )}
            <h3 className="t-heading-02 mt-6 mb-2">Activity</h3>
            <ul className="space-y-1 t-helper-01 text-[var(--cds-text-secondary)] max-h-36 overflow-y-auto">
              {events.length === 0 && <li>No activity recorded.</li>}
              {events.map((e, i) => <li key={i}>{e.at} · {e.user} · {e.event}: {e.detail}</li>)}
            </ul>
          </div>
        </div>
      </section>
      <Modal
        open={!!confirmSign}
        size="xs"
        modalHeading="Simulate document signatures?"
        primaryButtonText="Simulate signatures"
        secondaryButtonText="Cancel"
        onRequestClose={() => setConfirmSign(null)}
        onRequestSubmit={() => { const id = confirmSign!; setGlobal((g) => ({ ...g, signedLines: [...g.signedLines, id] })); log('Documents signed (simulated)', 'Credit agreement and pledge agreement marked complete', id); setConfirmSign(null); }}
      >
        <p className="t-body-01">Demo action. This marks the credit agreement and the pledge and control agreement as signed for demonstration purposes.</p>
      </Modal>
    </div>
  );
}

/** IRIS-11: one mask format everywhere — the last four digits after four bullets, in the code face. */
function maskAccount(label: string) {
  const m = label.match(/^(.*?)\s*•+\s*(\d{4})$/);
  if (!m) return label;
  return <>{m[1]} <span className="t-code whitespace-nowrap">••••{m[2]}</span></>;
}

interface Resp { text: string; decision?: 'Accept' | 'Deny' | 'Change Terms'; method?: string; date?: string }
const KIND_LABEL = { condition: 'Condition', question: 'Question', decision: 'Decision · needs acknowledgment' } as const;

/** One underwriting finding and the banker's response to it. */
function Finding({ c, client, requested, onRespond }: { c: Condition; client: string; requested: number; onRespond: (r: Resp) => void }) {
  const kind = c.kind ?? 'condition';
  const open = c.status === 'open';
  const [text, setText] = useState('');
  const [method, setMethod] = useState('');
  const [date, setDate] = useState('');
  const [decision, setDecision] = useState<Resp['decision'] | ''>('');
  const [ack, setAck] = useState(false);
  const [err, setErr] = useState('');
  const [tried, setTried] = useState(false);
  const dateOk = /^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/\d{4}$/.test(date.trim());
  const submit = () => {
    setTried(true);
    if (kind === 'question' && !text.trim()) return setErr('Enter your answer.');
    if (kind === 'decision') {
      if (!method || !date || !decision) return setErr('Record how and when the decision was communicated, and the borrower’s response.');
      if (!dateOk) return setErr('Enter the date communicated as MM/DD/YYYY.');
      if (!ack) return setErr('Confirm that you communicated the decision to the borrower.');
    }
    setErr('');
    onRespond({ text: text.trim(), decision: decision || undefined, method, date });
  };
  const doneLabel = kind === 'decision' ? 'Response recorded' : kind === 'question' ? 'Answered' : 'Provided';
  return (
    <div className={cx('finding', `t-${kind}`, !open && 'is-done')}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="t-label-01 text-[var(--cds-text-secondary)]">{KIND_LABEL[kind]}</p>
          <p className="t-body-01 mt-0.5">{c.text}</p>
        </div>
        <Tag tone={open ? 'warning' : 'success'}>{open ? 'Open' : doneLabel}</Tag>
      </div>
      {kind === 'decision' && c.terms != null && (
        <dl className="grid grid-cols-2 gap-4 mt-3 max-w-md"><KV label="Requested" value={fmtMoney(requested)} mono /><KV label="Revised limit offered" value={fmtMoney(c.terms)} mono /></dl>
      )}
      <p className="t-helper-01 text-[var(--cds-text-secondary)] mt-2">Issued {c.at}{c.providedAt ? ` · responded ${c.providedAt}` : ''}</p>
      {!open && c.response && <p className="t-body-01 mt-2"><span className="text-[var(--cds-text-secondary)]">Your response: </span>{c.response}</p>}
      {open && (
        <div className="mt-3 space-y-4 max-w-2xl">
          {kind === 'decision' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select id={`m-${c.id}`} labelText="Notification method" invalid={tried && !method} invalidText="Choose how the decision was communicated." value={method} onChange={(e) => setMethod(e.target.value)}>
                <SelectItem value="" text="Choose" /><SelectItem value="Phone" text="Phone" /><SelectItem value="Email" text="Email" /><SelectItem value="In person" text="In person" />
              </Select>
              <TextInput id={`d-${c.id}`} labelText="Date communicated" placeholder="MM/DD/YYYY" invalid={tried && !dateOk} invalidText="Enter the date as MM/DD/YYYY." value={date} onChange={(e) => setDate(e.target.value)} />
              <div className="sm:col-span-2">
                <RadioButtonGroup legendText={`${client}’s response`} name={`r-${c.id}`} invalid={tried && !decision} invalidText="Choose the borrower’s response." valueSelected={decision} onChange={(v) => setDecision(v as Resp['decision'])}>
                  <RadioButton id={`r-${c.id}-a`} labelText="Accept revised terms" value="Accept" />
                  <RadioButton id={`r-${c.id}-d`} labelText="Decline the offer" value="Deny" />
                  <RadioButton id={`r-${c.id}-c`} labelText="Ask for changed terms" value="Change Terms" />
                </RadioButtonGroup>
              </div>
            </div>
          )}
          {(
            <TextArea id={`t-${c.id}`} labelText={kind === 'question' ? 'Your answer' : kind === 'decision' ? 'Note to underwriting (optional)' : 'Note (optional)'} invalid={tried && kind === 'question' && !text.trim()} invalidText="Enter your answer." rows={2} value={text} onChange={(e) => setText(e.target.value)} />
          )}
          {kind === 'decision' && <Checkbox id={`ack-${c.id}`} labelText="I communicated this decision to the borrower and recorded their response." invalid={tried && !ack} invalidText="Confirm before recording the response." checked={ack} onChange={(_, { checked }) => setAck(checked)} />}
          {err && <p role="alert" className="t-helper-01 text-[var(--cds-text-error)]">{err}</p>}
          <Button kind="primary" size="sm" onClick={submit}>{kind === 'decision' ? 'Record borrower response' : kind === 'question' ? 'Send answer' : 'Mark as provided'}</Button>
        </div>
      )}
    </div>
  );
}
