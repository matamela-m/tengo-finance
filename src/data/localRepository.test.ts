import { beforeEach, describe, expect, it } from 'vitest';
import { LocalRepository, type KeyValueStore } from './localRepository';

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
    expect(kept.balance).toBe(500);
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
});
