import { describe, expect, it } from 'vitest';
import { LocalRepository, type KeyValueStore } from '../localRepository';
import { AccountRepository } from './accountRepository';
import { fromBundle, toBundle } from './backend';
import { MemoryBackend, TEST_CODE } from './memoryBackend';
import { signInOptions } from './index';

class Mem implements KeyValueStore {
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

const today = '2026-10-21';
const adult = '2026-10-21T08:00:00.000Z';

/** One shared server, two devices. */
function world() {
  const server = new Mem();
  let clock = Date.parse('2026-10-21T08:00:00Z');
  const now = () => (clock += 61_000);
  const a = new MemoryBackend(server, new Mem(), undefined, undefined, now);
  const b = new MemoryBackend(server, new Mem(), undefined, undefined, now);
  return { server, a, b };
}

describe('accounts', () => {
  it('signs in with a one-time code only, and rate limits code requests', async () => {
    const server = new Mem();
    const be = new MemoryBackend(server, new Mem(), undefined, undefined, () => 1_000_000);
    await be.requestCode('a@example.test');
    await expect(be.requestCode('a@example.test')).rejects.toThrow('rate_limited');
    await expect(be.verifyCode('a@example.test', '000000')).rejects.toThrow('invalid_code');
    const user = await be.verifyCode('a@example.test', TEST_CODE);
    expect((await be.currentUser())?.id).toBe(user.id);
  });

  it('user B cannot read, change or delete user A data', async () => {
    const { a, b } = world();
    await a.verifyCode('a@example.test', TEST_CODE);
    const repoA = new AccountRepository(a, () => adult);
    await repoA.getRecord('own', today);
    await repoA.replaceHistory('own', [{ id: 't1', date: '2026-10-20', description: 'Spar', amount: -80, category: 'spend' }], 900);
    await b.verifyCode('b@example.test', TEST_CODE);
    expect(await b.loadBundle()).toBeNull();
    const repoB = new AccountRepository(b, () => adult);
    await repoB.replaceHistory('own', [], 10);
    expect((await a.loadBundle())?.transactions).toHaveLength(1);
    await b.deleteAccount();
    expect((await a.loadBundle())?.transactions).toHaveLength(1);
  });

  it('keeps the record the same through the server', async () => {
    const { a } = world();
    await a.verifyCode('a@example.test', TEST_CODE);
    const device = new LocalRepository(new Mem(), 0, 'tengo.profile.v1');
    const local = await device.getRecord('own', today);
    await device.updateProfile('own', { nickname: 'Sam', onboardingStep: 4 });
    const withMoney = await device.updateMoney('own', {
      accounts: [
        { id: 'bank', kind: 'bank', name: 'Bank account', balance: 700 },
        { id: 'cash', kind: 'cash', name: 'Cash on hand', balance: 50 },
      ],
      obligations: [{ id: 'o', kind: 'stokvel', name: 'Stokvel', amount: 300, every: 'month', nextDate: '2026-11-01', movable: false }],
      add: [{ id: 'c', date: today, description: 'Cash in', amount: 50, category: 'income', accountId: 'cash' }],
    });
    void local;
    await a.saveBundle(toBundle(withMoney, adult));
    const back = fromBundle((await a.loadBundle())!);
    expect(back.balance).toBe(750);
    expect(back.profile?.nickname).toBe('Sam');
    expect(back.obligations).toEqual(withMoney.obligations);
    expect(back.transactions).toEqual(withMoney.transactions);
  });

  it('account data wins on another device; replacing it is a separate choice', () => {
    const remote = toBundle({ personaId: 'own', transactions: [{ id: 'x', date: today, description: 'x', amount: -1, category: 'spend' }], balance: 1, source: 'manual', seededOn: today, createdAt: '', updatedAt: '' }, adult);
    const localWith = { personaId: 'own' as const, transactions: [{ id: 'y', date: today, description: 'y', amount: -1, category: 'spend' as const }], balance: 1, source: 'manual' as const, seededOn: today, createdAt: '', updatedAt: '' };
    const localEmpty = { ...localWith, transactions: [] };
    expect(signInOptions(remote, localWith)).toEqual(['useAccount', 'replaceAccount']);
    expect(signInOptions(remote, localEmpty)).toEqual(['useAccount']);
    expect(signInOptions(null, localWith)).toEqual(['upload', 'startEmpty']);
    expect(signInOptions(null, null)).toEqual(['startEmpty']);
  });

  it('signing out everywhere ends the session on the other device too', async () => {
    const { a, b } = world();
    await a.verifyCode('same@example.test', TEST_CODE);
    await b.verifyCode('same@example.test', TEST_CODE);
    await a.signOut(true);
    expect(await b.currentUser()).toBeNull();
  });

  it('deletion removes everything and the receipt holds no personal data', async () => {
    const { server, a } = world();
    await a.verifyCode('a@example.test', TEST_CODE);
    const repo = new AccountRepository(a, () => adult);
    await repo.getRecord('own', today);
    await repo.updateProfile('own', { nickname: 'Sam' });
    await repo.replaceHistory('own', [{ id: 't1', date: '2026-10-20', description: 'Spar', amount: -80, category: 'spend' }], 900);
    await repo.setConsent('own', { core: true, messages: false, analytics: false, noticeVersion: 'v1' });
    const receipt = await repo.deletePersona('own');
    expect(receipt.transactionsRemoved).toBe(1);
    expect(JSON.stringify(receipt)).not.toMatch(/Sam|Spar|example/);
    expect(server.getItem('tengo.e2e.server')).not.toMatch(/Sam|Spar|a@example/);
    expect(await a.currentUser()).toBeNull();
  });

  it('keeps a consent log on the server and the latest decision wins', async () => {
    const { a } = world();
    await a.verifyCode('a@example.test', TEST_CODE);
    const repo = new AccountRepository(a, () => adult);
    await repo.setConsent('own', { core: true, messages: false, analytics: false, noticeVersion: 'v1' });
    await repo.setConsent('own', { core: false, messages: false, analytics: false, noticeVersion: 'v1' });
    expect((await repo.getConsent('own'))?.core).toBe(false);
    expect(await a.listConsent()).toHaveLength(2);
    const exported = (await a.exportAll()) as { consentRecords: unknown[] };
    expect(exported.consentRecords).toHaveLength(2);
  });
});
