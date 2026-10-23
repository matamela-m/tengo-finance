import { useId, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from './ui';

interface ToggleProps {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description?: ReactNode;
  disabled?: boolean;
  badge?: string;
}

/** A labelled switch. Uses a checkbox with role="switch" so it reads as on or off. */
export function Toggle({ checked, onChange, label, description, disabled, badge }: ToggleProps) {
  const id = useId();
  const { t } = useTranslation();
  return (
    <div className="flex items-start justify-between gap-4 py-4">
      <div className="min-w-0">
        <label htmlFor={id} className="flex flex-wrap items-center gap-2 font-semibold">
          {label}
          {badge && <Badge>{badge}</Badge>}
          <span aria-hidden>
            <Badge dot tone={checked ? 'enough' : 'neutral'}>{checked ? t('common.on') : t('common.off')}</Badge>
          </span>
        </label>
        {description && (
          <p id={`${id}-desc`} className="mt-1 text-sm text-muted">
            {description}
          </p>
        )}
      </div>
      <span className="relative inline-flex h-11 shrink-0 items-center">
        <input
          id={id}
          type="checkbox"
          role="switch"
          checked={checked}
          disabled={disabled}
          aria-describedby={description ? `${id}-desc` : undefined}
          onChange={(e) => onChange(e.target.checked)}
          className="peer absolute inset-0 h-full w-full cursor-pointer appearance-none rounded-full disabled:cursor-not-allowed"
        />
        <span
          aria-hidden
          className={`pointer-events-none flex h-6 w-11 items-center rounded-full border p-0.5 transition-colors duration-150 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--color-focus)] ${
            checked ? 'border-accent bg-accent' : 'border-[var(--color-field-border)] bg-surface-2'
          } ${disabled ? 'opacity-60' : ''}`}
        >
          <span className={`h-[18px] w-[18px] rounded-full shadow-sm transition-transform duration-150 ${checked ? 'translate-x-5 bg-on-accent' : 'bg-muted'}`} />
        </span>
      </span>
    </div>
  );
}
