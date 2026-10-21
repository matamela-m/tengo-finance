import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { addDays, localToday, minDate } from '../engine/dates';
import { forecast as runForecast } from '../engine/forecast';
import type { BillDecision, Forecast, ForecastInput, ISODate, Transaction } from '../engine/types';
import { useSession } from '../store/session';
import { repository } from './index';
import { StorageError, type StorageProblem } from './localRepository';
import { accountsOf, type Account, type AuditEntry, type AuditType, type ConsentRecord, type DeletionReceipt, type MoneyChange, type OwnProfile, type PersonaRecord, type PlanSettings, type ReviewRequest, type TransactionPatch } from './repository';
import { mergeEstimated } from '../engine/setup';
import { recordDiagnostic } from '../lib/diagnostics';
import i18n from '../i18n';
import { getPersona, isProfileId, OWN_ID, ownProfile, type PersonaProfile, type ProfileId } from './seed/personas';

type Status = 'idle' | 'loading' | 'ready' | 'error';

interface PersonaContextValue {
  personaId: ProfileId | null;
  /** True for the person's own profile, never for the fictional people. */
  isOwn: boolean;
  profile: PersonaProfile | undefined;
  today: ISODate;
  status: Status;
  record: PersonaRecord | null;
  consent: ConsentRecord | null;
  /** The exact engine input behind `forecast`, for what-ifs and help plans on other screens. */
  input: ForecastInput | null;
  forecast: Forecast | null;
  audit: AuditEntry[];
  reviews: ReviewRequest[];
  reload: () => Promise<void>;
  /** A storage failure to show the person, or null. */
  storageProblem: StorageProblem | null;
  dismissStorageProblem: () => void;
  /** After unreadable data: start with empty storage. The unreadable copy is kept on the device. */
  startFresh: () => Promise<void>;
  log: (type: AuditType, params?: AuditEntry['params']) => Promise<void>;
  setConsent: (c: Omit<ConsentRecord, 'decidedAt'>, type?: AuditType, params?: AuditEntry['params']) => Promise<void>;
  replaceHistory: (transactions: Transaction[], balance: number, rows: number, balanceDate?: ISODate) => Promise<void>;
  /** Replaces the history with one estimated from setup answers, balance as of today. */
  saveManualSetup: (transactions: Transaction[], balance: number) => Promise<void>;
  updateTransaction: (id: string, patch: TransactionPatch, params: AuditEntry['params']) => Promise<void>;
  addTransactions: (transactions: Transaction[], balance?: number) => Promise<void>;
  setBalance: (balance: number) => Promise<void>;
  setBillDecision: (missedBillId: string, decision: BillDecision) => Promise<void>;
  setPlanSettings: (settings: PlanSettings) => Promise<void>;
  updateMoney: (change: MoneyChange) => Promise<void>;
  /** Own profile details: nickname, sample flag, onboarding step. Not logged with values. */
  updateProfile: (patch: Partial<OwnProfile>) => Promise<void>;
  /** Cash in or out: an entry on the cash account and a matching change to cash on hand. */
  addCash: (direction: 'in' | 'out', amount: number, note: string) => Promise<void>;
  /** Sets how much cash is on hand now, without an entry. */
  setCashOnHand: (amount: number) => Promise<void>;
  addReview: (r: Omit<ReviewRequest, 'id' | 'at'>) => Promise<ReviewRequest>;
  deleteData: () => Promise<DeletionReceipt>;
}

const Ctx = createContext<PersonaContextValue | null>(null);

