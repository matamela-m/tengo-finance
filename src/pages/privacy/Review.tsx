import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Notice } from '../../components/Feedback';
import { Icon } from '../../components/Icon';
import { usePersona, useReadyPersona } from '../../data/PersonaProvider';
import type { ReviewRequest } from '../../data/repository';
import { headlineKey } from '../../engine/view';
import { useDates } from '../../lib/useLang';
import { SubPage } from './Sub';

const REASONS = ['date', 'income', 'bill', 'other'] as const;

export default function Review() {
  const { t } = useTranslation();
  const d = useDates();
  const { forecast } = useReadyPersona();
  const { addReview, reviews } = usePersona();
  const [reason, setReason] = useState<(typeof REASONS)[number]>('date');
  const [details, setDetails] = useState('');
  const [contact, setContact] = useState<ReviewRequest['contact']>('inbox');
  const [sent, setSent] = useState<ReviewRequest | null>(null);
  const [busy, setBusy] = useState(false);
  const headline = `${t(headlineKey(forecast))} ${d.dayShort(forecast.headlineDate)} (${t(`state.${forecast.state}`)})`;

  const submit = async () => {
    setBusy(true);
    setSent(await addReview({ reason, details: details.trim(), contact, headline }));
    setBusy(false);
    setDetails('');
  };

  return (
    <SubPage title={t('privacy.links.review.title')} lead={t('privacy.reviewLead')}>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section className="card min-w-0 p-6 sm:p-7" aria-labelledby="review-form">
          <h2 id="review-form" className="font-heading text-h3 text-ink">
            {t('privacy.reviewFormTitle')}
          </h2>
          <p className="mt-1 text-sm text-muted">{t('privacy.reviewAbout', { result: headline })}</p>
          {sent ? (
            <div className="mt-5 space-y-4" role="status">
              <Notice tone="ok">
                <p className="font-semibold">{t('privacy.reviewSent')}</p>
                <p className="mt-1">{t('privacy.reviewRef', { ref: sent.id.toUpperCase() })}</p>
              </Notice>
              <p className="text-sm text-muted">{t('privacy.reviewNext')}</p>
              <button type="button" className="btn-secondary" onClick={() => setSent(null)}>
                {t('privacy.reviewAnother')}
              </button>
            </div>
          ) : (
            <form
              className="mt-5 space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                void submit();
              }}
            >
              <div>
                <label htmlFor="reason" className="label">
                  {t('privacy.reviewReason')}
                </label>
                <select id="reason" className="field" value={reason} onChange={(e) => setReason(e.target.value as (typeof REASONS)[number])}>
                  {REASONS.map((r) => (
                    <option key={r} value={r}>
                      {t(`privacy.reasons.${r}`)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="details" className="label">
                  {t('privacy.reviewDetails')}
                </label>
                <textarea id="details" rows={4} className="field py-3" value={details} onChange={(e) => setDetails(e.target.value)} placeholder={t('privacy.reviewPlaceholder')} />
              </div>
              <fieldset>
                <legend className="label">{t('privacy.reviewContact')}</legend>
                <div className="space-y-2">
                  {(['inbox', 'none'] as const).map((c) => (
                    <label key={c} className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl border border-line px-4 text-[15px]">
                      <input type="radio" name="contact" checked={contact === c} onChange={() => setContact(c)} className="h-4 w-4 accent-[var(--color-accent)]" />
                      {t(`privacy.contact.${c}`)}
                    </label>
                  ))}
                </div>
              </fieldset>
              <button type="submit" className="btn-primary w-full sm:w-auto" disabled={busy}>
                <Icon name="mail" size={18} />
                {busy ? t('common.saving') : t('privacy.reviewSubmit')}
              </button>
              <p className="text-xs text-muted">{t('privacy.reviewSimulated')}</p>
            </form>
          )}
        </section>
        <section className="card h-fit min-w-0 p-6" aria-labelledby="past-reviews">
          <h2 id="past-reviews" className="font-heading text-h3 text-ink">
            {t('privacy.reviewPast')}
          </h2>
          {reviews.length === 0 ? (
            <p className="mt-3 text-sm text-muted">{t('privacy.reviewNone')}</p>
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {reviews.map((r) => (
                <li key={r.id} className="py-3 text-sm">
                  <p className="font-semibold">{t(`privacy.reasons.${r.reason}`)}</p>
                  <p className="text-muted">{r.headline}</p>
                  <p className="num mt-1 text-xs text-muted">
                    {d.stamp(r.at)} · {t('privacy.reviewStatus')}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </SubPage>
  );
}
