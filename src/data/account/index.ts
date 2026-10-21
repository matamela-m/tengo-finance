import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { AccountRepository } from './accountRepository';
import type { AccountBackend, AccountUser, Bundle } from './backend';
import { toBundle } from './backend';
import { MemoryBackend } from './memoryBackend';
import { SupabaseBackend } from './supabaseBackend';
import type { PersonaRecord, TengoRepository } from '../repository';

/**
 * Optional accounts. Off unless the founder sets VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, so the app
 * runs fully as a guest with no keys at all. On localhost only, tests can switch on an in-memory server
 * with localStorage "tengo.e2e.accounts" = "1"; that switch does nothing anywhere else.
 */
const URL = import.meta.env.VITE_SUPABASE_URL?.trim();
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

function testServerOn(): boolean {
  try {
    return ['localhost', '127.0.0.1'].includes(window.location.hostname) && window.localStorage.getItem('tengo.e2e.accounts') === '1';
  } catch {
    return false;
  }
}

export function accountsAvailable(): boolean {
  return Boolean(URL && KEY) || testServerOn();
}

let backend: AccountBackend | null = null;
export function accountBackend(): AccountBackend {
  if (!backend) backend = testServerOn() ? new MemoryBackend(window.localStorage, window.localStorage) : new SupabaseBackend(URL!, KEY!);
  return backend;
}

export type StorageMode = 'device' | 'account';

interface AccountState {
  mode: StorageMode;
  /** Shown on Me so the person knows which account is signed in. Never sent anywhere else. */
  email: string | null;
  /** When the person confirmed they are 18 or older. No date of birth is asked or kept. */
  adultConfirmedAt: string | null;
  setSignedIn: (email: string, adultConfirmedAt: string) => void;
  setSignedOut: () => void;
}

export const useAccount = create<AccountState>()(
  persist(
    (set) => ({
      mode: 'device',
      email: null,
      adultConfirmedAt: null,
      setSignedIn: (email, adultConfirmedAt) => set({ mode: 'account', email, adultConfirmedAt }),
      setSignedOut: () => set({ mode: 'device', email: null }),
    }),
    { name: 'tengo.account.v1', storage: createJSONStorage(() => localStorage) },
  ),
);

let repo: AccountRepository | null = null;
export function accountRepository(): AccountRepository {
  repo ??= new AccountRepository(accountBackend(), () => useAccount.getState().adultConfirmedAt ?? new Date().toISOString());
  return repo;
}

/** What to do with data when signing in. */
export type SignInChoice = 'upload' | 'useAccount' | 'replaceAccount' | 'startEmpty';

export interface SignInSituation {
  user: AccountUser;
  /** The account already has data. */
  remote: Bundle | null;
  /** This device has the person's own data. */
  localHasData: boolean;
  /** What the person is offered. The first one is the default. */
  options: SignInChoice[];
}

/**
 * Conflict rules when signing in. Account data wins by default on another device; replacing it with this
 * device's data is a separate, explicit choice.
 */
export function signInOptions(remote: Bundle | null, local: PersonaRecord | null): SignInChoice[] {
  const localHasData = Boolean(local && local.transactions.length > 0);
  if (!remote) return localHasData ? ['upload', 'startEmpty'] : ['startEmpty'];
  return localHasData ? ['useAccount', 'replaceAccount'] : ['useAccount'];
}

export async function afterVerify(user: AccountUser, local: PersonaRecord | null): Promise<SignInSituation> {
  const remote = await accountBackend().loadBundle();
  return { user, remote, localHasData: Boolean(local && local.transactions.length > 0), options: signInOptions(remote, local) };
}

/**
 * Applies the choice, then moves the own profile to the account. Uploaded or replaced device data is
 * removed from the device afterwards, so it lives in one place.
 */
export async function applyChoice(choice: SignInChoice, local: PersonaRecord | null, deviceRepo: TengoRepository, adultConfirmedAt: string): Promise<void> {
  const b = accountBackend();
  if ((choice === 'upload' || choice === 'replaceAccount') && local) {
    await b.saveBundle(toBundle(local, adultConfirmedAt));
    const consent = await deviceRepo.getConsent('own');
    if (consent) await b.addConsent({ core: consent.core, messages: consent.messages, analytics: consent.analytics, noticeVersion: consent.noticeVersion });
    await b.addAudit('account.uploaded');
  }
  if (choice === 'startEmpty') await b.addAudit('account.created');
  accountRepository().reset();
  if (choice === 'upload' || choice === 'replaceAccount') await deviceRepo.deletePersona('own');
}
