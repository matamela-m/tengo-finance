import type { SpendGroup } from '../engine/spending';
import type { BillDecision, ISODate, Obligation, Transaction } from '../engine/types';
import type { PersonaId } from './seed/personas';

export type RecordSource = 'seed' | 'import' | 'edited' | 'manual';

export type AccountKind = 'bank' | 'cash' | 'wallet';

/** One place money is kept. The forecast uses the total of every account. */
export interface Account {
  id: string;
  kind: AccountKind;
  name: string;
  /** Rands. */
  balance: number;
}

/** The accounts of a record; older records without any get one bank account holding the balance. */
export function accountsOf(record: Pick<PersonaRecord, 'accounts' | 'balance'>): Account[] {
  return record.accounts && record.accounts.length > 0 ? record.accounts : [{ id: 'bank', kind: 'bank', name: 'Bank account', balance: record.balance }];
}

export function totalOf(accounts: Account[]): number {
  return Math.round(accounts.reduce((a, b) => a + b.balance, 0) * 100) / 100;
}

export interface PersonaRecord {
  personaId: PersonaId;
  transactions: Transaction[];
  /** Current balance in rands: the total of every account. */
  balance: number;
  /** Where the money is kept. The total always equals `balance`. */
  accounts?: Account[];
  /** Stokvel, burial society, family support and informal loans. */
  obligations?: Obligation[];
  source: RecordSource;
  /** The date the seed was generated for. Seeds refresh daily until the user changes them. */
  seededOn: ISODate;
  /** The day the balance was true for. Missing means today for seeds and the statement end for imports. */
  balanceDate?: ISODate;
  /** Answers about bills that looked unpaid, keyed by the missed bill id. */
  billDecisions?: Record<string, BillDecision>;
  /** Spending groups the person says can bend, used only by What helps most. */
  flexibleGroups?: SpendGroup[];
  /** Recurring bill keys the person says can be paid later without a fee. Protected bills are never moved. */
  movableBills?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ConsentRecord {
  /** Required to use the app. Withdrawing pauses the forecast. */
  core: boolean;
  messages: boolean;
  /** Off by default. No analytics runs either way. */
  analytics: boolean;
  decidedAt: string;
}

export type AuditType =
  | 'session.opened'
  | 'consent.given'
  | 'consent.changed'
  | 'data.viewed'
  | 'data.exported'
  | 'statement.imported'
  | 'transaction.edited'
  | 'transaction.added'
  | 'balance.updated'
  | 'bill.answered'
  | 'plan.settings'
  | 'money.updated'
  | 'setup.saved'
  | 'cash.added'
  | 'review.requested'
  | 'forecast.paused'
  | 'forecast.resumed';

export interface AuditEntry {
  id: string;
  at: string;
  type: AuditType;
  params?: Record<string, string | number>;
}

export interface DeletionReceipt {
  id: string;
  personaId: PersonaId;
  at: string;
  transactionsRemoved: number;
  auditEntriesRemoved: number;
}

export interface ReviewRequest {
  id: string;
  at: string;
  reason: string;
  details: string;
  contact: 'inbox' | 'none';
  /** Snapshot of the result being questioned. */
  headline: string;
}

export interface MoneyChange {
  accounts?: Account[];
  obligations?: Obligation[];
  add?: Transaction[];
}

export interface PlanSettings {
  flexibleGroups?: SpendGroup[];
  movableBills?: string[];
}

export interface TransactionPatch {
  description?: string;
  amount?: number;
  category?: Transaction['category'];
  oneOff?: boolean;
}

/**
 * Every read and write of persona data goes through this interface.
 * The local implementation keeps everything in the browser. A hosted implementation
 * (for example Supabase) can replace it without touching UI code.
 */
export interface TengoRepository {
  /** Loads the persona's record, creating it from seed data when missing or stale. */
  getRecord(personaId: PersonaId, today: ISODate): Promise<PersonaRecord>;
  /** `balanceDate` is the day the balance was true for, usually the statement end or today. */
  replaceHistory(personaId: PersonaId, transactions: Transaction[], balance: number, balanceDate?: ISODate, source?: RecordSource): Promise<PersonaRecord>;
  updateTransaction(personaId: PersonaId, transactionId: string, patch: TransactionPatch): Promise<PersonaRecord>;
  /** Adds entries such as a confirmed payment or cash. Does not change the balance unless `balance` is given. */
  addTransactions(personaId: PersonaId, transactions: Transaction[], balance?: number): Promise<PersonaRecord>;
  setBalance(personaId: PersonaId, balance: number, balanceDate: ISODate): Promise<PersonaRecord>;
  setBillDecision(personaId: PersonaId, missedBillId: string, decision: BillDecision): Promise<PersonaRecord>;
  setPlanSettings(personaId: PersonaId, settings: PlanSettings): Promise<PersonaRecord>;
  /**
   * Changes accounts and obligations, and adds entries, in one write. When accounts are given the balance
   * becomes their total. Used by cash quick add, wallets and obligations.
   */
  updateMoney(personaId: PersonaId, change: MoneyChange): Promise<PersonaRecord>;

  getConsent(personaId: PersonaId): Promise<ConsentRecord | null>;
  setConsent(personaId: PersonaId, consent: Omit<ConsentRecord, 'decidedAt'>): Promise<ConsentRecord>;

  getAudit(personaId: PersonaId): Promise<AuditEntry[]>;
  appendAudit(personaId: PersonaId, type: AuditType, params?: AuditEntry['params']): Promise<AuditEntry>;

  getReviewRequests(personaId: PersonaId): Promise<ReviewRequest[]>;
  addReviewRequest(personaId: PersonaId, request: Omit<ReviewRequest, 'id' | 'at'>): Promise<ReviewRequest>;

  /** Wipes the persona's records and returns a receipt. The receipt itself is kept. */
  deletePersona(personaId: PersonaId): Promise<DeletionReceipt>;
  getDeletionReceipts(): Promise<DeletionReceipt[]>;

  /** Removes everything this demo stored. */
  resetAll(): Promise<void>;
  /** Clears the main store after it could not be read, keeping any unreadable copy aside. */
  startFresh(): Promise<void>;
}
