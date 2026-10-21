import type { SupabaseClient } from '@supabase/supabase-js';
import type { Obligation, Transaction } from '../../engine/types';
import type { Account, AuditEntry, AuditType, ConsentRecord, DeletionReceipt, ReviewRequest } from '../repository';
import type { AccountBackend, AccountUser, Bundle } from './backend';

/**
 * The account server on Supabase. Only the public anon key is ever in the browser; row-level security
 * (supabase/migrations) limits every query to the signed-in person. The client library is loaded only
 * when accounts are used, so guests never download it.
 */
export class SupabaseBackend implements AccountBackend {
  private client: Promise<SupabaseClient> | null = null;

  constructor(
    private readonly url: string,
    private readonly anonKey: string,
  ) {}

  private db(): Promise<SupabaseClient> {
    this.client ??= import('@supabase/supabase-js').then(({ createClient }) =>
      createClient(this.url, this.anonKey, { auth: { persistSession: true, autoRefreshToken: true, storageKey: 'tengo.auth' } }),
    );
    return this.client;
  }

  private async uid(): Promise<string> {
    const { data } = await (await this.db()).auth.getUser();
    if (!data.user) throw new Error('not signed in');
    return data.user.id;
  }

  async requestCode(email: string): Promise<void> {
    const { error } = await (await this.db()).auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
    if (error) throw new Error(error.status === 429 ? 'rate_limited' : 'request_failed');
  }

  async verifyCode(email: string, code: string): Promise<AccountUser> {
    const { data, error } = await (await this.db()).auth.verifyOtp({ email, token: code.trim(), type: 'email' });
    if (error || !data.user) throw new Error('invalid_code');
    return { id: data.user.id, email: data.user.email ?? email };
  }

  async currentUser(): Promise<AccountUser | null> {
    const { data } = await (await this.db()).auth.getUser();
    return data.user ? { id: data.user.id, email: data.user.email ?? '' } : null;
  }

  async signOut(everywhere: boolean): Promise<void> {
    await (await this.db()).auth.signOut({ scope: everywhere ? 'global' : 'local' });
  }

  async loadBundle(): Promise<Bundle | null> {
    const db = await this.db();
    const [p, a, t, r] = await Promise.all([
      db.from('profiles').select('*').maybeSingle(),
      db.from('accounts').select('*'),
      db.from('transactions').select('*').order('date'),
      db.from('recurring_items').select('*'),
    ]);
    for (const res of [p, a, t, r]) if (res.error) throw new Error('load_failed');
    if (!p.data) return null;
    const row = p.data as Record<string, unknown>;
    return {
      profile: {
        nickname: (row.nickname as string | null) ?? undefined,
        noticeVersion: (row.notice_version as string | null) ?? undefined,
        sample: row.sample as boolean,
        onboardingStep: row.onboarding_step as number,
        adultConfirmedAt: row.adult_confirmed_at as string,
        source: row.source as Bundle['profile']['source'],
        balanceDate: (row.balance_date as string | null) ?? undefined,
        seededOn: row.seeded_on as string,
        billDecisions: row.bill_decisions as Bundle['profile']['billDecisions'],
        flexibleGroups: row.flexible_groups as Bundle['profile']['flexibleGroups'],
        movableBills: row.movable_bills as string[],
        createdAt: row.created_at as string,
        updatedAt: row.updated_at as string,
      },
      accounts: (a.data ?? []).map((x: Record<string, unknown>) => ({ id: x.id, kind: x.kind, name: x.name, balance: Number(x.balance) }) as Account),
      transactions: (t.data ?? []).map(
        (x: Record<string, unknown>) =>
          ({
            id: x.id,
            date: x.date,
            description: x.description,
            amount: Number(x.amount),
            category: x.category,
            ...(x.one_off ? { oneOff: true } : {}),
            ...(x.estimated ? { estimated: true } : {}),
            ...(x.account_id ? { accountId: x.account_id } : {}),
          }) as Transaction,
      ),
      obligations: (r.data ?? []).map(
        (x: Record<string, unknown>) => ({ id: x.id, kind: x.kind, name: x.name, amount: Number(x.amount), every: x.every, nextDate: x.next_date, movable: x.movable }) as Obligation,
      ),
    };
  }

