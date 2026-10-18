import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon, type IconName } from './Icon';
import { IconTile } from './ui';

export function EmptyState({ icon = 'info', title, body, action }: { icon?: IconName; title: string; body?: ReactNode; action?: ReactNode }) {
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
  info: { box: 'border-line bg-surface-2 text-ink', icon: 'text-muted', fallback: 'info' as IconName },
  warn: { box: 'border-tight/25 bg-tight-soft text-ink', icon: 'text-tight', fallback: 'alert' as IconName },
  danger: { box: 'border-short/25 bg-short-soft text-ink', icon: 'text-short', fallback: 'shortCircle' as IconName },
  ok: { box: 'border-enough/25 bg-enough-soft text-ink', icon: 'text-enough', fallback: 'checkCircle' as IconName },
};

/** An inline message. The icon carries the tone in colour; the text stays full contrast. */
export function Notice({ tone = 'info', icon, children, className = '' }: { tone?: keyof typeof NOTICE; icon?: IconName; children: ReactNode; className?: string }) {
  const s = NOTICE[tone];
  return (
    <div className={`flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm ${s.box} ${className}`}>
      <Icon name={icon ?? s.fallback} size={17} className={`mt-px shrink-0 ${s.icon}`} />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
