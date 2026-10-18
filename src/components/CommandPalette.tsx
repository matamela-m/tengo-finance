import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { repository } from '../data';
import { PERSONAS } from '../data/seed/personas';
import { LANGUAGES } from '../i18n/languages';
import { NAV } from '../layouts/nav';
import { useSession, type ThemePref } from '../store/session';
import { useAnnounce } from './A11y';
import { Icon, type IconName } from './Icon';

interface Command {
  id: string;
  group: 'pages' | 'people' | 'language' | 'theme';
  label: string;
  hint?: string;
  icon: IconName;
  run: () => void | Promise<void>;
  /** Extra words to match, such as the English name of a language. */
  keywords?: string;
}

/**
 * Ctrl or Cmd plus K: jump to a page, switch person, change language or theme.
 * Follows the combobox pattern: typing filters, arrow keys move, Enter runs, Escape closes,
 * and focus returns to where it was.
 */
export function CommandPalette() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const announce = useAnnounce();
  const id = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const returnTo = useRef<Element | null>(null);
  const setLanguage = useSession((s) => s.setLanguage);
  const setTheme = useSession((s) => s.setTheme);
  const setPersona = useSession((s) => s.setActivePersona);
  const personaId = useSession((s) => s.activePersonaId);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener('keydown', onKey);
    window.addEventListener('tengo:palette', onOpen);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('tengo:palette', onOpen);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    returnTo.current = document.activeElement;
    setQuery('');
    setActive(0);
    const root = document.getElementById('root');
    root?.setAttribute('inert', '');
    root?.setAttribute('aria-hidden', 'true');
    window.setTimeout(() => input.current?.focus(), 0);
    return () => {
      root?.removeAttribute('inert');
      root?.removeAttribute('aria-hidden');
      (returnTo.current as HTMLElement | null)?.focus?.();
    };
  }, [open]);

  const commands = useMemo<Command[]>(() => {
    const pages: Command[] = (personaId ? NAV : []).map((n) => ({
      id: `page-${n.key}`,
      group: 'pages',
      label: t(`nav.${n.key}`),
      icon: n.icon,
      run: () => navigate(n.to),
    }));
    if (!personaId) pages.push({ id: 'page-start', group: 'pages', label: t('picker.title'), icon: 'user', run: () => navigate('/start') });
    const people: Command[] = PERSONAS.map((p) => ({
      id: `person-${p.id}`,
      group: 'people',
      label: t('palette.switchTo', { name: p.name }),
      hint: t(`personas.${p.id}.role`),
      icon: 'refresh',
      run: async () => {
        const consent = await repository.getConsent(p.id);
        setPersona(p.id);
        navigate(consent ? '/app' : '/consent');
      },
    }));
    const languages: Command[] = LANGUAGES.map((l) => ({
      id: `lang-${l.code}`,
      group: 'language',
      label: l.native,
      hint: l.native === l.english ? undefined : l.english,
      icon: 'globe',
      keywords: l.english,
      run: () => {
        setLanguage(l.code);
        announce(t('palette.languageSet', { name: l.native }));
      },
    }));
    const themes: Command[] = (['light', 'dark', 'system'] as ThemePref[]).map((th) => ({
      id: `theme-${th}`,
      group: 'theme',
      label: t('palette.theme', { name: t(`me.themes.${th}`) }),
      icon: th === 'light' ? 'sun' : th === 'dark' ? 'moon' : 'monitor',
      run: () => {
        setTheme(th);
        announce(t('palette.themeSet', { name: t(`me.themes.${th}`) }));
      },
    }));
    return [...pages, ...people, ...languages, ...themes];
  }, [t, navigate, personaId, setPersona, setLanguage, setTheme, announce]);

  const q = query.trim().toLowerCase();
  const results = q ? commands.filter((c) => `${c.label} ${c.hint ?? ''} ${c.keywords ?? ''}`.toLowerCase().includes(q)) : commands;
  const current = results[Math.min(active, results.length - 1)];

  const runCommand = (c: Command | undefined) => {
    if (!c) return;
    setOpen(false);
    void c.run();
  };

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-start justify-center px-4 pt-[12vh]">
      <div className="absolute inset-0 animate-fade bg-scrim backdrop-blur-sm" onClick={() => setOpen(false)} aria-hidden />
      <div role="dialog" aria-modal="true" aria-label={t('palette.title')} className="relative w-full max-w-xl animate-rise overflow-hidden rounded-2xl border border-line bg-surface shadow-lift">
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Icon name="search" size={18} className="shrink-0 text-subtle" />
          <input
            ref={input}
            role="combobox"
            aria-expanded="true"
            aria-controls={`${id}-list`}
            aria-activedescendant={current ? `${id}-${current.id}` : undefined}
            aria-autocomplete="list"
            aria-label={t('palette.search')}
            placeholder={t('palette.placeholder')}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActive((i) => Math.min(i + 1, results.length - 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActive((i) => Math.max(i - 1, 0));
              } else if (e.key === 'Enter') {
                e.preventDefault();
                runCommand(current);
              } else if (e.key === 'Escape') {
                e.preventDefault();
                setOpen(false);
              }
            }}
            className="min-h-[56px] w-full bg-transparent text-base text-ink placeholder:text-subtle focus:outline-none"
          />
          <kbd className="hidden rounded-md border border-line px-1.5 py-0.5 text-xs text-subtle sm:block">Esc</kbd>
        </div>
        <ul id={`${id}-list`} role="listbox" aria-label={t('palette.results')} className="max-h-[50vh] overflow-y-auto p-2">
          {results.length === 0 && (
            <li role="presentation" className="px-3 py-8 text-center text-sm text-muted">
              {t('palette.empty')}
            </li>
          )}
          {results.map((c, i) => {
            const selected = c === current;
            const newGroup = i === 0 || results[i - 1]!.group !== c.group;
            return (
              <li key={c.id} role="presentation">
                {newGroup && (
                  <p role="presentation" className="eyebrow px-3 pb-1 pt-3">
                    {t(`palette.groups.${c.group}`)}
                  </p>
                )}
                <div
                  id={`${id}-${c.id}`}
                  role="option"
                  aria-selected={selected}
                  onMouseMove={() => setActive(i)}
                  onClick={() => runCommand(c)}
                  className={`flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl px-3 text-[15px] ${selected ? 'bg-surface-3 text-ink' : 'text-muted'}`}
                >
                  <Icon name={c.icon} size={17} className={selected ? 'text-accent' : 'text-subtle'} />
                  <span className="flex-1 truncate">{c.label}</span>
                  {c.hint && <span className="truncate text-xs text-subtle">{c.hint}</span>}
                </div>
              </li>
            );
          })}
        </ul>
        <p className="border-t border-line px-4 py-2.5 text-xs text-subtle">{t('palette.help')}</p>
      </div>
    </div>,
    document.body,
  );
}
