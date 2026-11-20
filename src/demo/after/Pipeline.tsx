import { useState } from 'react';
import { Button, Modal, Search, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@carbon/react';
import { Add, ArrowRight } from '@carbon/icons-react';
import { PEOPLE, PIPELINE, SCENARIOS, fmtMoney, fmtPct, type ScenarioId } from '../data';
import { accountValue } from '../engine';
import { useAfterRequest } from './state';
import { guidance, type Attention } from './guidance';
import { Money, cx } from './ui';
import type { Route } from './AfterApp';

/*
 * Pipeline: origination requests the relationship banker owns, grouped by who
 * must act next. Lifecycle stage (where the request is) is shown separately
 * from attention (who needs to do something).
 */

interface Row {
  key: string;
  client: string;
  sub: string;
  lifecycle: string;
  progress: string;
  attention: Attention;
  waitingOn?: string;
  requested: number;
  power: number;
  coverage: number;
  margin: number;
  exceptions: string[];
  next: string;
  why: string;
  route: Route;
  open: number;
  priority: number;
}

function useScenarioRow(id: ScenarioId): Row {
  const m = useAfterRequest(id);
  const { s, req, ev, readiness } = m;
  const g = guidance(m);
  const open = readiness.filter((r) => !r.done).length;
  const lifecycle = req.status === 'draft' ? 'Origination' : req.status === 'submitted' ? 'Underwriting' : 'Approved';
  const progress = req.status !== 'draft' ? (req.status === 'submitted' ? `Submitted ${req.submittedAt?.split(',')[0] ?? ''}` : 'Credit line active')
    : req.visited.length === 0 ? 'Not started' : `${readiness.length - open} of ${readiness.length} checks complete`;
  let next = g.next?.label ?? '';
  let route: Route = g.next ? { page: 'request', id, section: g.next.section } : { page: 'request', id, section: 'review' };
  let why = g.next?.detail ?? '';
  const openConditions = (req.conditions ?? []).filter((c) => c.status === 'open');
  let attention = g.attention;
  if (req.status === 'submitted' && openConditions.length) { next = 'Respond to condition'; route = { page: 'underwriting', id: s.requestId }; why = `Credit Underwriting asked: ${openConditions[0].text}`; attention = 'action'; }
  else if (req.status === 'submitted') { next = 'View in underwriting'; route = { page: 'underwriting', id: s.requestId }; why = 'Credit Underwriting is reviewing the request.'; }
  else if (req.status === 'approved') { next = 'View credit line'; route = { page: 'credit', id: s.requestId }; why = 'Approved. Monitor documents and collateral in Active credit.'; }
  else if (g.attention === 'waiting') { next = 'View request'; route = { page: 'request', id, section: 'collateral' }; why = `Waiting on ${g.waitingOn}. No action needed from you.`; }
  // Lower number = higher priority: shortfalls and exceptions first, then requests already in progress.
  const priority = openConditions.length && req.status === 'submitted' ? -1 : (g.margin < 0 ? 0 : 10) + (g.exceptions.length ? 0 : 5) + (req.visited.length ? 0 : 1);
  return {
    key: s.requestId,
    client: s.entityName ?? s.primary.name,
    sub: `${s.requestId} · ${s.applicationType}${s.entityName ? ` · Signer ${s.primary.name}` : ''}`,
    lifecycle, progress,
    attention, waitingOn: attention === 'action' ? undefined : g.waitingOn,
    requested: req.requested, power: ev.total, coverage: g.coverage, margin: g.margin,
    exceptions: openConditions.length && req.status === 'submitted' ? [`${openConditions.length} underwriting condition${openConditions.length > 1 ? 's' : ''}`, ...g.exceptions] : g.exceptions,
    next, why, route, open: req.status === 'draft' ? open : openConditions.length, priority,
  };
}

const GROUPS: { key: Attention; title: string; description: string; empty: string }[] = [
  { key: 'action', title: 'Needs your action', description: 'Items only you can resolve, highest priority first.', empty: 'Nothing needs your action.' },
  { key: 'ready', title: 'Ready to submit', description: 'All readiness checks are complete.', empty: 'No requests are ready to submit yet.' },
  { key: 'waiting', title: 'Waiting on another team', description: 'No action needed from you.', empty: 'No requests are waiting on another team.' },
];

export function Pipeline({ onOpen }: { onOpen: (r: Route) => void }) {
  const rows: Row[] = [
    useScenarioRow('single'),
    useScenarioRow('joint'),
    useScenarioRow('complex'),
    ...PIPELINE.filter((p) => p.status === 'In Underwriting').map((p): Row => ({
      key: p.requestId, client: p.client, sub: `${p.requestId} · Individual`, lifecycle: 'Underwriting', progress: 'Submitted 11/12/2025',
      attention: 'waiting', waitingOn: 'Credit Underwriting', requested: p.requestedAmount, power: p.borrowingPower,
      coverage: p.borrowingPower / p.requestedAmount, margin: p.borrowingPower - p.requestedAmount, exceptions: [],
      next: 'View in underwriting', why: 'Credit Underwriting is reviewing the request.', route: { page: 'underwriting', id: p.requestId }, open: 0, priority: 20,
    })),
  ];
  const [q, setQ] = useState('');
  const [starting, setStarting] = useState(false);
  const match = (r: Row) => !q || `${r.client} ${r.sub}`.toLowerCase().includes(q.toLowerCase());
  const byGroup = (k: Attention) => rows.filter((r) => r.attention === k).sort((a, b) => a.priority - b.priority);
  const action = byGroup('action');
  const top = action[0];

  return (
    <div className="px-4 sm:px-8 py-8 w-page mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-6 mb-6">
        <div>
          <h1 className="t-heading-05">Pipeline</h1>
          <p className="t-body-01 text-[var(--cds-text-secondary)] mt-2 w-form">Origination requests you own, grouped by who needs to act next.</p>
        </div>
        <Button kind="tertiary" size="md" renderIcon={Add} onClick={() => setStarting(true)}>New request</Button>
      </div>
      <NewRequest open={starting} onClose={() => setStarting(false)} onOpen={(r) => { setStarting(false); onOpen(r); }} />

      {/* Operational overview: one dominant priority, two supporting counts. */}
      <section aria-labelledby="overview-h" className="bg-[var(--cds-layer-01)] grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] mb-10">
        <div className="p-6 lg:pr-8">
          <h2 id="overview-h" className="t-label-01 text-[var(--cds-text-secondary)]">Needs your action</h2>
          <p className="mt-1 flex items-baseline gap-3"><span className="t-heading-06 tabular-nums">{action.length}</span><span className="t-body-01">request{action.length === 1 ? '' : 's'}</span></p>
          {top ? (
            <div className="mt-3">
              <p className="t-body-01"><span className="font-semibold">Start with {top.client}.</span> {top.why}</p>
              <Button className="mt-4" size="md" renderIcon={ArrowRight} onClick={() => onOpen(top.route)}>{top.next}</Button>
            </div>
          ) : (
            <p className="t-body-01 mt-3">You’re clear. Requests that need you will appear here.</p>
          )}
        </div>
        {(['ready', 'waiting'] as Attention[]).map((k) => {
          const g = GROUPS.find((x) => x.key === k)!;
          const n = byGroup(k).length;
          return (
            <div key={k} className="p-6 border-t lg:border-t-0 lg:border-l border-[var(--cds-border-subtle-01)]">
              <h2 className="t-label-01 text-[var(--cds-text-secondary)]">{g.title}</h2>
              <p className="t-heading-04 tabular-nums mt-1">{n}</p>
              <p className="t-helper-01 text-[var(--cds-text-secondary)] mt-1">{k === 'waiting' && n ? `${byGroup(k).map((r) => r.waitingOn).filter((v, i, a) => a.indexOf(v) === i).join(', ')}` : g.description}</p>
            </div>
          );
        })}
      </section>

      <div className="flex flex-wrap items-end justify-between gap-4 mb-3">
        <h2 className="t-heading-03">Requests</h2>
        <div className="w-search">
          <Search size="md" id="pipeline-search" labelText="Filter requests" placeholder="Filter by client or request ID" value={q} onChange={(e: { target: HTMLInputElement }) => setQ(e.target.value)} />
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table aria-label="Requests by attention" size="lg" className="min-w-[1120px] pipeline-table">
          <TableHead>
            <TableRow>
              <TableHeader>Client</TableHeader>
              <TableHeader>Stage</TableHeader>
              <TableHeader className="num">Requested amount</TableHeader>
              <TableHeader className="num">Estimated borrowing power</TableHeader>
              <TableHeader className="num">Coverage of request</TableHeader>
              <TableHeader>Exceptions</TableHeader>
              <TableHeader>Next action</TableHeader>
            </TableRow>
          </TableHead>
          {GROUPS.map((g) => {
            const list = byGroup(g.key).filter(match);
            return (
              <TableBody key={g.key} aria-label={g.title}>
                <TableRow className="group-row">
                  <TableCell colSpan={7}>
                    <span className="t-heading-02">{g.title} <span className="tabular-nums">({list.length})</span></span>
                    <span className="t-helper-01 text-[var(--cds-text-secondary)] ml-3">{g.description}</span>
                  </TableCell>
                </TableRow>
                {list.length === 0 && (
                  <TableRow><TableCell colSpan={7}><span className="t-body-01 text-[var(--cds-text-secondary)]">{q ? 'No requests match this filter.' : g.empty}</span></TableCell></TableRow>
                )}
                {list.map((r) => (
                  <TableRow key={r.key}>
                    <TableCell>
                      <div className="t-heading-compact-01">{r.client}</div>
                      <div className="t-helper-01 text-[var(--cds-text-secondary)]">{r.sub}</div>
                    </TableCell>
                    <TableCell>
                      <div className="t-body-01">{r.lifecycle}</div>
                      <div className="t-helper-01 text-[var(--cds-text-secondary)]">{r.progress}</div>
                    </TableCell>
                    <TableCell className="num"><Money value={r.requested} /></TableCell>
                    <TableCell className="num font-semibold"><Money value={r.power} /></TableCell>
                    <TableCell className="num">
                      <div className={cx('t-body-01', r.margin < 0 && 'text-[var(--cds-text-error)] !font-semibold')}>{fmtPct(r.coverage)}</div>
                      <div className={cx('t-helper-01', r.margin < 0 ? 'text-[var(--cds-text-error)]' : 'text-[var(--cds-text-secondary)]')}>{r.margin < 0 ? `${fmtMoney(-r.margin)} short` : `${fmtMoney(r.margin)} surplus`}</div>
                      {r.margin < 0 && <span className="sr-only"> (below the 100% needed to submit)</span>}
                    </TableCell>
                    <TableCell>
                      {r.exceptions.length ? (
                        <ul className="t-body-01">{r.exceptions.map((e) => <li key={e}>{e}</li>)}</ul>
                      ) : <span className="t-body-01 text-[var(--cds-text-secondary)]">None</span>}
                    </TableCell>
                    <TableCell>
                      <Button kind={g.key === 'waiting' ? 'ghost' : 'tertiary'} size="sm" renderIcon={ArrowRight} onClick={() => onOpen(r.route)} aria-label={`${r.next}: ${r.client}`}>{r.next}</Button>
                      {r.attention === 'action' && r.open > 0 && <div className="t-helper-01 text-[var(--cds-text-secondary)] mt-1">{r.open} open item{r.open > 1 ? 's' : ''}</div>}
                      {r.attention === 'waiting' && r.waitingOn && <div className="t-helper-01 text-[var(--cds-text-secondary)] mt-1">Waiting on {r.waitingOn}</div>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            );
          })}
        </Table>
      </div>
      <p className="t-helper-01 text-[var(--cds-text-secondary)] mt-3 w-form">
        Coverage = estimated borrowing power ÷ requested amount. A request can be submitted when coverage is 100% or more. Estimated borrowing power is indicative; it is not approved credit. Collateral alerts for active lines are in <span className="font-semibold">Active credit</span>.
      </p>
    </div>
  );
}

/**
 * Start a request from the client directory. The request is prefilled from the client
 * record and relationship accounts; clients with a request already in progress are sent
 * to it rather than duplicated.
 */
function NewRequest({ open, onClose, onOpen }: { open: boolean; onClose: () => void; onOpen: (r: Route) => void }) {
  const [q, setQ] = useState('');
  const term = q.trim().toLowerCase();
  const hits = term.length >= 2 ? PEOPLE.filter((p) => [p.name, p.mdmId, p.powerId].some((f) => f.toLowerCase().includes(term))) : [];
  const describe = (personId: string, mdmId: string): { status: string; detail: string; action?: { label: string; route: Route } } => {
    const own = SCENARIOS.find((sc) => sc.primary.id === personId);
    if (own) {
      const value = own.accounts.reduce((t, a) => t + accountValue(a), 0);
      return { status: `Request ${own.requestId} in progress`, detail: `Prefilled from the client record: identity, contact and ${own.accounts.length} relationship accounts (${fmtMoney(value)} market value).`, action: { label: 'Open request', route: { page: 'request', id: own.id, section: 'client' } } };
    }
    const party = SCENARIOS.find((sc) => sc.coBorrowerId === personId || sc.beneficialOwners?.some((o) => o.personId === personId));
    if (party) return { status: `Party on ${party.requestId}`, detail: `${party.coBorrowerId === personId ? 'Co-borrower' : 'Beneficial owner'} on the request for ${party.entityName ?? party.primary.name}.`, action: { label: 'Open request', route: { page: 'request', id: party.id, section: 'client' } } };
    const existing = PIPELINE.find((x) => x.mdmId === mdmId);
    if (existing) return { status: `Request ${existing.requestId}: ${existing.status.toLowerCase()}`, detail: existing.status === 'In Underwriting' ? 'Credit Underwriting is reviewing this request.' : 'An existing request is already open for this client.', action: existing.status === 'In Underwriting' ? { label: 'View in underwriting', route: { page: 'underwriting', id: existing.requestId } } : undefined };
    return { status: 'No request can be started', detail: 'No accounts on file can be pledged. A request needs at least one eligible account in the client relationship.' };
  };
  return (
    <Modal open={open} size="md" modalHeading="Start a request" passiveModal onRequestClose={() => { setQ(''); onClose(); }}>
      <p className="t-body-01 mb-4">Find the client. The request is prefilled from the client record, so you only confirm what’s there and ask what isn’t.</p>
      {/* Carbon Search keeps Escape to clear its text; once it's empty, Escape closes the dialog. */}
      <div onKeyDownCapture={(e) => { if (e.key === 'Escape' && !q) { e.stopPropagation(); onClose(); } }}>
        <Search size="md" id="new-request-search" labelText="Search the client directory" placeholder="Name, MDM ID or Power ID" value={q} onChange={(e: { target: HTMLInputElement }) => setQ(e.target.value)} />
      </div>
      <p className="t-helper-01 text-[var(--cds-text-secondary)] mt-1">Enter at least two characters.</p>
      {term.length >= 2 && (
        <ul className="mt-4 border-t border-[var(--cds-border-subtle-01)]" aria-live="polite">
          {hits.length === 0 && <li className="py-3 t-body-01">No clients match “{q}”. Check the name or identifier.</li>}
          {hits.map((p) => {
            const d = describe(p.id, p.mdmId);
            return (
              <li key={p.id} className="py-3 border-b border-[var(--cds-border-subtle-01)] flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="t-heading-compact-01">{p.name} <span className="t-helper-01 text-[var(--cds-text-secondary)]">MDM ID {p.mdmId} · Power ID {p.powerId}</span></p>
                  <p className="t-body-01 mt-1">{d.status}</p>
                  <p className="t-helper-01 text-[var(--cds-text-secondary)] mt-1">{d.detail}</p>
                </div>
                {d.action && <Button kind="tertiary" size="sm" renderIcon={ArrowRight} onClick={() => { setQ(''); onOpen(d.action!.route); }} aria-label={`${d.action.label}: ${p.name}`}>{d.action.label}</Button>}
              </li>
            );
          })}
        </ul>
      )}
    </Modal>
  );
}
