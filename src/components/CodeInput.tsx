import { useContext } from 'react';
import { OTPInput, OTPInputContext, REGEXP_ONLY_DIGITS } from 'input-otp';

// One-time code in separate boxes, after shadcn/ui Input OTP (MIT), built on input-otp by Guilherme Rodz (MIT).
// A single real input sits over the boxes, so paste, the phone's code suggestion (autocomplete
// "one-time-code") and password managers all work, and screen readers hear one labelled field.

interface CodeInputProps {
  id: string;
  length: number;
  value: string;
  onChange: (value: string) => void;
  /** Called once every box is filled, to submit without another tap. */
  onComplete?: (value: string) => void;
  disabled?: boolean;
  describedBy?: string;
}

export function CodeInput({ id, length, value, onChange, onComplete, disabled, describedBy }: CodeInputProps) {
  return (
    <OTPInput
      id={id}
      maxLength={length}
      value={value}
      onChange={onChange}
      onComplete={onComplete}
      disabled={disabled}
      pattern={REGEXP_ONLY_DIGITS}
      inputMode="numeric"
      autoComplete="one-time-code"
      aria-describedby={describedBy}
      // 16px so iOS does not zoom when the field takes focus.
      className="text-base disabled:cursor-not-allowed"
      containerClassName="flex items-center has-[:disabled]:opacity-60"
    >
      <div className="flex gap-2">
        {Array.from({ length }, (_, i) => (
          <Slot key={i} index={i} />
        ))}
      </div>
    </OTPInput>
  );
}

function Slot({ index }: { index: number }) {
  const { slots } = useContext(OTPInputContext);
  const slot = slots[index];
  const active = slot?.isActive ?? false;
  return (
    <div
      aria-hidden
      className={`num relative flex h-12 w-11 items-center justify-center rounded-xl border bg-surface font-heading text-xl font-semibold text-ink transition-colors sm:h-14 sm:w-12 ${
        active ? 'z-10 border-accent ring-2 ring-[var(--color-focus)] ring-offset-2 ring-offset-bg' : 'border-[var(--color-field-border)]'
      }`}
    >
      {slot?.char}
      {slot?.hasFakeCaret && (
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="code-caret h-6 w-px bg-ink" />
        </span>
      )}
    </div>
  );
}
