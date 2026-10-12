import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usePageTitle } from '../lib/usePageTitle';
import { TengoLogo } from '../components/TengoLogo';

export default function NotFound({ embedded = false }: { embedded?: boolean }) {
  const { t } = useTranslation();
  usePageTitle(t('notFound.title'));
  const Tag = embedded ? 'div' : 'main';
  return (
    <Tag className={`flex ${embedded ? 'min-h-[60vh]' : 'min-h-dvh'} flex-col items-center justify-center gap-6 px-6 text-center`}>
      <TengoLogo variant="mark" height={56} decorative />
      <h1 className="font-display text-4xl font-extrabold">{t('notFound.title')}</h1>
      <p className="max-w-md text-muted">{t('notFound.body')}</p>
      <Link to="/" className="btn-primary">
        {t('notFound.cta')}
      </Link>
    </Tag>
  );
}
