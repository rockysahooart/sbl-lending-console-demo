import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Mode, ScenarioId } from './data';
import { HOME, stageOfLoc, type Loc } from './sync';

/**
 * Canonical workflow stages shared by both experiences, so the Before/After
 * toggle can land on the equivalent place in the other product.
 */
export type Stage =
  | 'dashboard'
  | 'evaluation'
  | 'acknowledgment'
  | 'customer'
  | 'parties'
  | 'loan'
  | 'collateral'
  | 'review'
  | 'submitted'
  | 'servicing';

export const STAGE_LABEL: Record<Stage, string> = {
  dashboard: 'Dashboard',
  evaluation: 'Collateral evaluation',
  acknowledgment: 'Acknowledgment',
  customer: 'Customer information',
  parties: 'Co-borrowers & owners',
  loan: 'Loan information',
  collateral: 'Collateral',
  review: 'Review & submit',
  submitted: 'Submitted',
  servicing: 'Post-underwriting',
};

export interface RunMetrics {
  startedAt?: number;
  completedAt?: number;
  navigations: number;
  interactions: number;
  fieldEdits: number;
  validationErrors: number;
  /** Required items missing or invalid when the request was submitted (rework risk). */
  gapsAtSubmit?: number;
  completed: boolean;
}

const emptyRun = (): RunMetrics => ({ navigations: 0, interactions: 0, fieldEdits: 0, validationErrors: 0, completed: false });

type View = 'intro' | 'app' | 'compare';

interface DemoValue {
  view: View;
  setView: (v: View) => void;
  mode: Mode;
  setMode: (m: Mode) => void;
  scenario: ScenarioId;
  setScenario: (s: ScenarioId) => void;
  /** Follow the scenario the user opened inside an experience (no stage reset). */
  adoptScenario: (s: ScenarioId) => void;
  /** Current canonical stage of each experience. */
  stage: Record<Mode, Stage>;
  /** Experiences report where they are; counts navigations. */
  reportStage: (mode: Mode, stage: Stage) => void;
  /** Where each experience is: screen, application, tab, expanded row, step. */
  loc: Record<Mode, Loc>;
  /** Experiences report their full location after every navigation. */
  reportLocation: (mode: Mode, loc: Loc) => void;
  /** Bumped when the shell asks an experience to jump to `loc[mode]`. */
  jumpToken: number;
  requestJump: (mode: Mode, loc: Loc) => void;
  /** Where an experience actually landed after its last jump (first location it reported). */
  landedAt: (mode: Mode) => Loc | null;
  metrics: Record<string, RunMetrics>;
  track: (kind: 'interaction' | 'field' | 'error', mode?: Mode, count?: number) => void;
  resetRun: (mode: Mode, scenario: ScenarioId) => void;
  recordGaps: (mode: Mode, gaps: number) => void;
}

const DemoCtx = createContext<DemoValue | null>(null);
export const runKey = (m: Mode, s: ScenarioId) => `${m}:${s}`;

