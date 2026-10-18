import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from './Icon';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

/** Side drawer on wide screens, bottom sheet on small ones. Traps focus and closes on Escape. */
export function Drawer({ open, onClose, title, children, footer }: DrawerProps) {
  const { t } = useTranslation();
  const panel = useRef<HTMLDivElement>(null);
  const returnTo = useRef<Element | null>(null);

  useEffect(() => {
    if (!open) return;
    returnTo.current = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const root = document.getElementById('root');
    root?.setAttribute('inert', '');
    root?.setAttribute('aria-hidden', 'true');
    panel.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab' && panel.current) {
        const items = [...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
        if (items.length === 0) return;
        const first = items[0]!;
        const last = items[items.length - 1]!;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      root?.removeAttribute('inert');
      root?.removeAttribute('aria-hidden');
      (returnTo.current as HTMLElement | null)?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-stretch md:justify-end">
      <div className="absolute inset-0 animate-fade bg-scrim backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        className="relative flex max-h-[92dvh] w-full animate-slide-up flex-col rounded-t-3xl bg-surface shadow-lift md:h-full md:max-h-none md:w-[480px] md:animate-slide-in md:rounded-none md:rounded-l-3xl"
      >
        <div className="flex items-center justify-between gap-4 border-b border-line px-6 py-4">
          <h2 id="drawer-title" className="font-heading text-2xl font-extrabold">
            {title}
          </h2>
          <button type="button" onClick={onClose} data-autofocus className="inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-surface-2" aria-label={t('common.close')}>
            <Icon name="x" />
          </button>
        </div>
        <div tabIndex={0} role="region" aria-labelledby="drawer-title" className="flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>
        {footer && <div className="border-t border-line px-6 py-4">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
