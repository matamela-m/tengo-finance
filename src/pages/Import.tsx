import { useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Notice } from '../components/Feedback';
import { Icon } from '../components/Icon';
import { PageHeader } from '../components/PageHeader';
import { forecastInput, useReadyPersona } from '../data/PersonaProvider';
import type { PersonaRecord } from '../data/repository';
import { addDays } from '../engine/dates';
import { forecast as runForecast } from '../engine/forecast';
import { buildImport, detectMapping, mappingReady, parseAmount, parseCsv, type ColumnMapping, type ParsedFile } from '../lib/csv';
import { formatZAR } from '../lib/format';
import { downloadText, SAMPLE_FILENAME, sampleStatementCsv } from '../lib/sampleStatement';
import { useDates } from '../lib/useLang';
import { headlineKey } from '../engine/view';
import { StateChip } from '../components/StateChip';

const FIELDS: (keyof ColumnMapping)[] = ['date', 'description', 'amount', 'debit', 'credit', 'balance'];

export default function ImportPage() {
  const { t } = useTranslation();
  const d = useDates();
  const navigate = useNavigate();
  const { today, record, replaceHistory } = useReadyPersona();
  const fileInput = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<ParsedFile | null>(null);
  const [fileName, setFileName] = useState('');
  const [mapping, setMapping] = useState<ColumnMapping | null>(null);
  const [balanceText, setBalanceText] = useState('');
  const [readError, setReadError] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = (text: string, name: string) => {
    try {
      const parsed = parseCsv(text);
      if (parsed.headers.length === 0) throw new Error('empty');
      setFile(parsed);
      setFileName(name);
      setMapping(detectMapping(parsed.headers));
      setReadError(false);
    } catch {
      setReadError(true);
      setFile(null);
    }
  };

  const result = useMemo(() => (file && mapping ? buildImport(file, mapping, today) : null), [file, mapping, today]);

  const balanceFromFile = result?.lastBalance ?? null;
  const typedBalance = parseAmount(balanceText);
  const balance = balanceText.trim() ? typedBalance : (balanceFromFile ?? record.balance);
  // A typed balance is today's; otherwise the balance is the statement's own, as of its last day.
  const balanceDate = balanceText.trim() ? today : undefined;
  const preview = useMemo(() => {
    if (!result || result.error || balance === null) return null;
    const draft: PersonaRecord = { ...record, transactions: result.transactions, balance, source: 'import', balanceDate, billDecisions: {} };
    return runForecast(forecastInput(draft, today));
  }, [result, balance, balanceDate, record, today]);

  const confirm = async () => {
    if (!result || result.error || balance === null) return;
    setSaving(true);
    await replaceHistory(result.transactions, balance, result.transactions.length, balanceDate);
    navigate('/app');
  };

  const counts = result
    ? {
        income: result.transactions.filter((x) => x.category === 'income').length,
        spend: result.transactions.filter((x) => x.category === 'spend').length,
        bill: result.transactions.filter((x) => x.category === 'bill').length,
      }
    : null;

  return (
    <>
      <Link to="/app/money" className="btn-ghost -ml-3 mb-2 min-h-[40px] px-3 text-sm">
        <Icon name="chevronLeft" size={16} />
        {t('nav.money')}
      </Link>
      <PageHeader title={t('import.title')} lead={t('import.lead')} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        {/* Step 1: choose */}
        <section className="card h-fit min-w-0 p-6 sm:p-7" aria-labelledby="pick-title">
          <h2 id="pick-title" className="font-heading text-h3 text-ink">
            {t('import.step1')}
          </h2>
          <div className="mt-4 space-y-3">
            <button type="button" className="btn-primary w-full" onClick={() => load(sampleStatementCsv(addDays(today, -1)), SAMPLE_FILENAME)}>
              <Icon name="sparkle" size={18} />
              {t('import.useSample')}
            </button>
            <label className="btn-secondary w-full cursor-pointer focus-within:outline focus-within:outline-[3px] focus-within:outline-offset-2 focus-within:outline-[var(--color-focus)]">
              <Icon name="upload" size={18} />
              {t('import.chooseCsv')}
              <input
                ref={fileInput}
                type="file"
                accept=".csv,text/csv"
                className="sr-only"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (f) load(await f.text(), f.name);
                  if (fileInput.current) fileInput.current.value = '';
                }}
              />
            </label>
            <button type="button" disabled className="btn-secondary w-full" aria-describedby="pdf-note">
              <Icon name="file" size={18} />
              {t('import.pdf')}
            </button>
            <p id="pdf-note" className="sr-only">
              {t('import.pdfNote')}
            </p>
          </div>
          <button type="button" className="btn-ghost -ml-3 mt-3 text-sm" onClick={() => downloadText(SAMPLE_FILENAME, sampleStatementCsv(addDays(today, -1)))}>
            <Icon name="download" size={16} />
            {t('import.downloadSample')}
          </button>
          <Notice tone="ok" icon="lock" className="mt-4">
            {t('import.local')}
          </Notice>
          <div className="mt-5 text-sm text-muted">
            <p className="font-semibold text-ink">{t('import.formatTitle')}</p>
            <p className="mt-1">{t('import.formatBody')}</p>
          </div>
        </section>

        {/* Step 2: map and confirm */}
        <section className="card min-w-0 p-6 sm:p-7" aria-labelledby="map-title">
          <h2 id="map-title" className="font-heading text-h3 text-ink">
            {t('import.step2')}
          </h2>
          {readError && (
            <Notice tone="danger" className="mt-4">
              {t('import.readError')}
            </Notice>
          )}
          {!file || !mapping ? (
            <div className="mt-4 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line px-6 py-12 text-center text-muted">
              <Icon name="file" size={28} />
              <p className="max-w-xs text-sm">{t('import.empty')}</p>
            </div>
          ) : (
            <>
              <p className="mt-1 text-sm text-muted" role="status">
                {fileName} · {t('import.rowsRead', { count: file.rows.length })}
              </p>
              <fieldset className="mt-5">
                <legend className="text-sm font-semibold">{t('import.mapping')}</legend>
                <p className="mt-1 text-sm text-muted">{t('import.mappingHint')}</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  {FIELDS.map((f) => (
                    <div key={f}>
                      <label className="label" htmlFor={`map-${f}`}>
                        {t(`import.field.${f}`)}
                      </label>
                      <select id={`map-${f}`} className="field" value={mapping[f]} onChange={(e) => setMapping({ ...mapping, [f]: e.target.value })}>
                        <option value="">{t('import.none')}</option>
                        {file.headers.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </fieldset>

              {!mappingReady(mapping) && (
                <Notice tone="warn" className="mt-4">
                  {t('import.needMapping')}
                </Notice>
              )}

              {result && !result.error && result.transactions.length > 0 && (
                <>
                  <div className="mt-6 overflow-x-auto rounded-xl border border-line">
                    <table className="data-table min-w-[520px]">
                      <caption className="sr-only">{t('import.previewCaption')}</caption>
                      <thead>
                        <tr>
                          <th scope="col" className="font-semibold">
                            {t('import.field.date')}
                          </th>
                          <th scope="col" className="font-semibold">
                            {t('import.field.description')}
                          </th>
                          <th scope="col" className="text-right font-semibold">
                            {t('import.field.amount')}
                          </th>
                          <th scope="col" className="font-semibold">
                            {t('import.type')}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.transactions.slice(-8).map((tx) => (
                          <tr key={tx.id}>
                            <td className="num whitespace-nowrap">{d.dayMonth(tx.date)}</td>
                            <td className="max-w-[220px] truncate">{tx.description}</td>
                            <td className={`num whitespace-nowrap text-right font-semibold ${tx.amount > 0 ? 'text-enough' : ''}`}>{formatZAR(tx.amount, { sign: true })}</td>
                            <td>{t(`category.${tx.category}`)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-2 text-xs text-muted">{t('import.previewNote', { count: result.transactions.length })}</p>
                </>
              )}

              {result && (
                <div className="mt-5 space-y-3" role="status">
                  {result.skipped > 0 && <Notice tone="warn">{t('import.skipped', { count: result.skipped })}</Notice>}
                  {result.error === 'tooShort' && <Notice tone="danger">{t('import.tooShort', { count: result.days })}</Notice>}
                  {result.error === 'noRows' && <Notice tone="danger">{t('import.noRows')}</Notice>}
                  {!result.error && result.warning === 'wideRange' && <Notice tone="warn">{t('import.wideRange', { count: result.days })}</Notice>}
                  {!result.error && result.shiftedDays > 0 && <Notice>{t('import.shifted', { count: result.shiftedDays })}</Notice>}
                </div>
              )}

              {result && !result.error && counts && (
                <>
                  <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                      [t('import.days'), String(result.days)],
                      [t('category.income'), String(counts.income)],
                      [t('category.spend'), String(counts.spend)],
                      [t('category.bill'), String(counts.bill)],
                    ].map(([k, v]) => (
                      <div key={k} className="rounded-xl bg-surface-2 px-4 py-3">
                        <dt className="eyebrow">{k}</dt>
                        <dd className="num mt-1 font-heading text-[24px] font-bold leading-none tracking-[-0.02em] text-ink">{v}</dd>
                      </div>
                    ))}
                  </dl>

                  <div className="mt-5 grid items-end gap-4 sm:grid-cols-2">
                    <div>
                      <label className="label" htmlFor="balance">
                        {t('import.balance')}
                      </label>
                      <input
                        id="balance"
                        inputMode="decimal"
                        className="field num"
                        placeholder={String(balanceFromFile ?? record.balance)}
                        value={balanceText}
                        onChange={(e) => setBalanceText(e.target.value)}
                        aria-describedby="balance-hint"
                        aria-invalid={balance === null}
                      />
                      <p id="balance-hint" className="mt-1 text-xs text-muted">
                        {balanceFromFile !== null ? t('import.balanceFromFile', { amount: formatZAR(balanceFromFile) }) : t('import.balanceKept', { amount: formatZAR(record.balance) })}
                      </p>
                    </div>
                    {preview && (
                      <div className="rounded-2xl border border-line p-4">
                        <p className="text-xs text-muted">{t('import.result')}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <p className="num font-semibold">
                            {preview.status === 'unclear' ? t('hero.unclear') : `${t(headlineKey(preview))} ${d.dayShort(preview.headlineDate)}`}
                          </p>
                          <StateChip state={preview.status} size="sm" />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <button type="button" className="btn-primary min-h-[52px] flex-1" disabled={saving || balance === null} onClick={() => void confirm()}>
                      <Icon name="check" size={18} />
                      {saving ? t('common.saving') : t('import.confirm')}
                    </button>
                    <button type="button" className="btn-secondary min-h-[52px]" onClick={() => setFile(null)}>
                      {t('common.cancel')}
                    </button>
                  </div>
                  <p className="mt-3 text-xs text-muted">{t('import.replaceNote')}</p>
                </>
              )}
            </>
          )}
        </section>
      </div>
    </>
  );
}
