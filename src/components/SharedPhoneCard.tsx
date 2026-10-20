import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AUTO_LOCK_CHOICES, validPin, type LockSettings } from '../lib/appLock';
import { useSession } from '../store/session';
import { useAnnounce } from './A11y';
import { Icon } from './Icon';
import { useLock } from './Lock';
import { Toggle } from './Toggle';

type Mode = 'idle' | 'set' | 'off';

/** App lock, discreet mode and quick exit, in one place on Me. */
export function SharedPhoneCard() {
  const { t } = useTranslation();
  const announce = useAnnounce();
  const { enabled, autoLockMinutes, setPin, disable, setAutoLock, lockNow } = useLock();
  const discreet = useSession((s) => s.discreet);
  const setDiscreet = useSession((s) => s.setDiscreet);
  const [mode, setMode] = useState<Mode>('idle');
  const [pin, setPinText] = useState('');
  const [again, setAgain] = useState('');
  const [error, setError] = useState('');
  const [minutes, setMinutes] = useState<LockSettings['autoLockMinutes']>(autoLockMinutes);

  const reset = () => {
    setMode('idle');
    setPinText('');
    setAgain('');
    setError('');
  };
  const save = async () => {
    if (!validPin(pin)) return setError(t('shared.pinInvalid'));
    if (pin !== again) return setError(t('shared.pinMismatch'));
    await setPin(pin, minutes);
    announce(t('shared.lockOn', { count: minutes }));
    reset();
  };
  const turnOff = async () => {
    if (await disable(pin)) {
      announce(t('shared.lockOff'));
      reset();
    } else setError(t('shared.wrongPin'));
  };
  const digits = (v: string) => v.replace(/\D/g, '').slice(0, 6);

  return (
    <section className="card p-5 sm:p-6" aria-labelledby="shared-title">
      <div className="flex items-center gap-2">
        <Icon name="lock" size={18} className="text-accent" />
        <h2 id="shared-title" className="font-heading text-h3 text-ink">
          {t('shared.title')}
        </h2>
      </div>
      <p className="mt-1 text-sm text-muted">{t('shared.lead')}</p>

      <h3 className="mt-5 font-semibold">{t('shared.lockTitle')}</h3>
      <p className="mt-1 text-sm text-muted">{enabled ? t('shared.lockOn', { count: autoLockMinutes }) : t('shared.lockOff')}</p>

      {mode === 'idle' ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className="btn-secondary min-h-[44px]" onClick={() => setMode('set')}>
            {enabled ? t('shared.changePin') : t('shared.setPin')}
          </button>
          {enabled && (
            <>
              <button type="button" className="btn-secondary min-h-[44px]" onClick={lockNow}>
                {t('shared.lockNow')}
              </button>
              <button type="button" className="btn-ghost min-h-[44px]" onClick={() => setMode('off')}>
                {t('shared.turnOff')}
              </button>
            </>
          )}
        </div>
      ) : (
        <form
          className="mt-3 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            void (mode === 'set' ? save() : turnOff());
          }}
        >
          <div>
            <label className="label" htmlFor="pin-1">
              {mode === 'set' ? t('shared.newPin') : t('shared.currentPin')}
            </label>
            <input id="pin-1" type="password" inputMode="numeric" autoComplete="off" className="field num" value={pin} onChange={(e) => setPinText(digits(e.target.value))} aria-describedby="pin-hint pin-err" />
            {mode === 'set' && (
              <p id="pin-hint" className="mt-1 text-xs text-muted">
                {t('shared.pinHint')}
              </p>
            )}
          </div>
          {mode === 'set' && (
            <>
              <div>
                <label className="label" htmlFor="pin-2">
                  {t('shared.confirmPin')}
                </label>
                <input id="pin-2" type="password" inputMode="numeric" autoComplete="off" className="field num" value={again} onChange={(e) => setAgain(digits(e.target.value))} />
              </div>
              <div>
                <label className="label" htmlFor="pin-min">
                  {t('shared.autoLock')}
                </label>
                <select id="pin-min" className="field" value={minutes} onChange={(e) => setMinutes(Number(e.target.value) as LockSettings['autoLockMinutes'])}>
                  {AUTO_LOCK_CHOICES.map((m) => (
                    <option key={m} value={m}>
                      {t('shared.minutes', { count: m })}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
          <p id="pin-err" role="alert" className="min-h-[18px] text-xs font-medium text-short">
            {error}
          </p>
          <div className="flex gap-2">
            <button type="submit" className={mode === 'set' ? 'btn-primary' : 'btn-danger'}>
              {mode === 'set' ? t('shared.setPin') : t('shared.turnOff')}
            </button>
            <button type="button" className="btn-secondary" onClick={reset}>
              {t('common.cancel')}
            </button>
          </div>
        </form>
      )}

      {enabled && mode === 'idle' && (
        <div className="mt-3">
          <label className="label" htmlFor="pin-auto">
            {t('shared.autoLock')}
          </label>
          <select id="pin-auto" className="field max-w-[200px]" value={autoLockMinutes} onChange={(e) => setAutoLock(Number(e.target.value) as LockSettings['autoLockMinutes'])}>
            {AUTO_LOCK_CHOICES.map((m) => (
              <option key={m} value={m}>
                {t('shared.minutes', { count: m })}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="mt-4 border-t border-line">
        <Toggle checked={discreet} onChange={setDiscreet} label={t('shared.discreet')} description={t('shared.discreetHint')} />
      </div>
      <p className="text-sm text-muted">{t('shared.quickExitHint')}</p>
      <Link to="/safety" className="btn-ghost -ml-3 mt-2 text-sm">
        {t('shared.policy')}
        <Icon name="chevronRight" size={16} />
      </Link>
    </section>
  );
}
