import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Notice } from '../components/Feedback';
import type { DeletionReceipt } from '../data/repository';
import { getPersona } from '../data/seed/personas';
import { useDates } from '../lib/useLang';
import { useTranslation } from 'react-i18next';
import { Avatar } from '../components/Avatar';
import { CoverBars } from '../components/CoverBars';
import { DemoChip } from '../components/DemoChip';
import { Icon } from '../components/Icon';
import { LanguageSelector } from '../components/LanguageSelector';
import { useIsDark } from '../components/Preferences';
import { StateChip } from '../components/StateChip';
import { TengoLogo } from '../components/TengoLogo';
import { repository } from '../data';
import { PERSONAS, type PersonaProfile } from '../data/seed/personas';
import { usePageTitle } from '../lib/usePageTitle';
import { useSession } from '../store/session';

export default function Picker() {
  const { t } = useTranslation();
  usePageTitle(t('picker.title'));
  const navigate = useNavigate();
  const active = useSession((s) => s.activePersonaId);
  const setActive = useSession((s) => s.setActivePersona);
  const bg = useIsDark() ? 'dark' : 'light';
  const d = useDates();
  const [params] = useSearchParams();
  const deletedId = params.get('deleted');
  const [receipt, setReceipt] = useState<DeletionReceipt | null>(null);

  useEffect(() => {
    if (!deletedId) return;
    void repository.getDeletionReceipts().then((all) => setReceipt(all.find((r) => r.id === deletedId) ?? null));
  }, [deletedId]);

  const choose = async (p: PersonaProfile) => {
    setActive(p.id);
    const consent = await repository.getConsent(p.id);
    navigate(consent ? '/app' : '/consent');
  };

  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex w-full max-w-[1440px] items-center justify-between gap-4 px-5 py-5 sm:px-8 lg:px-12">
        <Link to="/" className="rounded-lg" aria-label={t('picker.backHome')}>
          <TengoLogo variant="horizontal" background={bg} height={26} />
        </Link>
        <DemoChip />
      </header>

      <main id="main" className="mx-auto w-full max-w-[1440px] px-5 pb-16 pt-4 sm:px-8 lg:px-12 lg:pt-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 lg:flex-1">
            <h1 className="font-display text-[32px] font-extrabold leading-[1.05] sm:text-[46px]">{t('picker.title')}</h1>
            <p className="mt-3 max-w-2xl text-lg text-muted">{t('picker.lead')}</p>
          </div>
          <LanguageSelector className="w-full shrink-0 sm:max-w-sm lg:w-80" />
        </div>
        {receipt && (
          <Notice tone="ok" icon="receipt" className="mt-6 max-w-3xl">
            <p className="font-semibold">{t('picker.deletedTitle', { name: getPersona(receipt.personaId)?.name ?? '' })}</p>
            <p className="num mt-1">
              {t('picker.deletedBody', { ref: receipt.id, date: d.stamp(receipt.at), count: receipt.transactionsRemoved, audit: receipt.auditEntriesRemoved })}
            </p>
          </Notice>
        )}

        <section aria-labelledby="persona-heading" className="mt-10">
          <h2 id="persona-heading" className="sr-only">
            {t('picker.personas')}
          </h2>
          <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {PERSONAS.map((p) => (
              <li key={p.id}>
                <article
                  className={`group card relative flex h-full w-full flex-col p-6 transition-[transform,box-shadow] duration-200 focus-within:ring-[3px] focus-within:ring-[var(--c-focus)] hover:-translate-y-0.5 hover:shadow-lift sm:p-7 ${
                    active === p.id ? 'ring-2 ring-brand' : ''
                  }`}
                >
                  <div className="flex w-full items-start justify-between gap-4">
                    <Avatar persona={p} size={64} />
                    <div className="flex items-center gap-2">
                      <StateChip state={p.startState} />
                      <CoverBars state={p.startState} size={28} />
                    </div>
                  </div>
                  <h3 className="mt-6 font-display text-[30px] font-extrabold leading-none">{p.name}</h3>
                  <p className="mt-2 text-[15px] font-semibold">
                    {t(`personas.${p.id}.role`)}, {p.place}
                  </p>
                  <p className="mt-3 flex-1 text-[15px] text-muted">{t(`personas.${p.id}.situation`)}</p>
                  <div className="mt-6 flex w-full items-center justify-between gap-3 border-t border-line pt-4">
                    <span className="text-xs font-medium text-muted">{t('personas.fictional')}</span>
                    <button
                      type="button"
                      onClick={() => void choose(p)}
                      className="inline-flex min-h-[44px] items-center gap-1 text-sm font-semibold text-brand-ink after:absolute after:inset-0 after:rounded-3xl after:content-[''] focus-visible:outline-none"
                    >
                      {active === p.id ? t('picker.continueAs', { name: p.name }) : t('picker.enterAs', { name: p.name })}
                      <Icon name="arrowRight" size={16} className="transition-transform group-hover:translate-x-0.5" />
                    </button>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        </section>

      </main>
    </div>
  );
}
