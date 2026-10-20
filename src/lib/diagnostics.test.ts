import { describe, expect, it } from 'vitest';
import { clearDiagnostics, DIAG_KEY, readDiagnostics, recordDiagnostic, routePattern } from './diagnostics';

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

describe('diagnostics', () => {
  it('keeps only the error name, kind, route pattern and time, never the message', () => {
    const store = new Mem();
    const err = new TypeError('Rent for Mrs K 0821234567 is R2 800');
    recordDiagnostic('render', err, '/app/money/tx_8f2k1', store);
    const raw = store.getItem(DIAG_KEY)!;
    expect(raw).not.toMatch(/Mrs K|0821234567|2 800|Rent/);
    const [entry] = readDiagnostics(store);
    expect(entry).toMatchObject({ kind: 'render', name: 'TypeError', where: '/app/money/:id' });
  });

  it('drops odd error names and keeps at most 20 entries', () => {
    const store = new Mem();
    for (let i = 0; i < 25; i++) recordDiagnostic('error', { name: 'R2 800 owed' }, '/app', store);
    const list = readDiagnostics(store);
    expect(list).toHaveLength(20);
    expect(list[0]!.name).toBe('Error');
    clearDiagnostics(store);
    expect(readDiagnostics(store)).toEqual([]);
  });

  it('turns ids and numbers in a route into a pattern', () => {
    expect(routePattern('/app/privacy/data')).toBe('/app/privacy/data');
    expect(routePattern('/app/item/123')).toBe('/app/item/:id');
  });
});
