import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { LANGUAGES, isLanguageCode, translationStatus, type LanguageCode, type TranslationStatus } from '../i18n/languages';
import { useSession } from '../store/session';
import { Icon } from './Icon';

interface LanguageSelectProps {
  /** Defaults to the app language. Pass value and onChange to control another setting, like message language. */
  value?: LanguageCode;
  onChange?: (code: LanguageCode) => void;
  label?: string;
  hint?: string;
  className?: string;
}

/**
 * A native select of all 11 official languages: compact, works with every screen reader
 * and uses the phone's own picker. Each option shows the native name, the English name and,
 * when the language is not translated yet, that it shows English for now.
 */
export function LanguageSelect({ value, onChange, label, hint, className = '' }: LanguageSelectProps) {
  const { t } = useTranslation();
  const id = useId();
  const appLanguage = useSession((s) => s.language);
  const setLanguage = useSession((s) => s.setLanguage);
  const current = value ?? appLanguage;
  const change = onChange ?? setLanguage;
  const status = translationStatus(current);
  const noteId = `${id}-note`;

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">
        <Icon name="globe" size={18} />
        {label ?? t('language.label')}
      </label>
      {hint && <p className="-mt-1 mb-2 text-sm text-muted">{hint}</p>}
      <div className="relative">
        <select
          id={id}
          value={current}
          onChange={(e) => isLanguageCode(e.target.value) && change(e.target.value)}
          aria-describedby={status === 'source' ? undefined : noteId}
          className="field appearance-none pr-11 font-medium"
        >
          {LANGUAGES.map((l) => {
            const st = translationStatus(l.code);
            const name = l.native === l.english ? l.native : `${l.native} (${l.english})`;
            return (
              <option key={l.code} value={l.code} lang={l.code}>
                {st === 'source' || st === 'reviewed' ? name : `${name}, ${t(`language.short.${st}`)}`}
              </option>
            );
          })}
        </select>
        <Icon name="chevronDown" size={18} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted" />
      </div>
      <p className="mt-2 text-xs text-muted">{t('language.claim')}</p>
      {status !== 'source' && (
        <div id={noteId} className="mt-2 flex flex-wrap items-start gap-2 text-xs text-muted">
          <StatusChip status={status} />
          <span className="min-w-0 flex-1">{t(`language.${status}`)}</span>
        </div>
      )}
    </div>
  );
}

/** Status of a translation, in words. Never colour alone. */
export function StatusChip({ status }: { status: TranslationStatus }) {
  const { t } = useTranslation();
  return <span className="inline-flex items-center rounded-full border border-line bg-surface-2 px-2 py-0.5 text-xs font-semibold text-ink">{t(`language.chip.${status}`)}</span>;
}

/** Kept for existing imports: the app language picker. */
export function LanguageSelector({ className }: { compact?: boolean; className?: string }) {
  return <LanguageSelect className={className} />;
}
