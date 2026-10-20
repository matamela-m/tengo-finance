import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SCHEMA_VERSION } from '../data/localRepository';
import { clearDiagnostics, readDiagnostics, storageBytes, type DiagEntry } from '../lib/diagnostics';
import { useSession } from '../store/session';
import { useAnnounce } from './A11y';
import { Icon } from './Icon';

/**
 * A local diagnostic panel for support: build, storage use, offline status and recent error names.
 * Nothing here is personal data, and nothing is sent; "Copy" puts the same text on the clipboard so a
 * person can choose to share it.
 */
export function DiagnosticsCard() {
  const { t } = useTranslation();
  const announce = useAnnounce();
  const language = useSession((s) => s.language);
  const [entries, setEntries] = useState<DiagEntry[]>(() => readDiagnostics());
  const [offline, setOffline] = useState<string>('…');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    setEntries(readDiagnostics());
    if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) {
      setOffline(t('diag.offlineNo'));
      return;
    }
    void caches.keys().then((keys) => setOffline(keys.filter((k) => k.startsWith('tengo-')).join(', ') || t('diag.offlineNo')));
  }, [open, t]);

  const lines = [
    `${t('diag.build')}: ${__BUILD_ID__}`,
    `${t('diag.schema')}: ${SCHEMA_VERSION}`,
    `${t('diag.storage')}: ${(storageBytes() / 1024).toFixed(1)} KB`,
    `${t('diag.offline')}: ${offline}`,
    `${t('diag.language')}: ${language}`,
    `${t('diag.errors')}: ${entries.length}`,
    ...entries.slice(-5).map((e) => `  ${e.at} ${e.kind} ${e.name} ${e.where}`),
  ];

  return (
    <section className="card p-5 sm:p-6" aria-labelledby="diag-title">
      <div className="flex items-center justify-between gap-3">
        <h2 id="diag-title" className="flex items-center gap-2 font-heading text-h3 text-ink">
          <Icon name="activity" size={18} className="text-accent" />
          {t('diag.title')}
        </h2>
        <button type="button" className="btn-ghost -mr-3 min-h-[44px] px-3 text-sm text-muted" aria-expanded={open} aria-controls="diag-body" onClick={() => setOpen((v) => !v)}>
          <Icon name={open ? 'chevronDown' : 'chevronRight'} size={16} />
          {open ? t('diag.hide') : t('diag.show')}
        </button>
      </div>
      <p className="mt-1 text-sm text-muted">{t('diag.lead')}</p>
      {open && (
        <div id="diag-body">
          <pre className="num mt-3 overflow-x-auto whitespace-pre-wrap rounded-xl bg-surface-2 p-3 text-xs text-ink">{lines.join('\n')}</pre>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className="btn-secondary min-h-[44px]"
              onClick={() => void navigator.clipboard?.writeText(lines.join('\n')).then(() => announce(t('diag.copied')))}
            >
              {t('diag.copy')}
            </button>
            <button
              type="button"
              className="btn-ghost min-h-[44px]"
              onClick={() => {
                clearDiagnostics();
                setEntries([]);
                announce(t('diag.cleared'));
              }}
            >
              {t('diag.clear')}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
