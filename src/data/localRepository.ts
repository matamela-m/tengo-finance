import type { BillDecision, ISODate, Transaction } from '../engine/types';
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
import { generateHistory, startingBalance } from './seed/generate';
import { getPersona, type PersonaId } from './seed/personas';

const KEY = 'tengo.data.v1';
const MAX_AUDIT = 200;

interface PersonaSlot {
  record?: PersonaRecord;
  consent?: ConsentRecord;
  audit: AuditEntry[];
  reviews: ReviewRequest[];
}

interface Stored {
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
  const balance = startingBalance(transactions, today, profile?.startState ?? 'tight');
  const now = new Date().toISOString();
  return { personaId, transactions, balance, source: 'seed', seededOn: today, createdAt: now, updatedAt: now };
}

export class LocalRepository implements TengoRepository {
  constructor(
    private readonly store: KeyValueStore,
    /** Artificial delay so loading states are real. */
    private readonly latencyMs = 0,
  ) {}

  private read(): Stored {
    try {
      const raw = this.store.getItem(KEY);
      if (raw) return JSON.parse(raw) as Stored;
    } catch {
      // Corrupt or unavailable storage: start fresh.
    }
    return { personas: {}, receipts: [] };
  }

  private write(data: Stored) {
    this.store.setItem(KEY, JSON.stringify(data));
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

  async replaceHistory(personaId: PersonaId, transactions: Transaction[], balance: number, balanceDate?: ISODate): Promise<PersonaRecord> {
    await this.wait();
    const data = this.read();
    const slot = this.slot(data, personaId);
    const now = new Date().toISOString();
    slot.record = {
      personaId,
      transactions,
      balance,
      source: 'import',
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

  async setBalance(personaId: PersonaId, balance: number, balanceDate: ISODate): Promise<PersonaRecord> {
    await this.wait();
    return this.change(personaId, (r) => {
      r.balance = balance;
      r.balanceDate = balanceDate;
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

  async resetAll(): Promise<void> {
    this.store.removeItem(KEY);
  }
}
