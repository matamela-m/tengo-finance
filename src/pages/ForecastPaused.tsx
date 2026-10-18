import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '../components/Icon';
import { IconTile } from '../components/ui';
import { usePersona } from '../data/PersonaProvider';
import { usePageTitle } from '../lib/usePageTitle';

export function ForecastPaused() {
  const { t } = useTranslation();
  const { consent, setConsent } = usePersona();
  usePageTitle(t('paused.title'));
  return (
    <section className="card mx-auto max-w-2xl p-8 text-center sm:p-12">
      <span className="flex justify-center">
        <IconTile name="pause" tone="tight" size={52} />
      </span>
      <h1 className="mt-5 font-heading text-h1 text-ink">{t('paused.title')}</h1>
      <p className="mx-auto mt-3 max-w-md text-muted">{t('paused.body')}</p>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <button
          type="button"
          className="btn-primary"
          onClick={() => void setConsent({ core: true, messages: consent?.messages ?? false, analytics: consent?.analytics ?? false }, 'forecast.resumed')}
        >
          <Icon name="refresh" size={18} />
          {t('paused.resume')}
        </button>
        <Link to="/app/privacy/delete" className="btn-secondary">
          <Icon name="trash" size={18} />
          {t('paused.delete')}
        </Link>
      </div>
    </section>
  );
}
