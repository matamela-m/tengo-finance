import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Avatar } from '../components/Avatar';
import { Icon } from '../components/Icon';
import { usePersona } from '../data/PersonaProvider';

export function PersonaSwitch() {
  const { t } = useTranslation();
  const { profile } = usePersona();
  if (!profile) return null;
  return (
    <div className="rounded-2xl border border-line bg-surface p-3">
      <div className="flex items-center gap-3">
        <Avatar persona={profile} size={40} />
        <div className="min-w-0">
          <p className="truncate font-semibold">{profile.name}</p>
          <p className="truncate text-xs text-muted">{t('personas.fictional')}</p>
        </div>
      </div>
      <Link to="/start" className="btn-secondary mt-3 min-h-[40px] w-full text-sm">
        <Icon name="refresh" size={16} />
        {t('me.switchPersona')}
      </Link>
    </div>
  );
}
