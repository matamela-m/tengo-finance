import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { localToday } from '../engine/dates';
import { forecast as runForecast } from '../engine/forecast';
import type { Forecast, ISODate, Transaction } from '../engine/types';
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
  forecast: Forecast | null;
  audit: AuditEntry[];
  reviews: ReviewRequest[];
  reload: () => Promise<void>;
  log: (type: AuditType, params?: AuditEntry['params']) => Promise<void>;
  setConsent: (c: Omit<ConsentRecord, 'decidedAt'>, type?: AuditType, params?: AuditEntry['params']) => Promise<void>;
  replaceHistory: (transactions: Transaction[], balance: number, rows: number) => Promise<void>;
  updateTransaction: (id: string, patch: TransactionPatch, params: AuditEntry['params']) => Promise<void>;
  addReview: (r: Omit<ReviewRequest, 'id' | 'at'>) => Promise<ReviewRequest>;
  deleteData: () => Promise<DeletionReceipt>;
}

const Ctx = createContext<PersonaContextValue | null>(null);

export function PersonaProvider({ children }: { children: ReactNode }) {
  const personaId = useSession((s) => s.activePersonaId) as PersonaId | null;
  const profile = getPersona(personaId);
  const [today] = useState(() => localToday());
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

  const forecast = useMemo(
    () => (record ? runForecast({ transactions: record.transactions, balance: record.balance, today }) : null),
    [record, today],
  );

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
      replaceHistory: async (transactions, balance, rows) => {
        const id = requireId();
        setRecord(await repository.replaceHistory(id, transactions, balance));
        await repository.appendAudit(id, 'statement.imported', { rows });
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
        opened.current.delete(id);
        setRecord(null);
        setConsentState(null);
        setAudit([]);
        setReviews([]);
        return receipt;
      },
    };
  }, [personaId, profile, today, status, record, consent, forecast, audit, reviews, load]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePersona(): PersonaContextValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('usePersona must be used inside PersonaProvider');
  return v;
}

/** For pages that only render once data is ready. */
export function useReadyPersona() {
  const v = usePersona();
  if (!v.record || !v.forecast || !v.personaId || !v.profile) throw new Error('Persona data not ready');
  return { ...v, record: v.record, forecast: v.forecast, personaId: v.personaId, profile: v.profile };
}