export function DemoProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<View>('intro');
  const [mode, setModeState] = useState<Mode>('before');
  const [scenario, setScenarioState] = useState<ScenarioId>('single');
  const [stage, setStage] = useState<Record<Mode, Stage>>({ before: 'dashboard', after: 'dashboard' });
  const [jumpToken, setJumpToken] = useState(0);
  const [loc, setLoc] = useState<Record<Mode, Loc>>({ before: HOME, after: HOME });
  const locRef = useRef(loc);
  const setLocBoth = (next: Record<Mode, Loc>) => { locRef.current = next; setLoc(next); };
  const [metrics, setMetrics] = useState<Record<string, RunMetrics>>({});
  const live = useRef({ mode, scenario });
  live.current = { mode, scenario };

  const bump = useCallback((m: Mode, s: ScenarioId, fn: (r: RunMetrics) => RunMetrics) => {
    setMetrics((prev) => {
      const k = runKey(m, s);
      const cur = prev[k] ?? emptyRun();
      if (cur.completed) return prev; // a finished run is frozen until reset
      return { ...prev, [k]: fn(cur) };
    });
  }, []);

  const start = (r: RunMetrics) => (r.startedAt ? r : { ...r, startedAt: Date.now() });

  const stageRef = useRef(stage);
  const setStageBoth = (next: Record<Mode, Stage>) => {
    stageRef.current = next;
    setStage(next);
  };

  const reportStage = useCallback(
    (m: Mode, st: Stage) => {
      if (stageRef.current[m] === st) return;
      setStageBoth({ ...stageRef.current, [m]: st });
      if (m !== live.current.mode) return;
      bump(m, live.current.scenario, (r) => {
        const next = { ...start(r), navigations: r.navigations + 1 };
        return st === 'submitted' ? { ...next, completed: true, completedAt: Date.now() } : next;
      });
    },
    [bump],
  );

  const track = useCallback(
    (kind: 'interaction' | 'field' | 'error', m?: Mode, count = 1) => {
      const mm = m ?? live.current.mode;
      bump(mm, live.current.scenario, (r) => {
        const n = start(r);
        if (kind === 'interaction') return { ...n, interactions: r.interactions + count };
        if (kind === 'field') return { ...n, fieldEdits: r.fieldEdits + count };
        return { ...n, validationErrors: r.validationErrors + count };
      });
    },
    [bump],
  );

  const recordGaps = useCallback((m: Mode, gaps: number) => {
    bump(m, live.current.scenario, (r) => ({ ...r, gapsAtSubmit: gaps }));
  }, [bump]);

  const resetRun = useCallback((m: Mode, s: ScenarioId) => {
    setMetrics((prev) => ({ ...prev, [runKey(m, s)]: emptyRun() }));
  }, []);

  const landing = useRef<Record<Mode, boolean>>({ before: false, after: false });
  const landed = useRef<Record<Mode, Loc | null>>({ before: null, after: null });
  const landedAt = useCallback((m: Mode) => landed.current[m], []);
  const reportLocation = useCallback((m: Mode, l: Loc) => {
    if (landing.current[m]) { landing.current[m] = false; landed.current[m] = l; }
    const cur = locRef.current[m];
    if (JSON.stringify(cur) !== JSON.stringify(l)) setLocBoth({ ...locRef.current, [m]: l });
    reportStage(m, stageOfLoc(l));
  }, [reportStage]);

  const requestJump = useCallback((m: Mode, l: Loc) => {
    landing.current[m] = true;
    landed.current[m] = l;
    setLocBoth({ ...locRef.current, [m]: l });
    setStageBoth({ ...stageRef.current, [m]: stageOfLoc(l) });
    setJumpToken((t) => t + 1);
  }, []);

  const setMode = useCallback((m: Mode) => setModeState(m), []);
  const setScenario = useCallback((s: ScenarioId) => {
    setScenarioState(s);
    setStageBoth({ before: 'dashboard', after: 'dashboard' });
    setLocBoth({ before: HOME, after: HOME });
    setJumpToken((t) => t + 1);
  }, []);

  const adoptScenario = useCallback((s: ScenarioId) => setScenarioState(s), []);

  const value = useMemo(
    () => ({ view, setView, mode, setMode, scenario, setScenario, adoptScenario, stage, reportStage, loc, reportLocation, jumpToken, requestJump, landedAt, metrics, track, resetRun, recordGaps }),
    [view, mode, setMode, scenario, setScenario, adoptScenario, stage, reportStage, loc, reportLocation, jumpToken, requestJump, landedAt, metrics, track, resetRun, recordGaps],
  );
  return <DemoCtx.Provider value={value}>{children}</DemoCtx.Provider>;
}

export function useDemo() {
  const ctx = useContext(DemoCtx);
  if (!ctx) throw new Error('useDemo must be used inside DemoProvider');
  return ctx;
}

/** Safe variant for baseline components that can also run outside the demo. */
export function useDemoOptional() {
  return useContext(DemoCtx);
}
