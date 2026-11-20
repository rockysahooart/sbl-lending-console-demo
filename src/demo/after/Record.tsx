import { Button, InlineNotification, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@carbon/react';
import { CheckmarkFilled, Warning } from '@carbon/icons-react';
import { fmtMoney, fmtPct } from '../data';
import { useEffect } from 'react';
import { PENDING_REFS, RETURNED_REF, refMarket, refPower } from './records';
import { refState } from './lifecycle';
import { useAfterGlobal } from './state';
import { KV, Money, StatusTag, Tag, cx, type Tone } from './ui';
import type { Route } from './AfterApp';
import { landOn } from './Evaluation';

/*
 * Read-only view of a fictional reference application, in the same layout as a
 * Loan Request: progress on the left, the record in the middle, Application
 * status on the right. Editing is available on the three scenario requests.
 */

const STEPS = ['Evaluation', 'Customer Information', 'Co-borrowers', 'Loan Information', 'Collaterals'];
const COL_TONE: Record<string, Tone> = { 'Auto evaluated': 'success', 'Manual evaluation': 'review', 'Manually evaluated': 'info', 'Not eligible': 'error', 'Not selected': 'neutral' };

export function Record({ id, fix, onRoute }: { id: string; fix?: string; onRoute: (r: Route) => void }) {
  const r = [...PENDING_REFS, RETURNED_REF].find((x) => x.id === id);
  const [global, setGlobal] = useAfterGlobal();
  // "Start Application" on a not-started reference record starts its evaluation.
  useEffect(() => {
    if (r && fix === 'start' && !(global.startedRefs ?? []).includes(r.id)) setGlobal((g) => ({ ...g, startedRefs: [...(g.startedRefs ?? []), r.id] }));
    const target = fix === 'start' ? 'rc-h' : fix && fix !== 'submit' ? `item-${fix}` : undefined;
    if (target) setTimeout(() => { const el = document.getElementById(target); if (el) { el.setAttribute('data-fix', 'task'); landOn(el); } }, 100);
    return () => document.querySelectorAll('[data-fix]').forEach((n) => n.removeAttribute('data-fix'));
  }, [fix]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!r) {
    return (
      <div className="px-4 sm:px-8 py-8 w-form mx-auto">
        <InlineNotification kind="error" lowContrast hideCloseButton className="!max-w-none" title="Application not found" subtitle={`No application with ID ${id}. It may have been submitted or removed.`} />
        <Button kind="tertiary" size="md" className="mt-6" onClick={() => onRoute({ page: 'console' })}>Return to Console</Button>
      </div>
    );
  }
  const power = refPower(r);
  const cov = power / r.requested;
  const diff = power - r.requested;
  const st = refState(r, global.resolvedRefItems ?? [], global.startedRefs ?? []);
  const PLACE: { [k: string]: string } = { evaluation: 'Evaluation', customer: 'Customer Information', parties: 'Co-borrowers', loan: 'Loan Information', collateral: 'Collaterals' };
  const byStep = (stp: string) => st.items.filter((o) => PLACE[o.place] === stp);
  const resolve = (itemId: string) => setGlobal((g) => ({ ...g, resolvedRefItems: [...(g.resolvedRefItems ?? []), itemId] }));
  const fixItem = fix ? st.items.find((i) => i.id === fix) : undefined;
  return (
    <div className="px-4 sm:px-8 pt-6">
      <header className="mb-6">
        <p className="t-label-01 text-[var(--cds-text-secondary)]">Loan Request · {r.id} · {r.type}</p>
        <div className="flex flex-wrap items-center gap-3 mt-1">
          <h1 className="t-heading-05">{r.business}</h1>
          <StatusTag status={st.status} />
        </div>
        <p className="t-body-01 text-[var(--cds-text-secondary)] mt-1">{st.detail !== st.status ? `${st.detail}. ` : ''}{st.why}</p>
      </header>
      <InlineNotification kind="info" lowContrast hideCloseButton className="!max-w-none mb-6" title="Fictional reference record" subtitle="Every name and figure is invented. Open items can be marked resolved here; full editing is available on the three scenario requests: Daniel Okafor, Elena Marquez and Northbridge Holdings LLC." />
      <div className="grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[224px_minmax(0,1fr)_340px] gap-8 items-start">
        <nav aria-label="Application progress" className="lg:sticky lg:top-6">
          <ol className="record-progress">
            {STEPS.map((st) => {
              const open = byStep(st).length;
              return (
                <li key={st} className={cx(open > 0 && 'has-open')}>
                  {open ? <Warning size={16} className="fill-[var(--cds-icon-secondary)]" aria-hidden="true" /> : <CheckmarkFilled size={16} className="fill-[var(--cds-support-success)]" aria-hidden="true" />}
                  <span><span className="t-body-compact-01 block">{st}</span><span className="t-helper-01 text-[var(--cds-text-secondary)]">{open ? `${open} open item${open > 1 ? 's' : ''}` : 'Complete'}</span></span>
                </li>
              );
            })}
          </ol>
        </nav>
        <div className="min-w-0 w-full w-record mx-auto">
          {fixItem && (
            <div className="mb-6" role="status">
              <InlineNotification kind={fixItem.kind === 'correction' ? 'warning' : 'info'} lowContrast hideCloseButton className="!max-w-none" title={fixItem.kind === 'correction' ? `Action required: ${fixItem.problem ?? fixItem.label}` : fixItem.label} subtitle={fixItem.explain} />
            </div>
          )}
          {fix && fix !== 'start' && fix !== 'submit' && !fixItem && (
            <div className="mb-6 flex flex-wrap items-center gap-4" role="status">
              <InlineNotification kind="success" lowContrast hideCloseButton className="!max-w-none flex-1" title="Resolved" subtitle={st.items.length ? `${st.items.length} item${st.items.length > 1 ? 's' : ''} still open.` : 'Every readiness check is complete.'} />
              {st.next && <Button size="md" onClick={() => onRoute(st.next!.route)}>{`Next: ${st.next.label}`}</Button>}
            </div>
          )}
          {r.returned && (
            <section aria-labelledby="ret-h" className="step-section">
              <h2 id="ret-h" className="t-heading-03 mb-2">Returned for correction</h2>
              <p className="t-body-01 mb-4">Submitted {r.returned.submittedAt}; returned by Credit Underwriting {r.returned.returnedAt}: {r.returned.reason}</p>
              <h3 className="t-heading-compact-01">Previously submitted (read-only)</h3>
              <dl className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3 mt-2">{r.returned.previous.map((p) => <KV key={p.label} label={p.label} value={p.value} />)}</dl>
            </section>
          )}
          <section aria-labelledby="rd-h" className="step-section">
            <h2 id="rd-h" className="t-heading-03 mb-6">Customer Details</h2>
            <dl className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-5">
              <KV label={r.type === 'Entity' || r.type === 'Trust' ? 'Business Name' : 'Customer Name'} value={r.business} />
              <KV label={r.type === 'Entity' ? 'Authorized Signer' : r.type === 'Trust' ? 'Trustee' : 'Primary Applicant'} value={r.applicant} />
              <KV label="Opportunity Date" value={r.opportunityDate} mono />
              <KV label="Customer Power ID" value={r.powerId} mono />
              <KV label="Loan Purpose" value={r.purpose} />
              <KV label="Requested Loan Amount" value={`${fmtMoney(r.requested)} USD`} mono />
              <KV label="Relationship Manager" value={r.officer} />
            </dl>
          </section>
          <section aria-labelledby="rc-h" className="step-section">
            <h2 id="rc-h" className="t-heading-03 mb-6">Collaterals</h2>
            <div className="overflow-x-auto">
              <Table size="md" aria-label="Collaterals" className="collateral-table min-w-[680px]">
                <TableHead><TableRow><TableHeader>Collateral Name</TableHeader><TableHeader>Collateral Account Number</TableHeader><TableHeader className="num">Estimated Collateral Value</TableHeader><TableHeader className="num">Advance rate</TableHeader><TableHeader className="num">Maximum Borrowing Power</TableHeader><TableHeader>Status</TableHeader></TableRow></TableHead>
                <TableBody>
                  {r.collateral.map((x) => {
                    const counts = x.status !== 'Not eligible' && x.status !== 'Not selected';
                    return (
                      <TableRow key={x.number}>
                        <TableCell className="font-semibold">{x.name}</TableCell>
                        <TableCell className="t-code">{x.number}</TableCell>
                        <TableCell className="num"><Money value={x.value} /></TableCell>
                        <TableCell className="num">{fmtPct(x.rate)}{x.status === 'Manual evaluation' && <span className="block t-helper-01 text-[var(--cds-text-secondary)]">provisional</span>}</TableCell>
                        <TableCell className="num font-semibold"><Money value={counts ? x.value * x.rate : 0} /></TableCell>
                        <TableCell><Tag tone={COL_TONE[x.status]}>{x.status}</Tag></TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow className="totals-row">
                    <TableCell colSpan={2}><span className="font-semibold">Total</span></TableCell>
                    <TableCell className="num font-semibold"><Money value={refMarket(r)} /></TableCell>
                    <TableCell />
                    <TableCell className="num font-semibold"><Money value={power} /></TableCell>
                    <TableCell><span className="t-helper-01 text-[var(--cds-text-secondary)]">Total Maximum Borrowing Power</span></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </section>
          <section aria-labelledby="rx-h" className="step-section">
            <h2 id="rx-h" className="t-heading-03 mb-4">Exceptions</h2>
            {r.exceptions.length ? <ul className="flex flex-wrap gap-2">{r.exceptions.map((e) => <li key={e}><Tag tone={/expired|shortfall|missing|ineligible|not certified/i.test(e) ? 'error' : 'warning'}>{e}</Tag></li>)}</ul> : <p className="t-body-01">None. The request follows the standard path.</p>}
          </section>
          <section aria-labelledby="rh-h" className="step-section">
            <h2 id="rh-h" className="t-heading-03 mb-4">History</h2>
            <ul className="border-t border-[var(--cds-border-subtle-01)]">
              {r.history.map((h, i) => (
                <li key={i} className="py-2 border-b border-[var(--cds-border-subtle-01)] grid grid-cols-[110px_1fr] gap-4 t-body-01">
                  <span className="tabular-nums text-[var(--cds-text-secondary)]">{h.date}</span>
                  <span><span className="font-semibold">{h.action}</span> · {h.evaluator}{h.notes && <span className="block t-helper-01 text-[var(--cds-text-secondary)]">{h.notes}</span>}</span>
                </li>
              ))}
            </ul>
          </section>
          <footer className="step-footer">
            <Button kind="ghost" size="md" onClick={() => onRoute({ page: 'console', tab: st.queue, expanded: r.id })}>Back</Button>
          </footer>
        </div>
        <aside aria-label="Application status" className="status-panel xl:sticky xl:top-6 lg:col-start-2 xl:col-start-auto">
          <section className="px-4 py-4 space-y-3 border-b border-[var(--cds-border-subtle-01)]">
            <h2 className="t-heading-02">Application status</h2>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 items-end">
              <div><dt className="t-label-01 text-[var(--cds-text-secondary)]">Requested Loan Amount</dt><dd className="t-heading-03 tabular-nums mt-0.5"><Money value={r.requested} /></dd></div>
              <div><dt className="t-label-01 text-[var(--cds-text-secondary)]">Total Maximum Borrowing Power</dt><dd className="t-heading-03 tabular-nums !font-semibold mt-0.5"><Money value={power} /></dd></div>
            </dl>
            <div className="relative h-1 bg-[var(--cds-border-subtle-01)]" aria-hidden="true">
              <div className={cx('h-full', cov >= 1 ? 'bg-[var(--cds-support-success)]' : 'bg-[var(--cds-support-error)]')} style={{ width: `${Math.min(cov / 1.5, 1) * 100}%` }} />
              <div className="absolute -top-1 h-3 w-px bg-[var(--cds-text-primary)]" style={{ left: `${(1 / 1.5) * 100}%` }} />
            </div>
            <p className={cx('t-helper-01', diff >= 0 ? 'text-[var(--cds-text-secondary)]' : 'text-[var(--cds-text-error)]')}>{fmtPct(cov)} of the request · {diff >= 0 ? `${fmtMoney(diff)} available` : `${fmtMoney(-diff)} short`}. Submission needs 100%.</p>
          </section>
          <section className="px-4 py-4">
            <h2 className="t-heading-02">Submission readiness</h2>
            {st.items.length ? (
              <ul className="mt-3 space-y-3">
                {st.items.map((o) => (
                  <li key={o.id} id={`item-${o.id}`} tabIndex={-1} className="t-body-compact-01 focus:outline-none">
                    {o.kind === 'correction' && <span className="block mb-1"><Tag tone="warning">Action required</Tag></span>}
                    <span className="block">{o.label}</span>
                    <span className="t-helper-01 text-[var(--cds-text-secondary)] block">{PLACE[o.place]} · {o.explain}</span>
                    {o.kind !== 'waiting' && <Button kind="ghost" size="sm" className="!px-0" onClick={() => { resolve(o.id); onRoute({ page: 'record', id: r.id, fix: o.id }); }}>Mark as resolved (demo)</Button>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 t-body-01 flex items-center gap-2"><CheckmarkFilled size={16} className="fill-[var(--cds-support-success)]" aria-hidden="true" />All readiness checks are complete.</p>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
