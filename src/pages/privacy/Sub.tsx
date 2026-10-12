import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '../../components/Icon';
import { PageHeader } from '../../components/PageHeader';

/** Shared frame for privacy sub-pages: a back link and the page title. */
export function SubPage({ title, lead, children, actions }: { title: string; lead?: ReactNode; children: ReactNode; actions?: ReactNode }) {
  const { t } = useTranslation();
  return (
    <>
      <Link to="/app/privacy" className="btn-ghost -ml-3 mb-2 min-h-[40px] px-3 text-sm">
        <Icon name="chevronLeft" size={16} />
        {t('privacy.title')}
      </Link>
      <PageHeader title={title} lead={lead} actions={actions} />
      {children}
    </>
  );
}
