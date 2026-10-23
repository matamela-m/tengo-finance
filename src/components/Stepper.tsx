import { Icon } from './Icon';

interface StepperProps {
  /** Accessible name of the list, such as "Setup steps". */
  label: string;
  steps: string[];
  /** 1-based. */
  current: number;
  /** Words read after a step's name, for screen readers. */
  doneLabel: string;
  currentLabel: string;
  /** Lets a finished step be revisited. Upcoming steps are never links. */
  onGo?: (step: number) => void;
}

/**
 * Numbered steps with their names. Finished steps show a tick and can be revisited; the current step carries
 * aria-current. On phones only the numbers show, with the current step's name beside them.
 */
export function Stepper({ label, steps, current, doneLabel, currentLabel, onGo }: StepperProps) {
  return (
    <nav aria-label={label}>
      <ol className="flex items-center gap-2 sm:gap-3">
        {steps.map((name, i) => {
          const n = i + 1;
          const done = n < current;
          const now = n === current;
          const dot = (
            <span
              className={`num flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold ${
                now ? 'border-accent bg-accent text-on-accent' : done ? 'border-accent bg-accent-soft text-ink' : 'border-line bg-surface text-muted'
              }`}
              aria-hidden
            >
              {done ? <Icon name="check" size={16} /> : n}
            </span>
          );
          const text = (
            <>
              <span className={`text-sm ${now ? 'font-semibold text-ink' : 'text-muted'} ${now ? '' : 'sr-only sm:not-sr-only'}`}>{name}</span>
              <span className="sr-only">, {done ? doneLabel : now ? currentLabel : ''}</span>
            </>
          );
          return (
            <li key={name} className="flex min-w-0 items-center gap-2 sm:gap-3" aria-current={now ? 'step' : undefined}>
              {done && onGo ? (
                <button type="button" className="flex min-h-[44px] items-center gap-2 rounded-full pr-2 hover:text-ink" onClick={() => onGo(n)}>
                  {dot}
                  {text}
                </button>
              ) : (
                <span className="flex min-h-[44px] items-center gap-2">
                  {dot}
                  {text}
                </span>
              )}
              {n < steps.length && <span aria-hidden className={`h-px w-4 shrink-0 sm:w-8 ${done ? 'bg-accent' : 'bg-line'}`} />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
