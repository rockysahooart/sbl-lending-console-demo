import { useCallback, useEffect, useRef, useState, type MouseEvent, type FormEvent } from 'react';
import { X, ArrowRight } from 'lucide-react';
import { DISCLAIMER, SCENARIOS, scenarioById, type Mode, type ScenarioId } from './data';
import { runKey, useDemo, type RunMetrics } from './DemoContext';
import { HOME, fromHash, mapLoc, sameLoc, toHash, type Loc } from './sync';
import { useConsoleStore } from '../app/state/ConsoleStore';
import { LoanTable } from '../app/components/LoanTable';
import { PendingReview } from '../app/components/PendingReview';
import { NavigationMenu } from '../app/components/NavigationMenu';
import { AfterApp } from './after/AfterApp';
import { useModalA11y } from '../app/components/useModalA11y';

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(' ');

/** Lets the baseline header (which has no direct handler) open the baseline menu. */
export const beforeMenu = { open: () => {} };

/**
 * Two stages: (1) Preface & Context, (2) Interactive Prototype.
 * Inside the prototype there is no presentation UI beyond a minimal bar:
 * fictional-data indicator, Before/After toggle, scenario, and a link back.
 */
export function DemoShell() {
  const { view } = useDemo();
  useHistorySync();
  if (view !== 'app') return <Preface />;
  return (
    <div className="h-screen flex flex-col bg-[#F4F4F4]">
      <DemoBar />
      <InstrumentedFrame />
    </div>
  );
}

