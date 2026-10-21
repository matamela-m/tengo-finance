import { OWN_ID, type ProfileId } from './seed/personas';
import type { DeletionReceipt, TengoRepository } from './repository';

/**
 * Sends the person's own profile to one repository and the fictional people to another, behind the same
 * interface, so UI code never knows which store it is talking to. The own profile store is the device
 * repository for a guest and, from Phase 8, the account repository when signed in.
 */
export class RoutingRepository implements TengoRepository {
  constructor(
    private readonly personas: TengoRepository,
    private own: TengoRepository,
  ) {}

  /** Switches where the own profile lives: device or account. */
  setOwnRepository(repo: TengoRepository) {
    this.own = repo;
  }

  get ownRepository(): TengoRepository {
    return this.own;
  }

  private pick(id: ProfileId): TengoRepository {
    return id === OWN_ID ? this.own : this.personas;
  }

  getRecord: TengoRepository['getRecord'] = (id, today) => this.pick(id).getRecord(id, today);
  replaceHistory: TengoRepository['replaceHistory'] = (id, ...a) => this.pick(id).replaceHistory(id, ...a);
  updateTransaction: TengoRepository['updateTransaction'] = (id, ...a) => this.pick(id).updateTransaction(id, ...a);
  addTransactions: TengoRepository['addTransactions'] = (id, ...a) => this.pick(id).addTransactions(id, ...a);
  setBalance: TengoRepository['setBalance'] = (id, ...a) => this.pick(id).setBalance(id, ...a);
  setBillDecision: TengoRepository['setBillDecision'] = (id, ...a) => this.pick(id).setBillDecision(id, ...a);
  setPlanSettings: TengoRepository['setPlanSettings'] = (id, ...a) => this.pick(id).setPlanSettings(id, ...a);
  updateMoney: TengoRepository['updateMoney'] = (id, ...a) => this.pick(id).updateMoney(id, ...a);
  updateProfile: TengoRepository['updateProfile'] = (id, ...a) => this.pick(id).updateProfile(id, ...a);
  getConsent: TengoRepository['getConsent'] = (id) => this.pick(id).getConsent(id);
  setConsent: TengoRepository['setConsent'] = (id, ...a) => this.pick(id).setConsent(id, ...a);
  getAudit: TengoRepository['getAudit'] = (id) => this.pick(id).getAudit(id);
  appendAudit: TengoRepository['appendAudit'] = (id, ...a) => this.pick(id).appendAudit(id, ...a);
  getReviewRequests: TengoRepository['getReviewRequests'] = (id) => this.pick(id).getReviewRequests(id);
  addReviewRequest: TengoRepository['addReviewRequest'] = (id, ...a) => this.pick(id).addReviewRequest(id, ...a);
  deletePersona: TengoRepository['deletePersona'] = (id) => this.pick(id).deletePersona(id);

  async getDeletionReceipts(): Promise<DeletionReceipt[]> {
    const all = [...(await this.personas.getDeletionReceipts()), ...(await this.own.getDeletionReceipts())];
    return all.sort((a, b) => (a.at < b.at ? 1 : -1));
  }

  async resetAll(): Promise<void> {
    await this.personas.resetAll();
    await this.own.resetAll();
  }

  async startFresh(): Promise<void> {
    await this.personas.startFresh();
    await this.own.startFresh();
  }
}
