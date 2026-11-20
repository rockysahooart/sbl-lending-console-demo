import { useEffect, useRef, useState } from 'react';
import '@fontsource/ibm-plex-sans/300.css';
import '@fontsource/ibm-plex-sans/400.css';
import '@fontsource/ibm-plex-sans/500.css';
import '@fontsource/ibm-plex-sans/600.css';
import '@fontsource/ibm-plex-mono/400.css';
import './carbon.scss';
import './team/iris.scss';
import './team/theo.scss';
import './team/kenji.scss';
import './team/mara.scss';
import './team/felix.scss';
import './team/paul.scss';
import './surfaces.scss';
import './features.scss';
import { Header, HeaderGlobalAction, HeaderGlobalBar, HeaderMenuButton, HeaderName, HeaderPanel, Modal, Select, SelectItem, SideNav, SideNavItems, SideNavLink, SkipToContent, Button } from '@carbon/react';
import { UserAvatar } from '@carbon/icons-react';
import { useDemo, type Stage } from '../DemoContext';
import { usePersistentState } from '../../app/state/ConsoleStore';
import { SCENARIOS, type ScenarioId } from '../data';
import { scenarioOfApp, type Loc } from '../sync';
import { Console } from './Console';
import { Evaluation } from './Evaluation';
import { Record } from './Record';
import { Workspace } from './Workspace';
import { Underwriting, ActiveCredit } from './PostUnderwriting';
import { AfterGlobalProvider, ROLE_LABEL, STEPS, USERS, nowStamp, useAudit, type Role, type Section } from './state';

const FULL_NAME: Record<Role, string> = { 'Relationship Banker': 'Sarah Mitchell', 'Credit Officer': 'Michael Okonkwo' };
import { useConsoleStore } from '../../app/state/ConsoleStore';

export type ConsoleTab = 'pending' | 'evaluations' | 'submitted';
export type Route =
  | { page: 'console'; tab?: ConsoleTab; expanded?: string }
  | { page: 'evaluation'; id: ScenarioId; ack?: boolean; fix?: string }
  | { page: 'record'; id: string; fix?: string }
  | { page: 'request'; id: ScenarioId; section: Section; fix?: string }
  | { page: 'confirmation'; id: ScenarioId }
  | { page: 'review'; id?: string; fix?: string }
  | { page: 'credit'; id?: string };

const SECTION_STAGE: Record<Section, Stage> = { customer: 'customer', parties: 'parties', loan: 'loan', collateral: 'collateral' };
const reqId = (id: ScenarioId) => SCENARIOS.find((x) => x.id === id)!.requestId;

/** After route → shared location (src/demo/sync.ts). */
export function routeToLoc(r: Route): Loc {
  switch (r.page) {
    case 'console': return { screen: 'console', tab: r.tab ?? 'pending', expanded: r.expanded };
    case 'evaluation': return { screen: r.ack ? 'acknowledgment' : 'evaluation', appId: reqId(r.id) };
    case 'record': return { screen: 'record', appId: r.id };
    case 'request': return { screen: 'step', appId: reqId(r.id), step: (STEPS.findIndex((x) => x.key === r.section) + 1) as 1 | 2 | 3 | 4 };
    case 'confirmation': return { screen: 'submitted', appId: reqId(r.id) };
    case 'review': return { screen: 'review', appId: r.id };
    case 'credit': return { screen: 'credit', appId: r.id };
  }
}

