import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { repository } from '../data';
import { checkPin, COOL_OFF_MS, makeLock, MAX_TRIES, readLock, writeLock, type LockSettings } from '../lib/appLock';
import { useSession } from '../store/session';
import { Brand } from './Brand';
import { Notice } from './Feedback';

interface LockValue {
  enabled: boolean;
  locked: boolean;
  autoLockMinutes: LockSettings['autoLockMinutes'];
  setPin: (pin: string, minutes: LockSettings['autoLockMinutes']) => Promise<void>;
  /** Turns the lock off. Needs the current PIN. */
  disable: (pin: string) => Promise<boolean>;
  setAutoLock: (minutes: LockSettings['autoLockMinutes']) => void;
  lockNow: () => void;
  unlock: (pin: string) => Promise<'ok' | 'wrong' | 'wait'>;
  /** Milliseconds until another try is allowed, after too many wrong ones. */
  waitMs: number;
}

const Ctx = createContext<LockValue | null>(null);
const store = window.localStorage;

/** Holds the optional app lock and locks after the chosen time without use or away from the app. */
export function LockProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<LockSettings | null>(() => readLock(store));
  const [locked, setLocked] = useState(() => readLock(store) !== null);
  const [tries, setTries] = useState(0);
  const [blockedUntil, setBlockedUntil] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const lastActive = useRef(Date.now());

  // Activity resets the timer; being away longer than the auto-lock time locks.
  useEffect(() => {
    if (!settings) return;
    const touch = () => (lastActive.current = Date.now());
    const check = () => {
      setNow(Date.now());
      if (Date.now() - lastActive.current > settings.autoLockMinutes * 60_000) setLocked(true);
    };
    window.addEventListener('pointerdown', touch);
    window.addEventListener('keydown', touch);
    document.addEventListener('visibilitychange', check);
    const timer = window.setInterval(check, 10_000);
    return () => {
      window.removeEventListener('pointerdown', touch);
      window.removeEventListener('keydown', touch);
      document.removeEventListener('visibilitychange', check);
      window.clearInterval(timer);
    };
  }, [settings]);

  // Tick while waiting out a cool-off, so the count down updates.
  useEffect(() => {
    if (blockedUntil <= Date.now()) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [blockedUntil]);

  const save = useCallback((s: LockSettings | null) => {
    writeLock(store, s);
    setSettings(s);
  }, []);

  const value = useMemo<LockValue>(
    () => ({
      enabled: settings !== null,
      locked: settings !== null && locked,
      autoLockMinutes: settings?.autoLockMinutes ?? 5,
      waitMs: Math.max(0, blockedUntil - now),
      setPin: async (pin, minutes) => {
        save(await makeLock(pin, minutes));
        lastActive.current = Date.now();
        setLocked(false);
      },
      disable: async (pin) => {
        if (!settings || !(await checkPin(pin, settings))) return false;
        save(null);
        setLocked(false);
        return true;
      },
      setAutoLock: (minutes) => settings && save({ ...settings, autoLockMinutes: minutes }),
      lockNow: () => settings && setLocked(true),
      unlock: async (pin) => {
        if (!settings) return 'ok';
        if (Date.now() < blockedUntil) return 'wait';
        if (await checkPin(pin, settings)) {
          setTries(0);
          lastActive.current = Date.now();
          setLocked(false);
          return 'ok';
        }
        const n = tries + 1;
        setTries(n);
        if (n >= MAX_TRIES) {
          setTries(0);
          setBlockedUntil(Date.now() + COOL_OFF_MS);
          setNow(Date.now());
          return 'wait';
        }
        return 'wrong';
      },
    }),
    [settings, locked, tries, blockedUntil, now, save],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLock(): LockValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useLock must be used inside LockProvider');
  return v;
}

/** Full-screen PIN entry. Shows no names, amounts or dates. */
export function LockScreen() {
  const { t } = useTranslation();
  const { unlock, waitMs } = useLock();
  const setActive = useSession((s) => s.setActivePersona);
  const [pin, setPin] = useState('');
  const [message, setMessage] = useState('');
  const [forgot, setForgot] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    const r = await unlock(pin);
    setBusy(false);
    setPin('');
    if (r === 'wrong') setMessage(t('lock.wrong'));
    else if (r === 'wait') setMessage(t('lock.wait'));
    else setMessage('');
  };

  const eraseAll = async () => {
    await repository.resetAll();
    writeLock(store, null);
    setActive(null);
    window.location.replace('/');
  };

  return (
    <main id="main" className="flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <Brand size={24} />
        <h1 className="mt-8 font-heading text-h2 text-ink">{t('lock.title')}</h1>
        <p className="mt-2 text-sm text-muted">{t('lock.lead')}</p>
        <form
          className="mt-6 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <label className="label" htmlFor="lock-pin">
            {t('lock.pin')}
          </label>
          <input
            id="lock-pin"
            type="password"
            inputMode="numeric"
            autoComplete="off"
            maxLength={6}
            className="field num text-center text-2xl tracking-[0.5em]"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            aria-describedby="lock-msg"
            autoFocus
          />
          <p id="lock-msg" role="alert" className="min-h-[20px] text-sm font-medium text-short">
            {waitMs > 0 ? t('lock.waitFor', { count: Math.ceil(waitMs / 1000) }) : message}
          </p>
          <button type="submit" className="btn-primary min-h-[52px] w-full" disabled={busy || pin.length < 4 || waitMs > 0}>
            {t('lock.unlock')}
          </button>
        </form>
        <button type="button" className="btn-ghost mt-4 w-full" aria-expanded={forgot} onClick={() => setForgot((v) => !v)}>
          {t('lock.forgot')}
        </button>
        {forgot && (
          <Notice tone="warn" className="mt-2">
            <p>{t('lock.forgotBody')}</p>
            <button type="button" className="btn-danger mt-3 min-h-[44px]" onClick={() => void eraseAll()}>
              {t('lock.erase')}
            </button>
          </Notice>
        )}
      </div>
    </main>
  );
}
