import { useState } from 'react';
import { ContentSwitcher, Switch, Table, TableBody, TableCell, TableContainer, TableHead, TableHeader, TableRow, TableToolbar, TableToolbarContent, TableToolbarSearch, Button } from '@carbon/react';
import { ArrowRight } from '@carbon/icons-react';
import { PIPELINE, ACTIVE_LINES, fmtPct, type ScenarioId } from '../data';
import { useAfterRequest, type Section } from './state';
import { Money, PageHeader, Tag, cx, type Tone } from './ui';
import type { Route } from './AfterApp';

interface Row {
  key: string;
  client: string;
  sub: string;
  type: string;
  stage: string;
  tone: Tone;
  requested: number;
  power: number | null;
  openItems: number;
  itemsDetail: string;
  next: string;
  route: Route;
  group: 'action' | 'ready' | 'underwriting' | 'other';
}

function useScenarioRow(id: ScenarioId): Row {
  const { s, req, ev, openItems, readiness } = useAfterRequest(id);
  const firstOpen = readiness.find((r) => !r.done);
  const label: Record<Section, string> = { client: 'client and party', collateral: 'collateral', structure: 'loan structure', review: 'review' };
  let stage = 'Not started';
  let tone: Tone = 'neutral';
  let next = 'Start request';
  let route: Route = { page: 'request', id, section: 'client' };
  let group: Row['group'] = 'action';
  if (req.status === 'submitted') {
    stage = 'In underwriting'; tone = 'info'; next = 'View in underwriting'; route = { page: 'underwriting', id: s.requestId }; group = 'underwriting';
  } else if (req.status === 'approved') {
    stage = 'Approved'; tone = 'success'; next = 'View credit line'; route = { page: 'credit', id: s.requestId }; group = 'other';
  } else if (openItems === 0) {
    stage = 'Ready to submit'; tone = 'success'; next = 'Review and submit'; route = { page: 'request', id, section: 'review' }; group = 'ready';
  } else if (req.visited.length > 0 && firstOpen) {
    stage = ev.needsReview > 0 ? 'Collateral review required' : 'In progress';
    tone = ev.needsReview > 0 ? 'review' : 'warning';
    const sec = firstOpen.step as Section;
    const n = readiness.filter((r) => !r.done && r.step === firstOpen.step).length;
    next = `Resolve ${n} ${label[sec]} item${n > 1 ? 's' : ''}`;
    route = { page: 'request', id, section: sec };
  } else if (ev.needsReview > 0) {
    stage = 'Collateral review required'; tone = 'review';
  }
  return {
    key: s.requestId,
    client: s.entityName ?? s.primary.name,
    sub: `${s.requestId}${s.entityName ? ` · ${s.primary.name}` : ''}`,
    type: s.applicationType,
    stage, tone,
    requested: req.requested,
    power: ev.total,
    openItems: req.status === 'draft' ? openItems : 0,
    itemsDetail: readiness.filter((r) => !r.done).map((r) => r.label).join('; '),
    next, route, group,
  };
}

const FILTERS = [
  { key: 'all', text: 'All' },
  { key: 'action', text: 'Action required' },
  { key: 'ready', text: 'Ready to submit' },
  { key: 'underwriting', text: 'In underwriting' },
] as const;

