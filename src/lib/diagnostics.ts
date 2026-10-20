/**
 * Local diagnostics that never hold personal data: error kind, error name, the route pattern and the
 * time. No messages, stack traces, amounts, descriptions or ids are kept, because any of them could
 * contain personal data. Stored on this device only and shown in Me; nothing is sent anywhere.
 */
export const DIAG_KEY = 'tengo.diagnostics.v1';
const MAX = 20;

export type DiagKind = 'render' | 'error' | 'promise' | 'storage';

export interface DiagEntry {
  at: string;
  kind: DiagKind;
  /** Error class name only, such as TypeError. */
  name: string;
  /** Route with anything that looks like an id or a number replaced. */
  where: string;
}

/** "/app/privacy/data" stays, "/app/x/123abc" becomes "/app/x/:id". */
export function routePattern(path: string): string {
  return path
    .split('/')
    .map((p) => (/\d/.test(p) && p.length > 2 ? ':id' : p))
    .join('/');
}

function safeName(e: unknown): string {
  const n = (e as { name?: unknown })?.name;
  return typeof n === 'string' && /^[A-Za-z]{1,40}$/.test(n) ? n : 'Error';
}

export function readDiagnostics(store: Pick<Storage, 'getItem'> = localStorage): DiagEntry[] {
  try {
    const list = JSON.parse(store.getItem(DIAG_KEY) ?? '[]') as DiagEntry[];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function recordDiagnostic(kind: DiagKind, error: unknown, path: string, store: Pick<Storage, 'getItem' | 'setItem'> = localStorage) {
  try {
    const entry: DiagEntry = { at: new Date().toISOString(), kind, name: safeName(error), where: routePattern(path) };
    store.setItem(DIAG_KEY, JSON.stringify([...readDiagnostics(store), entry].slice(-MAX)));
  } catch {
    // Diagnostics must never break the app.
  }
}

export function clearDiagnostics(store: Pick<Storage, 'removeItem'> = localStorage) {
  try {
    store.removeItem(DIAG_KEY);
  } catch {
    // Ignore.
  }
}

/** Bytes used by Tengo's keys in this browser's storage. */
export function storageBytes(store: Storage = localStorage): number {
  let n = 0;
  for (let i = 0; i < store.length; i++) {
    const k = store.key(i);
    if (k?.startsWith('tengo.')) n += k.length + (store.getItem(k)?.length ?? 0);
  }
  return n * 2;
}
