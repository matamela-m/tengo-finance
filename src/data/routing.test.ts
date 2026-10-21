import { describe, expect, it } from 'vitest';
import { LocalRepository, type KeyValueStore } from './localRepository';
import { RoutingRepository } from './routing';

class MemoryStore implements KeyValueStore {
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

function setup() {
  const store = new MemoryStore();
  const repo = new RoutingRepository(new LocalRepository(store), new LocalRepository(store, 0, 'tengo.profile.v1'));
  return { store, repo };
}

describe('own profile storage', () => {
  it('starts empty, is never seeded, and lives in its own namespace', async () => {
    const { store, repo } = setup();
    const own = await repo.getRecord('own', '2026-10-20');
    expect(own.transactions).toEqual([]);
    expect(own.balance).toBe(0);
    expect(own.profile?.onboardingStep).toBe(0);
    expect(store.getItem('tengo.profile.v1')).toContain('"own"');
    expect(store.getItem('tengo.data.v1')).toBeNull();
    await repo.getRecord('lerato', '2026-10-20');
    expect(store.getItem('tengo.data.v1')).toContain('lerato');
    expect(store.getItem('tengo.profile.v1')).not.toContain('lerato');
  });

  it('keeps profile details and never stores more than the forecast needs', async () => {
    const { repo } = setup();
    await repo.getRecord('own', '2026-10-20');
    const r = await repo.updateProfile('own', { nickname: 'Sam', onboardingStep: 2 });
    expect(r.profile).toEqual({ nickname: 'Sam', onboardingStep: 2 });
    expect(Object.keys(r).sort()).not.toContain('idNumber');
    const replaced = await repo.replaceHistory('own', [], 100);
    expect(replaced.profile?.nickname).toBe('Sam');
  });

  it('deletes the own profile for real and keeps a receipt with no personal data', async () => {
    const { store, repo } = setup();
    await repo.getRecord('own', '2026-10-20');
    await repo.updateProfile('own', { nickname: 'Sam' });
    await repo.replaceHistory('own', [{ id: 't', date: '2026-10-19', description: 'Groceries at Spar', amount: -90, category: 'spend' }], 500);
    const receipt = await repo.deletePersona('own');
    expect(receipt.transactionsRemoved).toBe(1);
    const raw = store.getItem('tengo.profile.v1')!;
    expect(raw).not.toMatch(/Sam|Spar|Groceries/);
    expect(JSON.stringify(receipt)).not.toMatch(/Sam|Spar/);
    expect((await repo.getDeletionReceipts()).map((x) => x.id)).toContain(receipt.id);
  });

  it('a full reset clears both namespaces', async () => {
    const { store, repo } = setup();
    await repo.getRecord('own', '2026-10-20');
    await repo.getRecord('thabo', '2026-10-20');
    await repo.resetAll();
    expect(store.getItem('tengo.profile.v1')).toBeNull();
    expect(store.getItem('tengo.data.v1')).toBeNull();
  });
});
