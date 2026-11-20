import { useId, type ReactNode } from 'react';
import {
  Button,
  Checkbox,
  RadioButton,
  RadioButtonGroup,
  Select as CSelect,
  SelectItem,
  Tag as CTag,
  TextInput as CTextInput,
} from '@carbon/react';
import { CheckmarkFilled, ErrorFilled, InformationFilled, WarningAltFilled, Pending, CircleDash } from '@carbon/icons-react';

/*
 * AFTER primitives built on IBM Carbon (v11) components.
 * Content rules (see docs/content-standards.md): sentence case labels,
 * optional fields marked “(optional)”, actionable error text, and the
 * financial terms defined in the glossary.
 */

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

type BtnKind = 'primary' | 'secondary' | 'tertiary' | 'ghost' | 'danger' | 'danger--tertiary';
export function Btn({ kind = 'tertiary', size = 'md', children, ...p }: { kind?: BtnKind; size?: 'sm' | 'md' | 'lg'; children: ReactNode } & Record<string, unknown>) {
  return (
    <Button kind={kind} size={size} {...p}>
      {children}
    </Button>
  );
}

export function TextField({ label, value, onChange, helper, invalidText, optional, id, ...rest }: { label: string; value: string; onChange: (v: string) => void; helper?: string; invalidText?: string; optional?: boolean; id?: string } & Record<string, unknown>) {
  const auto = useId();
  return (
    <CTextInput
      id={id ?? auto}
      labelText={optional ? `${label} (optional)` : label}
      value={value}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
      helperText={helper}
      invalid={!!invalidText}
      invalidText={invalidText}
      {...rest}
    />
  );
}

export function SelectField({ label, options, value, onChange, helper, invalidText, optional, placeholder = 'Choose an option', id }: { label: string; options: string[]; value: string; onChange: (v: string) => void; helper?: string; invalidText?: string; optional?: boolean; placeholder?: string; id?: string }) {
  const auto = useId();
  return (
    <CSelect id={id ?? auto} labelText={optional ? `${label} (optional)` : label} value={value} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)} helperText={helper} invalid={!!invalidText} invalidText={invalidText}>
      <SelectItem value="" text={placeholder} />
      {options.map((o) => (
        <SelectItem key={o} value={o} text={o} />
      ))}
    </CSelect>
  );
}

export function RadioGroup({ legend, name, options, value, onChange, orientation = 'horizontal', helper }: { legend: string; name: string; options: { value: string; label: string }[]; value: string; onChange: (v: string) => void; orientation?: 'horizontal' | 'vertical'; helper?: string }) {
  return (
    <RadioButtonGroup legendText={legend} name={name} valueSelected={value || undefined} onChange={(v: unknown) => onChange(String(v))} orientation={orientation} helperText={helper}>
      {options.map((o) => (
        <RadioButton key={o.value} id={`${name}-${o.value}`} labelText={o.label} value={o.value} />
      ))}
    </RadioButtonGroup>
  );
}

export function Check({ id, label, checked, onChange }: { id: string; label: ReactNode; checked: boolean; onChange: (b: boolean) => void }) {
  return <Checkbox id={id} labelText={label as string} checked={checked} onChange={(_: unknown, { checked: c }: { checked: boolean }) => onChange(c)} />;
}

export type Tone = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'review' | 'pending';
const TAG: Record<Tone, { type: string; Icon: typeof CheckmarkFilled }> = {
  success: { type: 'green', Icon: CheckmarkFilled },
  warning: { type: 'warm-gray', Icon: WarningAltFilled },
  error: { type: 'red', Icon: ErrorFilled },
  info: { type: 'blue', Icon: InformationFilled },
  neutral: { type: 'gray', Icon: CircleDash },
  review: { type: 'purple', Icon: Pending },
  pending: { type: 'cool-gray', Icon: Pending },
};

/** Carbon tag with an icon, so status never relies on colour alone. */
export function Tag({ tone, children }: { tone: Tone; children: ReactNode }) {
  const t = TAG[tone];
  return (
    <CTag type={t.type as never} size="md" renderIcon={t.Icon} className="!m-0">
      {children}
    </CTag>
  );
}

export function Money({ value, className }: { value: number; className?: string }) {
  return <span className={cx('tabular-nums', className)}>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Math.round(value))}</span>;
}

export function KV({ label, value, mono }: { label: string; value: ReactNode; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="t-label-01 text-[var(--cds-text-secondary)]">{label}</dt>
      <dd className={cx('t-body-01 mt-1 break-words', mono && 'tabular-nums')}>{value}</dd>
    </div>
  );
}

/** A section within the white content layer: heading + body, separated by a 1px rule. */
export function Panel({ title, children, right, id, description }: { title: string; children: ReactNode; right?: ReactNode; id?: string; description?: ReactNode }) {
  return (
    <section aria-labelledby={id} className="px-6 py-6 border-b border-[var(--cds-border-subtle-01)] last:border-0">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div>
          <h3 id={id} className="t-heading-03">{title}</h3>
          {description && <p className="t-body-01 text-[var(--cds-text-secondary)] mt-1 max-w-3xl">{description}</p>}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

export function PageHeader({ title, description, eyebrow, right }: { title: string; description?: ReactNode; eyebrow?: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-6 mb-6">
      <div>
        {eyebrow && <p className="t-label-01 text-[var(--cds-text-secondary)]">{eyebrow}</p>}
        <h1 className="t-heading-05 mt-1">{title}</h1>
        {description && <p className="t-body-01 text-[var(--cds-text-secondary)] mt-2 max-w-4xl">{description}</p>}
      </div>
      {right}
    </div>
  );
}
