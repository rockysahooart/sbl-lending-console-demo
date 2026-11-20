import { useEffect, useRef, useState } from 'react';
import '@fontsource/ibm-plex-sans/300.css';
import '@fontsource/ibm-plex-sans/400.css';
import '@fontsource/ibm-plex-sans/500.css';
import '@fontsource/ibm-plex-sans/600.css';
import '@fontsource/ibm-plex-mono/400.css';
import './carbon.scss';
import { Header, HeaderGlobalAction, HeaderGlobalBar, HeaderMenuButton, HeaderName, HeaderPanel, Modal, SideNav, SideNavItems, SideNavLink, SkipToContent, Button } from '@carbon/react';
import { UserAvatar } from '@carbon/icons-react';
import { useDemo, type Stage } from '../DemoContext';
import { usePersistentState } from '../../app/state/ConsoleStore';
import type { ScenarioId } from '../data';
import { SelectField } from './ui';
import { Console } from './Console';
import { Evaluation } from './Evaluation';
import { Record } from './Record';
import { Workspace } from './Workspace';
import { Underwriting, ActiveCredit } from './PostUnderwriting';
import { AfterGlobalProvider, STEPS, USERS, nowStamp, useAudit, type Role, type Section } from './state';

const FULL_NAME: Record<Role, string> = { 'Relationship Banker': 'Sarah Mitchell', 'Credit Officer': 'Michael Okonkwo' };
const ROLE_LABEL: Record<Role, string> = { 'Relationship Banker': 'Loan Officer', 'Credit Officer': 'Credit Officer' };
import { useConsoleStore } from '../../app/state/ConsoleStore';

export type ConsoleTab = 'pending' | 'evaluations' | 'submitted';
export type Route =
  | { page: 'console'; tab?: ConsoleTab }
  | { page: 'evaluation'; id: ScenarioId }
  | { page: 'record'; id: string }
  | { page: 'request'; id: ScenarioId; section: Section }
  | { page: 'confirmation'; id: ScenarioId }
  | { page: 'review'; id?: string }
  | { page: 'credit'; id?: string };

const SECTION_STAGE: Record<Section, Stage> = { customer: 'customer', parties: 'parties', loan: 'loan', collateral: 'collateral' };

export function stageOf(r: Route): Stage {
  if (r.page === 'console' || r.page === 'record') return 'dashboard';
  if (r.page === 'evaluation') return 'evaluation';
  if (r.page === 'request') return SECTION_STAGE[r.section];
  if (r.page === 'confirmation') return 'submitted';
  return 'servicing';
}

const PAGES = ['console', 'evaluation', 'record', 'request', 'confirmation', 'review', 'credit'];
const isRoute = (r: unknown): r is Route => {
  const x = r as Route | undefined;
  if (!x || !PAGES.includes(x.page)) return false;
  return x.page !== 'request' || STEPS.some((st) => st.key === x.section);
};

