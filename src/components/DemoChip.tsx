import { useTranslation } from 'react-i18next';
import { Badge } from './ui';

export function DemoChip({ className = '' }: { className?: string }) {
  const { t } = useTranslation();
  return (
    <Badge dot tone="tight" className={className}>
      {t('common.demoChip')}
    </Badge>
  );
}
