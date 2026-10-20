/**
 * Optional PIN lock for shared phones. The PIN is never stored: only a salted PBKDF2-SHA256 hash, on
 * this device. There is no recovery: a forgotten PIN means deleting the data on this device, which is
 * said plainly on the lock screen.
 */

export const LOCK_KEY = 'tengo.lock.v1';
export const PBKDF2_ITERATIONS = 150_000;
/** Wrong tries allowed before a pause. */
export const MAX_TRIES = 5;
export const COOL_OFF_MS = 30_000;
export const AUTO_LOCK_CHOICES = [1, 5, 15] as const;

export interface LockSettings {
  salt: string;
  hash: string;
  iterations: number;
  /** Lock after this many minutes without use, or away from the app. */
  autoLockMinutes: (typeof AUTO_LOCK_CHOICES)[number];
}

export interface LockStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const b64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

/** 4 to 6 digits. */
export function validPin(pin: string): boolean {
  return /^\d{4,6}$/.test(pin);
}

export async function hashPin(pin: string, salt: Uint8Array, iterations = PBKDF2_ITERATIONS): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: salt as BufferSource, iterations }, key, 256);
  return b64(new Uint8Array(bits));
}

export async function makeLock(pin: string, autoLockMinutes: LockSettings['autoLockMinutes'] = 5): Promise<LockSettings> {
  if (!validPin(pin)) throw new Error('PIN must be 4 to 6 digits');
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return { salt: b64(salt), hash: await hashPin(pin, salt), iterations: PBKDF2_ITERATIONS, autoLockMinutes };
}

/** Compares in constant time for equal-length strings. */
function same(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function checkPin(pin: string, settings: LockSettings): Promise<boolean> {
  if (!validPin(pin)) return false;
  return same(await hashPin(pin, unb64(settings.salt), settings.iterations), settings.hash);
}

export function readLock(store: LockStore): LockSettings | null {
  try {
    const raw = store.getItem(LOCK_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as LockSettings;
    return s.salt && s.hash ? s : null;
  } catch {
    return null;
  }
}

export function writeLock(store: LockStore, settings: LockSettings | null) {
  if (settings) store.setItem(LOCK_KEY, JSON.stringify(settings));
  else store.removeItem(LOCK_KEY);
}
