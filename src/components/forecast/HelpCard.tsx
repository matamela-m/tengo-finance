import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useReadyPersona } from '../../data/PersonaProvider';
import { helpPlan } from '../../engine/help';
import { formatZAR } from '../../lib/format';
import { useDates } from '../../lib/useLang';
import { Icon, type IconName } from '../Icon';
import { IconTile } from '../ui';

/** Concrete ways to move up one cover state, or how much is free to set aside when covered. */
export function HelpCard() {
  const { t } = useTranslation();
  const d = useDates();
  const { record, today } = useReadyPersona();
  const [showAll, setShowAll] = useState(false);
  const plan = useMemo(() => helpPlan({ transactions: record.transactions, balance: record.balance, today }), [record, today]);

  if (!plan.target) {
    return (
      <section className="card p-5 sm:p-6" aria-labelledby="help-title">
        <div className="flex items-center gap-3">
          <IconTile name="sparkle" tone="enough" />
          <h2 id="help-title" className="font-heading text-h3 text-ink">
            {t('help.coveredTitle')}
          </h2>
        </div>
        <p className="mt-3 text-[15px]">
          {plan.canSetAside > 0 ? t('help.setAside', { amount: formatZAR(plan.canSetAside) }) : t('help.coveredBody')}
        </p>
        <Link to="/app/plan" className="btn-ghost -ml-3 mt-2 text-sm">
          {t('help.tryInPlan')}
          <Icon name="chevronRight" size={16} />
        </Link>
      </section>
    );
  }

  const ideas: { icon: IconName; text: string }[] = [];
  const until = plan.until ? d.dayShort(plan.until) : '';
  if (plan.billToMove) {
    ideas.push({ icon: 'calendar', text: t('help.moveBill', { name: plan.billToMove.description, amount: formatZAR(plan.billToMove.amount), date: until }) });
  }
  if (plan.dailyCut > 0) ideas.push({ icon: 'arrowDown', text: t('help.dailyCut', { amount: formatZAR(plan.dailyCut), date: until }) });
  if (plan.extraNeeded > 0) ideas.push({ icon: 'plus', text: t('help.extra', { amount: formatZAR(plan.extraNeeded), date: until }) });

  const [first, ...rest] = ideas;
  return (
    <section className="card p-5 sm:p-6" aria-labelledby="help-title">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 id="help-title" className="font-heading text-h3 text-ink">
          {t('help.title')}
        </h2>
        <p className="text-sm text-muted">{t('help.toReachState', { state: t(`state.${plan.target}`) })}</p>
      </div>
      <ul className="mt-3 divide-y divide-line">
        {[first, ...(showAll ? rest : [])].filter(Boolean).map((idea) => (
          <li key={idea!.text} className="flex items-start gap-3 py-3 text-[15px] text-ink">
            <Icon name={idea!.icon} size={18} className="mt-0.5 shrink-0 text-accent" />
            <span className="num">{idea!.text}</span>
          </li>
        ))}
      </ul>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        {rest.length > 0 && (
          <button type="button" className="btn-ghost -ml-3 min-h-[44px] px-3 text-sm text-muted" aria-expanded={showAll} onClick={() => setShowAll((v) => !v)}>
            <Icon name={showAll ? 'chevronDown' : 'chevronRight'} size={16} />
            {showAll ? t('help.fewer') : t('help.more', { count: rest.length })}
          </button>
        )}
        <Link to="/app/plan" className="btn-ghost min-h-[44px] px-3 text-sm text-accent">
          {t('help.tryInPlan')}
          <Icon name="arrowRight" size={16} />
        </Link>
      </div>
    </section>
  );
}
