import { useEffect, useRef, useState } from 'react';
import '@fontsource/ibm-plex-sans/300.css';
import '@fontsource/ibm-plex-sans/400.css';
import '@fontsource/ibm-plex-sans/500.css';
import '@fontsource/ibm-plex-sans/600.css';
import '@fontsource/ibm-plex-mono/400.css';
import './carbon.scss';
import { Header, HeaderGlobalAction, HeaderGlobalBar, HeaderMenuItem, HeaderName, HeaderNavigation, HeaderPanel, Modal, Search, SkipToContent, Button } from '@carbon/react';
import { UserAvatar } from '@carbon/icons-react';
import { useDemo, type Stage } from '../DemoContext';
import { usePersistentState } from '../../app/state/ConsoleStore';
import { ACTIVE_LINES, PIPELINE, SCENARIOS, type ScenarioId } from '../data';
import { cx, SelectField } from './ui';
import { Pipeline } from './Pipeline';
import { Workspace } from './Workspace';
import { Underwriting, ActiveCredit } from './PostUnderwriting';
import { AfterGlobalProvider, USERS, nowStamp, useAudit, type Role, type Section } from './state';
import { useConsoleStore } from '../../app/state/ConsoleStore';

export type Route =
  | { page: 'pipeline' }
  | { page: 'request'; id: ScenarioId; section: Section }
  | { page: 'confirmation'; id: ScenarioId }
  | { page: 'underwriting'; id?: string }
  | { page: 'credit'; id?: string };

const SECTION_STAGE: Record<Section, Stage> = { client: 'customer', collateral: 'collateral', structure: 'loan', review: 'review' };

export function stageOf(r: Route): Stage {
  if (r.page === 'pipeline') return 'dashboard';
  if (r.page === 'request') return SECTION_STAGE[r.section];
  if (r.page === 'confirmation') return 'submitted';
  return 'servicing';
}

/** Session timeout (simulated): warning at 13 minutes idle, sign-out at 15. `?sessionSeconds=N` shortens it for testing. */
const SESSION_MS = (() => {
  const v = Number(new URLSearchParams(window.location.search).get('sessionSeconds'));
  return v > 0 ? v * 1000 : 15 * 60 * 1000;
})();
const WARN_MS = Math.max(SESSION_MS - 2 * 60 * 1000, SESSION_MS / 2);

export function AfterApp() {
  return (
    <AfterGlobalProvider>
      <AfterInner />
    </AfterGlobalProvider>
  );
}

