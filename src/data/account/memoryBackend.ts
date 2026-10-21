import type { AuditEntry, AuditType, ConsentRecord, DeletionReceipt, ReviewRequest } from '../repository';
import type { KeyValueStore } from '../localRepository';
import type { AccountBackend, AccountUser, Bundle } from './backend';

/** The one code the memory backend accepts. It stands in for the emailed code in tests. */
export const TEST_CODE = '123456';
/** Seconds between code requests for the same email, as a server rate limit would. */
export const CODE_COOLDOWN_S = 60;

interface UserRows {
  bundle: Bundle | null;
  consent: ConsentRecord[];
  audit: AuditEntry[];
  reviews: ReviewRequest[];
}

interface ServerState {
  users: Record<string, { id: string; email: string }>;
  rows: Record<string, UserRows>;
  receipts: DeletionReceipt[];
  /** Session ids that are still valid, by user. Signing out everywhere clears them all. */
  sessions: Record<string, string[]>;
  lastCode: Record<string, number>;
}

const empty = (): ServerState => ({ users: {}, rows: {}, receipts: [], sessions: {}, lastCode: {} });
const rid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

/**
 * An account server kept in storage, with the same rules as the real one: one-time codes only, a code
 * cooldown, every call scoped to the signed-in person, logs append only, real deletion with a receipt
 * that holds no personal data. `server` is the shared "cloud"; `device` holds this device's session.
 */
export class MemoryBackend implements AccountBackend {
  constructor(
    private readonly server: KeyValueStore,
    private readonly device: KeyValueStore,
    private readonly serverKey = 'tengo.e2e.server',
    private readonly sessionKey = 'tengo.e2e.session',
    private readonly now: () => number = () => Date.now(),
  ) {}

  private read(): ServerState {
    try {
      return { ...empty(), ...(JSON.parse(this.server.getItem(this.serverKey) ?? 'null') ?? {}) };
    } catch {
      return empty();
    }
  }

  private write(s: ServerState) {
    this.server.setItem(this.serverKey, JSON.stringify(s));
  }

  /** The signed-in user, or an error: the stand-in for row-level security. */
  private me(s: ServerState): AccountUser {
    const raw = this.device.getItem(this.sessionKey);
    if (!raw) throw new Error('not signed in');
    const { userId, sessionId } = JSON.parse(raw) as { userId: string; sessionId: string };
    const user = Object.values(s.users).find((u) => u.id === userId);
    if (!user || !(s.sessions[userId] ?? []).includes(sessionId)) {
      this.device.removeItem(this.sessionKey);
      throw new Error('not signed in');
    }
    return user;
  }

  private rows(s: ServerState, userId: string): UserRows {
    return (s.rows[userId] ??= { bundle: null, consent: [], audit: [], reviews: [] });
  }

  async requestCode(email: string): Promise<void> {
    const s = this.read();
    const key = email.trim().toLowerCase();
    const last = s.lastCode[key] ?? 0;
    if (this.now() - last < CODE_COOLDOWN_S * 1000) throw new Error('rate_limited');
    s.lastCode[key] = this.now();
    this.write(s);
  }

  async verifyCode(email: string, code: string): Promise<AccountUser> {
    if (code.trim() !== TEST_CODE) throw new Error('invalid_code');
    const s = this.read();
    const key = email.trim().toLowerCase();
    const user = (s.users[key] ??= { id: `u_${rid()}`, email: key });
    const sessionId = rid();
    (s.sessions[user.id] ??= []).push(sessionId);
    this.write(s);
    this.device.setItem(this.sessionKey, JSON.stringify({ userId: user.id, sessionId }));
    return user;
  }

  async currentUser(): Promise<AccountUser | null> {
    try {
      return this.me(this.read());
    } catch {
      return null;
    }
  }

  async signOut(everywhere: boolean): Promise<void> {
    const s = this.read();
    try {
      const user = this.me(s);
      const { sessionId } = JSON.parse(this.device.getItem(this.sessionKey)!) as { sessionId: string };
      s.sessions[user.id] = everywhere ? [] : (s.sessions[user.id] ?? []).filter((x) => x !== sessionId);
      this.write(s);
    } catch {
      // Already signed out.
    }
    this.device.removeItem(this.sessionKey);
  }

  async loadBundle(): Promise<Bundle | null> {
    const s = this.read();
    return this.rows(s, this.me(s).id).bundle;
  }

  async saveBundle(bundle: Bundle): Promise<void> {
    const s = this.read();
    this.rows(s, this.me(s).id).bundle = bundle;
    this.write(s);
  }

  async addConsent(c: Omit<ConsentRecord, 'decidedAt'>): Promise<ConsentRecord> {
    const s = this.read();
    const saved = { ...c, decidedAt: new Date(this.now()).toISOString() };
    this.rows(s, this.me(s).id).consent.push(saved);
    this.write(s);
    return saved;
  }

  async listConsent(): Promise<ConsentRecord[]> {
    const s = this.read();
    return [...this.rows(s, this.me(s).id).consent].reverse();
  }

  async addAudit(type: AuditType, params?: AuditEntry['params']): Promise<AuditEntry> {
    const s = this.read();
    const entry: AuditEntry = { id: rid(), at: new Date(this.now()).toISOString(), type, params };
    this.rows(s, this.me(s).id).audit.push(entry);
    this.write(s);
    return entry;
  }

  async listAudit(): Promise<AuditEntry[]> {
    const s = this.read();
    return [...this.rows(s, this.me(s).id).audit].reverse();
  }

  async addReview(r: Omit<ReviewRequest, 'id' | 'at'>): Promise<ReviewRequest> {
    const s = this.read();
    const saved: ReviewRequest = { ...r, id: rid(), at: new Date(this.now()).toISOString() };
    this.rows(s, this.me(s).id).reviews.push(saved);
    this.write(s);
    return saved;
  }

  async listReviews(): Promise<ReviewRequest[]> {
    const s = this.read();
    return [...this.rows(s, this.me(s).id).reviews].reverse();
  }

  async exportAll(): Promise<unknown> {
    const s = this.read();
    const r = this.rows(s, this.me(s).id);
    return { exportedAt: new Date(this.now()).toISOString(), ...r.bundle, consentRecords: r.consent, auditLog: r.audit, reviewRequests: r.reviews };
  }

  async deleteAccount(): Promise<DeletionReceipt> {
    const s = this.read();
    const user = this.me(s);
    const r = this.rows(s, user.id);
    const receipt: DeletionReceipt = {
      id: `DEL-${rid().toUpperCase().slice(0, 12)}`,
      personaId: 'own',
      at: new Date(this.now()).toISOString(),
      transactionsRemoved: r.bundle?.transactions.length ?? 0,
      auditEntriesRemoved: r.audit.length,
    };
    delete s.rows[user.id];
    delete s.sessions[user.id];
    for (const [k, u] of Object.entries(s.users)) if (u.id === user.id) delete s.users[k];
    // Nothing that names the person stays behind, not even the code rate-limit entry.
    delete s.lastCode[user.email];
    s.receipts.push(receipt);
    this.write(s);
    this.device.removeItem(this.sessionKey);
    return receipt;
  }
}
