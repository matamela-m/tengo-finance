import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useReadyPersona } from '../../data/PersonaProvider';
import { helpPlan, type Suggestion } from '../../engine/help';
import { formatZAR } from '../../lib/format';
import { useDates } from '../../lib/useLang';
import { Icon, type IconName } from '../Icon';
import { IconTile } from '../ui';

const ICON: Record<Suggestion['kind'], IconName> = { earn: 'plus', trim: 'arrowDown', moveBill: 'calendar' };

/**
 * Ways to move up one cover state, or how much is free to set aside when covered. Only three kinds of
 * idea exist (earn or receive more, trim spending marked flexible, move a bill marked movable), and each
 * says what it assumes. Nothing suggests skipping credit, insurance, rent or school fees, cutting stock
 * or borrowing.
 */
export function HelpCard() {
  const { t } = useTranslation();
  const d = useDates();
  const { input, forecast, record } = useReadyPersona();
  const [showAll, setShowAll] = useState(false);
  const plan = useMemo(() => helpPlan(input, { flexibleGroups: record.flexibleGroups, movableBills: record.movableBills }), [input, record.flexibleGroups, record.movableBills]);

  // Nothing to suggest until Tengo can tell.
  if (forecast.status === 'unclear') return null;

  if (!plan.target) {
    return (
      <section className="card p-5 sm:p-6" aria-labelledby="help-title">
        <div className="flex items-center gap-3">
          <IconTile name="sparkle" tone="enough" />
          <h2 id="help-title" className="font-heading text-h3 text-ink">
            {t('help.coveredTitle')}
          </h2>
        </div>
        <p className="mt-3 text-[15px]">{plan.canSetAside > 0 ? t('help.setAside', { amount: formatZAR(plan.canSetAside) }) : t('help.coveredBody')}</p>
        <p className="mt-2 text-xs text-subtle">{t('help.ideasNote')}</p>
        <Link to="/app/plan" className="btn-ghost -ml-3 mt-2 text-sm">
          {t('help.tryInPlan')}
          <Icon name="chevronRight" size={16} />
        </Link>
      </section>
    );
  }

  const until = plan.until ? d.dayShort(plan.until) : '';
  const state = t(`state.${plan.target}`);
  const text = (s: Suggestion): { main: string; assume: string } => {
    if (s.kind === 'earn') return { main: t('help.earn', { amount: formatZAR(s.amount), date: until }), assume: t('help.earnAssume') };
    if (s.kind === 'trim')
      return {
        main: t('help.trim', { amount: formatZAR(s.perDay), groups: s.groups.map((g) => t(`spending.groups.${g}`).toLowerCase()).join(', '), date: until }),
        assume: s.covers ? t('help.trimAssume') : t('help.trimPartial'),
      };
    return { main: t('help.moveBill', { name: s.bill.description, amount: formatZAR(s.bill.amount), date: until, state }), assume: t('help.moveAssume') };
  };

  const [first, ...rest] = plan.suggestions;
  const shown = [first, ...(showAll ? rest : [])].filter((s): s is Suggestion => Boolean(s));
  return (
    <section className="card p-5 sm:p-6" aria-labelledby="help-title">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 id="help-title" className="font-heading text-h3 text-ink">
          {t('help.title')}
        </h2>
        <p className="text-sm text-muted">{t('help.toReachState', { state })}</p>
      </div>
      <ul className="mt-3 divide-y divide-line">
        {shown.map((s) => {
          const { main, assume } = text(s);
          return (
            <li key={s.kind} className="flex items-start gap-3 py-3 text-[15px] text-ink">
              <Icon name={ICON[s.kind]} size={18} className="mt-0.5 shrink-0 text-link" />
              <span className="num">
                {main}
                <span className="mt-1 block text-sm text-muted">{assume}</span>
              </span>
            </li>
          );
        })}
      </ul>
      {plan.needsFlexible && (
        <p className="mt-1 text-sm text-muted">
          {t('help.markFlexible')}{' '}
          <Link to="/app/money" className="font-medium text-link underline-offset-4 hover:underline">
            {t('help.chooseOnMoney')}
          </Link>
        </p>
      )}
      {plan.current === 'short' && (
        <p className="mt-2 text-sm text-muted">
          {t('help.freeHelp')}{' '}
          <a href="https://www.ncr.org.za" target="_blank" rel="noreferrer noopener" className="font-medium text-link underline-offset-4 hover:underline">
            ncr.org.za
          </a>
        </p>
      )}
      <p className="mt-3 text-xs text-subtle">{t('help.ideasNote')}</p>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        {rest.length > 0 && (
          <button type="button" className="btn-ghost -ml-3 min-h-[44px] px-3 text-sm text-muted" aria-expanded={showAll} onClick={() => setShowAll((v) => !v)}>
            <Icon name={showAll ? 'chevronDown' : 'chevronRight'} size={16} />
            {showAll ? t('help.fewer') : t('help.more', { count: rest.length })}
          </button>
        )}
        <Link to="/app/plan" className="btn-ghost min-h-[44px] px-3 text-sm text-link">
          {t('help.tryInPlan')}
          <Icon name="arrowRight" size={16} />
        </Link>
      </div>
    </section>
  );
}