export function Pipeline({ onOpen }: { onOpen: (r: Route) => void }) {
  const rows: Row[] = [
    useScenarioRow('single'),
    useScenarioRow('joint'),
    useScenarioRow('complex'),
    ...PIPELINE.filter((p) => p.status === 'In Underwriting').map((p): Row => ({
      key: p.requestId, client: p.client, sub: p.requestId, type: 'Individual', stage: 'In underwriting', tone: 'info',
      requested: p.requestedAmount, power: p.borrowingPower, openItems: 0, itemsDetail: '', next: 'View in underwriting',
      route: { page: 'underwriting', id: p.requestId }, group: 'underwriting',
    })),
  ];
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['key']>('all');
  const [q, setQ] = useState('');
  const visible = rows.filter((r) => (filter === 'all' || r.group === filter) && (!q || `${r.client} ${r.sub}`.toLowerCase().includes(q.toLowerCase())));
  const count = (k: Row['group']) => rows.filter((r) => r.group === k).length;
  const alerts = ACTIVE_LINES.filter((l) => l.outstanding / l.collateralValue > l.maintenanceLtv - 0.1).length;
  const tiles: [string, number, string][] = [
    ['Action required', count('action'), 'Requests with open items'],
    ['Ready to submit', count('ready'), 'All readiness checks complete'],
    ['In underwriting', count('underwriting'), 'Awaiting an underwriting decision'],
    ['Collateral alerts', alerts, 'Active lines near the maintenance LTV'],
  ];

  return (
    <div className="px-4 sm:px-8 py-8">
      <PageHeader title="Pipeline" description="Requests in origination and pre-underwriting review. Estimated borrowing power is indicative and is not a credit decision." />
      <dl className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-[var(--cds-border-subtle-01)] border border-[var(--cds-border-subtle-01)] mb-8">
        {tiles.map(([l, v, d]) => (
          <div key={l} className="bg-[var(--cds-layer-01)] px-5 py-4">
            <dt className="t-label-01 text-[var(--cds-text-secondary)]">{l}</dt>
            <dd className="t-heading-05 tabular-nums mt-1">{v}</dd>
            <dd className="t-helper-01 text-[var(--cds-text-secondary)]">{d}</dd>
          </div>
        ))}
      </dl>

      <TableContainer title="Requests" description="Estimated borrowing power and coverage update as collateral and reviews change.">
        <TableToolbar aria-label="Request filters">
          <div className="flex-1 flex items-center px-4 min-w-0">
            <ContentSwitcher
              size="md"
              selectedIndex={FILTERS.findIndex((f) => f.key === filter)}
              onChange={({ index }: { index?: number }) => setFilter(FILTERS[index ?? 0].key)}
              className="max-w-[640px]"
            >
              {FILTERS.map((f) => (
                <Switch key={f.key} name={f.key} text={`${f.text} (${f.key === 'all' ? rows.length : count(f.key as Row['group'])})`} />
              ))}
            </ContentSwitcher>
          </div>
          <TableToolbarContent>
            <TableToolbarSearch persistent placeholder="Filter by client or request ID" labelText="Filter requests" onChange={(e: unknown) => setQ(((e as React.ChangeEvent<HTMLInputElement>)?.target?.value) ?? '')} />
          </TableToolbarContent>
        </TableToolbar>
        <div className="overflow-x-auto">
          <Table aria-label="Requests" size="lg" className="min-w-[1000px]">
            <TableHead>
              <TableRow>
                <TableHeader>Client and request</TableHeader>
                <TableHeader>Application type</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader className="num">Requested amount</TableHeader>
                <TableHeader className="num">Estimated borrowing power</TableHeader>
                <TableHeader>Coverage ratio</TableHeader>
                <TableHeader className="num">Open items</TableHeader>
                <TableHeader>Next action</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {visible.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8}>
                    <div className="py-8 text-center t-body-01">
                      No requests match this filter.{' '}
                      <Button kind="ghost" size="sm" onClick={() => { setFilter('all'); setQ(''); }}>Show all requests</Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {visible.map((r) => {
                const cov = r.power != null && r.requested > 0 ? r.power / r.requested : null;
                return (
                  <TableRow key={r.key}>
                    <TableCell>
                      <div className="font-medium">{r.client}</div>
                      <div className="t-helper-01 text-[var(--cds-text-secondary)]">{r.sub}</div>
                    </TableCell>
                    <TableCell>{r.type}</TableCell>
                    <TableCell><Tag tone={r.tone}>{r.stage}</Tag></TableCell>
                    <TableCell className="num"><Money value={r.requested} /></TableCell>
                    <TableCell className="num">{r.power != null ? <Money value={r.power} /> : '—'}</TableCell>
                    <TableCell>
                      {cov != null && (
                        <div className="flex items-center gap-2 w-36">
                          <div className="h-1 flex-1 bg-[var(--cds-border-subtle-01)]" aria-hidden="true">
                            <div className={cx('h-full', cov >= 1 ? 'bg-[var(--cds-support-success)]' : 'bg-[var(--cds-support-error)]')} style={{ width: `${(Math.min(cov, 1.5) / 1.5) * 100}%` }} />
                          </div>
                          <span className={cx('t-helper-01 tabular-nums w-11 text-right', cov >= 1 ? 'text-[var(--cds-text-primary)]' : 'text-[var(--cds-text-error)]')}>{fmtPct(cov)}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="num">
                      <span className={r.openItems ? 'font-semibold' : 'text-[var(--cds-text-secondary)]'}>{r.openItems}</span>
                      {r.openItems > 0 && <span className="sr-only">: {r.itemsDetail}</span>}
                    </TableCell>
                    <TableCell>
                      <Button kind="ghost" size="sm" renderIcon={ArrowRight} onClick={() => onOpen(r.route)} aria-label={`${r.next}: ${r.client}`}>
                        {r.next}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </TableContainer>
      <p className="t-helper-01 text-[var(--cds-text-secondary)] mt-3">Coverage ratio = estimated borrowing power ÷ requested amount.</p>
    </div>
  );
}
