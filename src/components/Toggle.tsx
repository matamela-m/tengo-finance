import { useId, type ReactNode } from 'react';

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
  return (
    <div className="flex items-start justify-between gap-4 py-4">
      <div className="min-w-0">
        <label htmlFor={id} className="flex flex-wrap items-center gap-2 font-semibold">
          {label}
          {badge && <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs font-semibold text-muted">{badge}</span>}
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
          className={`pointer-events-none flex h-7 w-12 items-center rounded-full p-1 transition-colors peer-focus-visible:outline peer-focus-visible:outline-[3px] peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--color-focus)] ${
            checked ? 'bg-accent' : 'bg-line'
          } ${disabled ? 'opacity-60' : ''}`}
        >
          <span className={`h-5 w-5 rounded-full bg-surface shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
        </span>
      </span>
    </div>
  );
}
