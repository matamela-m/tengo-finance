import { describe, expect, it } from 'vitest';
import { checkPin, LOCK_KEY, makeLock, readLock, validPin, writeLock } from './appLock';

class Mem {
  map = new Map<string, string>();
  getItem(k: string) {
    return this.map.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.map.set(k, v);
  }
  removeItem(k: string) {
    this.map.delete(k);
  }
}

describe('app lock', () => {
  it('accepts 4 to 6 digits only', () => {
    expect(validPin('1234')).toBe(true);
    expect(validPin('123456')).toBe(true);
    expect(validPin('123')).toBe(false);
    expect(validPin('1234567')).toBe(false);
    expect(validPin('12a4')).toBe(false);
  });

  it('stores only a salted hash, never the PIN', async () => {
    const store = new Mem();
    const lock = await makeLock('4821', 5);
    writeLock(store, lock);
    const raw = store.getItem(LOCK_KEY)!;
    expect(raw).not.toContain('4821');
    expect(lock.salt).not.toBe(lock.hash);
    const again = await makeLock('4821', 5);
    expect(again.hash).not.toBe(lock.hash);
    expect(readLock(store)).toEqual(lock);
  });

  it('checks the right PIN and rejects a wrong one', async () => {
    const lock = await makeLock('4821');
    expect(await checkPin('4821', lock)).toBe(true);
    expect(await checkPin('4822', lock)).toBe(false);
    expect(await checkPin('', lock)).toBe(false);
  });

  it('turns off cleanly', () => {
    const store = new Mem();
    writeLock(store, null);
    expect(readLock(store)).toBeNull();
  });
});
