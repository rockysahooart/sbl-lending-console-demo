import { useState } from 'react';
import { ActionableNotification, Button, InlineNotification, Modal, Table, TableBody, TableCell, TableContainer, TableHead, TableHeader, TableRow } from '@carbon/react';
import { CheckmarkFilled, Time } from '@carbon/icons-react';
import { ACTIVE_LINES, PIPELINE, fmtMoney, fmtPct, type ActiveLine, type ScenarioId } from '../data';
import { nowStamp, useAfterRequest, useAudit } from './state';
import { KV, Money, PageHeader, Tag, cx } from './ui';
import type { Route } from './AfterApp';

function useScenarioLines() {
  // Fixed order of hook calls (three scenarios).
  return (['single', 'joint', 'complex'] as ScenarioId[]).map((id) => ({ id, m: useAfterRequest(id) }));
}

/** Approved limit used by the simulated decision: lower of requested amount and estimated borrowing power, rounded down to $10,000. */
const approvedLimit = (requested: number, power: number) => Math.floor(Math.min(requested, power) / 10000) * 10000;

export function Underwriting({ focusId, onRoute }: { focusId?: string; onRoute: (r: Route) => void }) {
  const lines = useScenarioLines();
  const { log } = useAudit();
  const [confirmFor, setConfirmFor] = useState<string | null>(null);
  const rows = [
    ...lines.filter((l) => l.m.req.status !== 'draft').map((l) => ({ key: l.m.s.requestId, client: l.m.s.entityName ?? l.m.s.primary.name, requested: l.m.req.requested, power: l.m.ev.total, submitted: l.m.req.submittedAt ?? '', status: l.m.req.status, scenario: l })),
    ...PIPELINE.filter((p) => p.status === 'In Underwriting').map((p) => ({ key: p.requestId, client: p.client, requested: p.requestedAmount, power: p.borrowingPower, submitted: '11/12/2025', status: 'submitted' as const, scenario: undefined })),
  ];
  const [sel, setSel] = useState(focusId && rows.some((r) => r.key === focusId) ? focusId : rows[0]?.key);
  const cur = rows.find((r) => r.key === sel);
  const target = rows.find((r) => r.key === confirmFor);
  const [conditionFor, setConditionFor] = useState<string | null>(null);
  const openOf = (r?: (typeof rows)[number]) => (r?.scenario?.m.req.conditions ?? []).filter((c) => c.status === 'open');
  const condTarget = rows.find((r) => r.key === conditionFor);
  const provide = (r: (typeof rows)[number], id: string) => {
    r.scenario!.m.setReq((p) => ({ ...p, conditions: (p.conditions ?? []).map((c) => (c.id === id ? { ...c, status: 'provided', providedAt: nowStamp() } : c)) }));
    log('Condition provided', 'Response sent to Credit Underwriting', r.key);
  };

  return (
    <div className="px-4 sm:px-8 py-8 w-page mx-auto">
      <PageHeader title="Underwriting" description="Credit Underwriting owns these decisions. You’re notified when a decision or condition needs your response." />
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_440px] gap-6 items-start">
        <TableContainer title="Requests in underwriting">
          <div className="overflow-x-auto">
            <Table aria-label="Requests in underwriting" size="lg" className="min-w-[860px]">
              <TableHead>
                <TableRow>
                  <TableHeader>Request</TableHeader>
                  <TableHeader className="num">Requested amount</TableHeader>
                  <TableHeader className="num">Estimated borrowing power</TableHeader>
                  <TableHeader>Submitted</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Your next step</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.key} isSelected={sel === r.key}>
                    <TableCell>
                      <Button kind="ghost" size="sm" className="!px-0" onClick={() => setSel(r.key)} aria-pressed={sel === r.key}>{r.client}</Button>
                      <div className="t-helper-01 text-[var(--cds-text-secondary)]">{r.key}</div>
                    </TableCell>
                    <TableCell className="num"><Money value={r.requested} /></TableCell>
                    <TableCell className="num"><Money value={r.power} /></TableCell>
                    <TableCell>{r.submitted}</TableCell>
                    <TableCell>{r.status === 'approved' ? <Tag tone="success">Approved</Tag> : <Tag tone="info">Under review</Tag>}</TableCell>
                    <TableCell>{r.status === 'approved' ? <span className="t-heading-compact-01">Monitor the credit line</span> : openOf(r).length ? <span className="t-heading-compact-01">Respond to condition</span> : <span className="t-body-01 text-[var(--cds-text-secondary)]">None — awaiting decision</span>}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TableContainer>
        {cur && (
          <section aria-label={`Underwriting detail for ${cur.client}`} className="bg-[var(--cds-layer-01)] p-6 xl:sticky xl:top-6">
            <h2 className="t-heading-03">{cur.client}</h2>
            <p className="t-helper-01 text-[var(--cds-text-secondary)]">{cur.key}</p>
            <div className="mt-6 bg-[var(--cds-background)] px-4 py-3 accent-start">
              <p className="t-label-01 text-[var(--cds-text-secondary)]">{cur.status === 'approved' ? 'Decision' : openOf(cur).length ? 'Needs your response' : 'Waiting on'}</p>
              <p className="t-heading-02 mt-0.5">{cur.status === 'approved' ? 'Approved by Credit Underwriting' : openOf(cur).length ? `${openOf(cur).length} open condition${openOf(cur).length > 1 ? 's' : ''} from Credit Underwriting` : 'Credit Underwriting · decision due in 2 business days'}</p>
              <p className="t-body-01 mt-1">{cur.status === 'approved' ? 'Next: monitor documents and collateral in Active credit.' : openOf(cur).length ? 'The decision follows once each condition is provided.' : 'No action is needed from you. Conditions, if any, will appear here.'}</p>
            </div>
            {(cur.scenario?.m.req.conditions ?? []).length > 0 && (
              <section aria-labelledby="cond-h" className="mt-6">
                <h3 id="cond-h" className="t-heading-02">Conditions</h3>
                <ul className="mt-2 border-t border-[var(--cds-border-subtle-01)]">
                  {cur.scenario!.m.req.conditions!.map((c) => (
                    <li key={c.id} className="py-3 border-b border-[var(--cds-border-subtle-01)]">
                      <div className="flex items-start justify-between gap-3">
                        <p className="t-body-01">{c.text}</p>
                        <Tag tone={c.status === 'open' ? 'warning' : 'success'}>{c.status === 'open' ? 'Open' : 'Provided'}</Tag>
                      </div>
                      <p className="t-helper-01 text-[var(--cds-text-secondary)] mt-1">Issued {c.at}{c.providedAt ? ` · provided ${c.providedAt}` : ''}</p>
                      {c.status === 'open' && <Button kind="primary" size="sm" className="mt-2" onClick={() => provide(cur, c.id)}>Mark as provided</Button>}
                    </li>
                  ))}
                </ul>
              </section>
            )}
            <dl className="grid grid-cols-2 gap-4 mt-6">
              <KV label="Underwriter" value="Credit Underwriting" />
              <KV label="Submitted" value={cur.submitted ? cur.submitted.split(',')[0] : '—'} mono />
              <KV label="Requested amount" value={fmtMoney(cur.requested)} mono />
              <KV label="Estimated borrowing power" value={fmtMoney(cur.power)} mono />
            </dl>
            <h3 className="t-heading-02 mt-6">Documentation</h3>
            <ul className="mt-2 space-y-2 t-body-01">
              {[
                ['Credit application', true],
                ['Collateral evaluation and reviews', true],
                ['Identification, screening and ownership records', true],
                ['Pledge and control agreement', cur.status === 'approved'],
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
              ) : (
                <div className="mt-6 border border-dashed border-[var(--cds-border-strong-01)] p-4">
                  <p className="t-helper-01 text-[var(--cds-text-secondary)]">Demo actions: simulate what Credit Underwriting does so the rest of the lifecycle can be explored.</p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    {openOf(cur).length === 0 && <Button kind="tertiary" size="sm" onClick={() => setConfirmFor(cur.key)}>Simulate approval</Button>}
                    <Button kind="ghost" size="sm" onClick={() => setConditionFor(cur.key)}>Simulate a condition</Button>
                  </div>
                  {openOf(cur).length > 0 && <p className="t-helper-01 text-[var(--cds-text-secondary)] mt-2">A decision can be simulated once open conditions are provided.</p>}
                </div>
              )
            ) : (
              <p className="t-helper-01 text-[var(--cds-text-secondary)] mt-6">Reference record. Decisions can be simulated on the three scenario requests.</p>
            )}
            <div className="mt-6 flex flex-wrap gap-3">
              {cur.scenario && cur.status === 'approved' && <Button size="sm" onClick={() => onRoute({ page: 'credit', id: cur.key })}>View credit line</Button>}
              <Button kind="ghost" size="sm" onClick={() => onRoute(cur.scenario ? { page: 'request', id: cur.scenario.id, section: 'review' } : { page: 'pipeline' })}>{cur.scenario ? 'View origination record' : 'Back to pipeline'}</Button>
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
          condTarget.scenario.m.setReq((p) => ({ ...p, conditions: [...(p.conditions ?? []), { id: `c${(p.conditions ?? []).length + 1}`, text, status: 'open', at: nowStamp() }] }));
          log('Underwriting condition issued (simulated)', text, condTarget.key);
          setConditionFor(null);
        }}
      >
        {condTarget && <p className="t-body-01">Demo action. Credit Underwriting asks {condTarget.client}’s banker for the most recent month-end statement for each pledged account. The request returns to the banker’s pipeline. No real request is made.</p>}
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
          target.scenario.m.setReq((p) => ({ ...p, status: 'approved', approvedAt: `11/19/2025, ${at}` }));
          log('Underwriting decision (simulated)', `Approved; credit limit ${fmtMoney(approvedLimit(target.requested, target.power))}`, target.key);
          setConfirmFor(null);
        }}
      >
        {target && (
          <p className="t-body-01">Demo action. This records a simulated approval for {target.client} with an approved credit limit of {fmtMoney(approvedLimit(target.requested, target.power))} (the lower of the requested amount and the estimated borrowing power). No real credit decision is made.</p>
        )}
      </Modal>
    </div>
  );
}

