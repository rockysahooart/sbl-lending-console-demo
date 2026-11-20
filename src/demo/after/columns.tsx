import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Checkbox, DismissibleTag, TableHeader } from '@carbon/react';
import { ArrowDown, ArrowRight, ArrowUp, ArrowsVertical, Filter, FilterRemove, WarningAltFilled } from '@carbon/icons-react';
import { fmtMoney } from '../data';
import { cx } from './ui';

/**
 * Per-column filtering and sorting (Carbon DataTable patterns): every header sorts; each column has a
 * filter suited to its data — text contains, categorical multi-select, numeric range, date range.
 * Filters combine (AND) with each other and with the queue toolbar; active filters show as dismissible tags.
 */
export type ColType = 'text' | 'enum' | 'number' | 'date';
export interface Col<T> { key: string; label: string; type: ColType; get: (r: T) => string | number; num?: boolean; money?: boolean; noSort?: boolean }
type F = { text?: string; values?: string[]; min?: string; max?: string };

export const toTime = (v: string | number) => {
  if (typeof v === 'number') return v;
  const m = String(v).match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) return new Date(+m[3], +m[1] - 1, +m[2]).getTime();
  const iso = String(v).match(/(\d{4})-(\d{2})-(\d{2})/);
  return iso ? new Date(+iso[1], +iso[2] - 1, +iso[3]).getTime() : NaN;
};

function pass<T>(c: Col<T>, f: F, r: T) {
  const v = c.get(r);
  if (c.type === 'text') return !f.text || String(v).toLowerCase().includes(f.text.trim().toLowerCase());
  if (c.type === 'enum') return !f.values?.length || f.values.includes(String(v));
  const n = c.type === 'date' ? toTime(v) : Number(v);
  const lo = f.min ? (c.type === 'date' ? toTime(f.min) : Number(f.min)) : -Infinity;
  const hi = f.max ? (c.type === 'date' ? toTime(f.max) : Number(f.max)) : Infinity;
  return n >= lo && n <= hi;
}
const isActive = (f?: F) => !!f && (!!f.text?.trim() || !!f.values?.length || !!f.min || !!f.max);

export function useColumns<T>(rows: T[], cols: Col<T>[], onChange?: () => void) {
  const [filters, setFilters] = useState<Record<string, F>>({});
  const [sort, setSort] = useState<{ key: string; dir: 'ASC' | 'DESC' } | null>(null);
  const out = useMemo(() => {
    let r = rows.filter((row) => cols.every((c) => !isActive(filters[c.key]) || pass(c, filters[c.key], row)));
    if (sort) {
      const c = cols.find((x) => x.key === sort.key)!;
      const val = (x: T) => (c.type === 'date' ? toTime(c.get(x)) : c.get(x));
      r = [...r].sort((a, b) => { const A = val(a), B = val(b); const d = typeof A === 'number' && typeof B === 'number' ? A - B : String(A).localeCompare(String(B)); return sort.dir === 'ASC' ? d : -d; });
    }
    return r;
  }, [rows, cols, filters, sort]);
  const set = (key: string, f: F) => { setFilters((p) => ({ ...p, [key]: f })); onChange?.(); };
  const clear = (key: string) => { setFilters((p) => { const n = { ...p }; delete n[key]; return n; }); onChange?.(); };
  const clearAll = () => { setFilters({}); onChange?.(); };
  const toggleSort = (key: string) => { setSort((s) => (!s || s.key !== key ? { key, dir: 'ASC' } : s.dir === 'ASC' ? { key, dir: 'DESC' } : null)); onChange?.(); };
  const active = cols.filter((c) => isActive(filters[c.key])).map((c) => ({ key: c.key, text: `${c.label}: ${describe(c, filters[c.key])}` }));
  return { rows: out, filters, set, clear, clearAll, sort, toggleSort, active, cols, options: (c: Col<T>) => [...new Set(rows.map((r) => String(c.get(r))))].sort() };
}
export type ColState<T> = ReturnType<typeof useColumns<T>>;

function describe<T>(c: Col<T>, f: F) {
  if (c.type === 'text') return `contains “${f.text}”`;
  if (c.type === 'enum') return f.values!.join(', ');
  const fmt = (v: string) => (c.type === 'date' ? new Date(toTime(v)).toLocaleDateString('en-US') : c.money ? fmtMoney(Number(v)) : v);
  if (f.min && f.max) return `${fmt(f.min)} – ${fmt(f.max)}`;
  return f.min ? `≥ ${fmt(f.min)}` : `≤ ${fmt(f.max!)}`;
}