/** Page title shown in the centre of the header, as in the original console. */
const titleOf = (r: Route) =>
  r.page === 'console' ? 'Securities Lending Console' : r.page === 'evaluation' ? 'Evaluation' : r.page === 'review' ? 'Pending Review' : r.page === 'credit' ? 'Active Credit' : 'Loan Request';

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
  const [stored, setRoute] = usePersistentState<Route>('after:route', () => ({ page: 'console' }));
  const route: Route = isRoute(stored) ? stored : { page: 'console' };
  const [panelOpen, setPanelOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [signedOut, setSignedOut] = useState(false);
  const { role, log, setGlobal } = useAudit();

  // Shell-driven jumps (Before/After toggle, scenario change).
  const lastJump = useRef(-1);
  useEffect(() => {
    if (lastJump.current === jumpToken) return;
    lastJump.current = jumpToken;
    const st = stage.after;
    const id = scenario;
    const submitted = read<Record<string, boolean>>('after:submitted')?.[id];
    const map: Partial<Record<Stage, Route>> = {
      dashboard: { page: 'console' },
      evaluation: { page: 'evaluation', id },
      acknowledgment: { page: 'evaluation', id },
      customer: { page: 'request', id, section: 'customer' },
      parties: { page: 'request', id, section: 'parties' },
      loan: { page: 'request', id, section: 'loan' },
      collateral: { page: 'request', id, section: 'collateral' },
      review: { page: 'request', id, section: 'collateral' },
      submitted: submitted ? { page: 'confirmation', id } : { page: 'request', id, section: 'collateral' },
      servicing: { page: 'review' },
    };
    setRoute(map[st] ?? { page: 'console' });
  }, [jumpToken]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    reportStage('after', stageOf(route));
    document.getElementById('after-main')?.scrollTo({ top: 0 });
  }, [route.page, (route as { section?: string }).section, (route as { id?: string }).id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Same menu as the original console (Evaluations, Pending Review), plus Active Credit.
  const nav = [
    { page: 'console' as const, label: 'Evaluations' },
    { page: 'review' as const, label: 'Pending Review' },
    { page: 'credit' as const, label: 'Active Credit' },
  ];
  const activeNav = route.page === 'review' || route.page === 'credit' ? route.page : 'console';
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
      <Header aria-label="Securities Lending Console">
        <SkipToContent href="#after-main" />
        <HeaderMenuButton aria-label={menuOpen ? 'Close menu' : 'Open menu'} isActive={menuOpen} isCollapsible onClick={() => setMenuOpen(!menuOpen)} />
        <HeaderName href="#" prefix="" onClick={(e: React.MouseEvent) => { e.preventDefault(); setRoute({ page: 'console' }); }}>
          <span className="inline-block w-1 h-4 bg-[var(--sbl-brand-accent)] mr-2" aria-hidden="true" />
          Securities Lending Console
        </HeaderName>
        <p className="sbl-header-title t-heading-02" aria-hidden="true">{titleOf(route)}</p>
        <SideNav aria-label="Menu" expanded={menuOpen} isPersistent={false} onOverlayClick={() => setMenuOpen(false)} onSideNavBlur={() => setMenuOpen(false)}>
          <SideNavItems>
            {nav.map(({ page, label }) => (
              <SideNavLink
                key={page}
                href="#"
                isActive={activeNav === page}
                aria-current={activeNav === page ? 'page' : undefined}
                onClick={(e: React.MouseEvent) => { e.preventDefault(); setRoute({ page } as Route); setMenuOpen(false); }}
              >
                {label}
              </SideNavLink>
            ))}
          </SideNavItems>
        </SideNav>
        <HeaderGlobalBar>
          <div className="hidden md:flex flex-col items-end justify-center pr-3 leading-tight">
            <span className="t-body-compact-01 font-semibold">{FULL_NAME[role]}</span>
            <span className="t-helper-01 text-[var(--cds-text-secondary)]">{ROLE_LABEL[role]} · Branch 4472</span>
          </div>
          <HeaderGlobalAction aria-label={`${FULL_NAME[role]}, ${ROLE_LABEL[role]}. Open user menu`} aria-expanded={panelOpen} isActive={panelOpen} onClick={() => setPanelOpen(!panelOpen)} tooltipAlignment="end">
            <UserAvatar size={20} />
          </HeaderGlobalAction>
        </HeaderGlobalBar>
        <HeaderPanel aria-label="User menu" expanded={panelOpen}>
          <div className="p-4">
            <p className="t-heading-02">{FULL_NAME[role]}</p>
            <p className="t-helper-01 text-[var(--cds-text-secondary)]">{ROLE_LABEL[role]} · Branch 4472</p>
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
        {route.page === 'console' && <Console tab={route.tab ?? 'pending'} onRoute={setRoute} />}
        {route.page === 'record' && <Record key={route.id} id={route.id} onRoute={setRoute} />}
        {route.page === 'evaluation' && <Evaluation key={route.id} id={route.id} onRoute={setRoute} />}
        {(route.page === 'request' || route.page === 'confirmation') && <Workspace key={route.id} route={route} onRoute={setRoute} />}
        {route.page === 'review' && <Underwriting focusId={route.id} onRoute={setRoute} />}
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
