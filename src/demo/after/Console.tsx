import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Button,
  Checkbox,
  Pagination,
  RadioButton,
  RadioButtonGroup,
  Search,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Tag as CTag,
  Table,
  TableBody,
  TableCell,
  TableExpandedRow,
  TableExpandHeader,
  TableExpandRow,
  TableHead,
  TableHeader,
  TableRow,
} from '@carbon/react';
import { ArrowRight, ArrowsVertical, CheckmarkFilled, Filter, Warning } from '@carbon/icons-react';
import { BASELINE_PENDING, BASELINE_SUBMITTED } from '../beforeData';
import { ACTIVE_LINES, fmtMoney, fmtPct, type ScenarioId } from '../data';
import { useAfterGlobal, useAfterRequest } from './state';
import { appState, refState, submittedRefState, STATUS_ORDER, type AppState, type Queue, type Status } from './lifecycle';
import { useDemo } from '../DemoContext';
import { guidance } from './guidance';
import { PENDING_REFS, RETURNED_REF, SUBMITTED_REFS, refPower, type AppType } from './records';
import { KV, StatusTag, Tag, cx, type Tone } from './ui';
import { ActiveFilters, ColHeader, useColumns, type Col } from './columns';
import { ActionCell } from './columns';
import type { ConsoleTab, Route } from './AfterApp';

/*
 * The Securities Lending Console, modernized. Same three tabs, same toolbar
 * (search by Application ID, Business Name or Primary Applicant; Filter; sort
 * by Last Updated), same columns and the same expandable row as the original.
 * Statuses reflect the request's real state. The three scenario requests are
 * fully interactive; the additional records are fictional reference records.
 */

export type SearchBy = 'id' | 'business' | 'applicant';
const SEARCH_LABEL: Record<SearchBy, string> = { id: 'Application ID', business: 'Business Name', applicant: 'Primary Applicant' };

export const STATUS_TONE: Record<string, Tone> = {
  'Pending Review': 'warning',
  'Under Evaluation': 'info',
  'Application In Progress': 'info',
  'Underwriting In Progress': 'info',
  'Pending Credit Committee': 'pending',
  'Condition Requested': 'warning',
  'Underwriting Review Complete': 'success',
  Approved: 'success',
  Declined: 'error',
  Denied: 'error',
  Booked: 'success',
};

interface Row {
  key: string;
  applicationId: string;
  businessName: string;
  primaryApplicant: string;
  type: AppType;
  loanType: string;
  status: Status;
  detail: string;
  why: string;
  queue: Queue;
  lastUpdated: string;
  details: { label: string; value: ReactNode }[];
  exceptions: string[];
  openItems: { step: string; label: string }[] | null;
  note?: ReactNode;
  history: { date: string; action: string; evaluator: string; notes: string }[];
  action: { label: string; route: Route };
  open?: { label: string; route: Route };
  /** PAUL-01: the scenario chosen in the demo bar / Preface. */
  current?: boolean;
}

const TABS: { key: ConsoleTab; label: string }[] = [
  { key: 'pending', label: 'Pending Evaluations' },
  { key: 'evaluations', label: 'Evaluations' },
  { key: 'submitted', label: 'Submitted Applications' },
];

/** Statuses where the next action belongs to the loan officer: the row action is emphasised. */
const OWNED: Status[] = ['Not Started', 'In Progress', 'Action Required', 'Ready to Submit'];

const money = (n: number, short = false) => <span className={cx('font-semibold tabular-nums', short && 'text-[var(--cds-text-error)]')}>{fmtMoney(n)}</span>;

