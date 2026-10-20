import type { BillDecision, ISODate, Transaction } from '../engine/types';
import { accountsOf, totalOf, type Account, type MoneyChange, type RecordSource } from './repository';
import type {
  AuditEntry,
  AuditType,
  ConsentRecord,
  DeletionReceipt,
  PersonaRecord,
  PlanSettings,
  ReviewRequest,
  TengoRepository,
  TransactionPatch,
} from './repository';
import { applyRetention } from './retention';
import { generateHistory, PERSONA_EXTRAS, personaObligations, startingBalance } from './seed/generate';
import { getPersona, type PersonaId } from './seed/personas';

const KEY = 'tengo.data.v1';
/** Where unreadable data is kept, so a bad write never silently wipes it. */
export const CORRUPT_KEY = 'tengo.data.unreadable';
const MAX_AUDIT = 200;

/**
 * Stored data carries a schema version. Each migration moves data one version up when it is read.
 * 1: build 1. 2: build 2, audit entries hold no descriptions (SEC-07) and records gain optional fields.
 */
export const SCHEMA_VERSION = 2;

export type StorageProblem = 'quota' | 'unavailable' | 'corrupt';

/** A storage failure the person needs to see, with what kind it was. */
export class StorageError extends Error {
  constructor(
    readonly kind: StorageProblem,
    message: string,
  ) {
    super(message);
    this.name = 'StorageError';
  }
}

function isQuota(e: unknown): boolean {
  const err = e as { name?: string; code?: number };
  return err?.name === 'QuotaExceededError' || err?.name === 'NS_ERROR_DOM_QUOTA_REACHED' || err?.code === 22 || err?.code === 1014;
}

/** Brings stored data up to SCHEMA_VERSION. Pure, so it is tested on its own. */
export function migrate(data: Stored): Stored {
  let d = data;
  if ((d.schema ?? 1) < 2) {
    for (const slot of Object.values(d.personas)) {
      if (!slot) continue;
      slot.audit = (slot.audit ?? []).map((a) => {
        if (a.type !== 'transaction.edited' || !a.params) return a;
        const { name: _name, ...rest } = a.params;
        void _name;
        return { ...a, params: rest };
      });
      slot.reviews = slot.reviews ?? [];
    }
    d = { ...d, schema: 2 };
  }
  return d;
}

export interface PersonaSlot {
  record?: PersonaRecord;
  consent?: ConsentRecord;
  audit: AuditEntry[];
  reviews: ReviewRequest[];
}

export interface Stored {
  schema?: number;
  personas: Partial<Record<PersonaId, PersonaSlot>>;
  receipts: DeletionReceipt[];
}

