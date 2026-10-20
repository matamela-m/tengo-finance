import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useReveal } from '../store/reveal';
import { useSession } from '../store/session';
import { Icon } from './Icon';
import { useLock } from './Lock';

/**
 * Shared-phone controls, always in reach: quick exit, and in discreet mode a button to show amounts
 * for a short while. Quick exit hides amounts, locks the app if a PIN is set, and replaces the page
 * with a neutral one, so Back does not return to the forecast.
 */
export function SafetyControls({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const discreet = useSession((s) => s.discreet);
  const { until, reveal, hide } = useReveal();
  const { lockNow } = useLock();
  const shown = discreet && until > Date.now();

  // Hide again when the reveal time runs out.
  useEffect(() => {
    if (!shown) return;
    const timer = window.setTimeout(hide, Math.max(0, until - Date.now()));
    return () => window.clearTimeout(timer);
  }, [shown, until, hide]);

  const quickExit = () => {
    hide();
    lockNow();
    navigate('/exit', { replace: true });
  };

  const btn = compact
    ? 'inline-flex h-11 w-11 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-ink'
    : 'btn-ghost min-h-[44px] px-3 text-sm text-muted';
  return (
    <div className="flex items-center gap-1">
      {discreet && (
        <button type="button" className={btn} onClick={shown ? hide : reveal} aria-pressed={shown} aria-label={compact ? t(shown ? 'safety.hideAmounts' : 'safety.showAmounts') : undefined}>
          <Icon name={shown ? 'eyeOff' : 'eye'} size={18} />
          {!compact && t(shown ? 'safety.hideAmounts' : 'safety.showAmounts')}
        </button>
      )}
      <button type="button" className={btn} onClick={quickExit} aria-label={compact ? t('safety.quickExit') : undefined}>
        <Icon name="door" size={18} />
        {!compact && t('safety.quickExit')}
      </button>
    </div>
  );
}
