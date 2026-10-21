import type { BillDecision, ISODate, Transaction } from '../../engine/types';
import { applyRetention } from '../retention';
import { accountsOf, totalOf, type Account, type AuditEntry, type AuditType, type ConsentRecord, type DeletionReceipt, type MoneyChange, type OwnProfile, type PersonaRecord, type PlanSettings, type RecordSource, type ReviewRequest, type TengoRepository, type TransactionPatch } from '../repository';
import { emptyOwnRecord } from '../localRepository';
import type { ProfileId } from '../seed/personas';
import { fromBundle, toBundle, type AccountBackend } from './backend';

/**
 * The person's own profile, saved to their account. Same interface as the device repository, so UI code
 * does not change. It keeps the record in memory for the session and writes every change to the server.
 * The forecast is never worked out on the server.
 */
export class AccountRepository implements TengoRepository {
  private cache: PersonaRecord | null = null;

  constructor(
    private readonly backend: AccountBackend,
    /** When the person confirmed they are 18 or older, recorded with the profile. */
    private readonly adultConfirmedAt: () => string,
  ) {}

  private async load(today: ISODate): Promise<PersonaRecord> {
    if (this.cache) return this.cache;
    const bundle = await this.backend.loadBundle();
    this.cache = bundle ? fromBundle(bundle) : emptyOwnRecord(today);
    return this.cache;
  }

  private async save(record: PersonaRecord): Promise<PersonaRecord> {
    record.updatedAt = new Date().toISOString();
    await this.backend.saveBundle(toBundle(record, this.adultConfirmedAt()));
    this.cache = record;
    return record;
  }

  private async change(fn: (r: PersonaRecord) => void): Promise<PersonaRecord> {
    const r = structuredClone(await this.load(new Date().toISOString().slice(0, 10)));
    fn(r);
    return this.save(r);
  }

  /** Forget the cached copy, after signing in or out. */
  reset() {
    this.cache = null;
  }

  async getRecord(_id: ProfileId, today: ISODate): Promise<PersonaRecord> {
    const r = await this.load(today);
    const { kept, removed } = applyRetention(r.transactions, today);
    if (removed > 0) return this.save({ ...r, transactions: kept });
    return r;
  }

  async replaceHistory(_id: ProfileId, transactions: Transaction[], balance: number, balanceDate?: ISODate, source: RecordSource = 'import'): Promise<PersonaRecord> {
    return this.change((r) => {
      const accounts: Account[] = [{ id: 'bank', kind: 'bank', name: 'Bank account', balance }, ...accountsOf(r).filter((a) => a.kind !== 'bank')];
      r.transactions = transactions;
      r.accounts = accounts;
      r.balance = totalOf(accounts);
      r.balanceDate = balanceDate;
      r.billDecisions = {};
      r.source = source;
    });
  }

  updateTransaction(_id: ProfileId, transactionId: string, patch: TransactionPatch) {
    return this.change((r) => {
      r.transactions = r.transactions.map((t) => (t.id === transactionId ? { ...t, ...patch } : t));
      r.source = r.source === 'import' ? 'edited' : r.source;
    });
  }

  addTransactions(_id: ProfileId, transactions: Transaction[], balance?: number) {
    return this.change((r) => {
      r.transactions = [...r.transactions, ...transactions];
      if (balance !== undefined) {
        r.accounts = accountsOf(r).map((a) => (a.kind === 'bank' ? { ...a, balance: balance - totalOf(accountsOf(r).filter((x) => x.kind !== 'bank')) } : a));
        r.balance = balance;
      }
    });
  }

  setBalance(_id: ProfileId, balance: number, balanceDate: ISODate) {
    return this.change((r) => {
      const accounts = accountsOf(r).map((a) => (a.kind === 'bank' ? { ...a, balance } : a));
      r.accounts = accounts;
      r.balance = totalOf(accounts);
      r.balanceDate = balanceDate;
    });
  }

  setBillDecision(_id: ProfileId, missedBillId: string, decision: BillDecision) {
    return this.change((r) => {
      r.billDecisions = { ...(r.billDecisions ?? {}), [missedBillId]: decision };
    });
  }

  setPlanSettings(_id: ProfileId, settings: PlanSettings) {
    return this.change((r) => {
      if (settings.flexibleGroups) r.flexibleGroups = settings.flexibleGroups;
      if (settings.movableBills) r.movableBills = settings.movableBills;
    });
  }

  updateMoney(_id: ProfileId, change: MoneyChange) {
    return this.change((r) => {
      if (change.add?.length) r.transactions = [...r.transactions, ...change.add];
      if (change.obligations) r.obligations = change.obligations;
      if (change.accounts) {
        r.accounts = change.accounts;
        r.balance = totalOf(change.accounts);
      }
    });
  }

  updateProfile(_id: ProfileId, patch: Partial<OwnProfile>) {
    return this.change((r) => {
      r.profile = { ...(r.profile ?? {}), ...patch };
    });
  }

  async getConsent(_id?: ProfileId): Promise<ConsentRecord | null> {
    return (await this.backend.listConsent())[0] ?? null;
  }

  setConsent(_id: ProfileId, consent: Omit<ConsentRecord, 'decidedAt'>): Promise<ConsentRecord> {
    return this.backend.addConsent(consent);
  }

  getAudit(_id?: ProfileId): Promise<AuditEntry[]> {
    return this.backend.listAudit();
  }

  appendAudit(_id: ProfileId, type: AuditType, params?: AuditEntry['params']): Promise<AuditEntry> {
    return this.backend.addAudit(type, params);
  }

  getReviewRequests(_id?: ProfileId): Promise<ReviewRequest[]> {
    return this.backend.listReviews();
  }

  addReviewRequest(_id: ProfileId, request: Omit<ReviewRequest, 'id' | 'at'>): Promise<ReviewRequest> {
    return this.backend.addReview(request);
  }

  async deletePersona(_id?: ProfileId): Promise<DeletionReceipt> {
    const receipt = await this.backend.deleteAccount();
    this.cache = null;
    return receipt;
  }

  async getDeletionReceipts(): Promise<DeletionReceipt[]> {
    return [];
  }

  async resetAll(): Promise<void> {
    this.cache = null;
  }

  async startFresh(): Promise<void> {
    this.cache = null;
  }
}