/** Shared location → After route. Where After can't show it, the closest parent. */
export function locToRoute(l: Loc, submitted: (id: ScenarioId) => boolean): Route {
  const sid = scenarioOfApp(l.appId);
  switch (l.screen) {
    case 'record': return { page: 'record', id: l.appId ?? '' };
    case 'evaluation': case 'acknowledgment': return sid ? { page: 'evaluation', id: sid, ack: l.screen === 'acknowledgment' } : { page: 'console' };
    case 'step': return sid ? { page: 'request', id: sid, section: STEPS[(l.step ?? 1) - 1].key } : { page: 'console' };
    case 'submitted': return sid ? (submitted(sid) ? { page: 'confirmation', id: sid } : { page: 'request', id: sid, section: 'collateral' }) : { page: 'console', tab: 'submitted' };
    case 'review': case 'overview': return (l.appId ?? '').startsWith('LOC-') ? { page: 'credit', id: l.appId } : { page: 'review', id: l.appId };
    case 'credit': return { page: 'credit', id: l.appId };
    default: return { page: 'console', tab: l.tab ?? 'pending', expanded: l.expanded };
  }
}

export function stageOf(r: Route): Stage {
  if (r.page === 'console' || r.page === 'record') return 'dashboard';
  if (r.page === 'evaluation') return 'evaluation';
  if (r.page === 'request') return SECTION_STAGE[r.section];
  if (r.page === 'confirmation') return 'submitted';
  return 'servicing';
}

/** Browser tab title per screen, built from the screen names already on the page (FELIX-04). */
const stepLabel = (sec: Section) => { const i = STEPS.findIndex((x) => x.key === sec); return `${i + 1}. ${STEPS[i].label}`; };
const docTitleOf = (r: Route) => {
  const screen =
    r.page === 'console' ? '' :
    r.page === 'evaluation' ? `Evaluation · ${reqId(r.id)}` :
    r.page === 'record' ? `${r.id}` :
    r.page === 'request' ? `${stepLabel(r.section)} · ${reqId(r.id)}` :
    r.page === 'confirmation' ? `Loan Request Submitted · ${reqId(r.id)}` :
    r.page === 'review' ? `Pending Review${r.id ? ` · ${r.id}` : ''}` :
    `Active Credit${r.id ? ` · ${r.id}` : ''}`;
  return `${screen ? `${screen} — ` : ''}Securities Lending Console (After)`;
};

/**
 * Move focus to the new screen's h1 (FELIX-01, FELIX-09). Headings rendered by the screens are made
 * programmatically focusable here, so no screen component has to change. Falls back to <main>.
 */
function focusPageHeading() {
  const h = document.querySelector<HTMLElement>('#after-main h1, #after-signed-out h1');
  const target = h ?? document.getElementById('after-main');
  if (!target) return;
  if (h && !h.hasAttribute('tabindex')) h.setAttribute('tabindex', '-1');
  target.focus({ preventScroll: true });
}

