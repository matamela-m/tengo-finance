import { useTranslation } from 'react-i18next';
import { LANGUAGES } from '../i18n/languages';
import { useSession } from '../store/session';
import { Icon } from './Icon';

export function LanguageSelector({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation();
  const language = useSession((s) => s.language);
  const setLanguage = useSession((s) => s.setLanguage);
  return (
    <fieldset>
      <legend className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
        <Icon name="globe" size={18} />
        {t('language.label')}
      </legend>
      <div className={`grid gap-2 ${compact ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6'}`}>
        {LANGUAGES.map((l) => {
          const active = language === l.code;
          return (
            <label
              key={l.code}
              className={`relative flex min-h-[48px] cursor-pointer items-center justify-between gap-2 rounded-2xl border px-4 text-[15px] font-medium transition-colors focus-within:outline focus-within:outline-[3px] focus-within:outline-offset-2 focus-within:outline-[var(--c-focus)] ${
                active ? 'border-brand bg-brand text-on-brand' : 'border-line bg-surface hover:bg-surface-2'
              }`}
            >
              <input type="radio" name="language" value={l.code} checked={active} onChange={() => setLanguage(l.code)} className="sr-only" />
              <span lang={l.code}>{l.native}</span>
              {active && <Icon name="check" size={18} />}
            </label>
          );
        })}
      </div>
      {language !== 'en' && <p className="mt-3 text-sm text-muted">{t('language.pending')}</p>}
    </fieldset>
  );
}