export function PersonaProvider({ children }: { children: ReactNode }) {
  const rawId = useSession((s) => s.activePersonaId);
  const personaId: ProfileId | null = isProfileId(rawId) ? rawId : null;
  const isOwn = personaId === OWN_ID;
  const [today, setToday] = useState(() => localToday());
  // "Today" moves on when the app comes back after midnight, so the forecast never sits on yesterday.
  useEffect(() => {
    const check = () => setToday((prev) => (localToday() === prev ? prev : localToday()));
    document.addEventListener('visibilitychange', check);
    const timer = window.setInterval(check, 60_000);
    return () => {
      document.removeEventListener('visibilitychange', check);
      window.clearInterval(timer);
    };
  }, []);
  const [status, setStatus] = useState<Status>('idle');
  const [record, setRecord] = useState<PersonaRecord | null>(null);
  const [consent, setConsentState] = useState<ConsentRecord | null>(null);
  const nickname = record?.personaId === OWN_ID ? record.profile?.nickname : undefined;
  const profile: PersonaProfile | undefined = useMemo(
    () => (isOwn ? ownProfile(nickname, i18n.t('own.you')) : getPersona(personaId)),
    [isOwn, nickname, personaId],
  );
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [reviews, setReviews] = useState<ReviewRequest[]>([]);
  const opened = useRef<Set<string>>(new Set());
  const [problem, setProblem] = useState<StorageProblem | null>(null);

  const load = useCallback(
    async (id: ProfileId, quiet = false) => {
      if (!quiet) setStatus('loading');
      try {
        const [r, c, a, rv] = await Promise.all([
          repository.getRecord(id, today),
          repository.getConsent(id),
          repository.getAudit(id),
          repository.getReviewRequests(id),
        ]);
        setRecord(r);
        setConsentState(c);
        setAudit(a);
        setReviews(rv);
        setStatus('ready');
      } catch (e) {
        if (e instanceof StorageError) setProblem(e.kind);
        setStatus('error');
      }
    },
    [today],
  );

  useEffect(() => {
    if (!personaId) {
      setRecord(null);
      setConsentState(null);
      setStatus('idle');
      return;
    }
    void load(personaId);
  }, [personaId, load]);

  // One access entry per persona per page load, once consent exists.
  useEffect(() => {
    if (!personaId || status !== 'ready' || !consent?.core || opened.current.has(personaId)) return;
    opened.current.add(personaId);
    void repository.appendAudit(personaId, 'session.opened').then(() => repository.getAudit(personaId).then(setAudit));
  }, [personaId, status, consent]);

  // With core consent withdrawn the forecast is not worked out at all, not just hidden (SEC-13).
  const paused = consent?.core === false;
  const input = useMemo(() => (record && !paused ? forecastInput(record, today) : null), [record, today, paused]);
  const forecast = useMemo(() => (input ? runForecast(input) : null), [input]);

  const value = useMemo<PersonaContextValue>(() => {
    const requireId = () => {
      if (!personaId) throw new Error('No active persona');
      return personaId;
    };
    const refreshAudit = async (id: ProfileId) => setAudit(await repository.getAudit(id));
    // Every write goes through this, so a full or blocked storage shows a visible message (TECH-04).
    const guard =
      <A extends unknown[], R>(fn: (...args: A) => Promise<R>) =>
      async (...args: A): Promise<R> => {
        try {
          const out = await fn(...args);
          setProblem(null);
          return out;
        } catch (e) {
          if (e instanceof StorageError) {
            setProblem(e.kind);
            recordDiagnostic('storage', e, window.location.pathname);
          }
          throw e;
        }
      };
    const plain: Omit<PersonaContextValue, 'storageProblem' | 'dismissStorageProblem' | 'startFresh'> = {
      personaId,
      profile,
      isOwn,
      today,
      status,
      record,
      consent,
      input,
      forecast,
      audit,
      reviews,
      reload: async () => {
        if (personaId) await load(personaId, true);
      },
      log: async (type, params) => {
        const id = requireId();
        await repository.appendAudit(id, type, params);
        await refreshAudit(id);
      },
      setConsent: async (c, type = 'consent.changed', params) => {
        const id = requireId();
        setConsentState(await repository.setConsent(id, c));
        await repository.appendAudit(id, type, params);
        await refreshAudit(id);
      },
      replaceHistory: async (transactions, balance, rows, balanceDate) => {
        const id = requireId();
        setRecord(await repository.replaceHistory(id, transactions, balance, balanceDate));
        await repository.appendAudit(id, 'statement.imported', { rows });
        await refreshAudit(id);
      },
      saveManualSetup: async (transactions, balance) => {
        const id = requireId();
        setRecord(await repository.replaceHistory(id, transactions, balance, today, 'manual'));
        await repository.appendAudit(id, 'setup.saved');
        await refreshAudit(id);
      },
      addTransactions: async (transactions, balance) => {
        const id = requireId();
        setRecord(await repository.addTransactions(id, transactions, balance));
        await repository.appendAudit(id, 'transaction.added', { count: transactions.length });
        await refreshAudit(id);
      },
      setBalance: async (balance) => {
        const id = requireId();
        setRecord(await repository.setBalance(id, balance, today));
        await repository.appendAudit(id, 'balance.updated');
        await refreshAudit(id);
      },
      updateProfile: async (patch) => {
        const id = requireId();
        setRecord(await repository.updateProfile(id, patch));
      },
      updateMoney: async (change) => {
        const id = requireId();
        setRecord(await repository.updateMoney(id, change));
        await repository.appendAudit(id, 'money.updated');
        await refreshAudit(id);
      },
      addCash: async (direction, amount, note) => {
        const id = requireId();
        if (!record) return;
        const accounts = withCash(accountsOf(record), (c) => c + (direction === 'in' ? amount : -amount));
        const tx: Transaction = {
          id: `cash-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
          date: today,
          description: note.trim() || (direction === 'in' ? 'Cash in' : 'Cash out'),
          amount: direction === 'in' ? amount : -amount,
          category: direction === 'in' ? 'income' : 'spend',
          accountId: 'cash',
        };
        setRecord(await repository.updateMoney(id, { add: [tx], accounts }));
        // No amounts or notes in the log, only that cash was recorded.
        await repository.appendAudit(id, 'cash.added', { direction });
        await refreshAudit(id);
      },
      setCashOnHand: async (amount) => {
        const id = requireId();
        if (!record) return;
        setRecord(await repository.updateMoney(id, { accounts: withCash(accountsOf(record), () => amount) }));
        await repository.appendAudit(id, 'money.updated');
        await refreshAudit(id);
      },
      setPlanSettings: async (settings) => {
        const id = requireId();
        setRecord(await repository.setPlanSettings(id, settings));
        await repository.appendAudit(id, 'plan.settings');
        await refreshAudit(id);
      },
      setBillDecision: async (missedBillId, decision) => {
        const id = requireId();
        setRecord(await repository.setBillDecision(id, missedBillId, decision));
        // No bill name in the log: the audit trail records that an answer was given, not what was paid.
        await repository.appendAudit(id, 'bill.answered', { answer: decision });
        await refreshAudit(id);
      },
      updateTransaction: async (txId, patch, params) => {
        const id = requireId();
        setRecord(await repository.updateTransaction(id, txId, patch));
        await repository.appendAudit(id, 'transaction.edited', params);
        await refreshAudit(id);
      },
      addReview: async (r) => {
        const id = requireId();
        const saved = await repository.addReviewRequest(id, r);
        setReviews(await repository.getReviewRequests(id));
        await repository.appendAudit(id, 'review.requested');
        await refreshAudit(id);
        return saved;
      },
      deleteData: async () => {
        const id = requireId();
        const receipt = await repository.deletePersona(id);
        // Leave the persona first so no screen tries to render without data.
        useSession.getState().setActivePersona(null);
        opened.current.delete(id);
        setRecord(null);
        setConsentState(null);
        setAudit([]);
        setReviews([]);
        return receipt;
      },
    };
    const wrapped = Object.fromEntries(
      Object.entries(plain).map(([k, v]) => [k, typeof v === 'function' && !['reload'].includes(k) ? guard(v as (...a: unknown[]) => Promise<unknown>) : v]),
    ) as typeof plain;
    return {
      ...wrapped,
      storageProblem: problem,
      dismissStorageProblem: () => setProblem(null),
      startFresh: async () => {
        await repository.startFresh();
        setProblem(null);
        if (personaId) await load(personaId);
      },
    };
  }, [personaId, isOwn, profile, today, status, record, consent, input, forecast, audit, reviews, load, problem]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/**
 * Engine input for a stored record. Seeds are always current. An imported statement is forecast as of
 * the day its balance was true, with `now` set so the engine can say how old it is.
 */
export function forecastInput(record: PersonaRecord, today: ISODate): ForecastInput {
  // Real entries replace estimated ones from the manual setup as they arrive.
  const base = { transactions: mergeEstimated(record.transactions), balance: record.balance, billDecisions: record.billDecisions, obligations: record.obligations };
  if (record.source === 'seed') return { ...base, today };
  const last = record.transactions.reduce<ISODate | null>((m, t) => (m === null || t.date > m ? t.date : m), null);
  const dataEnd = last ? addDays(last, 1) : today;
  // An imported closing balance is true at the start of the day after the statement's last day.
  const asOf = minDate(record.balanceDate ?? (record.source === 'import' ? dataEnd : record.seededOn), today);
  return { ...base, today: asOf, dataEnd: minDate(dataEnd, asOf), now: today };
}

/** Accounts with the cash account changed by `fn`, adding a cash account if there is none. */
function withCash(accounts: Account[], fn: (current: number) => number): Account[] {
  const has = accounts.some((a) => a.kind === 'cash');
  const list = has ? accounts : [...accounts, { id: 'cash', kind: 'cash' as const, name: 'Cash on hand', balance: 0 }];
  return list.map((a) => (a.kind === 'cash' ? { ...a, balance: Math.round(fn(a.balance) * 100) / 100 } : a));
}

export function usePersona(): PersonaContextValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('usePersona must be used inside PersonaProvider');
  return v;
}

/** For pages that need the stored record but not the forecast, so they work while the forecast is paused. */
export function useRecordPersona() {
  const v = usePersona();
  if (!v.record || !v.personaId || !v.profile) throw new Error('Persona data not ready');
  return { ...v, record: v.record, personaId: v.personaId, profile: v.profile };
}

/** For pages that only render once data is ready. */
export function useReadyPersona() {
  const v = usePersona();
  if (!v.record || !v.forecast || !v.input || !v.personaId || !v.profile) throw new Error('Persona data not ready');
  return { ...v, record: v.record, forecast: v.forecast, input: v.input, personaId: v.personaId, profile: v.profile };
}