export function Console({ tab, expanded, onRoute }: { tab: ConsoleTab; expanded?: string; onRoute: (r: Route) => void }) {
  // Fixed order of hook calls (three scenarios).
  const models = (['single', 'joint', 'complex'] as ScenarioId[]).map((id) => useAfterRequest(id));
  const { scenario } = useDemo();
  const [global] = useAfterGlobal();
  const STEP_NAME: Record<string, string> = { customer: 'Customer Information', parties: 'Co-borrowers', loan: 'Loan Information', collateral: 'Collaterals', evaluation: 'Evaluation', acknowledgment: 'Acknowledgment' };
  // Every row's status, queue, open items and next action come from lifecycle.ts.
  const fromState = (st: AppState) => ({
    status: st.status,
    detail: st.detail,
    why: st.why,
    queue: st.queue,
    exceptions: [...new Set(st.items.filter((i) => i.kind === 'correction').map((i) => i.problem ?? i.label))],
    openItems: st.inUnderwriting || st.status === 'Declined' || st.status === 'Completed' ? null : st.items.map((i) => ({ step: STEP_NAME[i.place] ?? i.place, label: i.label })),
    action: st.next ? { label: st.next.label, route: st.next.route } : { label: 'View', route: { page: 'console' } as Route },
    open: st.next ? { label: st.next.label, route: st.next.route } : undefined,
  });

  const scenarioRows: Row[] = models.map((m, i) => {
    const base = BASELINE_PENDING[i];
    const { s, req, ev } = m;
    const g = guidance(m);
    const st = appState(m, global.signedLines.includes(s.requestId));
    return {
      key: s.id,
      applicationId: s.requestId,
      // ADA-09: name the application type from the request itself (Before's adapter labels every non-entity scenario "(Individual)").
      businessName: s.entityName ?? `${s.primary.name} (${req.appType === 'Joint' ? 'Joint' : 'Individual'})`,
      primaryApplicant: base.primaryApplicant,
      type: req.appType === 'Entity' ? 'Entity' : req.appType,
      loanType: base.loanType,
      lastUpdated: (req.history ?? []).length ? req.history![req.history!.length - 1].at.split(',')[0] : base.lastUpdated,
      details: [
        { label: 'Opportunity Date', value: base.expandedDetails.opportunityDate },
        { label: 'Customer Power ID', value: base.expandedDetails.customerPowerId },
        { label: 'Loan Purpose', value: base.expandedDetails.loanPurpose },
        { label: 'Loan Amount', value: money(req.requested) },
        { label: 'Total Maximum Borrowing Power', value: money(ev.total, ev.total < req.requested) },
        { label: 'Coverage', value: <span className="tabular-nums">{fmtPct(g.coverage)}</span> },
      ],
      ...fromState(st),
      history: [
        ...[...(req.history ?? [])].reverse().map((h) => ({ date: h.at.split(',')[0], action: h.event, evaluator: h.by, notes: h.detail })),
        ...(base.expandedDetails.evaluationHistory ?? []),
      ],
      current: s.id === scenario,
    };
  });

  const resolved = global.resolvedRefItems ?? [];
  const startedRefs = global.startedRefs ?? [];
  const pendingRefs: Row[] = [...PENDING_REFS, RETURNED_REF].map((r) => {
    const power = refPower(r);
    const st = refState(r, resolved, startedRefs);
    return {
      key: r.id,
      applicationId: r.id,
      businessName: r.business,
      primaryApplicant: r.applicant,
      type: r.type,
      loanType: 'Securities-Based Line of Credit',
      lastUpdated: r.lastUpdated,
      details: [
        { label: 'Opportunity Date', value: r.opportunityDate },
        { label: 'Customer Power ID', value: r.powerId },
        { label: 'Loan Purpose', value: r.purpose },
        { label: 'Loan Amount', value: money(r.requested) },
        { label: 'Total Maximum Borrowing Power', value: money(power, power < r.requested) },
        { label: 'Coverage', value: <span className="tabular-nums">{fmtPct(power / r.requested)}</span> },
      ],
      ...fromState(st),
      history: [...r.history].reverse(),
    };
  });

  const submittedRefs: Row[] = [
    ...SUBMITTED_REFS.map((r): Row => ({
      key: r.id,
      applicationId: r.id,
      businessName: r.business,
      primaryApplicant: r.applicant,
      type: r.type,
      loanType: 'Securities-Based Line of Credit',
      lastUpdated: r.submitted,
      details: [
        { label: 'Submitted', value: r.submitted },
        { label: 'Customer Power ID', value: r.powerId },
        { label: 'Loan Purpose', value: r.purpose },
        { label: 'Loan Amount', value: money(r.requested) },
        { label: 'Total Maximum Borrowing Power', value: money(r.power, r.power < r.requested) },
        { label: 'Final Decision', value: r.decision === 'Approved' && r.approvedLimit ? `Approved · ${fmtMoney(r.approvedLimit)} limit` : r.decision },
      ],
      ...fromState(submittedRefState(r)),
      history: [{ date: r.submitted, action: 'Submitted to Underwriting', evaluator: 'System', notes: r.note }],
    })),
    ...BASELINE_SUBMITTED.map((b): Row => {
      const line = ACTIVE_LINES.find((l) => l.id === b.applicationId);
      // Shared fictional data from the original console, placed by its real stage: booked lines are Completed.
      const st: AppState = line
        ? { status: 'Completed', detail: 'Line active', queue: 'submitted', inUnderwriting: false, items: [], why: 'Approved, documents signed, and the line is active.', next: { label: 'View credit line', route: { page: 'credit', id: line.id }, explain: '' } }
        : { status: 'Under Review', detail: 'In credit underwriting', queue: 'submitted', inUnderwriting: true, items: [], why: 'Credit Underwriting is reviewing the request. Nothing is needed from you.', next: { label: 'View underwriting status', route: { page: 'review', id: b.applicationId }, explain: '' } };
      return {
        key: b.id,
        applicationId: b.applicationId,
        businessName: b.businessName,
        primaryApplicant: b.primaryApplicant,
        type: 'Individual',
        loanType: b.loanType,
        lastUpdated: b.lastUpdated,
        details: [
          { label: line ? 'Approved' : 'Opportunity Date', value: b.expandedDetails.opportunityDate },
          { label: 'Customer Power ID', value: b.expandedDetails.customerPowerId },
          { label: 'Loan Purpose', value: b.expandedDetails.loanPurpose },
          { label: line ? 'Credit Limit' : 'Loan Amount', value: <span className="font-semibold">{b.expandedDetails.loanAmount}</span> },
        ],
        ...fromState(st),
        history: b.expandedDetails.evaluationHistory ?? [],
      };
    }),
  ];

  // Each application appears in exactly one queue, decided by its lifecycle stage.
  const all = [...scenarioRows, ...pendingRefs, ...submittedRefs];
  const byQueue = (q: Queue) => all.filter((r) => r.queue === q);
  const rows = byQueue(tab);
  useEffect(() => {
    const home = all.find((r) => r.applicationId === expanded);
    if (expanded && home && home.queue !== tab) onRoute({ page: 'console', tab: home.queue, expanded });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="px-4 sm:px-8 py-6 w-page mx-auto">
      <section className="sbl-queue" aria-label="Loan requests">
        <Tabs selectedIndex={TABS.findIndex((t) => t.key === tab)} onChange={({ selectedIndex }: { selectedIndex: number }) => onRoute({ page: 'console', tab: TABS[selectedIndex].key })}>
          <TabList aria-label="Loan request queues" contained={false}>
            {TABS.map((t) => <Tab key={t.key}>{t.label} <span className="tab-count" aria-label={`${byQueue(t.key).length} applications`}>{byQueue(t.key).length}</span></Tab>)}
          </TabList>
          <TabPanels>
            {TABS.map((t) => (
              <TabPanel key={t.key} className="!p-0">
                {t.key === tab && (
                  <QueueTable
                    key={tab}
                    rows={rows}
                    initialExpanded={expanded}
                    onExpandedChange={(id) => onRoute({ page: 'console', tab, expanded: id })}
                    onRoute={onRoute}
                    empty={tab === 'submitted' ? 'No submitted applications.' : 'No evaluations are pending. Submitted requests are in Submitted Applications.'}
                  />
                )}
              </TabPanel>
            ))}
          </TabPanels>
        </Tabs>
      </section>
    </div>
  );
}

const ts = (d: string) => { const [mm, dd, yy] = d.split(',')[0].split('/').map(Number); return new Date(yy, mm - 1, dd).getTime() || 0; };

function QueueTable({ rows, onRoute, empty, initialExpanded, onExpandedChange }: { rows: Row[]; onRoute: (r: Route) => void; empty: string; initialExpanded?: string; onExpandedChange: (applicationId?: string) => void }) {
  const [by, setBy] = useState<SearchBy>('id');
  const [q, setQ] = useState('');
  const [newest, setNewest] = useState(true);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [withExceptions, setWithExceptions] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const startRow = initialExpanded ? rows.find((r) => r.applicationId === initialExpanded) : undefined;
  const [expanded, setExpandedState] = useState<string[]>(startRow ? [startRow.key] : []);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  // The most recently expanded row is the one the Before/After toggle carries.
  const setExpanded = (next: string[]) => { setExpandedState(next); onExpandedChange(rows.find((r) => r.key === next[next.length - 1])?.applicationId); };
  const allStatuses = STATUS_ORDER.filter((st) => rows.some((r) => r.status === st));
  const allTypes = [...new Set(rows.map((r) => r.type))];
  const filters = statuses.length + types.length + (withExceptions ? 1 : 0);

  const shown = useMemo(() => {
    const n = q.trim().toLowerCase();
    const field = (r: Row) => (by === 'id' ? r.applicationId : by === 'business' ? r.businessName : r.primaryApplicant).toLowerCase();
    return rows
      .filter((r) => !n || field(r).includes(n))
      .filter((r) => !statuses.length || statuses.includes(r.status))
      .filter((r) => !types.length || types.includes(r.type))
      .filter((r) => !withExceptions || r.exceptions.length > 0)
      .sort((a, b) => (newest ? ts(b.lastUpdated) - ts(a.lastUpdated) : ts(a.lastUpdated) - ts(b.lastUpdated)));
  }, [rows, q, by, newest, statuses, types, withExceptions]);
  // Open on the page that holds the expanded row.
  useEffect(() => {
    if (!startRow) return;
    const i = shown.findIndex((r) => r.key === startRow.key);
    if (i >= 0) setPage(Math.floor(i / pageSize) + 1);
    requestAnimationFrame(() => document.querySelector('.queue-table tr.is-expanded')?.scrollIntoView({ block: 'center' }));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const colsDef = useMemo<Col<Row>[]>(() => [
    { key: 'id', label: 'Application ID', type: 'text', get: (r) => r.applicationId },
    { key: 'business', label: 'Business Name', type: 'text', get: (r) => r.businessName },
    { key: 'applicant', label: 'Primary Applicant', type: 'text', get: (r) => r.primaryApplicant },
    { key: 'loan', label: 'Loan Type', type: 'enum', get: (r) => r.loanType },
    { key: 'status', label: 'Status', type: 'enum', get: (r) => r.status },
    { key: 'updated', label: 'Last Updated', type: 'date', get: (r) => r.lastUpdated },
    { key: 'action', label: 'Actions', type: 'enum', noSort: true, get: (r) => r.action.label },
  ], []);
  const cols = useColumns(shown, colsDef, () => setPage(1));
  const pages = Math.max(1, Math.ceil(cols.rows.length / pageSize));
  const cur = Math.min(page, pages);
  const visible = cols.rows.slice((cur - 1) * pageSize, cur * pageSize);
  const reset = () => { setQ(''); setStatuses([]); setTypes([]); setWithExceptions(false); cols.clearAll(); setPage(1); };
  const toggle = (list: string[], set: (v: string[]) => void, v: string, on: boolean) => { set(on ? [...list, v] : list.filter((x) => x !== v)); setPage(1); };

  return (
    <>
      <QueueToolbar
        by={by}
        onBy={(v) => { setBy(v); setQ(''); setPage(1); }}
        q={q}
        onQ={(v) => { setQ(v); setPage(1); }}
        newest={newest}
        onSort={() => setNewest(!newest)}
        filterOpen={filterOpen}
        onFilter={() => setFilterOpen(!filterOpen)}
        filterCount={filters}
      >
        {filterOpen && (
          <div className="queue-filters">
            <fieldset>
              <legend className="t-label-01 text-[var(--cds-text-secondary)] mb-2">Status</legend>
              {allStatuses.map((st) => <Checkbox key={st} id={`flt-${st}`} labelText={st} checked={statuses.includes(st)} onChange={(_: unknown, { checked }: { checked: boolean }) => toggle(statuses, setStatuses, st, checked)} />)}
            </fieldset>
            <fieldset>
              <legend className="t-label-01 text-[var(--cds-text-secondary)] mb-2">Application type</legend>
              {allTypes.map((t) => <Checkbox key={t} id={`flt-type-${t}`} labelText={t} checked={types.includes(t)} onChange={(_: unknown, { checked }: { checked: boolean }) => toggle(types, setTypes, t, checked)} />)}
            </fieldset>
            <fieldset>
              <legend className="t-label-01 text-[var(--cds-text-secondary)] mb-2">Exceptions</legend>
              <Checkbox id="flt-exceptions" labelText="Has exceptions or conditions" checked={withExceptions} onChange={(_: unknown, { checked }: { checked: boolean }) => { setWithExceptions(checked); setPage(1); }} />
            </fieldset>
            {filters > 0 && <Button kind="ghost" size="sm" className="self-end" onClick={() => { setStatuses([]); setTypes([]); setWithExceptions(false); setPage(1); }}>Clear filters</Button>}
          </div>
        )}
      </QueueToolbar>
      <ActiveFilters st={cols} count={cols.rows.length} total={shown.length} noun="applications" />
      <div className="overflow-x-auto">
        <Table aria-label="Loan requests" size="lg" className="queue-table min-w-[960px]">
          <TableHead>
            <TableRow>
              <TableExpandHeader aria-label="Expand row" />
              {['id', 'business', 'applicant', 'loan', 'status', 'updated', 'action'].map((k) => <ColHeader key={k} st={cols} k={k} />)}
            </TableRow>
          </TableHead>
          <TableBody>
            {visible.length === 0 && (
              <TableRow className="empty-row">
                <TableCell colSpan={8}>
                  <div className="py-8 text-center">
                    <p className="t-heading-02">{rows.length ? 'No applications match' : empty}</p>
                    {rows.length > 0 && (
                      <>
                        <p className="t-body-01 text-[var(--cds-text-secondary)] mt-1">{q ? `Nothing matches “${q}” in ${SEARCH_LABEL[by]}` : 'Nothing matches the selected filters'}. Check the spelling or clear the search and filters.</p>
                        <Button kind="tertiary" size="sm" className="mt-4" onClick={reset}>Clear search and filters</Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
            {visible.map((r) => {
              const isOpen = expanded.includes(r.key);
              return [
                <TableExpandRow
                  key={r.key}
                  isExpanded={isOpen}
                  className={cx(isOpen && 'is-expanded')}
                  onExpand={() => setExpanded(isOpen ? expanded.filter((k) => k !== r.key) : [...expanded, r.key])}
                  aria-label={isOpen ? `Collapse ${r.applicationId}` : `Expand ${r.applicationId}`}
                  expandIconDescription={isOpen ? 'Collapse row' : 'Expand row'}
                >
                  <TableCell className="font-semibold tabular-nums whitespace-nowrap">{r.applicationId}{r.current && <span className="block"><CTag type="outline" size="sm" className="scenario-tag !ml-0 !mb-0">Selected scenario</CTag></span>}</TableCell>
                  <TableCell>{r.businessName}</TableCell>
                  <TableCell>{r.primaryApplicant}</TableCell>
                  <TableCell className="cell-secondary">{r.loanType}</TableCell>
                  <TableCell><StatusTag status={r.status} detail={r.detail} /></TableCell>
                  <TableCell className="cell-secondary tabular-nums">{r.lastUpdated}</TableCell>
                  <TableCell>
                    <ActionCell status={r.status} label={r.action.label} id={r.applicationId} onClick={() => onRoute(r.action.route)} />
                  </TableCell>
                </TableExpandRow>,
                isOpen ? (
                  <TableExpandedRow key={r.key + '-x'} colSpan={8} className="expanded-detail">
                    <RowDetails row={r} onRoute={onRoute} />
                  </TableExpandedRow>
                ) : null,
              ];
            })}
          </TableBody>
        </Table>
      </div>
      <div className="queue-footer">
        <Pagination
          page={cur}
          pageSize={pageSize}
          pageSizes={[10, 20, 50]}
          totalItems={cols.rows.length}
          itemsPerPageText="Applications per page"
          itemRangeText={(min: number, max: number, total: number) => `Showing ${min} to ${max} of ${total} applications`}
          pageRangeText={(_: number, total: number) => `of ${total} page${total === 1 ? '' : 's'}`}
          onChange={({ page: p, pageSize: s }: { page: number; pageSize: number }) => { setPage(p); setPageSize(s); }}
          size="md"
        />
      </div>
    </>
  );
}

function RowDetails({ row, onRoute }: { row: Row; onRoute: (r: Route) => void }) {
  const [history, setHistory] = useState(false);
  return (
    <div className="expanded-body">
      <p className="t-body-01 mb-4"><span className="font-semibold">{row.status}{row.detail && row.detail !== row.status ? ` · ${row.detail}` : ''}.</span> {row.why}</p>
      <dl className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-x-8 gap-y-4">
        {row.details.map((d) => <KV key={d.label} label={d.label} value={d.value} />)}
      </dl>
      {(row.exceptions.length > 0 || row.openItems) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mt-5 pt-4 border-t border-[var(--cds-border-subtle-01)]">
          <div>
            <p className="t-label-01 text-[var(--cds-text-secondary)]">Exceptions</p>
            {row.exceptions.length ? (
              <ul className="flex flex-wrap gap-2 mt-2">{row.exceptions.map((e) => <li key={e}><Tag tone={/expired|shortfall|missing|ineligible|not certified|condition/i.test(e) ? 'error' : 'warning'}>{e}</Tag></li>)}</ul>
            ) : <p className="t-body-01 mt-1">None</p>}
          </div>
          {row.openItems && (
            <div>
              <p className="t-label-01 text-[var(--cds-text-secondary)]">Open items ({row.openItems.length})</p>
              {row.openItems.length ? (
                <ul className="mt-1 space-y-1">
                  {row.openItems.slice(0, 4).map((o) => (
                    <li key={o.label} className="flex items-start gap-2 t-body-01">
                      <Warning size={16} className="mt-0.5 shrink-0 fill-[var(--cds-icon-secondary)]" aria-hidden="true" />
                      <span>{o.label}<span className="t-helper-01 text-[var(--cds-text-secondary)]"> · {o.step}</span></span>
                    </li>
                  ))}
                  {row.openItems.length > 4 && <li className="t-helper-01 text-[var(--cds-text-secondary)] pl-6">and {row.openItems.length - 4} more</li>}
                </ul>
              ) : (
                <p className="t-body-01 mt-1 flex items-center gap-2"><CheckmarkFilled size={16} className="fill-[var(--cds-support-success)]" aria-hidden="true" />Ready to submit</p>
              )}
            </div>
          )}
        </div>
      )}
      {row.note && <div className="mt-4">{row.note}</div>}
      <div className="flex flex-wrap items-center gap-2 mt-4">
        {row.open && <Button kind={OWNED.includes(row.status) ? 'primary' : 'tertiary'} size="sm" renderIcon={ArrowRight} onClick={() => onRoute(row.open!.route)} aria-label={`${row.open.label}: ${row.applicationId}`}>{row.open.label}</Button>}
        <Button kind="ghost" size="sm" aria-expanded={history} onClick={() => setHistory(!history)}>{history ? 'Hide history' : 'View history'}</Button>
      </div>
      {history && (
        <ul className="mt-2 border-t border-[var(--cds-border-subtle-01)]">
          {row.history.map((h, i) => (
            <li key={i} className="py-2 border-b border-[var(--cds-border-subtle-01)] grid grid-cols-[110px_1fr] gap-4 t-body-01">
              <span className="tabular-nums text-[var(--cds-text-secondary)]">{h.date}</span>
              <span><span className="font-semibold">{h.action}</span> · {h.evaluator}{h.notes && <span className="block t-helper-01 text-[var(--cds-text-secondary)]">{h.notes}</span>}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Search by Application ID / Business Name / Primary Applicant, Filter and sort — the original toolbar, in Carbon. */
export function QueueToolbar({ by, onBy, q, onQ, newest, onSort, filterOpen, onFilter, filterCount, nameLabel = 'Business Name', children }: { by: SearchBy; onBy: (v: SearchBy) => void; q: string; onQ: (v: string) => void; newest: boolean; onSort: () => void; filterOpen: boolean; onFilter: () => void; filterCount: number; nameLabel?: string; children?: ReactNode }) {
  const label = by === 'business' ? nameLabel : SEARCH_LABEL[by];
  return (
    <div className="queue-toolbar">
      <div className="flex flex-wrap items-end gap-4">
        <RadioButtonGroup legendText="Search by" name={`search-by-${nameLabel}`} valueSelected={by} onChange={(v: string | number | undefined) => onBy(v as SearchBy)} className="queue-search-by">
          <RadioButton labelText="Application ID" value="id" id={`sb-id-${nameLabel}`} />
          <RadioButton labelText={nameLabel} value="business" id={`sb-business-${nameLabel}`} />
          <RadioButton labelText="Primary Applicant" value="applicant" id={`sb-applicant-${nameLabel}`} />
        </RadioButtonGroup>
        <div className="flex-1 min-w-[16rem]">
          <Search size="md" labelText={`Search by ${label}`} placeholder={`Search by ${label}…`} value={q} onChange={(e: { target: HTMLInputElement }) => onQ(e.target.value)} />
        </div>
        {/* KENJI-10: Filter and Sort share one row on phones, so the table starts higher. "Last Updated:" stays in the accessible name. */}
        <div className="queue-toolbar__actions flex items-stretch gap-2 sm:gap-4">
          <Button kind="tertiary" size="md" renderIcon={Filter} aria-expanded={filterOpen} onClick={onFilter}>{filterCount ? `Filter (${filterCount})` : 'Filter'}</Button>
          <Button kind="tertiary" size="md" renderIcon={ArrowsVertical} onClick={onSort}><span className="sr-only sm:not-sr-only sm:mr-1">Last Updated: </span>{newest ? 'Newest First' : 'Oldest First'}</Button>
        </div>
      </div>
      {children}
    </div>
  );
}
