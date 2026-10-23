import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '../Icon';

// The calendar (react-day-picker, about 20 KB) loads only the first time someone opens it.
const CalendarPopover = lazy(() => import('./CalendarPopover'));

interface DateFieldProps {
  id: string;
  /** ISO date, yyyy-mm-dd. */
  value: string;
  onChange: (iso: string) => void;
  min?: string;
  describedBy?: string;
  invalid?: boolean;
}

/**
 * A native date input, which stays the way to type a date and the picker on phones, plus a calendar button for
 * mouse and trackpad users. The button only shows where the pointer is fine, so phones keep their own picker.
 */
export function DateField({ id, value, onChange, min, describedBy, invalid }: DateFieldProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const outside = (e: PointerEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open]);

  const close = (refocus: boolean) => {
    setOpen(false);
    if (refocus) button.current?.focus();
  };

  return (
    <div ref={wrap} className="relative">
      <input
        id={id}
        type="date"
        min={min}
        // On a fine pointer our calendar button replaces the browser's own icon, inside the field.
        className="field num date-field [@media(pointer:fine)]:pr-12"
        value={value}
        aria-describedby={describedBy}
        aria-invalid={invalid || undefined}
        onChange={(e) => onChange(e.target.value)}
      />
      <button
        ref={button}
        type="button"
        className="absolute right-0 top-0 hidden h-11 w-11 items-center justify-center rounded-xl text-muted hover:text-ink [@media(pointer:fine)]:inline-flex"
        aria-label={t('calendar.open')}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <Icon name="calendar" size={18} />
      </button>
      {open && (
        <Suspense fallback={null}>
          <CalendarPopover
            value={value}
            min={min}
            onPick={(iso) => {
              onChange(iso);
              close(true);
            }}
            onClose={() => close(true)}
          />
        </Suspense>
      )}
    </div>
  );
}
