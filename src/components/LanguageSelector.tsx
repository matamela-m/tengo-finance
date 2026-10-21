import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { LANGUAGES, isLanguageCode, translationStatus, type LanguageCode } from '../i18n/languages';
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
 * and uses the phone's own picker. Options show only the language names; the translation status
 * of the chosen language is one line under the picker.
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
          aria-describedby={noteId}
          className="field appearance-none pr-11 font-medium"
        >
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code} lang={l.code}>
              {l.native === l.english ? l.native : `${l.native} (${l.english})`}
            </option>
          ))}
        </select>
        <Icon name="chevronDown" size={18} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted" />
      </div>
      <p id={noteId} className="mt-2 text-xs text-muted">
        {status === 'source' ? t('language.claim') : t(`language.${status}`)}
      </p>
    </div>
  );
}

/** Kept for existing imports: the app language picker. */
export function LanguageSelector({ className }: { compact?: boolean; className?: string }) {
  return <LanguageSelect className={className} />;
}
