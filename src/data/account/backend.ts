import type { Obligation, Transaction } from '../../engine/types';
import type { Account, AuditEntry, AuditType, ConsentRecord, DeletionReceipt, OwnProfile, PersonaRecord, ReviewRequest } from '../repository';

/**
 * Everything the app asks of an account server. The real implementation talks to Supabase; the memory
 * implementation keeps the same rules in the browser for tests. The server only stores data: the
 * forecast is always worked out on the device.
 *
 * Every data call acts on the signed-in person only. Row-level security enforces that on the server
 * (supabase/migrations, tested in supabase/tests); the memory backend enforces it the same way.
 */
export interface AccountUser {
  id: string;
  email: string;
}

/** The stored parts of a person's profile, without anything the server works out. */
export interface Bundle {
  profile: OwnProfile & {
    adultConfirmedAt: string;
    source: PersonaRecord['source'];
    balanceDate?: string;
    seededOn: string;
    billDecisions: PersonaRecord['billDecisions'];
    flexibleGroups: PersonaRecord['flexibleGroups'];
    movableBills: PersonaRecord['movableBills'];
    createdAt: string;
    updatedAt: string;
  };
  accounts: Account[];
  transactions: Transaction[];
  obligations: Obligation[];
}

export interface AccountBackend {
  /** Sends a one-time sign-in code by email. No passwords. */
  requestCode(email: string): Promise<void>;
  verifyCode(email: string, code: string): Promise<AccountUser>;
  currentUser(): Promise<AccountUser | null>;
  /** Signs out here, or on every device. */
  signOut(everywhere: boolean): Promise<void>;

  loadBundle(): Promise<Bundle | null>;
  saveBundle(bundle: Bundle): Promise<void>;

  /** Consent is a log: each decision is a new record with its time and notice version. */
  addConsent(c: Omit<ConsentRecord, 'decidedAt'>): Promise<ConsentRecord>;
  listConsent(): Promise<ConsentRecord[]>;

  addAudit(type: AuditType, params?: AuditEntry['params']): Promise<AuditEntry>;
  listAudit(): Promise<AuditEntry[]>;

  addReview(r: Omit<ReviewRequest, 'id' | 'at'>): Promise<ReviewRequest>;
  listReviews(): Promise<ReviewRequest[]>;

  /** The complete export from the server, as one JSON document. */
  exportAll(): Promise<unknown>;
  /** Removes every row and the sign-in, and returns a receipt with no personal data. */
  deleteAccount(): Promise<DeletionReceipt>;
}

/** A person's own record as the parts the server stores. */
export function toBundle(record: PersonaRecord, adultConfirmedAt: string): Bundle {
  return {
    profile: {
      ...(record.profile ?? {}),
      adultConfirmedAt,
      source: record.source === 'seed' ? 'manual' : record.source,
      balanceDate: record.balanceDate,
      seededOn: record.seededOn,
      billDecisions: record.billDecisions ?? {},
      flexibleGroups: record.flexibleGroups ?? [],
      movableBills: record.movableBills ?? [],
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    },
    accounts: record.accounts ?? [],
    transactions: record.transactions,
    obligations: record.obligations ?? [],
  };
}

/** Back from the server's parts to the record the app uses. */
export function fromBundle(b: Bundle): PersonaRecord {
  const { adultConfirmedAt: _a, source, balanceDate, seededOn, billDecisions, flexibleGroups, movableBills, createdAt, updatedAt, ...profile } = b.profile;
  void _a;
  const balance = Math.round(b.accounts.reduce((s, a) => s + a.balance, 0) * 100) / 100;
  return {
    personaId: 'own',
    transactions: b.transactions,
    balance,
    accounts: b.accounts,
    obligations: b.obligations,
    source,
    seededOn,
    balanceDate,
    billDecisions,
    flexibleGroups,
    movableBills,
    profile,
    createdAt,
    updatedAt,
  };
}
