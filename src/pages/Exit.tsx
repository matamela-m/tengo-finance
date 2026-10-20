import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usePageTitle } from '../lib/usePageTitle';

/** The neutral page quick exit lands on: no brand, no names, no amounts. */
export default function ExitPage() {
  const { t } = useTranslation();
  usePageTitle(t('safety.exitTitle'));
  return (
    <main id="main" className="mx-auto flex min-h-dvh max-w-xl flex-col px-5 py-10">
      <h1 className="font-heading text-h2 text-ink">{t('safety.exitTitle')}</h1>
      <p className="mt-6 text-muted">{t('safety.exitBody')}</p>
      <Link to="/" className="mt-auto self-start text-xs text-subtle underline-offset-4 hover:underline">
        {t('safety.exitBack')}
      </Link>
    </main>
  );
}
