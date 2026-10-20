import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { addDays, localToday, minDate } from '../engine/dates';
import { forecast as runForecast } from '../engine/forecast';
import type { BillDecision, Forecast, ForecastInput, ISODate, Transaction } from '../engine/types';
import { useSession } from '../store/session';
import { repository } from './index';
import type { AuditEntry, AuditType, ConsentRecord, DeletionReceipt, PersonaRecord, ReviewRequest, TransactionPatch } from './repository';
import { getPersona, type PersonaId, type PersonaProfile } from './seed/personas';

type Status = 'idle' | 'loading' | 'ready' | 'error';

interface PersonaContextValue {
  personaId: PersonaId | null;
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
  log: (type: AuditType, params?: AuditEntry['params']) => Promise<void>;
  setConsent: (c: Omit<ConsentRecord, 'decidedAt'>, type?: AuditType, params?: AuditEntry['params']) => Promise<void>;
  replaceHistory: (transactions: Transaction[], balance: number, rows: number, balanceDate?: ISODate) => Promise<void>;
  updateTransaction: (id: string, patch: TransactionPatch, params: AuditEntry['params']) => Promise<void>;
  addTransactions: (transactions: Transaction[], balance?: number) => Promise<void>;
  setBalance: (balance: number) => Promise<void>;
  setBillDecision: (missedBillId: string, decision: BillDecision) => Promise<void>;
  addReview: (r: Omit<ReviewRequest, 'id' | 'at'>) => Promise<ReviewRequest>;
  deleteData: () => Promise<DeletionReceipt>;
}

const Ctx = createContext<PersonaContextValue | null>(null);

export function PersonaProvider({ children }: { children: ReactNode }) {
  const personaId = useSession((s) => s.activePersonaId) as PersonaId | null;
  const profile = getPersona(personaId);
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
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [reviews, setReviews] = useState<ReviewRequest[]>([]);
  const opened = useRef<Set<string>>(new Set());

  const load = useCallback(
    async (id: PersonaId, quiet = false) => {
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
      } catch {
        setStatus('error');
      }
    },
    [today],
  );

  useEffect(() => {
    if (!personaId || !getPersona(personaId)) {
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

  const input = useMemo(() => (record ? forecastInput(record, today) : null), [record, today]);
  const forecast = useMemo(() => (input ? runForecast(input) : null), [input]);

  const value = useMemo<PersonaContextValue>(() => {
    const requireId = () => {
      if (!personaId) throw new Error('No active persona');
      return personaId;
    };
    const refreshAudit = async (id: PersonaId) => setAudit(await repository.getAudit(id));
    return {
      personaId,
      profile,
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
  }, [personaId, profile, today, status, record, consent, input, forecast, audit, reviews, load]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/**
 * Engine input for a stored record. Seeds are always current. An imported statement is forecast as of
 * the day its balance was true, with `now` set so the engine can say how old it is.
 */
export function forecastInput(record: PersonaRecord, today: ISODate): ForecastInput {
  const base = { transactions: record.transactions, balance: record.balance, billDecisions: record.billDecisions };
  if (record.source === 'seed') return { ...base, today };
  const last = record.transactions.reduce<ISODate | null>((m, t) => (m === null || t.date > m ? t.date : m), null);
  const dataEnd = last ? addDays(last, 1) : today;
  // An imported closing balance is true at the start of the day after the statement's last day.
  const asOf = minDate(record.balanceDate ?? (record.source === 'import' ? dataEnd : record.seededOn), today);
  return { ...base, today: asOf, dataEnd: minDate(dataEnd, asOf), now: today };
}

export function usePersona(): PersonaContextValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('usePersona must be used inside PersonaProvider');
  return v;
}

/** For pages that only render once data is ready. */
export function useReadyPersona() {
  const v = usePersona();
  if (!v.record || !v.forecast || !v.input || !v.personaId || !v.profile) throw new Error('Persona data not ready');
  return { ...v, record: v.record, forecast: v.forecast, input: v.input, personaId: v.personaId, profile: v.profile };
}
