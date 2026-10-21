import { useTranslation } from 'react-i18next';
import { usePersona } from '../data/PersonaProvider';
import { useAccount } from '../data/account';
import { Badge } from './ui';

/** "Demo | Fictional Data", only ever for the fictional people. */
export function DemoChip({ className = '' }: { className?: string }) {
  const { t } = useTranslation();
  return (
    <Badge dot tone="tight" className={className}>
      {t('common.demoChip')}
    </Badge>
  );
}

/** "Your profile" with where it is stored. Never says fictional, because it is not. */
export function ProfileChip({ className = '' }: { className?: string }) {
  const { t } = useTranslation();
  const mode = useAccount((s) => s.mode);
  return (
    <Badge dot tone="accent" className={className}>
      {t('own.chip', { mode: t(`own.storage.${mode}`) })}
    </Badge>
  );
}

/** The right chip for whoever is active: the demo chip for the fictional people, the profile chip for the person's own. */
export function ModeChip({ className = '' }: { className?: string }) {
  const { isOwn } = usePersona();
  return isOwn ? <ProfileChip className={className} /> : <DemoChip className={className} />;
}
