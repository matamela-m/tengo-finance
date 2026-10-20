import { beforeEach, describe, expect, it } from 'vitest';
import { CORRUPT_KEY, LocalRepository, migrate, SCHEMA_VERSION, StorageError, type KeyValueStore } from './localRepository';

class MemoryStore implements KeyValueStore {
  private map = new Map<string, string>();
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

describe('LocalRepository', () => {
  let repo: LocalRepository;
  beforeEach(() => {
    repo = new LocalRepository(new MemoryStore());
  });

  it('removes transactions older than 12 months when the record is opened', async () => {
    await repo.replaceHistory(
      'lerato',
      [
        { id: 'old', date: '2025-10-11', description: 'Old', amount: -10, category: 'spend' },
        { id: 'edge', date: '2025-10-12', description: 'Edge', amount: -10, category: 'spend' },
        { id: 'new', date: '2026-10-01', description: 'New', amount: -10, category: 'spend' },
      ],
      500,
    );
    const r = await repo.getRecord('lerato', '2026-10-12');
    expect(r.transactions.map((t) => t.id)).toEqual(['edge', 'new']);
  });

  it('seeds a persona on first read and keeps it for the day', async () => {
    const a = await repo.getRecord('lerato', '2026-10-12');
    expect(a.source).toBe('seed');
    expect(a.transactions.length).toBeGreaterThan(50);
    const b = await repo.getRecord('lerato', '2026-10-12');
    expect(b).toEqual(a);
  });

  it('refreshes seed data on a new day but keeps imported data', async () => {
    await repo.getRecord('thabo', '2026-10-12');
    const next = await repo.getRecord('thabo', '2026-10-13');
    expect(next.seededOn).toBe('2026-10-13');
    await repo.replaceHistory('thabo', [], 500);
    const kept = await repo.getRecord('thabo', '2026-10-14');
    expect(kept.source).toBe('import');
    // Build 2: a statement sets the bank account; cash on hand stays and counts in the total.
    const bank = kept.accounts?.find((a) => a.kind === 'bank');
    const cash = kept.accounts?.find((a) => a.kind === 'cash')?.balance ?? 0;
    expect(bank?.balance).toBe(500);
    expect(kept.balance).toBe(500 + cash);
  });

  it('edits a transaction and marks seed data as edited', async () => {
    const r = await repo.getRecord('ayanda', '2026-10-12');
    const target = r.transactions[0]!;
    const updated = await repo.updateTransaction('ayanda', target.id, { category: 'bill', description: 'Fixed' });
    const t = updated.transactions.find((x) => x.id === target.id)!;
    expect(t.category).toBe('bill');
    expect(t.description).toBe('Fixed');
    expect(updated.source).toBe('edited');
  });

  it('stores consent and audit entries per persona', async () => {
    await repo.setConsent('thabo', { core: true, messages: false, analytics: false });
    await repo.appendAudit('thabo', 'consent.given');
    expect((await repo.getConsent('thabo'))?.messages).toBe(false);
    expect(await repo.getConsent('lerato')).toBeNull();
    expect((await repo.getAudit('thabo')).map((a) => a.type)).toEqual(['consent.given']);
  });

  it('deletes a persona and keeps a receipt', async () => {
    const r = await repo.getRecord('thabo', '2026-10-12');
    await repo.setConsent('thabo', { core: true, messages: true, analytics: false });
    await repo.appendAudit('thabo', 'consent.given');
    const receipt = await repo.deletePersona('thabo');
    expect(receipt.transactionsRemoved).toBe(r.transactions.length);
    expect(receipt.auditEntriesRemoved).toBe(1);
    expect(await repo.getConsent('thabo')).toBeNull();
    expect(await repo.getAudit('thabo')).toEqual([]);
    expect(await repo.getDeletionReceipts()).toHaveLength(1);
  });

  it('stamps the schema version on every write', async () => {
    const store = new MemoryStore();
    const r = new LocalRepository(store);
    await r.setConsent('thabo', { core: true, messages: false, analytics: false });
    expect(JSON.parse(store.getItem('tengo.data.v1')!).schema).toBe(SCHEMA_VERSION);
  });
});

describe('accounts and obligations', () => {
  it('seeds each persona with cash on hand and one informal obligation, and the total is the balance', async () => {
    const repo = new LocalRepository(new MemoryStore());
    for (const id of ['thabo', 'lerato', 'ayanda'] as const) {
      const r = await repo.getRecord(id, '2026-10-20');
      expect(r.accounts?.map((a) => a.kind)).toEqual(['bank', 'cash']);
      expect(r.accounts!.reduce((a, b) => a + b.balance, 0)).toBeCloseTo(r.balance, 2);
      expect(r.obligations).toHaveLength(1);
      expect(r.obligations![0]!.nextDate >= '2026-10-20').toBe(true);
    }
  });

  it('keeps the balance equal to the total of the accounts when money changes', async () => {
    const repo = new LocalRepository(new MemoryStore());
    await repo.getRecord('lerato', '2026-10-20');
    const r = await repo.updateMoney('lerato', {
      accounts: [
        { id: 'bank', kind: 'bank', name: 'Bank account', balance: 1000 },
        { id: 'cash', kind: 'cash', name: 'Cash on hand', balance: 250 },
        { id: 'w1', kind: 'wallet', name: 'Mobile wallet', balance: 100 },
      ],
      add: [{ id: 'c1', date: '2026-10-20', description: 'Cash in', amount: 50, category: 'income', accountId: 'cash' }],
    });
    expect(r.balance).toBe(1350);
    expect(r.transactions.some((t) => t.id === 'c1')).toBe(true);
    const b = await repo.setBalance('lerato', 900, '2026-10-20');
    expect(b.balance).toBe(1250);
  });
});

describe('storage failures and migrations', () => {
  it('migrates build 1 audit entries so they no longer hold descriptions', () => {
    const v1 = {
      personas: { thabo: { audit: [{ id: 'a', at: 'x', type: 'transaction.edited' as const, params: { name: 'Mrs K payment', fields: 'amount' } }], reviews: [] } },
      receipts: [],
    };
    const out = migrate(v1);
    expect(out.schema).toBe(2);
    expect(out.personas.thabo!.audit[0]!.params).toEqual({ fields: 'amount' });
  });

  it('keeps unreadable data aside and reports it, instead of wiping it', async () => {
    const store = new MemoryStore();
    store.setItem('tengo.data.v1', '{not json');
    const r = new LocalRepository(store);
    await expect(r.getConsent('thabo')).rejects.toMatchObject({ kind: 'corrupt' });
    expect(store.getItem(CORRUPT_KEY)).toBe('{not json');
    expect(store.getItem('tengo.data.v1')).toBe('{not json');
    await r.startFresh();
    expect(await r.getConsent('thabo')).toBeNull();
    expect(store.getItem(CORRUPT_KEY)).toBe('{not json');
  });

  it('reports a full store as a quota problem', async () => {
    class FullStore extends MemoryStore {
      setItem() {
        const e = new Error('full');
        e.name = 'QuotaExceededError';
        throw e;
      }
    }
    const r = new LocalRepository(new FullStore());
    const err = await r.setConsent('thabo', { core: true, messages: false, analytics: false }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(StorageError);
    expect((err as StorageError).kind).toBe('quota');
  });

  it('reports blocked storage as unavailable', async () => {
    const blocked: KeyValueStore = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => undefined,
      removeItem: () => undefined,
    };
    await expect(new LocalRepository(blocked).getConsent('thabo')).rejects.toMatchObject({ kind: 'unavailable' });
  });
});
