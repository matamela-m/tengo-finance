import { useTranslation } from 'react-i18next';

export function DemoChip({ className = '' }: { className?: string }) {
  const { t } = useTranslation();
  return (
    <span
      className={`inline-flex min-h-[28px] items-center gap-1.5 whitespace-nowrap rounded-full border border-line bg-surface px-3 text-xs font-semibold text-ink ${className}`}
    >
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-tight" />
      {t('common.demoChip')}
    </span>
  );
}
