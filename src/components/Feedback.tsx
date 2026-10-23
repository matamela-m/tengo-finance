import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon, type IconName } from './Icon';
import { IconTile } from './ui';

/** Shown where a list or section has nothing yet. Compact is for empty parts of a card, not a whole page. */
export function EmptyState({ icon = 'info', title, body, action, compact }: { icon?: IconName; title: string; body?: ReactNode; action?: ReactNode; compact?: boolean }) {
  if (compact) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-dashed border-line-strong px-4 py-4">
        <Icon name={icon} size={18} className="shrink-0 text-muted" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink">{title}</p>
          {body && <p className="text-sm text-muted">{body}</p>}
        </div>
        {action && <div className="ml-auto shrink-0">{action}</div>}
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-line-strong px-6 py-12 text-center">
      <IconTile name={icon} />
      <p className="font-heading text-h3 text-ink">{title}</p>
      {body && <p className="max-w-sm text-sm text-muted">{body}</p>}
      {action}
    </div>
  );
}

export function LoadingBlock({ lines = 3, label }: { lines?: number; label?: string }) {
  const { t } = useTranslation();
  return (
    <div role="status" aria-live="polite" className="space-y-3">
      <span className="sr-only">{label ?? t('common.loading')}</span>
      {Array.from({ length: lines }, (_, i) => (
        <div key={i} className="skeleton h-4" style={{ width: `${90 - i * 15}%` }} />
      ))}
    </div>
  );
}

export function PageLoading() {
  const { t } = useTranslation();
  return (
    <div role="status" aria-live="polite" className="space-y-5">
      <span className="sr-only">{t('common.loading')}</span>
      <div className="skeleton h-[120px] rounded-2xl" />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="skeleton h-[320px] rounded-2xl" />
        <div className="space-y-5">
          <div className="skeleton h-[150px] rounded-2xl" />
          <div className="skeleton h-[150px] rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

const NOTICE = {
  info: { box: 'bg-surface-2 text-ink', icon: 'text-muted', fallback: 'info' as IconName },
  warn: { box: 'bg-tight-soft text-ink', icon: 'text-tight', fallback: 'alert' as IconName },
  danger: { box: 'bg-danger/10 text-ink', icon: 'text-danger-text', fallback: 'shortCircle' as IconName },
  ok: { box: 'bg-enough-soft text-ink', icon: 'text-enough', fallback: 'checkCircle' as IconName },
};

/** An inline message. The icon carries the tone in colour; the text stays full contrast. */
export function Notice({ tone = 'info', icon, children, className = '' }: { tone?: keyof typeof NOTICE; icon?: IconName; children: ReactNode; className?: string }) {
  const s = NOTICE[tone];
  return (
    <div className={`flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm ${s.box} ${className}`}>
      <Icon name={icon ?? s.fallback} size={17} className={`mt-px shrink-0 ${s.icon}`} />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