/** Minimal storage surface so tests can pass an in-memory map. */
export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function uid(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now().toString(36)}${rand}`;
}

export function seedRecord(personaId: PersonaId, today: ISODate): PersonaRecord {
  const profile = getPersona(personaId);
  const transactions = generateHistory(personaId, today);
  const obligations = personaObligations(personaId, today);
  // The total puts the persona in its intended state with its obligation counted; some of it is cash.
  const balance = startingBalance(transactions, today, profile?.startState ?? 'tight', obligations);
  const cash = Math.min(PERSONA_EXTRAS[personaId].cash, Math.max(0, balance));
  const accounts: Account[] = [
    { id: 'bank', kind: 'bank', name: 'Bank account', balance: Math.round((balance - cash) * 100) / 100 },
    { id: 'cash', kind: 'cash', name: 'Cash on hand', balance: cash },
  ];
  const now = new Date().toISOString();
  return { personaId, transactions, balance, accounts, obligations, source: 'seed', seededOn: today, createdAt: now, updatedAt: now };
}

export class LocalRepository implements TengoRepository {
  constructor(
    private readonly store: KeyValueStore,
    /** Artificial delay so loading states are real. */
    private readonly latencyMs = 0,
  ) {}

  private read(): Stored {
    let raw: string | null;
    try {
      raw = this.store.getItem(KEY);
    } catch {
      throw new StorageError('unavailable', 'Storage cannot be read on this device');
    }
    if (!raw) return { schema: SCHEMA_VERSION, personas: {}, receipts: [] };
    let parsed: Stored;
    try {
      parsed = JSON.parse(raw) as Stored;
      if (!parsed || typeof parsed !== 'object' || !parsed.personas) throw new Error('shape');
    } catch {
      // Keep the unreadable copy rather than overwrite it, and tell the person.
      try {
        this.store.setItem(CORRUPT_KEY, raw);
      } catch {
        // Nothing more can be done; the error below still reaches the person.
      }
      throw new StorageError('corrupt', 'Stored data could not be read');
    }
    return migrate(parsed);
  }

  private write(data: Stored) {
    try {
      this.store.setItem(KEY, JSON.stringify({ ...data, schema: SCHEMA_VERSION }));
    } catch (e) {
      throw new StorageError(isQuota(e) ? 'quota' : 'unavailable', 'Could not save on this device');
    }
  }

  private slot(data: Stored, id: PersonaId): PersonaSlot {
    const existing = data.personas[id];
    if (existing) return existing;
    const created: PersonaSlot = { audit: [], reviews: [] };
    data.personas[id] = created;
    return created;
  }

  private async wait() {
    if (this.latencyMs > 0) await new Promise((r) => setTimeout(r, this.latencyMs));
  }

  async getRecord(personaId: PersonaId, today: ISODate): Promise<PersonaRecord> {
    await this.wait();
    const data = this.read();
    const slot = this.slot(data, personaId);
    if (!slot.record || (slot.record.source === 'seed' && slot.record.seededOn !== today)) {
      slot.record = seedRecord(personaId, today);
      this.write(data);
    }
    // Retention is enforced here, not only described: records older than 12 months are removed on open.
    const { kept, removed } = applyRetention(slot.record.transactions, today);
    if (removed > 0) {
      slot.record = { ...slot.record, transactions: kept, updatedAt: new Date().toISOString() };
      this.write(data);
    }
    return slot.record;
  }

  async replaceHistory(personaId: PersonaId, transactions: Transaction[], balance: number, balanceDate?: ISODate, source: RecordSource = 'import'): Promise<PersonaRecord> {
    await this.wait();
    const data = this.read();
    const slot = this.slot(data, personaId);
    const now = new Date().toISOString();
    // A statement replaces the bank account; cash and wallets the person added stay, and count in the total.
    const others = slot.record ? accountsOf(slot.record).filter((a) => a.kind !== 'bank') : [];
    const accounts: Account[] = [{ id: 'bank', kind: 'bank', name: 'Bank account', balance }, ...others];
    slot.record = {
      personaId,
      transactions,
      balance: totalOf(accounts),
      accounts,
      obligations: slot.record?.obligations,
      source,
      seededOn: slot.record?.seededOn ?? now.slice(0, 10),
      balanceDate,
      billDecisions: {},
      createdAt: slot.record?.createdAt ?? now,
      updatedAt: now,
    };
    this.write(data);
    return slot.record;
  }

  /** Applies a change to an existing record, marks seeds as edited and saves. */
  private change(personaId: PersonaId, fn: (record: PersonaRecord) => void): PersonaRecord {
    const data = this.read();
    const record = this.slot(data, personaId).record;
    if (!record) throw new Error('No record for persona');
    fn(record);
    if (record.source === 'seed') record.source = 'edited';
    record.updatedAt = new Date().toISOString();
    this.write(data);
    return record;
  }

  async addTransactions(personaId: PersonaId, transactions: Transaction[], balance?: number): Promise<PersonaRecord> {
    await this.wait();
    return this.change(personaId, (r) => {
      r.transactions = [...r.transactions, ...transactions];
      if (balance !== undefined) r.balance = balance;
    });
  }

  /** Sets the bank account balance (the one a statement shows); the total follows. */
  async setBalance(personaId: PersonaId, balance: number, balanceDate: ISODate): Promise<PersonaRecord> {
    await this.wait();
    return this.change(personaId, (r) => {
      const accounts = accountsOf(r).map((a) => (a.kind === 'bank' ? { ...a, balance } : a));
      if (!accounts.some((a) => a.kind === 'bank')) accounts.unshift({ id: 'bank', kind: 'bank', name: 'Bank account', balance });
      r.accounts = accounts;
      r.balance = totalOf(accounts);
      r.balanceDate = balanceDate;
    });
  }

  async updateMoney(personaId: PersonaId, change: MoneyChange): Promise<PersonaRecord> {
    await this.wait();
    return this.change(personaId, (r) => {
      if (change.add?.length) r.transactions = [...r.transactions, ...change.add];
      if (change.obligations) r.obligations = change.obligations;
      if (change.accounts) {
        r.accounts = change.accounts;
        r.balance = totalOf(change.accounts);
      }
    });
  }

  async setPlanSettings(personaId: PersonaId, settings: PlanSettings): Promise<PersonaRecord> {
    await this.wait();
    return this.change(personaId, (r) => {
      if (settings.flexibleGroups) r.flexibleGroups = settings.flexibleGroups;
      if (settings.movableBills) r.movableBills = settings.movableBills;
    });
  }

  async setBillDecision(personaId: PersonaId, missedBillId: string, decision: BillDecision): Promise<PersonaRecord> {
    await this.wait();
    return this.change(personaId, (r) => {
      r.billDecisions = { ...(r.billDecisions ?? {}), [missedBillId]: decision };
    });
  }

  async updateTransaction(personaId: PersonaId, transactionId: string, patch: TransactionPatch): Promise<PersonaRecord> {
    await this.wait();
    const data = this.read();
    const record = this.slot(data, personaId).record;
    if (!record) throw new Error('No record for persona');
    record.transactions = record.transactions.map((t) => (t.id === transactionId ? { ...t, ...patch } : t));
    if (record.source === 'seed') record.source = 'edited';
    record.updatedAt = new Date().toISOString();
    this.write(data);
    return record;
  }

  async getConsent(personaId: PersonaId): Promise<ConsentRecord | null> {
    await this.wait();
    return this.read().personas[personaId]?.consent ?? null;
  }

  async setConsent(personaId: PersonaId, consent: Omit<ConsentRecord, 'decidedAt'>): Promise<ConsentRecord> {
    const data = this.read();
    const saved = { ...consent, decidedAt: new Date().toISOString() };
    this.slot(data, personaId).consent = saved;
    this.write(data);
    return saved;
  }

  async getAudit(personaId: PersonaId): Promise<AuditEntry[]> {
    await this.wait();
    return [...(this.read().personas[personaId]?.audit ?? [])].reverse();
  }

  async appendAudit(personaId: PersonaId, type: AuditType, params?: AuditEntry['params']): Promise<AuditEntry> {
    const data = this.read();
    const slot = this.slot(data, personaId);
    const entry: AuditEntry = { id: uid('a'), at: new Date().toISOString(), type, params };
    slot.audit = [...slot.audit, entry].slice(-MAX_AUDIT);
    this.write(data);
    return entry;
  }

  async getReviewRequests(personaId: PersonaId): Promise<ReviewRequest[]> {
    return [...(this.read().personas[personaId]?.reviews ?? [])].reverse();
  }

  async addReviewRequest(personaId: PersonaId, request: Omit<ReviewRequest, 'id' | 'at'>): Promise<ReviewRequest> {
    await this.wait();
    const data = this.read();
    const saved: ReviewRequest = { ...request, id: uid('r'), at: new Date().toISOString() };
    const slot = this.slot(data, personaId);
    slot.reviews = [...slot.reviews, saved];
    this.write(data);
    return saved;
  }

  async deletePersona(personaId: PersonaId): Promise<DeletionReceipt> {
    await this.wait();
    const data = this.read();
    const slot = data.personas[personaId];
    const receipt: DeletionReceipt = {
      id: uid('del').toUpperCase(),
      personaId,
      at: new Date().toISOString(),
      transactionsRemoved: slot?.record?.transactions.length ?? 0,
      auditEntriesRemoved: slot?.audit.length ?? 0,
    };
    delete data.personas[personaId];
    data.receipts = [...data.receipts, receipt];
    this.write(data);
    return receipt;
  }

  async getDeletionReceipts(): Promise<DeletionReceipt[]> {
    return [...this.read().receipts].reverse();
  }

  async startFresh(): Promise<void> {
    this.store.removeItem(KEY);
  }

  async resetAll(): Promise<void> {
    this.store.removeItem(KEY);
    this.store.removeItem(CORRUPT_KEY);
  }
}