  async saveBundle(b: Bundle): Promise<void> {
    const db = await this.db();
    const user_id = await this.uid();
    const p = b.profile;
    const check = (res: { error: unknown }) => {
      if (res.error) throw new Error('save_failed');
    };
    check(
      await db.from('profiles').upsert({
        user_id,
        nickname: p.nickname ?? null,
        notice_version: p.noticeVersion ?? null,
        adult_confirmed_at: p.adultConfirmedAt,
        sample: Boolean(p.sample),
        onboarding_step: p.onboardingStep ?? 0,
        source: p.source,
        balance_date: p.balanceDate ?? null,
        seeded_on: p.seededOn,
        bill_decisions: p.billDecisions ?? {},
        flexible_groups: p.flexibleGroups ?? [],
        movable_bills: p.movableBills ?? [],
      }),
    );
    // Small tables are replaced whole. Row-level security limits the delete to this person's rows.
    for (const [table, rows] of [
      ['accounts', b.accounts.map((a) => ({ user_id, id: a.id, kind: a.kind, name: a.name, balance: a.balance }))],
      [
        'transactions',
        b.transactions.map((t) => ({ user_id, id: t.id, date: t.date, description: t.description, amount: t.amount, category: t.category, one_off: Boolean(t.oneOff), estimated: Boolean(t.estimated), account_id: t.accountId ?? null })),
      ],
      ['recurring_items', b.obligations.map((o) => ({ user_id, id: o.id, kind: o.kind, name: o.name, amount: o.amount, every: o.every, next_date: o.nextDate, movable: o.movable }))],
    ] as const) {
      check(await db.from(table).delete().eq('user_id', user_id));
      for (let i = 0; i < rows.length; i += 500) check(await db.from(table).insert(rows.slice(i, i + 500) as never[]));
    }
  }

  async addConsent(c: Omit<ConsentRecord, 'decidedAt'>): Promise<ConsentRecord> {
    const db = await this.db();
    const { data, error } = await db
      .from('consent_records')
      .insert({ user_id: await this.uid(), core: c.core, messages: c.messages, analytics: c.analytics, notice_version: c.noticeVersion ?? null })
      .select('decided_at')
      .single();
    if (error) throw new Error('save_failed');
    return { ...c, decidedAt: (data as { decided_at: string }).decided_at };
  }

  async listConsent(): Promise<ConsentRecord[]> {
    const { data, error } = await (await this.db()).from('consent_records').select('*').order('decided_at', { ascending: false });
    if (error) throw new Error('load_failed');
    return (data ?? []).map((x: Record<string, unknown>) => ({
      core: x.core as boolean,
      messages: x.messages as boolean,
      analytics: x.analytics as boolean,
      noticeVersion: (x.notice_version as string | null) ?? undefined,
      decidedAt: x.decided_at as string,
    }));
  }

  async addAudit(type: AuditType, params?: AuditEntry['params']): Promise<AuditEntry> {
    const { data, error } = await (await this.db())
      .from('audit_log')
      .insert({ user_id: await this.uid(), type, params: params ?? {} })
      .select('id, at')
      .single();
    if (error) throw new Error('save_failed');
    const row = data as { id: string; at: string };
    return { id: row.id, at: row.at, type, params };
  }

  async listAudit(): Promise<AuditEntry[]> {
    const { data, error } = await (await this.db()).from('audit_log').select('id, at, type, params').order('at', { ascending: false }).limit(200);
    if (error) throw new Error('load_failed');
    return (data ?? []) as AuditEntry[];
  }

  async addReview(r: Omit<ReviewRequest, 'id' | 'at'>): Promise<ReviewRequest> {
    const { data, error } = await (await this.db())
      .from('review_requests')
      .insert({ user_id: await this.uid(), ...r })
      .select('id, at')
      .single();
    if (error) throw new Error('save_failed');
    return { ...r, ...(data as { id: string; at: string }) };
  }

  async listReviews(): Promise<ReviewRequest[]> {
    const { data, error } = await (await this.db()).from('review_requests').select('id, at, reason, details, contact, headline').order('at', { ascending: false });
    if (error) throw new Error('load_failed');
    return (data ?? []) as ReviewRequest[];
  }

  async exportAll(): Promise<unknown> {
    const { data, error } = await (await this.db()).rpc('export_my_data');
    if (error) throw new Error('export_failed');
    return data;
  }

  async deleteAccount(): Promise<DeletionReceipt> {
    const db = await this.db();
    const { data, error } = await db.rpc('delete_my_account');
    if (error) throw new Error('delete_failed');
    const row = data as { id: string; at: string; transactions_removed: number; audit_entries_removed: number };
    await db.auth.signOut({ scope: 'local' });
    return { id: row.id, personaId: 'own', at: row.at, transactionsRemoved: row.transactions_removed, auditEntriesRemoved: row.audit_entries_removed };
  }
}