function AfterInner() {
  const { scenario, stage, jumpToken, reportStage } = useDemo();
  const { read } = useConsoleStore();
  const [route, setRoute] = usePersistentState<Route>('after:route', () => ({ page: 'pipeline' }));
  const [panelOpen, setPanelOpen] = useState(false);
  const [signedOut, setSignedOut] = useState(false);
  const { role, log, setGlobal } = useAudit();

  // Shell-driven jumps (Before/After toggle, scenario change).
  const lastJump = useRef(-1);
  useEffect(() => {
    if (lastJump.current === jumpToken) return;
    lastJump.current = jumpToken;
    const st = stage.after;
    const id = scenario;
    const map: Partial<Record<Stage, Route>> = {
      dashboard: { page: 'pipeline' },
      evaluation: { page: 'request', id, section: 'collateral' },
      collateral: { page: 'request', id, section: 'collateral' },
      customer: { page: 'request', id, section: 'client' },
      parties: { page: 'request', id, section: 'client' },
      loan: { page: 'request', id, section: 'structure' },
      acknowledgment: { page: 'request', id, section: 'review' },
      review: { page: 'request', id, section: 'review' },
      submitted: read<Record<string, boolean>>('after:submitted')?.[id] ? { page: 'confirmation', id } : { page: 'request', id, section: 'review' },
      servicing: { page: 'credit' },
    };
    setRoute(map[st] ?? { page: 'pipeline' });
  }, [jumpToken]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    reportStage('after', stageOf(route));
    document.getElementById('after-main')?.scrollTo({ top: 0 });
  }, [route.page, (route as { section?: string }).section, (route as { id?: string }).id]); // eslint-disable-line react-hooks/exhaustive-deps

  const nav = [
    { page: 'pipeline' as const, label: 'Pipeline' },
    { page: 'underwriting' as const, label: 'Underwriting' },
    { page: 'credit' as const, label: 'Active credit' },
  ];
  const activeNav = route.page === 'request' || route.page === 'confirmation' ? 'pipeline' : route.page;
  const signOut = (reason: string) => {
    log('Signed out', reason);
    setPanelOpen(false);
    setSignedOut(true);
  };

  if (signedOut) {
    return (
      <div className="sbl-after h-full grid place-items-center">
        <div className="max-w-md px-6">
          <h1 className="t-heading-04">You are signed out</h1>
          <p className="t-body-01 text-[var(--cds-text-secondary)] mt-3">Your session ended. Draft requests are saved. Sign in to continue.</p>
          <Button size="md" className="mt-6" onClick={() => { setSignedOut(false); log('Signed in', 'Session started'); }}>Sign in</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="sbl-after h-full flex flex-col">
      <Header aria-label="SBL Workspace">
        <SkipToContent href="#after-main" />
        <HeaderName href="#" prefix="" onClick={(e: React.MouseEvent) => { e.preventDefault(); setRoute({ page: 'pipeline' }); }}>
          <span className="inline-block w-1 h-4 bg-[var(--sbl-brand-accent)] mr-2" aria-hidden="true" />
          SBL Workspace
        </HeaderName>
        <HeaderNavigation aria-label="Workspace">
          {nav.map(({ page, label }) => (
            <HeaderMenuItem
              key={page}
              href="#"
              isActive={activeNav === page}
              aria-current={activeNav === page ? 'page' : undefined}
              onClick={(e: React.MouseEvent) => { e.preventDefault(); setRoute({ page } as Route); }}
            >
              {label}
            </HeaderMenuItem>
          ))}
        </HeaderNavigation>
        <HeaderGlobalBar>
          <GlobalSearch onOpen={setRoute} />
          <HeaderGlobalAction aria-label={`${USERS[role]}, ${role}. Open user menu`} aria-expanded={panelOpen} isActive={panelOpen} onClick={() => setPanelOpen(!panelOpen)} tooltipAlignment="end">
            <UserAvatar size={20} />
          </HeaderGlobalAction>
        </HeaderGlobalBar>
        <HeaderPanel aria-label="User menu" expanded={panelOpen}>
          <div className="p-4">
            <p className="t-heading-02">{USERS[role]}</p>
            <p className="t-helper-01 text-[var(--cds-text-secondary)]">{role} · Private Banking</p>
            <div className="mt-6">
              <SelectField
                label="Role (demo)"
                options={['Relationship Banker', 'Credit Officer']}
                value={role}
                placeholder="Choose a role"
                helper="Available actions follow the selected role."
                onChange={(v) => {
                  if (!v || v === role) return;
                  setGlobal((g) => ({ ...g, role: v as Role, audit: [{ at: nowStamp(), user: USERS[v as Role], role: v as Role, event: 'Role changed', detail: `Signed in as ${v}` }, ...g.audit] }));
                }}
              />
            </div>
            <Button kind="tertiary" size="sm" className="mt-4" onClick={() => signOut('Signed out by user')}>Sign out</Button>
          </div>
        </HeaderPanel>
      </Header>
      <main id="after-main" tabIndex={-1} className="flex-1 min-h-0 overflow-y-auto overflow-x-auto">
        {route.page === 'pipeline' && <Pipeline onOpen={setRoute} />}
        {(route.page === 'request' || route.page === 'confirmation') && <Workspace key={route.id} route={route} onRoute={setRoute} />}
        {route.page === 'underwriting' && <Underwriting focusId={route.id} onRoute={setRoute} />}
        {route.page === 'credit' && <ActiveCredit focusId={route.id} onRoute={setRoute} />}
      </main>
      <SessionGuard onExpire={() => signOut('Session timed out after inactivity')} />
    </div>
  );
}