/* ------------------------------ Minimal demo bar ------------------------------ */
const MODES: Mode[] = ['before', 'after'];
function DemoBar() {
  const { mode, scenario, setScenario, setView } = useDemo();
  const switchMode = useSwitchMode();
  const toggleRefs = useRef<Partial<Record<Mode, HTMLButtonElement | null>>>({});
  const onToggleKey = (e: React.KeyboardEvent) => {
    const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : e.key === 'Home' ? -2 : e.key === 'End' ? 2 : 0;
    if (!step) return;
    e.preventDefault();
    const i = MODES.indexOf(mode);
    const next = MODES[step === -2 ? 0 : step === 2 ? MODES.length - 1 : (i + step + MODES.length) % MODES.length];
    toggleRefs.current[next]?.focus();
    if (next !== mode) switchMode(next);
  };
  return (
    <nav aria-label="Prototype" className="demo-bar relative z-[10000] h-10 pointer-coarse:h-12 flex-shrink-0 bg-[#161616] text-white flex items-center gap-1.5 sm:gap-3 px-1.5 min-[360px]:px-2 sm:px-4 text-[13px] overflow-x-auto">
      <button type="button" onClick={() => setView('intro')} aria-label="Back to preface" className="text-[13px] text-[#C6C6C6] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#78A9FF] whitespace-nowrap px-1 inline-flex items-center justify-center min-w-8 h-8 pointer-coarse:min-w-9 pointer-coarse:h-10 sm:min-w-0">←<span className="hidden sm:inline ml-1" aria-hidden="true">Preface</span></button>
      <span className="inline-flex items-center gap-1 min-[360px]:gap-1.5 sm:gap-2 h-6 px-1 min-[360px]:px-1.5 sm:px-2 rounded-sm border border-[#6F6F6F] text-[12px] text-[#C6C6C6] whitespace-nowrap">
        <span className="w-1.5 h-1.5 rounded-full bg-[#F5A742]" aria-hidden="true" /> <span className="hidden md:inline">Portfolio Demo · Fictional Data</span><span className="md:hidden">Fictional</span>
      </span>
      <div className="ml-auto flex items-center gap-1.5 sm:gap-3">
        <label htmlFor="scenario-select" className="sr-only">Scenario</label>
        <select
          id="scenario-select"
          value={scenario}
          onChange={(e) => setScenario(e.target.value as ScenarioId)}
          className="h-7 pointer-coarse:h-10 max-w-[84px] min-[360px]:max-w-[112px] sm:max-w-none text-[13px] bg-[#262626] border border-[#525252] rounded-sm px-1.5 sm:px-2 text-white focus:outline focus:outline-2 focus:outline-[#78A9FF]"
        >
          {SCENARIOS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
        {/* ARIA radio group (FELIX-07): one Tab stop on the checked option; arrow keys move and select, as the role promises. */}
        <div role="radiogroup" aria-label="Experience" onKeyDown={onToggleKey} className="flex border border-[#525252] rounded-sm overflow-hidden flex-shrink-0">
          {MODES.map((m) => (
            <button key={m} ref={(el) => { toggleRefs.current[m] = el; }} type="button" role="radio" aria-checked={mode === m} tabIndex={mode === m ? 0 : -1} onClick={() => switchMode(m)}
              className={cx('h-7 pointer-coarse:h-10 px-1.5 min-[360px]:px-2.5 sm:px-3 pointer-coarse:min-w-11 text-[13px] font-medium whitespace-nowrap focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#78A9FF]', mode === m ? 'bg-white text-[#161616]' : 'text-[#C6C6C6] hover:bg-[#262626]')}>
              {m === 'before' ? 'Before' : 'After'}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}

/**
 * Where a toggle landed, per experience, and where it came from. Toggling back from an
 * unchanged landing spot returns to the exact origin, even where the mapping is lossy
 * (an After-only record, Active Credit), so repeated toggling never drifts.
 */
const switchMemo: Partial<Record<Mode, { back: Loc }>> = {};

/** Switch experience while landing on the equivalent screen, application and context. */
function useSwitchMode() {
  const { mode, setMode, loc, requestJump, landedAt } = useDemo();
  return useCallback(
    (m: Mode) => {
      if (m === mode) return;
      const here = loc[mode];
      const saved = switchMemo[mode];
      // Untouched since the last toggle landed here? Go back exactly where the user came from.
      const target = saved && sameLoc(landedAt(mode) ?? undefined, here) ? saved.back : mapLoc(mode, here);
      switchMemo[m] = { back: here };
      requestJump(m, target);
      setMode(m);
    },
    [mode, setMode, loc, requestJump, landedAt],
  );
}

/**
 * Browser history: every screen change is a history entry (#/after/step/SBL-24-10871?step=2),
 * so Back and Forward move through screens across both experiences. Expanding a row or
 * changing a tab replaces the current entry instead of adding one.
 */
function useHistorySync() {
  const { view, setView, mode, setMode, loc, requestJump } = useDemo();
  const applying = useRef(false);
  const last = useRef<{ mode: Mode; loc: Loc } | null>(null);
  useEffect(() => {
    if (view !== 'app') return;
    const here = loc[mode];
    const hash = toHash(mode, here);
    if (window.location.hash === hash) { last.current = { mode, loc: here }; applying.current = false; return; }
    const prev = last.current;
    // THEO-06: Evaluation and its Acknowledgment dialog are one screen for history (replace, not push).
    const sameScreen = prev?.loc.screen === here.screen || [prev?.loc.screen, here.screen].every((x) => x === 'evaluation' || x === 'acknowledgment');
    const minor = prev && prev.mode === mode && sameScreen && (prev.loc.appId ?? '') === (here.appId ?? '') && (prev.loc.step ?? 0) === (here.step ?? 0);
    if (applying.current || minor || !prev) window.history.replaceState(null, '', hash);
    else window.history.pushState(null, '', hash);
    applying.current = false;
    last.current = { mode, loc: here };
  }, [view, mode, loc]);
  useEffect(() => {
    if (view === 'intro' && window.location.hash) window.history.pushState(null, '', window.location.pathname + window.location.search);
  }, [view]);
  useEffect(() => {
    const onPop = () => {
      const parsed = fromHash(window.location.hash);
      if (!parsed) { setView('intro'); return; }
      applying.current = true;
      // A history jump is not a toggle: forget toggle origins so the next toggle maps from here.
      delete switchMemo.before; delete switchMemo.after;
      setView('app');
      requestJump(parsed.mode, parsed.loc);
      setMode(parsed.mode);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [setView, setMode, requestJump]);
}

/* ------------------------ Experience + instrumentation ------------------------ */
function InstrumentedFrame() {
  const { mode, track } = useDemo();
  const lastField = useRef<EventTarget | null>(null);
  const onClick = (e: MouseEvent) => {
    const el = (e.target as HTMLElement).closest('button, a, input[type=checkbox], input[type=radio], select, [role=tab], [role=option]');
    // Deferred so tracking never re-renders mid-event (controlled radios rely on the click/change sequence).
    if (el) setTimeout(() => track('interaction', mode), 0);
  };
  const onInput = (e: FormEvent) => {
    const t = e.target as HTMLElement;
    if (!(t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement)) return;
    if (t.type === 'checkbox' || t.type === 'radio') return;
    if (lastField.current !== t) {
      lastField.current = t;
      setTimeout(() => track('field', mode), 0);
    }
  };
  return (
    <div className="demo-frame flex-1 min-h-0 min-w-0 relative overflow-x-auto overflow-y-hidden" onClickCapture={onClick} onInputCapture={onInput} onChangeCapture={(e) => { if ((e.target as HTMLElement).tagName === 'SELECT') setTimeout(() => track('field', mode), 0); }}>
      {mode === 'before' ? <BeforeHost /> : <AfterApp />}
    </div>
  );
}

/** Hosts the unchanged baseline app and opens it at the requested stage. */
type BeforePlan = { view: 'dashboard' | 'pending-review'; reviewApp?: string; initial?: NonNullable<Parameters<typeof LoanTable>[0]>['initialView'] };

/** What Before should show for a location. See src/demo/sync.ts for the map. */
function planFor(l: Loc, read: <T>(k: string) => T | undefined, write: (k: string, v: unknown) => void): BeforePlan {
  if (l.screen === 'review') return { view: 'pending-review', reviewApp: l.appId };
  if (l.screen === 'evaluation' || l.screen === 'acknowledgment') return { view: 'dashboard', initial: { applicationId: l.appId, view: 'evaluation', acknowledgment: l.screen === 'acknowledgment' } };
  if ((l.screen === 'step' || l.screen === 'submitted') && l.appId) {
    const completed = read<number[]>(`application:${l.appId}:completed`) ?? [];
    write(`application:${l.appId}:step`, l.screen === 'submitted' ? (completed.includes(4) ? 5 : 4) : l.step ?? 1);
    return { view: 'dashboard', initial: { applicationId: l.appId, view: 'application' } };
  }
  if (l.screen === 'overview') return { view: 'dashboard', initial: { applicationId: l.appId, view: 'overview', tab: 'submitted' } };
  return { view: 'dashboard', initial: { view: 'dashboard', tab: l.tab ?? 'pending', expanded: l.expanded } };
}

function BeforeHost() {
  const { loc, jumpToken } = useDemo();
  const { read, write } = useConsoleStore();
  const [menu, setMenu] = useState(false);
  // Start directly at the requested location, so no intermediate screen is shown or recorded in history.
  const [plan, setPlan] = useState<BeforePlan>(() => planFor(loc.before, read, write));
  const [navCount, setNavCount] = useState(0);
  const seen = useRef(jumpToken);
  useEffect(() => {
    beforeMenu.open = () => setMenu(true);
    return () => { beforeMenu.open = () => {}; };
  }, []);

  // Later jumps while Before is showing (browser history, scenario change).
  useEffect(() => {
    if (seen.current === jumpToken) return;
    seen.current = jumpToken;
    setPlan(planFor(loc.before, read, write));
    setNavCount((n) => n + 1);
  }, [jumpToken]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="h-full min-h-0 overflow-hidden">
      {plan.view === 'dashboard' ? <LoanTable key={navCount} onMenuClick={() => setMenu(true)} initialView={plan.initial} /> : <PendingReview key={navCount} initialApplicationId={plan.reviewApp} onBack={() => setPlan({ view: 'dashboard' })} />}
      <NavigationMenu
        isOpen={menu}
        currentSection={plan.view === 'pending-review' ? 'pending-review' : 'evaluations'}
        onClose={() => setMenu(false)}
        onNavigate={(sec) => { setPlan({ view: sec === 'pending-review' ? 'pending-review' : 'dashboard' }); setNavCount((n) => n + 1); setMenu(false); }}
      />
    </div>
  );
}

const fmtDur = (ms?: number) => {
  if (ms == null) return '—';
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};


/* ------------------------------- Session metrics (Preface only) ------------------------------- */
function CompareDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useModalA11y<HTMLDivElement>(open, onClose);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" onClick={onClose} />
      <div className="relative min-h-full flex items-center justify-center p-4 sm:p-8 pointer-events-none">
        <div ref={ref} role="dialog" aria-modal="true" aria-labelledby="cmp-title" tabIndex={-1} className="pointer-events-auto bg-white w-full max-w-[1040px] max-h-[calc(100vh-2rem)] overflow-y-auto shadow-xl">
          <div className="px-6 py-4 border-b border-[#E0E0E0] flex items-center justify-between">
            <h2 id="cmp-title" className="text-lg font-semibold">Session metrics — Before vs After</h2>
            <button type="button" aria-label="Close session metrics" className="p-2 rounded-sm hover:bg-[#F4F4F4]" onClick={onClose}><X className="w-5 h-5" aria-hidden="true" /></button>
          </div>
          <div className="p-6"><CompareBody /></div>
        </div>
      </div>
    </div>
  );
}

function CompareBody() {
  const { metrics, resetRun } = useDemo();
  const rows: [string, (r?: RunMetrics) => string | number, boolean][] = [
    ['Task duration (m:ss)', (r) => (r?.startedAt ? fmtDur((r.completedAt ?? Date.now()) - r.startedAt) : '—'), true],
    ['Screens visited', (r) => r?.navigations ?? '—', true],
    ['Manual interactions (clicks, selections)', (r) => r?.interactions ?? '—', true],
    ['Fields entered', (r) => r?.fieldEdits ?? '—', true],
    ['Validation errors shown', (r) => r?.validationErrors ?? '—', true],
    ['Missing / invalid items at submission', (r) => (r?.gapsAtSubmit ?? '—'), true],
    ['Completed (submitted)', (r) => (r ? (r.completed ? 'Yes' : 'Not yet') : '—'), false],
  ];
  return (
    <div>
      <p className="text-sm text-[#393939]">
        “Missing / invalid items at submission” applies the same fictional readiness rules to both experiences when Submit succeeds; in the original, such gaps would surface later in underwriting.
      </p>
      <p className="text-sm text-[#393939] mt-2">
        These are <b className="font-medium">simulated demo metrics</b> captured from your own interactions with this prototype in this browser session. They are not production data and do not represent PNC results.
      </p>
      <div className="mt-4 grid grid-cols-3 gap-6">
        {SCENARIOS.map((s) => {
          const b = metrics[runKey('before', s.id)];
          const a = metrics[runKey('after', s.id)];
          return (
            <section key={s.id} aria-labelledby={`cmp-${s.id}`} className="border border-[#E0E0E0]">
              <h3 id={`cmp-${s.id}`} className="px-4 py-3 bg-[#F4F4F4] text-sm font-semibold">{s.label}</h3>
              <table className="w-full text-[13px]">
                <thead><tr className="text-left text-[#525252]"><th scope="col" className="px-4 py-2 font-medium">Measure</th><th scope="col" className="py-2 font-medium text-right">Before</th><th scope="col" className="px-4 py-2 font-medium text-right">After</th></tr></thead>
                <tbody>
                  {rows.map(([label, f]) => (
                    <tr key={label} className="border-t border-[#E0E0E0]"><th scope="row" className="px-4 py-2 font-normal text-left">{label}</th><td className="py-2 text-right tabular-nums">{f(b)}</td><td className="px-4 py-2 text-right tabular-nums">{f(a)}</td></tr>
                  ))}
                </tbody>
              </table>
              <div className="px-4 py-2 border-t border-[#E0E0E0] flex gap-3 text-[12px]">
                <button type="button" className="text-[12px] text-[#0066CC] hover:underline" onClick={() => resetRun('before', s.id)}>Reset Before</button>
                <button type="button" className="text-[12px] text-[#0066CC] hover:underline" onClick={() => resetRun('after', s.id)}>Reset After</button>
              </div>
            </section>
          );
        })}
      </div>
      <section className="mt-6 border-l-4 border-[#F5A742] bg-[#FFF8E1] px-4 py-3" aria-labelledby="hist-h">
        <h3 id="hist-h" className="text-sm font-semibold">Historical project outcomes (reported, not measured here)</h3>
        <p className="text-sm mt-1 text-[#393939]">The original redesign reported a <b className="font-medium">55% increase in submission volume</b> and a <b className="font-medium">30% reduction in completion time</b>. They are the business context and KPI targets for this demonstration. Features proposed in the After experience are new design proposals and are not claimed as historically shipped.</p>
      </section>
    </div>
  );
}

/** A true-to-size, non-interactive replica of the prototype's top bar that shows where the Before/After switch lives. */
function ToggleDiagram() {
  return (
    <figure className="mt-4">
      <div aria-hidden="true" className="h-10 bg-[#161616] text-white flex items-center gap-2 sm:gap-3 px-2 sm:px-4 text-[13px] select-none">
        <span className="text-[#C6C6C6] whitespace-nowrap px-1">←<span className="hidden sm:inline"> Preface</span></span>
        <span className="inline-flex items-center gap-1.5 sm:gap-2 h-6 px-1.5 sm:px-2 rounded-sm border border-[#6F6F6F] text-[12px] text-[#C6C6C6] whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-[#F5A742]" /> <span className="hidden md:inline">Portfolio Demo · Fictional Data</span><span className="md:hidden">Fictional</span>
        </span>
        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <span className="hidden sm:inline-flex h-7 items-center gap-2 bg-[#262626] border border-[#525252] rounded-sm px-2 text-white whitespace-nowrap">Single borrower <span className="text-[10px] text-[#C6C6C6]">▾</span></span>
          <span className="flex border border-[#525252] rounded-sm overflow-hidden outline outline-2 outline-offset-[3px] outline-[#78A9FF]">
            <span className="h-7 px-2.5 sm:px-3 inline-flex items-center font-medium bg-white text-[#161616]">Before</span>
            <span className="h-7 px-2.5 sm:px-3 inline-flex items-center font-medium text-[#C6C6C6]">After</span>
          </span>
        </div>
      </div>
      <figcaption className="flex justify-end">
        <span className="relative pt-4 pr-2 sm:pr-4 text-sm text-[#393939] text-right max-w-[420px]">
          <span aria-hidden="true" className="absolute top-0 right-[64px] sm:right-[76px] h-3 w-px bg-[#0066CC]" />
          Switch between Before and After using the controls at the top of the prototype. Your scenario stays open.
        </span>
      </figcaption>
    </figure>
  );
}

/* ------------------------------------ Preface ------------------------------------ */
function Preface() {
  const { setView, setMode, setScenario, requestJump, metrics } = useDemo();
  const [metricsOpen, setMetricsOpen] = useState(false);
  const [startMode, setStartMode] = useState<Mode>('before');
  const [startScenario, setStartScenario] = useState<ScenarioId>('single');
  const hasRuns = Object.values(metrics).some((r) => r.startedAt);
  const enter = () => {
    setScenario(startScenario);
    setMode(startMode);
    requestJump(startMode, HOME);
    setView('app');
  };
  return (
    <div className="h-screen overflow-y-auto bg-[#F4F4F4] text-[#161616]">
      <div className="h-10 bg-[#161616] text-[#C6C6C6] flex items-center px-4 sm:px-6 text-[12px]">
        <span className="inline-flex items-center gap-2 h-6 px-2 rounded-sm border border-[#6F6F6F]"><span className="w-1.5 h-1.5 rounded-full bg-[#F5A742]" aria-hidden="true" /> Portfolio Demo · Fictional Data</span>
        <span className="ml-auto hidden sm:inline">Part 1 of 2 · Preface &amp; Context</span>
      </div>
      <main className="max-w-[1040px] mx-auto px-5 sm:px-8 py-7 sm:py-9">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-x-12 gap-y-5 items-end">
          <header>
            <p className="text-[12px] uppercase tracking-[0.12em] text-[#525252]">PNC · Securities-based lending · UX case study</p>
            <h1 className="mt-2 text-[28px] leading-[36px] sm:text-[36px] sm:leading-[44px] font-light">Redesigning securities-based lending to scale with demand</h1>
            <p className="mt-3 text-[15px] leading-relaxed text-[#393939] max-w-[620px]">As lending demand grew, the console bankers use to originate securities-based credit had to handle more applications without more effort.</p>
          </header>
          <section aria-labelledby="out-h">
            <h2 id="out-h" className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#525252]">Reported outcomes</h2>
            <dl className="mt-1 flex gap-8">
              <div className="flex flex-col-reverse"><dt className="text-sm text-[#393939]">Submission volume</dt><dd className="text-[36px] leading-[44px] font-light tabular-nums">+55%</dd></div>
              <div className="flex flex-col-reverse"><dt className="text-sm text-[#393939]">Completion time</dt><dd className="text-[36px] leading-[44px] font-light tabular-nums">−30%</dd></div>
            </dl>
            <p className="mt-1 text-[12px] text-[#525252]">As reported by the project; not reproduced here.</p>
          </section>
        </div>

        <section aria-labelledby="why-h" className="mt-7">
          <h2 id="why-h" className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#525252]">Why it had to change</h2>
          <ol className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4">
            {[
              ['Scalability', 'Handle more applications without a matching rise in operational effort.'],
              ['Workflow fragmentation', 'Borrower, collateral, evaluation and underwriting details sat in disconnected, dense screens, pulling focus from clients.'],
              ['Submission quality', 'Missing information, manual checks and late exceptions caused errors, rework and delays.'],
            ].map(([t, d], i) => (
              <li key={t} className="border-t-2 border-[#161616] pt-3">
                <h3 className="text-base font-semibold"><span className="tabular-nums text-[#525252] mr-2" aria-hidden="true">0{i + 1}</span>{t}</h3>
                <p className="mt-1 text-sm leading-relaxed text-[#393939]">{d}</p>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-[13px] text-[#525252]">Compounded by legacy patterns, inconsistent components, accessibility gaps and compliance complexity.</p>
        </section>

        <section aria-labelledby="role-h" className="mt-6">
          <h2 id="role-h" className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#525252]">My role</h2>
          <p className="mt-1 text-sm leading-relaxed text-[#393939]"><b className="font-semibold text-[#161616]">Sole UX Designer, three months</b> — turning these operational challenges into an efficient, connected, usable enterprise experience.</p>
        </section>

        <section aria-labelledby="enter-h" className="mt-6 bg-white border border-[#E0E0E0] p-5">
          <h2 id="enter-h" className="text-base font-semibold">Part 2 · Interactive prototype</h2>
          <p className="mt-1 text-sm text-[#393939]"><b className="font-medium text-[#161616]">Before</b> is the original console; <b className="font-medium text-[#161616]">After</b> is my redesign, including new proposals.</p>
          <ToggleDiagram />
          <div className="mt-4 grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4 items-end">
            <fieldset>
              <legend className="text-[12px] font-medium text-[#525252] mb-2">Start in</legend>
              <div className="flex gap-6">
                {(['before', 'after'] as Mode[]).map((m) => (
                  <label key={m} className="inline-flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" name="start-mode" checked={startMode === m} onChange={() => setStartMode(m)} className="w-4 h-4 accent-[#0066CC] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0066CC]" />
                    {m === 'before' ? 'Before (original)' : 'After (redesign)'}
                  </label>
                ))}
              </div>
            </fieldset>
            <div>
              <label htmlFor="start-scenario" className="block text-[12px] font-medium text-[#525252] mb-2">Scenario</label>
              <select id="start-scenario" value={startScenario} onChange={(e) => setStartScenario(e.target.value as ScenarioId)} className="w-full h-10 bg-[#F4F4F4] border-b border-[#8D8D8D] px-3 text-sm focus:outline focus:outline-2 focus:outline-[#0066CC]">
                {SCENARIOS.map((s) => <option key={s.id} value={s.id}>{s.label} — {s.entityName ?? s.primary.name}</option>)}
              </select>
            </div>
            <button type="button" onClick={enter} className="h-10 px-6 bg-[#0066CC] text-white text-sm font-medium rounded-sm hover:bg-[#0052A3] inline-flex items-center justify-center gap-2">
              Enter the prototype <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
          {hasRuns && (
            <p className="mt-3 text-sm">
              <button type="button" onClick={() => setMetricsOpen(true)} className="text-[#0066CC] font-medium hover:underline">View session metrics</button>
            </p>
          )}
        </section>

        <div role="note" aria-label="Disclaimer" className="mt-5 border-l-2 border-[#F5A742] pl-3 text-[12px] leading-[18px] text-[#525252] max-w-[860px]">
          <p>{DISCLAIMER} Security behaviours are simulated.</p>
        </div>
      </main>
      <CompareDialog open={metricsOpen} onClose={() => setMetricsOpen(false)} />
    </div>
  );
}