interface LineVM extends ActiveLine { scenarioId?: ScenarioId }

export function ActiveCredit({ focusId, onRoute }: { focusId?: string; onRoute: (r: Route) => void }) {
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
  const all: LineVM[] = [...approved, ...ACTIVE_LINES];
  const [sel, setSel] = useState(focusId && all.some((l) => l.id === focusId) ? focusId : all[0].id);
  const cur = all.find((l) => l.id === sel) ?? all[0];
  const ltv = (l: LineVM) => (l.collateralValue ? l.outstanding / l.collateralValue : 0);
  const nearCall = (l: LineVM) => ltv(l) >= l.maintenanceLtv - 0.1;
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
      <PageHeader title="Active credit" description="Approved credit lines you service. Lines that need attention come first." />
      <section aria-labelledby="attn-h" className="mb-10">
        <h2 id="attn-h" className="t-heading-03">Needs attention <span className="tabular-nums">({attention.length})</span></h2>
        {attention.length === 0 ? (
          <p className="t-body-01 mt-2">All lines are within limits and documentation is complete.</p>
        ) : (
          <ul className="mt-3 border-t border-[var(--cds-border-strong-01)]">
            {attention.map((a) => (
              <li key={a.key} className="grid grid-cols-1 md:grid-cols-[minmax(0,260px)_minmax(0,1fr)_auto] gap-x-8 gap-y-2 items-center py-4 border-b border-[var(--cds-border-subtle-00)]">
                <div><p className="t-heading-compact-01">{a.line.client}</p><p className="t-helper-01 text-[var(--cds-text-secondary)]">{a.line.id}</p></div>
                <div className="flex items-start gap-3">
                  <Tag tone={a.tone}>{a.tag}</Tag>
                  <p className="t-body-01">{a.text}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 md:justify-end">
                  {a.rank === 0 ? (
                    <Button kind="primary" size="sm" onClick={() => { setGlobal((g) => ({ ...g, acknowledgedAlerts: [...g.acknowledgedAlerts, a.line.id] })); log('Collateral alert acknowledged', 'Client outreach scheduled', a.line.id); }} aria-label={`Acknowledge and schedule outreach: ${a.line.client}`}>Acknowledge and schedule outreach</Button>
                  ) : (global.remindersSent ?? []).includes(a.line.id) ? (
                    <Tag tone="success">Reminder sent</Tag>
                  ) : (
                    <Button kind="tertiary" size="sm" onClick={() => { setGlobal((g) => ({ ...g, remindersSent: [...(g.remindersSent ?? []), a.line.id] })); log('Document reminder sent', 'Reminder sent to the client', a.line.id); }} aria-label={`Send document reminder: ${a.line.client}`}>Send document reminder</Button>
                  )}
                  <Button kind="ghost" size="sm" onClick={() => { setSel(a.line.id); requestAnimationFrame(() => { const el = document.getElementById('credit-detail'); el?.scrollIntoView({ block: 'start' }); el?.focus({ preventScroll: true }); }); }} aria-label={`View line: ${a.line.client}`}>View line</Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
      <TableContainer title="All credit lines" description="Loan-to-value (LTV) = outstanding balance ÷ collateral market value. A maintenance call may be issued at the maintenance threshold.">
        <div className="overflow-x-auto">
          <Table aria-label="Credit lines" size="lg" className="min-w-[1040px]">
            <TableHead>
              <TableRow>
                <TableHeader>Client and line</TableHeader>
                <TableHeader className="num">Approved credit limit</TableHeader>
                <TableHeader className="num">Outstanding balance</TableHeader>
                <TableHeader className="num">Available credit</TableHeader>
                <TableHeader className="num">Collateral market value</TableHeader>
                <TableHeader className="num">LTV</TableHeader>
                <TableHeader>Documents</TableHeader>
                <TableHeader>Monitoring</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {all.map((l) => {
                const acked = global.acknowledgedAlerts.includes(l.id);
                const docsOpen = l.docs.filter((d) => d.status !== 'Complete').length;
                return (
                  <TableRow key={l.id} isSelected={sel === l.id}>
                    <TableCell>
                      <Button kind="ghost" size="sm" className="!px-0" onClick={() => setSel(l.id)} aria-pressed={sel === l.id}>{l.client}</Button>
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
      </TableContainer>

      <section id="credit-detail" tabIndex={-1} aria-label={`Detail for ${cur.client}`} className="mt-10 border-t-2 border-[var(--cds-interactive)] focus:outline-none scroll-mt-4">
        <div className="py-4 border-b border-[var(--cds-border-subtle-00)] flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="t-heading-03">{cur.client}</h2>
            <p className="t-helper-01 text-[var(--cds-text-secondary)]">{cur.id} · Approved {cur.approvedOn}</p>
          </div>
          {cur.scenarioId && <Button kind="ghost" size="sm" onClick={() => onRoute({ page: 'request', id: cur.scenarioId!, section: 'review' })}>View origination record</Button>}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="py-6 lg:pr-0">
            <div className="bg-[var(--cds-layer-01)] p-5">
            <h3 className="t-heading-02 mb-3">Credit</h3>
            <dl className="space-y-2 t-body-01 tabular-nums">
              <div className="flex justify-between"><dt className="text-[var(--cds-text-secondary)]">Approved credit limit</dt><dd><Money value={cur.limit} /></dd></div>
              <div className="flex justify-between"><dt className="text-[var(--cds-text-secondary)]">Outstanding balance</dt><dd><Money value={cur.outstanding} /></dd></div>
              <div className="flex justify-between items-baseline font-semibold pt-1"><dt>Available credit</dt><dd className="t-heading-03 !font-semibold"><Money value={cur.limit - cur.outstanding} /></dd></div>
            </dl>
            <h3 className="t-heading-02 mt-6 mb-2">Collateral coverage</h3>
            <div className="relative h-2 bg-[var(--cds-border-subtle-01)]" role="img" aria-label={`LTV ${fmtPct(ltv(cur), 1)}; maintenance threshold ${fmtPct(cur.maintenanceLtv)}`}>
              <div className={cx('h-full', nearCall(cur) ? 'bg-[var(--cds-support-error)]' : 'bg-[var(--cds-interactive)]')} style={{ width: `${Math.min(ltv(cur), 1) * 100}%` }} />
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
                    <TableCell>{c.account}</TableCell>
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
