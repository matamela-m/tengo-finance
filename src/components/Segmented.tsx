import { useId, type ReactNode } from 'react';

interface Option<T extends string> {
  value: T;
  label: ReactNode;
}

interface SegmentedProps<T extends string> {
  label: string;
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
  variant?: 'pills' | 'track';
  className?: string;
}

/**
 * A row of choices built on native radio buttons, so screen readers announce "1 of 3"
 * and arrow keys move between options, exactly like a standard radio group.
 */
export function Segmented<T extends string>({ label, value, options, onChange, variant = 'track', className = '' }: SegmentedProps<T>) {
  const name = useId();
  return (
    <fieldset className={className}>
      <legend className="sr-only">{label}</legend>
      <div className={variant === 'track' ? 'inline-flex flex-wrap rounded-full border border-line bg-surface-2 p-1' : 'flex flex-wrap gap-2'}>
        {options.map((o) => {
          const active = o.value === value;
          const look =
            variant === 'track'
              ? active
                ? 'bg-surface-3 text-ink'
                : 'text-muted hover:text-ink'
              : active
                ? 'border border-ink bg-ink text-bg'
                : 'border border-line bg-transparent text-muted hover:border-line-strong hover:text-ink';
          return (
            <label
              key={o.value}
              className={`relative flex min-h-[40px] cursor-pointer items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-colors focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--color-focus)] ${look}`}
            >
              <input type="radio" name={name} value={o.value} checked={active} onChange={() => onChange(o.value)} className="sr-only" />
              {o.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
