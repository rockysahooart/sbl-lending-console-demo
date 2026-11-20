import { useEffect, useRef, useState } from 'react';
import {
  Accordion,
  AccordionItem,
  Button,
  InlineNotification,
  Modal,
  ProgressIndicator,
  ProgressStep,
  Search,
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
  Toggle,
  Checkbox,
} from '@carbon/react';
import { ArrowRight, CheckmarkFilled, WarningAltFilled, View } from '@carbon/icons-react';
import { useDemo } from '../DemoContext';
import { usePersistentState } from '../../app/state/ConsoleStore';
import { ASSET_CLASS_LABEL, PEOPLE, fmtMoney, fmtPct, personById, type Person, type ScenarioId } from '../data';
import { reviewBounds } from '../engine';
import { ATTESTATIONS, nowStamp, useAfterRequest, useAudit, type RequestModel, type Section, type YN } from './state';
import { ANCHOR, guidance, reviewUpside } from './guidance';
import { Btn, Check, KV, Money, Panel, RadioGroup, SelectField, Tag, TextField, WIDTH, cx, type Tone, type Width } from './ui';
import type { Route } from './AfterApp';

const SECTIONS: { key: Section; label: string }[] = [
  { key: 'client', label: 'Client and parties' },
  { key: 'collateral', label: 'Collateral and evaluation' },
  { key: 'structure', label: 'Loan structure' },
  { key: 'review', label: 'Review and submit' },
];

const yn = [{ value: 'Yes', label: 'Yes' }, { value: 'No', label: 'No' }];

/*
 * Content widths inside the middle workspace (the column itself always fills the space
 * between navigation and the status panel). Each content type stops growing where more
 * width would separate labels, values and controls:
 *   form    900px  — inputs, questions, attestations
 *   record  1120px — structured client information and summaries
 *   full    none   — data tables, collateral inventory, evaluation
 * Each section's content sits in one container, centred between the navigation and
 * the status panel, so every block in the section shares the same left edge.
 */
const SECTION_MAX: Record<Section, string | undefined> = { client: '1120px', collateral: undefined, structure: '900px', review: '1120px' };

function focusAnchor(id: string) {
  // After the section renders and the workspace scroll resets.
  window.setTimeout(() => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ block: 'start', behavior: 'auto' });
    (el as HTMLElement).focus({ preventScroll: true });
  }, 60);
}

export function Workspace({ route, onRoute }: { route: { page: 'request'; id: ScenarioId; section: Section } | { page: 'confirmation'; id: ScenarioId }; onRoute: (r: Route) => void }) {
  const m = useAfterRequest(route.id);
  const { s, req, update } = m;
  const section = route.page === 'request' ? route.section : 'review';
  const { scenario, adoptScenario } = useDemo();

  useEffect(() => {
    if (scenario !== route.id) adoptScenario(route.id);
  }, [route.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (route.page === 'request' && !req.visited.includes(section)) update({ visited: [...req.visited, section], section });
  }, [section]); // eslint-disable-line react-hooks/exhaustive-deps

  const pendingAnchor = useRef<string | null>(null);
  /** Go to a section and bring the place where the item is resolved into view (focus moves to its heading). */
  const go = (sec: Section, anchor?: string) => {
    pendingAnchor.current = anchor ?? null;
    if (sec === section && anchor) focusAnchor(anchor);
    else onRoute({ page: 'request', id: route.id, section: sec });
  };
  useEffect(() => {
    const a = pendingAnchor.current;
    if (a) { pendingAnchor.current = null; focusAnchor(a); }
  }, [section]);
  if (route.page === 'confirmation') return <Confirmation m={m} onRoute={onRoute} />;
  const locked = req.status !== 'draft';

  return (
    <div className="px-4 sm:px-8 py-8">
      <RequestHeader m={m} />
      {locked && (
        <InlineNotification kind="info" lowContrast hideCloseButton className="!max-w-none mb-6" title="Submitted to underwriting" subtitle={`Submitted ${req.submittedAt}. This request is read-only.`} />
      )}
      {/* Working width follows the task: forms stay at a readable width, the collateral inventory uses the space. */}
      <div className="grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[224px_minmax(0,1fr)_340px] gap-8 items-start">
        <nav aria-label="Request sections" className="lg:sticky lg:top-6">
          <ProgressIndicator vertical currentIndex={SECTIONS.findIndex((x) => x.key === section)} onChange={(i: number) => go(SECTIONS[i].key)} spaceEqually={false}>
            {SECTIONS.map((sec) => {
              const st = m.sectionState(sec.key);
              const open = m.readiness.filter((r) => r.step === sec.key && !r.done).length;
              return (
                <ProgressStep
                  key={sec.key}
                  label={sec.label}
                  secondaryLabel={st === 'complete' ? 'Complete' : open ? `${open} open item${open > 1 ? 's' : ''}` : undefined}
                  complete={st === 'complete'}
                />
              );
            })}
          </ProgressIndicator>
        </nav>
        <fieldset disabled={locked} className="min-w-0">
          <legend className="sr-only">{SECTIONS.find((x) => x.key === section)!.label}</legend>
          <div className="mx-auto" style={{ maxWidth: SECTION_MAX[section] }}>
          {section === 'client' && <ClientSection m={m} onNext={() => go('collateral')} />}
          {section === 'collateral' && <CollateralSection m={m} onNext={() => go('structure')} />}
          {section === 'structure' && <StructureSection m={m} onNext={() => go('review')} />}
          {section === 'review' && <ReviewSection m={m} onGo={go} onSubmitted={() => onRoute({ page: 'confirmation', id: route.id })} />}
          </div>
        </fieldset>
        <SummaryPanel m={m} onGo={go} section={section} />
      </div>
    </div>
  );
}

function RequestHeader({ m }: { m: RequestModel }) {
  const { s, req } = m;
  const phase = req.status === 'draft' ? 0 : req.status === 'submitted' ? 1 : 2;
  const phases = ['Origination and pre-underwriting review', 'Underwriting', 'Servicing'];
  return (
    <div className="flex flex-wrap items-start justify-between gap-6 mb-6">
      <div>
        <p className="t-label-01 text-[var(--cds-text-secondary)]">{s.requestId} · {s.product}</p>
        <h1 className="t-heading-05 mt-1">{s.entityName ?? s.primary.name}</h1>
        <p className="t-body-01 text-[var(--cds-text-secondary)] mt-1">{s.applicationType === 'Entity' ? `Authorized signer: ${s.primary.name} · ` : ''}Purpose: {s.purpose} · Opened {s.opportunityDate} by {s.createdBy}</p>
      </div>
      <ol aria-label="Request lifecycle" className="flex flex-wrap items-center gap-1 t-helper-01">
        {phases.map((p, i) => (
          <li key={p} aria-current={i === phase ? 'step' : undefined} className={cx('px-3 h-8 inline-flex items-center gap-1.5 border', i === phase ? 'bg-[var(--cds-background-inverse)] text-[var(--cds-text-inverse)] border-transparent' : i < phase ? 'border-[var(--cds-support-success)] text-[var(--cds-text-primary)]' : 'border-[var(--cds-border-subtle-01)] text-[var(--cds-text-secondary)]')}>
            {i < phase && <CheckmarkFilled size={14} className="fill-[var(--cds-support-success)]" aria-hidden="true" />}
            {p}
          </li>
        ))}
      </ol>
    </div>
  );
}