function SessionGuard({ onExpire }: { onExpire: () => void }) {
  const last = useRef(Date.now());
  const [warn, setWarn] = useState(false);
  const [left, setLeft] = useState(0);
  useEffect(() => {
    const bump = () => { if (!warn) last.current = Date.now(); };
    window.addEventListener('pointerdown', bump);
    window.addEventListener('keydown', bump);
    const t = setInterval(() => {
      const idle = Date.now() - last.current;
      if (idle >= SESSION_MS) { clearInterval(t); setWarn(false); onExpire(); return; }
      if (idle >= WARN_MS) { setWarn(true); setLeft(Math.ceil((SESSION_MS - idle) / 1000)); }
    }, 500);
    return () => { clearInterval(t); window.removeEventListener('pointerdown', bump); window.removeEventListener('keydown', bump); };
  }, [warn]); // eslint-disable-line react-hooks/exhaustive-deps
  const m = Math.floor(left / 60);
  const s = String(left % 60).padStart(2, '0');
  return (
    <Modal
      open={warn}
      size="xs"
      modalHeading="Your session is about to expire"
      primaryButtonText="Stay signed in"
      secondaryButtonText="Sign out"
      onRequestSubmit={() => { last.current = Date.now(); setWarn(false); }}
      onSecondarySubmit={() => { setWarn(false); onExpire(); }}
      onRequestClose={() => { last.current = Date.now(); setWarn(false); }}
    >
      <p className="t-body-01">For security, you will be signed out in <b className="tabular-nums">{m}:{s}</b> because of inactivity. Draft requests are saved.</p>
    </Modal>
  );
}

function GlobalSearch({ onOpen }: { onOpen: (r: Route) => void }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const norm = (t: string) => t.toLowerCase().replace(/[^a-z0-9]/g, '');
  const n = norm(q);
  type Hit = { label: string; sub: string; route: Route };
  const hits: Hit[] = !n
    ? []
    : [
        ...SCENARIOS.filter((s) => [s.primary.name, s.entityName ?? '', s.requestId, s.primary.mdmId, s.primary.powerId].some((f) => norm(f).includes(n))).map((s) => ({
          label: s.entityName ? `${s.entityName} — ${s.primary.name}` : s.primary.name,
          sub: `${s.requestId} · Origination · MDM ID ${s.primary.mdmId}`,
          route: { page: 'request', id: s.id, section: 'client' } as Route,
        })),
        ...PIPELINE.filter((p) => p.status === 'In Underwriting' && [p.client, p.requestId, p.mdmId, p.powerId].some((f) => norm(f).includes(n))).map((p) => ({ label: p.client, sub: `${p.requestId} · In underwriting`, route: { page: 'underwriting', id: p.requestId } as Route })),
        ...ACTIVE_LINES.filter((l) => [l.client, l.id].some((f) => norm(f).includes(n))).map((l) => ({ label: l.client, sub: `${l.id} · Active credit line`, route: { page: 'credit', id: l.id } as Route })),
      ].slice(0, 8);
  const choose = (h: Hit) => { onOpen(h.route); setQ(''); setOpen(false); };
  return (
    <div className="relative w-[min(420px,40vw)] self-center mr-2" role="search">
      <Search
        size="md"
        id="global-search"
        labelText="Search clients, requests and credit lines"
        placeholder="Search by name, request ID, MDM ID or Power ID"
        value={q}
        role="combobox"
        aria-expanded={open && hits.length > 0}
        aria-controls="global-search-list"
        aria-activedescendant={open && hits[active] ? `gs-${active}` : undefined}
        onChange={(e: { target: HTMLInputElement }) => { setQ(e.target.value); setOpen(true); setActive(0); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e: React.KeyboardEvent) => {
          if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, hits.length - 1)); }
          if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
          if (e.key === 'Enter' && hits[active]) { e.preventDefault(); choose(hits[active]); }
        }}
      />
      {open && n && (
        <ul id="global-search-list" role="listbox" aria-label="Search results" className="absolute z-[8000] left-0 right-0 top-full bg-[var(--cds-layer-01)] text-[var(--cds-text-primary)] shadow-lg max-h-80 overflow-y-auto border border-[var(--cds-border-subtle-01)]">
          {hits.length === 0 && <li className="px-4 py-3 t-body-01 text-[var(--cds-text-secondary)]">No results for “{q}”. Check the name or identifier.</li>}
          {hits.map((h, i) => (
            <li key={h.sub} id={`gs-${i}`} role="option" aria-selected={i === active} onMouseDown={(e) => { e.preventDefault(); choose(h); }} className={cx('px-4 py-3 cursor-pointer', i === active ? 'bg-[var(--cds-layer-selected-01)]' : 'hover:bg-[var(--cds-layer-hover-01)]')}>
              <div className="t-body-compact-01 font-semibold">{h.label}</div>
              <div className="t-helper-01 text-[var(--cds-text-secondary)]">{h.sub}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