/** A sortable column header with its own filter. */
export function ColHeader<T>({ st, k, className }: { st: ColState<T>; k: string; className?: string }) {
  const c = st.cols.find((x) => x.key === k)!;
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<F>({});
  const ref = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  // Closing from inside the popover (Escape, Apply, Clear) returns focus to the filter button.
  const close = () => { setOpen(false); setTimeout(() => btn.current?.focus(), 0); };
  const on = isActive(st.filters[k]);
  const dir = st.sort?.key === k ? st.sort.dir : null;
  useEffect(() => {
    if (!open) return;
    setDraft(st.filters[k] ?? {});
    const close = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const apply = () => { st.set(k, draft); close(); };
  const id = `cf-${k}`;
  return (
    <TableHeader className={className} aria-sort={c.noSort ? undefined : dir === 'ASC' ? 'ascending' : dir === 'DESC' ? 'descending' : 'none'}>
      <div ref={ref} className={cx('relative inline-flex items-center', c.num && 'justify-end w-full')}>
        {c.noSort ? <span className="col-sort inline-flex items-center font-semibold">{c.label}</span> : <button type="button" className="col-sort inline-flex items-center gap-1 font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--cds-focus)]" onClick={() => st.toggleSort(k)} aria-label={`${c.label}: sort ${dir === 'ASC' ? 'descending' : dir === 'DESC' ? 'off' : 'ascending'}`}>
          {c.label}
          {dir === 'ASC' ? <ArrowUp size={16} aria-hidden="true" /> : dir === 'DESC' ? <ArrowDown size={16} aria-hidden="true" /> : <ArrowsVertical size={16} aria-hidden="true" className="opacity-50" />}
        </button>}
        <button ref={btn} type="button" className={cx('col-filter-btn', on && 'is-on')} aria-expanded={open} aria-controls={id} aria-label={`Filter ${c.label}${on ? ' (active)' : ''}`} onClick={() => setOpen(!open)}>
          <Filter size={16} aria-hidden="true" />
        </button>
        {open && (
          <div id={id} role="dialog" aria-label={`Filter ${c.label}`} className={cx('col-filter-pop', c.num && '!left-auto !right-0')} onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); close(); } if (e.key === 'Enter' && c.type !== 'enum') apply(); }}>
            {c.type === 'text' && (
              <label className="t-label-01 block">Contains
                <input type="text" autoFocus className="mt-1" value={draft.text ?? ''} onChange={(e) => setDraft({ text: e.target.value })} />
              </label>
            )}
            {c.type === 'enum' && (
              <fieldset><legend className="t-label-01 mb-1">Show</legend>
                {st.options(c).map((o) => (
                  <Checkbox key={o} id={`${id}-${o}`} labelText={o} checked={!!draft.values?.includes(o)} onChange={(_: unknown, { checked }: { checked: boolean }) => setDraft((d) => ({ values: checked ? [...(d.values ?? []), o] : (d.values ?? []).filter((x) => x !== o) }))} />
                ))}
              </fieldset>
            )}
            {(c.type === 'number' || c.type === 'date') && (
              <div className="row">
                <label className="t-label-01 flex-1">{c.type === 'date' ? 'From' : 'Min'}<input type={c.type} autoFocus className="mt-1" value={draft.min ?? ''} onChange={(e) => setDraft((d) => ({ ...d, min: e.target.value }))} /></label>
                <label className="t-label-01 flex-1">{c.type === 'date' ? 'To' : 'Max'}<input type={c.type} className="mt-1" value={draft.max ?? ''} onChange={(e) => setDraft((d) => ({ ...d, max: e.target.value }))} /></label>
              </div>
            )}
            <div className="flex justify-end gap-2 mt-3">
              <Button kind="ghost" size="sm" onClick={() => { st.clear(k); close(); }}>Clear</Button>
              <Button kind="primary" size="sm" onClick={apply}>Apply</Button>
            </div>
          </div>
        )}
      </div>
    </TableHeader>
  );
}

/** Active column filters as dismissible tags, with a global reset. */
export function ActiveFilters<T>({ st, count, total, noun }: { st: ColState<T>; count: number; total: number; noun: string }) {
  if (!st.active.length) return null;
  return (
    <div className="active-filters" role="region" aria-label="Active column filters">
      <span className="t-label-01 text-[var(--cds-text-secondary)]" aria-live="polite">{count} of {total} {noun}</span>
      {st.active.map((a) => (
        <DismissibleTag key={a.key} type="blue" size="sm" text={a.text} title={`Remove filter ${a.text}`} onClose={() => st.clear(a.key)} />
      ))}
      <Button kind="ghost" size="sm" renderIcon={FilterRemove} onClick={st.clearAll}>Clear all column filters</Button>
    </div>
  );
}

/**
 * Actions column hierarchy, by intent and urgency:
 *   ready to submit → primary · corrective (Action Required) → tertiary + warning icon ·
 *   your next step (Not Started / In Progress) → tertiary · waiting or read-only → ghost "View".
 */
export function ActionCell({ status, label, id, onClick, ariaLabel, pressed }: { status: string; label: string; id: string; onClick: () => void; ariaLabel?: string; pressed?: boolean }) {
  // A "View …" label means the next step is someone else's (waiting) or read-only, whatever the status.
  const waiting = /^View\b/.test(label);
  const kind = waiting ? 'ghost' : status === 'Ready to Submit' ? 'primary' : status === 'Action Required' || status === 'Not Started' || status === 'In Progress' ? 'tertiary' : 'ghost';
  const icon = status === 'Action Required' ? WarningAltFilled : kind === 'ghost' ? undefined : ArrowRight;
  const text = kind === 'ghost' && /^View\b/.test(label) ? 'View' : label;
  return (
    <Button kind={kind} size="sm" renderIcon={icon} iconDescription="" onClick={onClick} aria-pressed={pressed} aria-label={ariaLabel ?? `${label} ${id}`} className="whitespace-nowrap">{text}</Button>
  );
}