function NextBar({ label, onNext, width = 'record' }: { label: string; onNext: () => void; width?: Width }) {
  return (
    <div className={cx('mt-8 py-4 flex items-center justify-between gap-4 border-t border-[var(--cds-border-subtle-01)]', WIDTH[width])}>
      <p className="t-helper-01 text-[var(--cds-text-secondary)]">Changes are saved automatically.</p>
      <Button renderIcon={ArrowRight} onClick={onNext}>{label}</Button>
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
          <p className="t-body-01">Your role ({role}) can view masked identifiers only. Contact the relationship banker if the full number is required.</p>
        )}
      </Modal>
    </span>
  );
}

function RecordGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <h4 className="t-heading-01 pb-2 mb-3 border-b border-[var(--cds-border-subtle-00)]">{title}</h4>
      <dl className="space-y-3">{children}</dl>
    </div>
  );
}

function Screening({ date = '11/18/2025' }: { date?: string }) {
  return (
    <span className="inline-flex flex-wrap gap-2">
      <Tag tone="success">Identity verified {date}</Tag>
      <Tag tone="success">Sanctions screening: no match {date}</Tag>
    </span>
  );
}

/* ----------------------------- 1. Client and parties ----------------------------- */
function ClientSection({ m, onNext }: { m: RequestModel; onNext: () => void }) {
  const { s, req, update, needsOwners, isEntity, owners, pledgesTrust, log } = m;
  const p = s.primary;
  const [reported, setReported] = useState(false);
  return (
    <div>
      <Panel id="client-record" task="Review" title="Client record" description="From the client record of 11/18/2025. Read-only; request a correction if anything is out of date." right={<Screening />}>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-x-8 gap-y-6">
          <RecordGroup title="Identity">
            <KV label="Legal name" value={p.name} />
            <KV label="Date of birth" value={p.dob} mono />
            <KV label="Social Security number" value={<MaskedId person={p} requestId={s.requestId} />} />
          </RecordGroup>
          <RecordGroup title="Identification">
            <KV label="Document" value={`${p.idType} ${p.idNumber}`} />
            <KV label="Status" value={<Tag tone="success">Valid until {p.idExpires}</Tag>} />
            <KV label="Citizenship" value={p.citizenship} />
          </RecordGroup>
          <RecordGroup title="Contact">
            <KV label="Phone" value={p.phone} />
            <KV label="Email" value={p.email} />
            <KV label="Address" value={`${p.address1}, ${p.city}, ${p.state} ${p.zip}`} />
          </RecordGroup>
          <RecordGroup title="Relationship">
            <KV label="MDM ID / Power ID" value={`${p.mdmId} / ${p.powerId}`} mono />
            <KV label="Client since" value={p.customerSince} mono />
            <KV label="Employment" value={`${p.employmentStatus}, ${p.employmentTitle}`} />
          </RecordGroup>
        </div>
        <div className="mt-5">
          {reported ? (
            <InlineNotification kind="success" lowContrast hideCloseButton title="Correction request sent" subtitle="Client Data Maintenance will review the record. The current record remains in use." />
          ) : (
            <Button kind="ghost" size="sm" onClick={() => { setReported(true); log('Record correction requested', `Correction requested for ${p.name}`, s.requestId); }}>Request a record correction</Button>
          )}
        </div>
      </Panel>

      <Panel id="app-type" task="Confirm" width="form" title="Application type">
        {isEntity ? (
          <p className="t-body-01">Borrower: <b className="font-semibold">{s.entityName}</b>. Authorized signer: {p.name}.</p>
        ) : (
          <RadioGroup legend="Application type" name="apptype" value={req.appType} onChange={(v) => update({ appType: v as 'Individual' | 'Joint' })} options={[{ value: 'Individual', label: 'Individual' }, { value: 'Joint', label: 'Joint (with a co-borrower)' }]} />
        )}
      </Panel>

      {req.appType === 'Joint' && <CoBorrowerPanel m={m} />}

      {needsOwners && (
        <Panel id="owners" task="Certify" title={isEntity ? 'Beneficial ownership' : 'Trust ownership'} description={isEntity ? `Individuals owning 25% or more of ${s.entityName}, and the individual with significant control, from the entity record.` : 'Required because a trust account is pledged as collateral. Trustees and beneficial owners from the trust record.'}>
          <Table size="md" aria-label="Owners">
            <TableHead>
              <TableRow>
                <TableHeader>Name</TableHeader>
                <TableHeader>Role</TableHeader>
                <TableHeader className="num">Ownership</TableHeader>
                <TableHeader>Verification</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {owners.map((o) => {
                const per = personById(o.personId);
                return (
                  <TableRow key={o.personId}>
                    <TableCell>{per.name}</TableCell>
                    <TableCell>{per.id === p.id ? (isEntity ? 'Managing member (control person)' : 'Trustee') : isEntity ? 'Member' : 'Co-trustee'}</TableCell>
                    <TableCell className="num">{o.pct}%</TableCell>
                    <TableCell><Screening /></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <div className="mt-5">
            <Check id="owners-certified" checked={req.ownersCertified} onChange={(b) => { update({ ownersCertified: b }); if (b) log('Ownership certified', isEntity ? 'Beneficial ownership certified' : 'Trust ownership certified', s.requestId); }} label={isEntity ? 'I certify that the beneficial ownership information was obtained from the client and is accurate.' : `I certify the trust ownership information${pledgesTrust ? ' for the pledged trust account' : ''} with the client.`} />
          </div>
        </Panel>
      )}

      <Panel id="compliance" task="Ask the client" width="form" title="Compliance questions" description="Only questions not already on file. No answers are preselected.">
        <div className="max-w-[760px]">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8 max-w-[640px]">
          <SelectField label="Is the client a politically exposed person?" options={['Yes', 'No']} value={req.pep} onChange={(v) => update({ pep: v as YN })} />
          <SelectField label="Marital status" options={['Married', 'Unmarried', 'Separated']} value={req.marital} onChange={(v) => update({ marital: v })} helper="From the client record. Change only if out of date." />
        </div>
        <div className="space-y-8">
          <RadioGroup legend="Does the client sell, manufacture or distribute weapons, ammunition or components under a U.S. Government contract?" name="q1" value={req.q1} onChange={(v) => update({ q1: v as YN })} options={yn} />
          {req.q1 === 'Yes' && <TextField label="Describe the activity and the contracting agency" value={req.q1Explain} onChange={(v) => update({ q1Explain: v })} />}
          <RadioGroup legend="Will anyone other than the borrowers make loan payments?" name="q2" value={req.q2} onChange={(v) => update({ q2: v as YN })} options={yn} />
          <RadioGroup legend="Is the source of repayment inconsistent with the client’s profile or industry?" name="q3" value={req.q3} onChange={(v) => update({ q3: v as YN })} options={yn} />
        </div>
        </div>
      </Panel>
      <NextBar label="Continue to collateral" onNext={onNext} />
    </div>
  );
}

function CoBorrowerPanel({ m }: { m: RequestModel }) {
  const { s, req, update, co, coIdExpired, log } = m;
  const [q, setQ] = useState('');
  const [err, setErr] = useState('');
  const [confirmRemove, setConfirmRemove] = useState(false);
  const { track } = useDemo();
  const household = s.coBorrowerId ? [personById(s.coBorrowerId)] : [];
  const results = q.trim().length >= 2 ? PEOPLE.filter((p) => p.id !== s.primary.id && [p.name, p.mdmId, p.powerId].some((f) => f.toLowerCase().includes(q.trim().toLowerCase()))) : [];
  const add = (id: string) => { update({ coBorrowerId: id }); setQ(''); log('Co-borrower added', `${personById(id).name} added; identity and sanctions screening completed`, s.requestId); };
  const saveId = () => {
    const okDate = /^\d{2}\/\d{2}\/\d{4}$/.test(req.coIdUpdate.expires);
    const [mm, dd, yy] = req.coIdUpdate.expires.split('/').map(Number);
    const future = okDate && new Date(yy, mm - 1, dd) > new Date(2025, 10, 19);
    if (!req.coIdUpdate.number.trim()) { setErr('number'); track('error', 'after'); return; }
    if (!future) { setErr('date'); track('error', 'after'); return; }
    setErr('');
    update({ coIdUpdate: { ...req.coIdUpdate, saved: true } });
    log('Identification updated', `${co!.name}: ID ${req.coIdUpdate.number}, valid until ${req.coIdUpdate.expires}`, s.requestId);
  };
  return (
    <Panel id="co" task="Enter" width="record" title="Co-borrower">
      {!co ? (
        <div className="space-y-5">
          {household.length > 0 && (
            <InlineNotification kind="info" lowContrast hideCloseButton className="!max-w-none" title="Household member found" subtitle={`${household[0].name} is a joint owner of account ${s.accounts.find((a) => a.relationship === 'Joint')?.number ?? ''} (MDM ID ${household[0].mdmId}).`} />
          )}
          {household.length > 0 && <Button kind="tertiary" size="md" onClick={() => add(household[0].id)}>Add {household[0].name} as co-borrower</Button>}
          <div className="max-w-xl">
            <Search size="md" id="co-search" labelText="Search the client directory" placeholder="Name, MDM ID or Power ID" value={q} onChange={(e: { target: HTMLInputElement }) => setQ(e.target.value)} />
            <p className="t-helper-01 text-[var(--cds-text-secondary)] mt-1">Enter at least two characters.</p>
            {q.trim().length >= 2 && (
              <ul className="mt-2 border border-[var(--cds-border-subtle-01)]" aria-live="polite">
                {results.length === 0 && <li className="px-4 py-3 t-body-01">No clients match “{q}”. Check the name or identifier.</li>}
                {results.map((p) => (
                  <li key={p.id} className="px-4 py-2 flex items-center justify-between border-b border-[var(--cds-border-subtle-01)] last:border-0">
                    <span className="t-body-01">{p.name} <span className="t-helper-01 text-[var(--cds-text-secondary)]">MDM ID {p.mdmId} · Power ID {p.powerId}</span></span>
                    <Button kind="ghost" size="sm" onClick={() => add(p.id)} aria-label={`Add ${p.name} as co-borrower`}>Add</Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <dl className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-x-6 gap-y-4 flex-1">
              <KV label="Name" value={co.name} />
              <KV label="MDM ID / Power ID" value={`${co.mdmId} / ${co.powerId}`} mono />
              <KV label="Social Security number" value={<MaskedId person={co} requestId={s.requestId} />} />
              <KV label="Relationship to borrower" value="Spouse" />
            </dl>
            <Button kind="danger--tertiary" size="sm" onClick={() => setConfirmRemove(true)}>Remove co-borrower</Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="t-label-01 text-[var(--cds-text-secondary)] mr-1">Identification</span>
            <span className="t-body-01">{co.idType} {req.coIdUpdate.saved ? req.coIdUpdate.number : co.idNumber}</span>
            <Tag tone={coIdExpired ? 'error' : 'success'}>{coIdExpired ? `Expired ${co.idExpires}` : `Valid until ${req.coIdUpdate.saved ? req.coIdUpdate.expires : co.idExpires}`}</Tag>
            <Screening date="11/19/2025" />
          </div>
          {coIdExpired && (
            <div>
              <InlineNotification kind="error" lowContrast hideCloseButton className="!max-w-none" title="Identification expired" subtitle="Record a current, unexpired government-issued ID before you submit this request." />
              <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4 items-end mt-4">
                <TextField label="ID number" value={req.coIdUpdate.number} onChange={(v) => update({ coIdUpdate: { ...req.coIdUpdate, number: v } })} invalidText={err === 'number' ? 'Enter the ID number.' : undefined} />
                <TextField label="Expiration date" placeholder="MM/DD/YYYY" helper="Format: MM/DD/YYYY" value={req.coIdUpdate.expires} onChange={(v) => update({ coIdUpdate: { ...req.coIdUpdate, expires: v } })} invalidText={err === 'date' ? 'Enter a future date in MM/DD/YYYY format.' : undefined} />
                <Button onClick={saveId}>Save identification</Button>
              </div>
            </div>
          )}
          <Check id="joint-permission" checked={req.jointPermission} onChange={(b) => update({ jointPermission: b })} label="The co-applicant gave permission to apply jointly on their behalf." />
          <Modal
            open={confirmRemove}
            danger
            size="xs"
            modalHeading={`Remove ${co.name} as co-borrower?`}
            primaryButtonText="Remove"
            secondaryButtonText="Cancel"
            onRequestClose={() => setConfirmRemove(false)}
            onRequestSubmit={() => { log('Co-borrower removed', `${co.name} removed`, s.requestId); update({ coBorrowerId: '', coIdUpdate: { number: '', expires: '', saved: false }, jointPermission: false }); setConfirmRemove(false); }}
          >
            <p className="t-body-01">Identification updates and the joint-application permission for this co-borrower will be cleared.</p>
          </Modal>
        </div>
      )}
    </Panel>
  );
}

/* ------------------------- 2. Collateral and evaluation ------------------------- */
const STATUS: Record<string, { tone: Tone; label: string }> = {
  auto: { tone: 'success', label: 'Valued' },
  review: { tone: 'review', label: 'Review required' },
  reviewed: { tone: 'info', label: 'Reviewed' },
  ineligible: { tone: 'error', label: 'Not eligible' },
  excluded: { tone: 'neutral', label: 'Not pledged' },
};

function CollateralSection({ m, onNext }: { m: RequestModel; onNext: () => void }) {
  const { s, req, changeEstimate, ev, update, role, log } = m;
  const [reviewing, setReviewing] = useState<string | null>(null);
  return (
    <div>
      <Panel id="collateral" task="Select" width="full" title="Collateral and evaluation" description="Accounts in the client relationship. Select the accounts to pledge; estimated borrowing power updates immediately.">
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-8 max-w-[1120px]">
          {[
            ['Pledged market value', <Money key="a" value={ev.pledgedValue} />],
            ['Estimated borrowing power', <Money key="b" value={ev.total} />],
            ['Review required', ev.needsReview],
            ['Not eligible', ev.ineligible],
          ].map(([l, v]) => (
            <div key={l as string} className={cx('bg-[var(--cds-layer-01)] px-4 py-4', l === 'Estimated borrowing power' && 'shadow-[inset_0_2px_0_var(--cds-interactive)]')}>
              <dt className="t-label-01 text-[var(--cds-text-secondary)]">{l}</dt>
              <dd className={cx('text-[1.25rem] leading-7 min-[1440px]:text-[1.75rem] min-[1440px]:leading-9 tabular-nums mt-1', l === 'Estimated borrowing power' && 'font-semibold')}>{v}</dd>
            </div>
          ))}
        </dl>
        <EvaluationStatement m={m} />
        <div className="overflow-x-auto">
          <Table aria-label="Collateral accounts" size="lg" className="min-w-[760px]">
            <TableHead>
              <TableRow>
                <TableHeader>Pledge</TableHeader>
                <TableHeader>Account</TableHeader>
                <TableHeader>Asset class</TableHeader>
                <TableHeader className="num">Market value</TableHeader>
                <TableHeader className="num">Advance rate</TableHeader>
                <TableHeader className="num">Eligible collateral value</TableHeader>
                <TableHeader>Status</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {ev.rows.map((r) => {
                const h = r.holdings[0];
                const st = STATUS[r.status];
                const requested = req.reviewRequested[r.account.id];
                return [
                  <TableRow key={r.account.id} className={cx('[&>td]:!border-b-0', r.pledged && 'is-selected-row')}>
                    <TableCell>
                      <Checkbox
                        id={`pledge-${r.account.id}`}
                        hideLabel
                        labelText={`Pledge ${r.account.name} ${r.account.number}`}
                        checked={r.pledged}
                        onChange={(_: unknown, { checked }: { checked: boolean }) => changeEstimate({ pledged: { ...req.pledged, [r.account.id]: checked } }, `${checked ? 'Pledged' : 'Removed from pledge'}: ${r.account.name} ${r.account.number}`)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{r.account.name} <span className="t-code text-[var(--cds-text-secondary)]">{r.account.number}</span></div>
                      <div className="t-helper-01 text-[var(--cds-text-secondary)]">{r.account.owner} · {r.account.relationship}</div>
                    </TableCell>
                    <TableCell>{[...new Set(r.holdings.map((x) => ASSET_CLASS_LABEL[x.assetClass]))].join(', ')}</TableCell>
                    <TableCell className="num"><Money value={r.value} /></TableCell>
                    <TableCell className="num">{r.status === 'ineligible' ? '0%' : fmtPct(h.concentrated ? h.appliedRate : h.baseRate)}</TableCell>
                    <TableCell className="num font-semibold"><Money value={r.lendable} /></TableCell>
                    <TableCell><Tag tone={st.tone}>{st.label}</Tag></TableCell>
                  </TableRow>,
                  <TableRow key={r.account.id + '-x'} className={cx('[&>td]:!border-t-0', r.pledged && 'is-selected-row')}>
                    <TableCell />
                    <TableCell colSpan={6}>
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-2">
                        <p className="t-helper-01 text-[var(--cds-text-secondary)] max-w-3xl">{r.explanation}</p>
                        {r.status === 'review' && role === 'Relationship Banker' && (requested ? (
                          <Tag tone="pending">Awaiting credit officer review</Tag>
                        ) : (
                          <Button kind="tertiary" size="sm" onClick={() => { update({ reviewRequested: { ...req.reviewRequested, [r.account.id]: nowStamp() } }); log('Collateral review requested', `${r.account.name} ${r.account.number}`, s.requestId); }}>Request credit officer review</Button>
                        ))}
                        {(r.status === 'review' || r.status === 'reviewed') && role === 'Credit Officer' && (
                          <Button kind={r.status === 'review' ? 'primary' : 'tertiary'} size="sm" onClick={() => setReviewing(r.account.id)}>{r.status === 'review' ? 'Complete review' : 'Revise review'}</Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>,
                ];
              })}
              <TableRow className="totals-row">
                <TableCell />
                <TableCell><span className="font-semibold">Total pledged</span> <span className="t-helper-01 text-[var(--cds-text-secondary)]">({ev.rows.filter((r) => r.pledged).length} of {ev.rows.length} accounts)</span></TableCell>
                <TableCell />
                <TableCell className="num font-semibold"><Money value={ev.pledgedValue} /></TableCell>
                <TableCell className="num">{ev.pledgedValue ? fmtPct(ev.total / ev.pledgedValue) : '—'}</TableCell>
                <TableCell className="num font-semibold"><Money value={ev.total} /></TableCell>
                <TableCell><span className="t-helper-01 text-[var(--cds-text-secondary)]">Estimated borrowing power</span></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        <Accordion className="mt-6">
          <AccordionItem title="Calculation details">
            <p className="t-body-01 mb-3">Eligible collateral value = market value × advance rate. Estimated borrowing power = total eligible collateral value of pledged accounts.</p>
            <StructuredListWrapper isCondensed aria-label="Advance rates">
              <StructuredListBody>
                {[['Cash and certificates of deposit at the bank', '100%'], ['Money market funds; Treasury bills under 7 years', '80%'], ['Fixed income', '80%'], ['Listed equities and ETFs', '70%'], ['Mutual funds and other assets', '60%'], ['Restricted stock', 'Not eligible'], ['Single-issuer position over 40% of pledged market value', '35% until reviewed; review range 35%–60%']].map(([a, b]) => (
                  <StructuredListRow key={a}><StructuredListCell>{a}</StructuredListCell><StructuredListCell className="tabular-nums">{b}</StructuredListCell></StructuredListRow>
                ))}
              </StructuredListBody>
            </StructuredListWrapper>
            <p className="t-helper-01 text-[var(--cds-text-secondary)] mt-2">Advance rates are fictional values for this demonstration.</p>
          </AccordionItem>
          <AccordionItem title={`Estimate history (${req.estimateLog.length})`}>
            {req.estimateLog.length === 0 ? (
              <p className="t-body-01">No changes yet. The estimate reflects the default pledge selection.</p>
            ) : (
              <Table size="sm" aria-label="Estimate history">
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
      </Panel>
      {reviewing && <ReviewModal m={m} accountId={reviewing} onClose={() => setReviewing(null)} />}
      <NextBar label="Continue to loan structure" onNext={onNext} width="full" />
    </div>
  );
}

/** States the consequence of the current selection and the ways to close any gap. */
function EvaluationStatement({ m }: { m: RequestModel }) {
  const { ev, req, s } = m;
  const margin = ev.total - req.requested;
  const auto = ev.rows.filter((r) => r.status === 'auto').length;
  const manual = ev.rows.filter((r) => r.status === 'review' || r.status === 'reviewed').length;
  const upside = reviewUpside(m);
  const review = ev.rows.find((r) => r.status === 'review');
  return (
    <div className="mb-8 max-w-[960px]">
      <p className="t-body-01">
        {margin >= 0 ? (
          <><span className="font-semibold">Covers the request.</span> Estimated borrowing power is {fmtMoney(margin)} above the requested amount of {fmtMoney(req.requested)}.</>
        ) : (
          <><span className="font-semibold text-[var(--cds-text-error)]">{fmtMoney(-margin)} short of the requested amount.</span> The request can’t be submitted until estimated borrowing power reaches {fmtMoney(req.requested)}.</>
        )}
      </p>
      {margin < 0 && (
        <ul className="t-body-01 mt-2 list-disc pl-5 space-y-1">
          {review && <li>Request a credit officer review of {review.account.name} {review.account.number}. A reviewed rate of up to {Math.round(reviewBounds.max * 100)}% could add up to {fmtMoney(upside)}.</li>}
          {ev.rows.some((r) => !r.pledged && r.status !== 'ineligible') && <li>Pledge another eligible account.</li>}
          <li>Reduce the requested amount in Loan structure.</li>
        </ul>
      )}
      <p className="t-helper-01 text-[var(--cds-text-secondary)] mt-3">
        Automatic evaluation: {auto} account{auto === 1 ? '' : 's'} at standard advance rates. Manual evaluation: {manual ? `${manual} account${manual === 1 ? '' : 's'} by credit officer review` : 'none needed'}.{ev.ineligible ? ` Not eligible: ${ev.ineligible}.` : ''} {s.accounts.length} accounts in the relationship.
      </p>
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
    changeEstimate({ reviews: { ...req.reviews, [accountId]: { rate: r, reason: reason.trim(), reviewer: user, at: nowStamp() } } }, `Credit officer review: ${row.account.name} at ${Math.round(r * 100)}%`);
    log('Collateral review recorded', `${row.account.name} ${row.account.number}: ${Math.round(r * 100)}%. Rationale: ${reason.trim()}`, s.requestId);
    onClose();
  };
  return (
    <Modal open size="sm" modalHeading={`Credit officer review: ${row.account.name} ${row.account.number}`} primaryButtonText="Record review" secondaryButtonText="Cancel" onRequestSubmit={save} onRequestClose={onClose}>
      <dl className="grid grid-cols-3 gap-4 mb-6">
        <KV label="Market value" value={fmtMoney(row.value)} mono />
        <KV label="Share of pledged market value" value={fmtPct(share, 1)} mono />
        <KV label="Permitted range" value={`${reviewBounds.min * 100}%–${reviewBounds.max * 100}%`} />
      </dl>
      <div className="space-y-5">
        <TextField id="review-rate" label="Advance rate (%)" inputMode="numeric" value={rate} onChange={(v) => setRate(v.replace(/[^0-9]/g, ''))} invalidText={errs.rate} helper="Whole number within the permitted range." />
        <TextArea id="review-reason" labelText="Rationale" helperText="Recorded with your name and the time in the audit trail." rows={3} value={reason} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReason(e.target.value)} invalid={!!errs.reason} invalidText={errs.reason} />
      </div>
    </Modal>
  );
}

/* ------------------------------- 3. Loan structure ------------------------------- */
function StructureSection({ m, onNext }: { m: RequestModel; onNext: () => void }) {
  const { s, req, update, ev } = m;
  const over = req.requested - ev.total;
  const deposits = s.accounts.filter((a) => a.holdings.some((h) => h.assetClass === 'cash' || h.assetClass === 'liquid')).map((a) => a.number);
  return (
    <div>
      <Panel id="amount" task="Enter" width="form" title="Amount and purpose">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-6">
          <TextField
            id="requested-amount"
            label="Requested amount (USD)"
            inputMode="numeric"
            value={req.requested ? req.requested.toLocaleString('en-US') : ''}
            onChange={(v) => update({ requested: Number(v.replace(/[^0-9]/g, '')) || 0 })}
            invalidText={over > 0 ? `Exceeds estimated borrowing power by ${fmtMoney(over)}. Reduce the amount or pledge additional collateral.` : undefined}
            helper={over > 0 ? undefined : `${fmtMoney(-over)} below estimated borrowing power.`}
          />
          <TextField label="Purpose" value={req.purpose} onChange={(v) => update({ purpose: v })} helper="From the opportunity." />
          <SelectField label="Application channel" options={['In Branch', 'Digital Assisted', 'Relationship Manager Initiated']} value={req.method} onChange={(v) => update({ method: v })} helper="From the opportunity." />
        </div>
        <div className="mt-8 space-y-4">
          <RadioGroup
            legend="Use of proceeds"
            name="proceeds"
            value={req.useOfProceeds}
            onChange={(v) => update({ useOfProceeds: v as 'non-purpose' | 'purpose', purposeStatement: v === 'purpose' ? false : req.purposeStatement })}
            options={[{ value: 'non-purpose', label: 'Non-purpose: proceeds will not buy or carry margin stock' }, { value: 'purpose', label: 'Purpose: proceeds will buy or carry margin stock' }]}
            orientation="vertical"
          />
          {req.useOfProceeds === 'purpose' && (
            <InlineNotification kind="error" lowContrast hideCloseButton className="!max-w-none" title="Not available for this product" subtitle="This line of credit supports non-purpose lending only. Confirm the use of proceeds with the client or contact Credit Administration." />
          )}
          {req.useOfProceeds === 'non-purpose' && (
            <Check id="purpose-statement" checked={req.purposeStatement} onChange={(b) => update({ purposeStatement: b })} label="The client completed and signed the purpose statement (Form FR U-1)." />
          )}
        </div>
      </Panel>
      <Panel id="sources" task="Ask the client" width="form" title="Sources of wealth and repayment">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-6 max-w-[720px]">
          <SelectField label="Primary source of wealth" options={['Business Income', 'Investments', 'Real Estate', 'Inheritance']} value={req.wealth1} onChange={(v) => update({ wealth1: v })} />
          <SelectField label="Primary source of repayment" options={['Business Cash Flow', 'Personal Income', 'Investment Income']} value={req.repay1} onChange={(v) => update({ repay1: v })} />
          {req.showSecondary && (
            <>
              <SelectField label="Secondary source of wealth" optional options={['Investments', 'Spouse Income', 'Other']} value={req.wealth2} onChange={(v) => update({ wealth2: v })} />
              <SelectField label="Secondary source of repayment" optional options={['Guarantor', 'Asset Liquidation']} value={req.repay2} onChange={(v) => update({ repay2: v })} />
            </>
          )}
        </div>
        <Button kind="ghost" size="sm" className="mt-3" aria-expanded={req.showSecondary} onClick={() => update({ showSecondary: !req.showSecondary })}>
          {req.showSecondary ? 'Remove secondary sources' : 'Add secondary sources'}
        </Button>
      </Panel>
      <Panel id="pricing" task="Confirm" width="form" title="Pricing and booking">
        <RadioGroup legend="Pricing" name="pricing" value={req.pricing} onChange={(v) => update({ pricing: v as 'standard' | 'exception' })} options={[{ value: 'standard', label: 'Standard pricing (SOFR daily plus product spread)' }, { value: 'exception', label: 'Request a pricing exception' }]} />
        {req.pricing === 'exception' && (
          <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6 mt-6">
            <TextField label="Requested spread over cost of funds (%)" inputMode="decimal" value={req.spread} onChange={(v) => update({ spread: v.replace(/[^0-9.]/g, '') })} />
            <TextField label="Business justification" value={req.pricingWhy} onChange={(v) => update({ pricingWhy: v })} helper="Reviewed by Pricing. Approval is not guaranteed." />
          </div>
        )}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-6 mt-8">
          <SelectField label="Booking cost center" options={['Commercial Lending', 'Small Business Banking', 'Private Banking']} value={req.costCenter} onChange={(v) => update({ costCenter: v })} helper="From your banker profile." />
          <SelectField label="Is a sustainability review required?" options={['Yes', 'No']} value={req.sustainability} onChange={(v) => update({ sustainability: v as YN })} />
          <TextField label="Relationship manager memo" optional value={req.memo} onChange={(v) => update({ memo: v })} />
        </div>
        <div className="mt-8 flex flex-wrap items-end gap-8">
          <Toggle id="ach-toggle" labelText="ACH automatic payment" labelA="Off" labelB="On" toggled={req.ach} onToggle={(b: boolean) => update({ ach: b })} />
          {req.ach && <div className="w-64"><SelectField label="Debit account" options={[...deposits, 'Other account on file']} value={req.achAccount} onChange={(v) => update({ achAccount: v })} /></div>}
        </div>
      </Panel>
      <Panel id="terms" task="Reference" width="form" title="Product terms" description="Set by the product. Read-only.">
        <dl className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-x-6 gap-y-4">
          <KV label="Product" value={s.product} />
          <KV label="Rate type and index" value="Variable, SOFR daily" />
          <KV label="Payment structure" value="Interest only" />
          <KV label="Credit action" value="New" />
        </dl>
      </Panel>
      <NextBar label="Continue to review" onNext={onNext} width="form" />
    </div>
  );
}

/* ------------------------------- 4. Review and submit ------------------------------- */
function ReviewSection({ m, onGo, onSubmitted }: { m: RequestModel; onGo: (s: Section, anchor?: string) => void; onSubmitted: () => void }) {
  const { s, req, update, readiness, ev, co, setReq, role, log } = m;
  const g = guidance(m);
  const { track, recordGaps } = useDemo();
  const { audit } = useAudit();
  const [, setSubmittedMap] = usePersistentState<Record<string, boolean>>('after:submitted', () => ({}));
  const [attempted, setAttempted] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const open = readiness.filter((r) => !r.done);
  const tryOpen = () => {
    setAttempted(true);
    if (open.length) {
      track('error', 'after');
      requestAnimationFrame(() => document.getElementById('readiness')?.focus());
      return;
    }
    setConfirm(true);
  };
  const submit = () => {
    recordGaps('after', 0);
    const at = nowStamp();
    log('Submitted to underwriting', `Requested ${fmtMoney(req.requested)}; estimated borrowing power ${fmtMoney(ev.total)}`, s.requestId);
    setReq((p) => ({ ...p, status: 'submitted', submittedAt: at }));
    setSubmittedMap((p) => ({ ...p, [s.id]: true }));
    setConfirm(false);
    onSubmitted();
  };
  const groups: { key: Section; label: string }[] = [
    { key: 'client', label: 'Client and parties' },
    { key: 'collateral', label: 'Collateral and evaluation' },
    { key: 'structure', label: 'Loan structure' },
    { key: 'review', label: 'Authorization and attestations' },
  ];
  const events = audit.filter((e) => e.requestId === s.requestId);
  return (
    <div>
      <section aria-labelledby="readiness">
        <div className="max-w-[1120px] pb-8 border-b border-[var(--cds-border-subtle-00)]">
        <p className="t-label-01 text-[var(--cds-text-secondary)] mb-1">Resolve</p>
        <h3 id="readiness" tabIndex={-1} className="t-heading-03 mb-5 focus:outline-none">Submission readiness</h3>
        {attempted && open.length > 0 && (
          <InlineNotification kind="error" lowContrast hideCloseButton className="!max-w-none mb-5" title={`${open.length} item${open.length > 1 ? 's' : ''} must be resolved before submission`} subtitle="Select Go to next to an item to open the place where it is completed." />
        )}
        <h4 className="t-heading-02 flex items-center gap-2">
          {open.length ? <WarningAltFilled size={16} className="fill-[var(--cds-support-error)]" aria-hidden="true" /> : <CheckmarkFilled size={16} className="fill-[var(--cds-support-success)]" aria-hidden="true" />}
          Blocking <span className="tabular-nums">({open.length})</span>
          <span className="t-helper-01 text-[var(--cds-text-secondary)] font-normal">Must be resolved before submission</span>
        </h4>
        {open.length ? (
          <ul className="mt-3 border-t border-[var(--cds-border-subtle-00)]">
            {open.map((r) => (
              <li key={r.id} className="flex items-center gap-4 py-2 border-b border-[var(--cds-border-subtle-00)] t-body-01">
                <span className="flex-1">{r.label}<span className="t-helper-01 text-[var(--cds-text-secondary)] ml-2">{groups.find((g) => g.key === r.step)!.label}</span></span>
                <Button kind="ghost" size="sm" onClick={() => onGo(r.step, ANCHOR[r.id])} aria-label={`Go to: ${r.label}`}>Go to</Button>
              </li>
            ))}
          </ul>
        ) : <p className="t-body-01 mt-2">Nothing is blocking submission.</p>}
        <h4 className="t-heading-02 flex items-center gap-2 mt-8">
          <WarningAltFilled size={16} className="fill-[var(--cds-support-warning)] [&_path:first-child]:fill-black" aria-hidden="true" />
          Warnings <span className="tabular-nums">({g.warnings.length})</span>
          <span className="t-helper-01 text-[var(--cds-text-secondary)] font-normal">Review before submitting; they don’t block submission</span>
        </h4>
        {g.warnings.length ? (
          <ul className="mt-3 border-t border-[var(--cds-border-subtle-00)]">
            {g.warnings.map((w) => (
              <li key={w.id} className="flex items-start gap-4 py-2 border-b border-[var(--cds-border-subtle-00)]">
                <span className="flex-1"><span className="t-body-01 font-semibold block">{w.label}</span><span className="t-body-01">{w.detail}</span></span>
                <Button kind="ghost" size="sm" onClick={() => onGo(w.section, w.anchor)} aria-label={`Go to: ${w.label}`}>Go to</Button>
              </li>
            ))}
          </ul>
        ) : <p className="t-body-01 mt-2">No warnings.</p>}
        <Accordion className="mt-6">
          <AccordionItem title={`Completed checks (${readiness.length - open.length} of ${readiness.length})`}>
            <ul className="space-y-1">
              {readiness.filter((r) => r.done).map((r) => (
                <li key={r.id} className="flex items-center gap-2 t-body-01"><CheckmarkFilled size={16} className="fill-[var(--cds-support-success)]" aria-hidden="true" />{r.label}</li>
              ))}
            </ul>
          </AccordionItem>
        </Accordion>
        </div>
      </section>
      <Panel id="package" task="Review" title="Request summary">
        <dl className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-x-6 gap-y-4">
          <KV label="Borrower" value={s.entityName ?? s.primary.name} />
          <KV label="Application type" value={req.appType + (co ? `, with ${co.name}` : '')} />
          <KV label="Requested amount" value={fmtMoney(req.requested)} mono />
          <KV label="Estimated borrowing power" value={fmtMoney(ev.total)} mono />
          <KV label="Pledged accounts" value={`${ev.rows.filter((r) => r.pledged).length} of ${s.accounts.length}`} />
          <KV label="Credit officer reviews" value={String(Object.keys(req.reviews).length)} />
          <KV label="Pricing" value={req.pricing === 'standard' ? 'Standard' : `Exception requested: ${req.spread || '—'}% over cost of funds`} />
          <KV label="ACH automatic payment" value={req.ach ? `On, account ${req.achAccount || 'not selected'}` : 'Off'} />
        </dl>
      </Panel>
      <Panel id="attest" task="Certify" width="form" title="Client authorization and attestations">
        <div className="max-w-md mb-6">
          <SelectField label="How did the client authorize this application?" options={['Signed in person', 'Electronic signature', 'Recorded phone call']} value={req.consentMethod} onChange={(v) => { update({ consentMethod: v }); if (v) log('Client authorization recorded', v, s.requestId); }} helper="Date recorded: 11/19/2025" />
        </div>
        <fieldset className="space-y-1">
          <legend className="t-label-01 text-[var(--cds-text-secondary)] mb-2">Attestations</legend>
          {ATTESTATIONS.map((a) => (
            <Check key={a.key} id={`attest-${a.key}`} checked={!!req.attest[a.key]} onChange={(b) => update({ attest: { ...req.attest, [a.key]: b } })} label={a.text} />
          ))}
        </fieldset>
        <Accordion className="mt-6">
          <AccordionItem
            title={req.disclosureViewed ? 'Acknowledgment (reviewed)' : 'Acknowledgment (review required)'}
            onHeadingClick={({ isOpen }: { isOpen: boolean }) => { if (isOpen && !req.disclosureViewed) { update({ disclosureViewed: true }); log('Acknowledgment reviewed', 'Banker acknowledgment opened', s.requestId); } }}
          >
            <p className="t-body-01 max-w-3xl">By submitting, the banking representative confirms that the client, collateral and loan information was reviewed for accuracy and completeness; that the client authorized the collection and use of personal and financial information for this application; and that electronic records and signatures may be used. (Fictional text for demonstration.)</p>
          </AccordionItem>
          <AccordionItem title={`Audit trail for this request (${events.length})`}>
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
          </AccordionItem>
        </Accordion>
      </Panel>
      <div className="mt-8 py-4 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--cds-border-subtle-01)] max-w-[1120px]">
        <p className="t-helper-01 text-[var(--cds-text-secondary)]">
          {role === 'Credit Officer' ? 'Submission is completed by the relationship banker.' : open.length ? `${open.length} item${open.length > 1 ? 's' : ''} open.` : 'All readiness checks are complete.'}
        </p>
        {role === 'Relationship Banker' && <Button onClick={tryOpen}>Submit to underwriting</Button>}
      </div>
      <Modal open={confirm} size="sm" modalHeading="Submit to underwriting?" primaryButtonText="Submit" secondaryButtonText="Cancel" onRequestSubmit={submit} onRequestClose={() => setConfirm(false)}>
        <dl className="grid grid-cols-2 gap-4 mb-4">
          <KV label="Request" value={`${s.requestId}, ${s.entityName ?? s.primary.name}`} />
          <KV label="Requested amount" value={fmtMoney(req.requested)} mono />
          <KV label="Estimated borrowing power" value={fmtMoney(ev.total)} mono />
          <KV label="Pledged accounts" value={String(ev.rows.filter((r) => r.pledged).length)} />
        </dl>
        <p className="t-body-01">After submission, the request is read-only. Underwriting makes the credit decision and sets any approved credit limit.</p>
      </Modal>
    </div>
  );
}

/* ------------------------------- Persistent summary ------------------------------- */
function SummaryPanel({ m, onGo, section }: { m: RequestModel; onGo: (s: Section, anchor?: string) => void; section: Section }) {
  const { req, ev, readiness } = m;
  const g = guidance(m);
  const cov = g.coverage;
  const diff = g.margin;
  const done = readiness.filter((r) => r.done).length;
  const open = readiness.filter((r) => !r.done);
  return (
    <aside aria-label="Financial summary and readiness" className="xl:sticky xl:top-6 bg-[var(--cds-layer-01)] lg:col-span-2 xl:col-span-1">
      {req.status === 'draft' && (
        <section aria-labelledby="next-h" className="px-5 pt-5 pb-5 border-b border-[var(--cds-border-subtle-01)]">
          <h2 id="next-h" className="t-label-01 text-[var(--cds-text-secondary)]">{g.attention === 'waiting' ? 'Waiting' : 'Next step'}</h2>
          {g.next ? (
            <>
              <p className="t-heading-02 mt-1">{g.next.label}</p>
              <p className="t-body-01 mt-1">{g.next.detail}</p>
              <Btn kind="primary" className="w-full !max-w-none mt-4" onClick={() => onGo(g.next!.section, g.next!.anchor)}>{g.next.label}</Btn>
            </>
          ) : (
            <p className="t-body-01 mt-1">Waiting on {g.waitingOn}. No action is needed from you{m.role === 'Credit Officer' ? '' : ' until the review is recorded'}.</p>
          )}
        </section>
      )}
      <section aria-labelledby="fin-h" className="px-5 pt-5 pb-5 space-y-3 border-b border-[var(--cds-border-subtle-01)]">
        <h2 id="fin-h" className="t-heading-02">Financial summary</h2>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 items-end">
          <div><dt className="t-label-01 text-[var(--cds-text-secondary)]">Requested amount</dt><dd className="t-heading-03 tabular-nums mt-0.5"><Money value={req.requested} /></dd></div>
          <div><dt className="t-label-01 text-[var(--cds-text-secondary)]">Estimated borrowing power</dt><dd className="t-heading-03 tabular-nums !font-semibold mt-0.5" aria-live="polite"><Money value={ev.total} /></dd></div>
          <div className="col-span-2 flex justify-between items-baseline gap-3 t-body-01"><dt className="text-[var(--cds-text-secondary)]">Coverage of request</dt><dd className={cx('tabular-nums font-semibold', cov < 1 && 'text-[var(--cds-text-error)]')}>{fmtPct(cov)}</dd></div>
        </dl>
        <div className="relative h-1 bg-[var(--cds-border-subtle-01)]" aria-hidden="true">
          <div className={cx('h-full', cov >= 1 ? 'bg-[var(--cds-support-success)]' : 'bg-[var(--cds-support-error)]')} style={{ width: `${Math.min(cov / 1.5, 1) * 100}%` }} />
          <div className="absolute -top-1 h-3 w-px bg-[var(--cds-text-primary)]" style={{ left: `${(1 / 1.5) * 100}%` }} />
        </div>
        <p className={cx('t-helper-01', diff >= 0 ? 'text-[var(--cds-text-secondary)]' : 'text-[var(--cds-text-error)]')}>
          {diff >= 0 ? `${fmtMoney(diff)} above the requested amount` : `${fmtMoney(-diff)} below the requested amount`}. Submission needs 100%.
        </p>
        <dl>
          <div className="flex justify-between t-body-01"><dt className="text-[var(--cds-text-secondary)]">Pledged market value</dt><dd className="tabular-nums"><Money value={ev.pledgedValue} /></dd></div>
        </dl>
        <div className="flex flex-wrap gap-1 pt-1">
          <Tag tone="success">{ev.rows.filter((r) => r.status === 'auto').length} valued</Tag>
          {ev.needsReview > 0 && <Tag tone="review">{ev.needsReview} review required</Tag>}
          {ev.rows.some((r) => r.status === 'reviewed') && <Tag tone="info">{ev.rows.filter((r) => r.status === 'reviewed').length} reviewed</Tag>}
          {ev.ineligible > 0 && <Tag tone="error">{ev.ineligible} not eligible</Tag>}
        </div>
        <p className="t-helper-01 text-[var(--cds-text-secondary)]">Indicative estimate. Not a credit decision or an offer of credit.</p>
      </section>
      <section aria-labelledby="ready-h" className="px-5 py-5">
        <div className="flex justify-between items-baseline">
          <h2 id="ready-h" className="t-heading-02">Readiness</h2>
          <span className="t-helper-01 tabular-nums text-[var(--cds-text-secondary)]">{done} of {readiness.length} complete</span>
        </div>
        <div className="h-1 bg-[var(--cds-border-subtle-01)] mt-2" aria-hidden="true"><div className="h-full bg-[var(--cds-interactive)]" style={{ width: `${(done / readiness.length) * 100}%` }} /></div>
        {open.length > 0 && section === 'review' ? (
          <p className="t-body-01 mt-3">{open.length} item{open.length > 1 ? 's' : ''} blocking submission. See the list in this section.</p>
        ) : open.length > 0 ? (
          <>
            <p className="t-label-01 text-[var(--cds-text-secondary)] mt-4">Blocking submission ({open.length})</p>
            <ul className="mt-2 space-y-1">
              {open.slice(0, 5).map((r) => (
                <li key={r.id}>
                  <button type="button" className="text-left t-body-compact-01 text-[var(--cds-link-primary)] hover:underline" onClick={() => onGo(r.step, ANCHOR[r.id])}>{r.label}</button>
                </li>
              ))}
              {open.length > 5 && <li><button type="button" className="text-left t-helper-01 text-[var(--cds-link-primary)] hover:underline" onClick={() => onGo('review', 'readiness')}>{open.length - 5} more in Review and submit</button></li>}
            </ul>
          </>
        ) : (
          <p className="mt-3 t-body-01 flex gap-2 items-center"><CheckmarkFilled size={16} className="fill-[var(--cds-support-success)]" aria-hidden="true" /> Ready to submit</p>
        )}
      </section>
    </aside>
  );
}

/* ------------------------------- Confirmation ------------------------------- */
function Confirmation({ m, onRoute }: { m: RequestModel; onRoute: (r: Route) => void }) {
  const { s, req, ev } = m;
  return (
    <div className="px-4 sm:px-8 py-8 max-w-[960px] mx-auto">
      <div className="bg-[var(--cds-layer-01)] p-8">
        <InlineNotification kind="success" lowContrast hideCloseButton className="!max-w-none" title="Submitted to underwriting" subtitle={`${s.requestId}, ${s.entityName ?? s.primary.name}. Submitted ${req.submittedAt}.`} />
        <dl className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <KV label="Requested amount" value={fmtMoney(req.requested)} mono />
          <KV label="Estimated borrowing power" value={fmtMoney(ev.total)} mono />
          <KV label="Readiness checks" value={`${m.readiness.length} of ${m.readiness.length} complete`} />
          <KV label="Credit officer reviews" value={String(Object.keys(req.reviews).length)} />
        </dl>
        <p className="t-body-01 mt-6">The estimated borrowing power is indicative. Underwriting makes the credit decision and sets any approved credit limit.</p>
        <h2 className="t-heading-03 mt-8">Next steps</h2>
        <ol className="mt-3 space-y-2 t-body-01 list-decimal pl-5">
          <li>Underwriting reviews credit, collateral and documentation.</li>
          <li>The decision and any conditions appear in Underwriting and are linked to this request.</li>
          <li>After approval and signed documents, the line appears in Active credit with collateral monitoring.</li>
        </ol>
        <div className="mt-8 flex flex-wrap gap-4">
          <Button onClick={() => onRoute({ page: 'underwriting', id: s.requestId })}>View in underwriting</Button>
          <Button kind="tertiary" onClick={() => onRoute({ page: 'pipeline' })}>Back to pipeline</Button>
        </div>
      </div>
    </div>
  );
}