/** Closed menus must leave the Tab order (FELIX-02, KENJI-06). React 18 has no typed `inert`, so it is passed as an attribute. */
const inertWhen = (closed: boolean) => (closed ? ({ inert: '' } as object) : {});

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
  const { loc, jumpToken, reportLocation } = useDemo();
  const { read } = useConsoleStore();
  const [stored, setRoute] = usePersistentState<Route>('after:route', () => ({ page: 'console' }));
  const route: Route = isRoute(stored) ? stored : { page: 'console' };
  const [panelOpen, setPanelOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [signedOut, setSignedOut] = useState(false);
  const { role, log, setGlobal } = useAudit();

  // Shell-driven jumps (Before/After toggle, browser history, scenario change). See src/demo/sync.ts.
  const lastJump = useRef(-1);
  const pending = useRef<string | null>(null);
  const [jumpKey, setJumpKey] = useState(0);
  useEffect(() => {
    if (lastJump.current === jumpToken) return;
    lastJump.current = jumpToken;
    const done = read<Record<string, boolean>>('after:submitted') ?? {};
    const mapped = locToRoute(loc.after, (id) => !!done[id]);
    // THEO-06: once the application is started, the acknowledgment is complete; a history jump lands on Evaluation, not the dialog.
    const started = mapped.page === 'evaluation' && mapped.ack && (read<{ visited?: unknown[] }>(`after:req:${mapped.id}`)?.visited?.length ?? 0) > 0;
    const next: Route = started ? { page: 'evaluation', id: mapped.id } : mapped;
    pending.current = JSON.stringify(routeToLoc(next));
    setRoute(next);
    setJumpKey((k) => k + 1);
  }, [jumpToken]); // eslint-disable-line react-hooks/exhaustive-deps

  // Report the full location after every navigation; the toggle follows it.
  // While a jump is being applied, the previous screen is not reported (it would add a stray history entry).
  const locKey = JSON.stringify(routeToLoc(route));
  useEffect(() => {
    if (pending.current) { if (pending.current !== locKey) return; pending.current = null; }
    reportLocation('after', routeToLoc(route));
  }, [locKey, jumpKey]); // eslint-disable-line react-hooks/exhaustive-deps
  // New screen or new application: start at the top. (Expanding a row or selecting a line doesn't scroll.)
  const scrollKey = route.page === 'review' || route.page === 'credit' || route.page === 'console' ? route.page : `${route.page}:${(route as { id?: string }).id}:${(route as { section?: string }).section ?? ''}`;
  // …and land focus on the new screen's h1, so keyboard and screen-reader users know the page changed (FELIX-01).
  // Runs on the next frame, before in-page landings (status-panel links, Pending Review / Active Credit detail,
  // 50–150 ms timers), which therefore still win. On first mount, focus the user already placed (e.g. the
  // Before/After toggle) is kept; only a lost focus (<body>) is rescued.
  // Keyed on the last handled screen (not a mount flag) so StrictMode's double effect run doesn't count as a navigation.
  const landedOn = useRef<string | null>(null);
  useEffect(() => {
    const key = `${scrollKey}|${signedOut}`;
    if (landedOn.current === key) return;
    const first = landedOn.current === null;
    landedOn.current = key;
    document.getElementById('after-main')?.scrollTo({ top: 0 });
    if (first && document.activeElement && document.activeElement !== document.body) return;
    requestAnimationFrame(() => {
      if (document.activeElement?.closest('[role=dialog]')) return; // an open dialog owns focus
      focusPageHeading();
    });
  }, [scrollKey, signedOut]);
  // WCAG 2.4.11 (round 2): keyboard focus must never land under the sticky step footer. The footer's height varies
  // (the reason a step is blocked wraps on phones), so it is measured and given to <main> as its bottom scroll padding,
  // which the browser honours when it scrolls a focused control into view.
  useEffect(() => {
    const main = document.getElementById('after-main');
    if (!main || typeof ResizeObserver === 'undefined') return;
    let observed: Element | null = null;
    const ro = new ResizeObserver(() => {
      const h = observed ? Math.ceil(observed.getBoundingClientRect().height) : 0;
      main.style.setProperty('--sbl-footer-h', `${h}px`);
    });
    const attach = () => {
      const f = main.querySelector('.step-footer');
      if (f === observed) return;
      if (observed) ro.unobserve(observed);
      observed = f;
      if (f) ro.observe(f); else main.style.setProperty('--sbl-footer-h', '0px');
    };
    attach();
    const mo = new MutationObserver(attach);
    mo.observe(main, { childList: true, subtree: true });
    return () => { ro.disconnect(); mo.disconnect(); };
  }, [signedOut]);
  // Browser tab title follows the screen (FELIX-04); the previous title is restored when After unmounts.
  useEffect(() => {
    const prev = document.title;
    return () => { document.title = prev; };
  }, []);
  useEffect(() => {
    document.title = signedOut ? 'Signed out — Securities Lending Console (After)' : docTitleOf(route);
  }, [locKey, signedOut]); // eslint-disable-line react-hooks/exhaustive-deps

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
      <main id="after-signed-out" className="sbl-after h-full grid place-items-center">
        <div className="max-w-md px-6">
          <h1 className="t-heading-04" tabIndex={-1}>You are signed out</h1>
          <p className="t-body-01 text-[var(--cds-text-secondary)] mt-3">Your session ended. Draft requests are saved. Sign in to continue.</p>
          <Button size="md" className="mt-6" onClick={() => { setSignedOut(false); log('Signed in', 'Session started'); }}>Sign in</Button>
        </div>
      </main>
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
        {/* IRIS-12: on the Console the centred title would repeat the product name beside it; the sr-only h1 still names the page. */}
        {route.page !== 'console' && <p className="sbl-header-title t-heading-02" aria-hidden="true">{titleOf(route)}</p>}
        <SideNav aria-label="Menu" {...inertWhen(!menuOpen)} expanded={menuOpen} isPersistent={false} onOverlayClick={() => setMenuOpen(false)} onSideNavBlur={() => setMenuOpen(false)}>
          <SideNavItems>
            {nav.map(({ page, label }) => (
              <SideNavLink
                key={page}
                href="#"
                isActive={activeNav === page}
                aria-current={activeNav === page ? 'page' : undefined}
                onClick={(e: React.MouseEvent) => { e.preventDefault(); setRoute({ page } as Route); setMenuOpen(false); if (activeNav === page) requestAnimationFrame(focusPageHeading); }}
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
        <HeaderPanel aria-label="User menu" {...inertWhen(!panelOpen)} expanded={panelOpen}>
          <div className="p-4">
            <p className="t-heading-02">{FULL_NAME[role]}</p>
            <p className="t-helper-01 text-[var(--cds-text-secondary)]">{ROLE_LABEL[role]} · Branch 4472</p>
            <div className="mt-6">
              {/* Values stay the internal Role; the options show the same label as the header (ADA-02). */}
              <Select
                id="after-role"
                labelText="Role (demo)"
                helperText="Available actions follow the selected role."
                value={role}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                  const v = e.target.value as Role;
                  if (!v || v === role) return;
                  setGlobal((g) => ({ ...g, role: v, audit: [{ at: nowStamp(), user: USERS[v], role: ROLE_LABEL[v], event: 'Role changed', detail: `Signed in as ${ROLE_LABEL[v]}` }, ...g.audit] }));
                }}
              >
                {(Object.keys(ROLE_LABEL) as Role[]).map((r) => <SelectItem key={r} value={r} text={ROLE_LABEL[r]} />)}
              </Select>
            </div>
            <Button kind="tertiary" size="sm" className="mt-4" onClick={() => signOut('Signed out by user')}>Sign out</Button>
          </div>
        </HeaderPanel>
      </Header>
      <main id="after-main" tabIndex={-1} className="flex-1 min-h-0 overflow-y-auto overflow-x-auto">
        {/* Console and Evaluation show their title only in the header; give them a page heading for screen readers (FELIX-03). */}
        {route.page === 'console' && <h1 className="sr-only">Securities Lending Console</h1>}
        {route.page === 'evaluation' && <h1 className="sr-only">Evaluation · {reqId(route.id)}</h1>}
        {route.page === 'console' && <Console key={`c${jumpKey}`} tab={route.tab ?? 'pending'} expanded={route.expanded} onRoute={setRoute} />}
        {route.page === 'record' && <Record key={`${route.id}-${route.fix ?? ''}`} id={route.id} fix={route.fix} onRoute={setRoute} />}
        {route.page === 'evaluation' && <Evaluation key={`${route.id}-${jumpKey}-${route.fix ?? ''}`} id={route.id} fix={route.fix} ack={!!route.ack} onAck={(a) => setRoute({ page: 'evaluation', id: route.id, ack: a })} onRoute={setRoute} />}
        {(route.page === 'request' || route.page === 'confirmation') && <Workspace key={route.id} route={route} onRoute={setRoute} />}
        {route.page === 'review' && <Underwriting key={`u${jumpKey}`} focusId={route.id} fix={route.fix} onSelect={(id) => setRoute({ page: 'review', id })} onRoute={setRoute} />}
        {route.page === 'credit' && <ActiveCredit key={`a${jumpKey}`} focusId={route.id} onSelect={(id) => setRoute({ page: 'credit', id })} onRoute={setRoute} />}
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
