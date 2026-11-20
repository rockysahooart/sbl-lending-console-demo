import { useMemo, useState, type ReactNode } from 'react';
import {
  Button,
  Checkbox,
  RadioButton,
  RadioButtonGroup,
  Search,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
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
import { ArrowsVertical, Filter } from '@carbon/icons-react';
import { BASELINE_PENDING, BASELINE_SUBMITTED } from '../beforeData';
import { ACTIVE_LINES, fmtMoney, type ScenarioId } from '../data';
import { useAfterRequest } from './state';
import { guidance } from './guidance';
import { KV, Tag, cx, type Tone } from './ui';
import type { ConsoleTab, Route } from './AfterApp';

/*
 * The Securities Lending Console, modernized. Same three tabs, same toolbar
 * (search by Application ID, Business Name or Primary Applicant; Filter; sort
 * by Last Updated), same columns and the same expandable row as the original.
 * Statuses now reflect the request's real state.
 */

export type SearchBy = 'id' | 'business' | 'applicant';
const SEARCH_LABEL: Record<SearchBy, string> = { id: 'Application ID', business: 'Business Name', applicant: 'Primary Applicant' };

export const STATUS_TONE: Record<string, Tone> = {
  'Pending Review': 'warning',
  'Under Evaluation': 'info',
  'Application In Progress': 'info',
  'Underwriting In Progress': 'info',
  'Condition Requested': 'warning',
  'Underwriting Review Complete': 'success',
  Approved: 'success',
  Denied: 'error',
  Booked: 'success',
};

interface Row {
  key: string;
  applicationId: string;
  businessName: string;
  primaryApplicant: string;
  loanType: string;
  status: string;
  lastUpdated: string;
  details: { label: string; value: ReactNode }[];
  note?: ReactNode;
  history: { date: string; action: string; evaluator: string; notes: string }[];
  action: { label: string; route: Route };
}

const TABS: { key: ConsoleTab; label: string }[] = [
  { key: 'pending', label: 'Pending Evaluations' },
  { key: 'evaluations', label: 'Evaluations' },
  { key: 'submitted', label: 'Submitted Applications' },
];

export function Console({ tab, onRoute }: { tab: ConsoleTab; onRoute: (r: Route) => void }) {
  // Fixed order of hook calls (three scenarios).
  const models = (['single', 'joint', 'complex'] as ScenarioId[]).map((id) => useAfterRequest(id));

  const scenarioRows: Row[] = models.map((m, i) => {
    const base = BASELINE_PENDING[i];
    const { s, req, ev } = m;
    const started = m.acknowledged || req.visited.length > 0;
    const g = guidance(m);
    const open = m.readiness.filter((r) => !r.done).length;
    const openCond = (req.conditions ?? []).filter((c) => c.status === 'open').length;
    const status = req.status === 'approved' ? 'Underwriting Review Complete' : req.status === 'submitted' ? (openCond ? 'Condition Requested' : 'Underwriting In Progress') : started ? 'Application In Progress' : base.status;
    const action: Row['action'] =
      req.status !== 'draft'
        ? { label: openCond ? 'Respond' : 'View', route: { page: 'review', id: s.requestId } }
        : started
          ? { label: 'Continue', route: { page: 'request', id: s.id, section: req.section } }
          : { label: 'Evaluate', route: { page: 'evaluation', id: s.id } };
    return {
      key: s.id,
      applicationId: s.requestId,
      businessName: base.businessName,
      primaryApplicant: base.primaryApplicant,
      loanType: base.loanType,
      status,
      lastUpdated: req.submittedAt?.split(',')[0] ?? base.lastUpdated,
      details: [
        { label: 'Primary Applicant', value: base.primaryApplicant },
        { label: 'Opportunity Date', value: base.expandedDetails.opportunityDate },
        { label: 'Product', value: base.expandedDetails.product },
        { label: 'Customer Power ID', value: base.expandedDetails.customerPowerId },
        { label: 'Loan Purpose', value: base.expandedDetails.loanPurpose },
        { label: 'Loan Amount', value: <span className="font-semibold">{fmtMoney(req.requested)} USD</span> },
        { label: 'Total Maximum Borrowing Power', value: <span className={cx('font-semibold', ev.total < req.requested && 'text-[var(--cds-text-error)]')}>{fmtMoney(ev.total)}</span> },
      ],
      note:
        req.status === 'draft' && g.next ? (
          <p className="t-body-01"><span className="font-semibold">{open} open item{open === 1 ? '' : 's'}.</span> Next: {g.next.detail}</p>
        ) : openCond ? (
          <p className="t-body-01"><span className="font-semibold">Underwriting requested {openCond} condition{openCond > 1 ? 's' : ''}.</span> Respond from Pending Review.</p>
        ) : null,
      history: [
        ...(req.submittedAt ? [{ date: req.submittedAt.split(',')[0], action: 'Submitted to Underwriting', evaluator: 'S. Mitchell', notes: 'Application package submitted for underwriting review' }] : []),
        ...(base.expandedDetails.evaluationHistory ?? []),
      ],
      action,
    };
  });

  const submittedRefs: Row[] = BASELINE_SUBMITTED.map((b) => {
    const line = ACTIVE_LINES.find((l) => l.id === b.applicationId);
    return {
      key: b.id,
      applicationId: b.applicationId,
      businessName: b.businessName,
      primaryApplicant: b.primaryApplicant,
      loanType: b.loanType,
      status: b.status,
      lastUpdated: b.lastUpdated,
      details: [
        { label: 'Primary Applicant', value: b.primaryApplicant },
        { label: line ? 'Approved' : 'Opportunity Date', value: b.expandedDetails.opportunityDate },
        { label: 'Product', value: b.expandedDetails.product },
        { label: 'Customer Power ID', value: b.expandedDetails.customerPowerId },
        { label: 'Loan Purpose', value: b.expandedDetails.loanPurpose },
        { label: line ? 'Credit Limit' : 'Loan Amount', value: <span className="font-semibold">{b.expandedDetails.loanAmount}</span> },
      ],
      history: b.expandedDetails.evaluationHistory ?? [],
      action: { label: 'View', route: line ? { page: 'credit', id: line.id } : { page: 'review', id: b.applicationId } },
    };
  });

  const submittedScenario = scenarioRows.filter((_, i) => models[i].req.status !== 'draft');
  const draftScenario = scenarioRows.filter((_, i) => models[i].req.status === 'draft');
  const rows = tab === 'submitted' ? [...submittedScenario, ...submittedRefs] : draftScenario;

  return (
    <div className="px-4 sm:px-8 py-6 w-page mx-auto">
      <section className="bg-[var(--cds-layer-01)]" aria-label="Loan requests">
        <Tabs selectedIndex={TABS.findIndex((t) => t.key === tab)} onChange={({ selectedIndex }: { selectedIndex: number }) => onRoute({ page: 'console', tab: TABS[selectedIndex].key })}>
          <TabList aria-label="Loan request queues" contained={false} className="px-4">
            {TABS.map((t) => <Tab key={t.key}>{t.label}</Tab>)}
          </TabList>
          <TabPanels>
            {TABS.map((t) => (
              <TabPanel key={t.key} className="!p-0">
                {t.key === tab && (
                  <QueueTable
                    rows={rows}
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

function QueueTable({ rows, onRoute, empty }: { rows: Row[]; onRoute: (r: Route) => void; empty: string }) {
  const [by, setBy] = useState<SearchBy>('id');
  const [q, setQ] = useState('');
  const [newest, setNewest] = useState(true);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [expanded, setExpanded] = useState<string[]>([]);
  const allStatuses = [...new Set(rows.map((r) => r.status))];

  const shown = useMemo(() => {
    const n = q.trim().toLowerCase();
    const field = (r: Row) => (by === 'id' ? r.applicationId : by === 'business' ? r.businessName : r.primaryApplicant).toLowerCase();
    const ts = (d: string) => { const [mm, dd, yy] = d.split('/').map(Number); return new Date(yy, mm - 1, dd).getTime() || 0; };
    return rows
      .filter((r) => !n || field(r).includes(n))
      .filter((r) => !statuses.length || statuses.includes(r.status))
      .sort((a, b) => (newest ? ts(b.lastUpdated) - ts(a.lastUpdated) : ts(a.lastUpdated) - ts(b.lastUpdated)));
  }, [rows, q, by, newest, statuses]);

  return (
    <>
      <QueueToolbar
        by={by}
        onBy={(v) => { setBy(v); setQ(''); }}
        q={q}
        onQ={setQ}
        newest={newest}
        onSort={() => setNewest(!newest)}
        filterOpen={filterOpen}
        onFilter={() => setFilterOpen(!filterOpen)}
        filterCount={statuses.length}
      />
      {filterOpen && (
        <fieldset className="px-4 pb-4 flex flex-wrap gap-x-6 gap-y-1">
          <legend className="t-label-01 text-[var(--cds-text-secondary)] mb-2">Status</legend>
          {allStatuses.map((st) => (
            <Checkbox key={st} id={`flt-${st}`} labelText={st} checked={statuses.includes(st)} onChange={(_: unknown, { checked }: { checked: boolean }) => setStatuses(checked ? [...statuses, st] : statuses.filter((x) => x !== st))} />
          ))}
          {statuses.length > 0 && <Button kind="ghost" size="sm" onClick={() => setStatuses([])}>Clear filter</Button>}
        </fieldset>
      )}
      <div className="overflow-x-auto">
        <Table aria-label="Loan requests" size="lg" className="queue-table min-w-[960px]">
          <TableHead>
            <TableRow>
              <TableExpandHeader aria-label="Expand row" />
              <TableHeader>Application ID</TableHeader>
              <TableHeader>Business Name</TableHeader>
              <TableHeader>Primary Applicant</TableHeader>
              <TableHeader>Loan Type</TableHeader>
              <TableHeader>Status</TableHeader>
              <TableHeader>Last Updated</TableHeader>
              <TableHeader>Actions</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {shown.length === 0 && (
              <TableRow><TableCell colSpan={8}><p className="t-body-01 py-2">{rows.length ? `No applications match “${q}”.` : empty}</p></TableCell></TableRow>
            )}
            {shown.map((r) => {
              const isOpen = expanded.includes(r.key);
              return [
                <TableExpandRow
                  key={r.key}
                  isExpanded={isOpen}
                  onExpand={() => setExpanded(isOpen ? expanded.filter((k) => k !== r.key) : [...expanded, r.key])}
                  aria-label={isOpen ? `Collapse ${r.applicationId}` : `Expand ${r.applicationId}`}
                  expandIconDescription={isOpen ? 'Collapse row' : 'Expand row'}
                >
                  <TableCell className="font-semibold">{r.applicationId}</TableCell>
                  <TableCell>{r.businessName}</TableCell>
                  <TableCell>{r.primaryApplicant}</TableCell>
                  <TableCell>{r.loanType}</TableCell>
                  <TableCell><Tag tone={STATUS_TONE[r.status] ?? 'neutral'}>{r.status}</Tag></TableCell>
                  <TableCell className="tabular-nums">{r.lastUpdated}</TableCell>
                  <TableCell>
                    <Button kind={r.action.label === 'Respond' ? 'primary' : 'ghost'} size="sm" onClick={() => onRoute(r.action.route)} aria-label={`${r.action.label} ${r.applicationId}`}>{r.action.label}</Button>
                  </TableCell>
                </TableExpandRow>,
                isOpen ? (
                  <TableExpandedRow key={r.key + '-x'} colSpan={8}>
                    <RowDetails row={r} />
                  </TableExpandedRow>
                ) : null,
              ];
            })}
          </TableBody>
        </Table>
      </div>
      <p className="px-4 py-4 t-body-01 text-[var(--cds-text-secondary)] border-t border-[var(--cds-border-subtle-01)]">
        Showing {shown.length ? 1 : 0} to {shown.length} of {rows.length} applications
      </p>
    </>
  );
}

function RowDetails({ row }: { row: Row }) {
  const [history, setHistory] = useState(false);
  return (
    <div className="py-4">
      <dl className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-x-8 gap-y-4">
        {row.details.map((d) => <KV key={d.label} label={d.label} value={d.value} />)}
      </dl>
      {row.note && <div className="mt-4">{row.note}</div>}
      <Button kind="ghost" size="sm" className="mt-3 !px-0" aria-expanded={history} onClick={() => setHistory(!history)}>{history ? 'Hide history' : 'View history'}</Button>
      {history && (
        <ul className="mt-2 border-t border-[var(--cds-border-subtle-01)]">
          {row.history.map((h, i) => (
            <li key={i} className="py-2 border-b border-[var(--cds-border-subtle-01)] grid grid-cols-[110px_1fr] gap-4 t-body-01">
              <span className="tabular-nums text-[var(--cds-text-secondary)]">{h.date}</span>
              <span><span className="font-semibold">{h.action}</span> · {h.evaluator}<span className="block t-helper-01 text-[var(--cds-text-secondary)]">{h.notes}</span></span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Search by Application ID / Business Name / Primary Applicant, Filter and sort — the original toolbar, in Carbon. */
export function QueueToolbar({ by, onBy, q, onQ, newest, onSort, filterOpen, onFilter, filterCount, nameLabel = 'Business Name' }: { by: SearchBy; onBy: (v: SearchBy) => void; q: string; onQ: (v: string) => void; newest: boolean; onSort: () => void; filterOpen: boolean; onFilter: () => void; filterCount: number; nameLabel?: string }) {
  const label = by === 'business' ? nameLabel : SEARCH_LABEL[by];
  return (
    <div className="p-4 flex flex-wrap items-end gap-4">
      <RadioButtonGroup legendText="Search by" name={`search-by-${nameLabel}`} valueSelected={by} onChange={(v: string | number | undefined) => onBy(v as SearchBy)} className="queue-search-by">
        <RadioButton labelText="Application ID" value="id" id={`sb-id-${nameLabel}`} />
        <RadioButton labelText={nameLabel} value="business" id={`sb-business-${nameLabel}`} />
        <RadioButton labelText="Primary Applicant" value="applicant" id={`sb-applicant-${nameLabel}`} />
      </RadioButtonGroup>
      <div className="flex-1 min-w-[16rem]">
        <Search size="md" labelText={`Search by ${label}`} placeholder={`Search by ${label}…`} value={q} onChange={(e: { target: HTMLInputElement }) => onQ(e.target.value)} />
      </div>
      <Button kind="tertiary" size="md" renderIcon={Filter} aria-expanded={filterOpen} onClick={onFilter}>{filterCount ? `Filter (${filterCount})` : 'Filter'}</Button>
      <Button kind="tertiary" size="md" renderIcon={ArrowsVertical} onClick={onSort}>Last Updated: {newest ? 'Newest First' : 'Oldest First'}</Button>
    </div>
  );
}
