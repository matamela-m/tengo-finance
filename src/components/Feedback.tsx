import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon, type IconName } from './Icon';

export function EmptyState({ icon = 'info', title, body, action }: { icon?: IconName; title: string; body?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-line px-6 py-10 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 text-muted">
        <Icon name={icon} size={22} />
      </span>
      <p className="font-semibold text-ink">{title}</p>
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
        <div key={i} className="skeleton h-5" style={{ width: `${90 - i * 15}%` }} />
      ))}
    </div>
  );
}

export function PageLoading() {
  const { t } = useTranslation();
  return (
    <div role="status" aria-live="polite" className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <span className="sr-only">{t('common.loading')}</span>
      <div className="skeleton h-[320px] rounded-3xl" />
      <div className="space-y-5">
        <div className="skeleton h-[150px] rounded-3xl" />
        <div className="skeleton h-[150px] rounded-3xl" />
      </div>
    </div>
  );
}

export function Notice({ tone = 'info', icon, children, className = '' }: { tone?: 'info' | 'warn' | 'danger' | 'ok'; icon?: IconName; children: ReactNode; className?: string }) {
  const styles = {
    info: 'bg-surface-2 text-ink border-line',
    warn: 'bg-tight-soft text-tight border-transparent',
    danger: 'bg-short-soft text-short border-transparent',
    ok: 'bg-enough-soft text-enough border-transparent',
  }[tone];
  const defaultIcon: IconName = tone === 'warn' ? 'alert' : tone === 'danger' ? 'shortCircle' : tone === 'ok' ? 'checkCircle' : 'info';
  return (
    <div className={`flex items-start gap-2.5 rounded-2xl border px-4 py-3 text-sm ${styles} ${className}`}>
      <Icon name={icon ?? defaultIcon} size={18} className="mt-0.5 shrink-0" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
