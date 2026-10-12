import type { ISODate, Transaction } from '../engine/types';
import type { PersonaId } from './seed/personas';

export type RecordSource = 'seed' | 'import' | 'edited';

export interface PersonaRecord {
  personaId: PersonaId;
  transactions: Transaction[];
  /** Current balance in rands. */
  balance: number;
  source: RecordSource;
  /** The date the seed was generated for. Seeds refresh daily until the user changes them. */
  seededOn: ISODate;
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

export interface TransactionPatch {
  description?: string;
  amount?: number;
  category?: Transaction['category'];
}

/**
 * Every read and write of persona data goes through this interface.
 * The local implementation keeps everything in the browser. A hosted implementation
 * (for example Supabase) can replace it without touching UI code.
 */
export interface TengoRepository {
  /** Loads the persona's record, creating it from seed data when missing or stale. */
  getRecord(personaId: PersonaId, today: ISODate): Promise<PersonaRecord>;
  replaceHistory(personaId: PersonaId, transactions: Transaction[], balance: number): Promise<PersonaRecord>;
  updateTransaction(personaId: PersonaId, transactionId: string, patch: TransactionPatch): Promise<PersonaRecord>;

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
}
