import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useReadyPersona } from '../../data/PersonaProvider';
import { helpPlan } from '../../engine/help';
import { formatZAR } from '../../lib/format';
import { useDates } from '../../lib/useLang';
import { Icon, type IconName } from '../Icon';
import { StateChip } from '../StateChip';
import { IconTile } from '../ui';

/** Concrete ways to move up one cover state, or how much is free to set aside when covered. */
export function HelpCard() {
  const { t } = useTranslation();
  const d = useDates();
  const { record, today } = useReadyPersona();
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

  return (
    <section className="card p-5 sm:p-6" aria-labelledby="help-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="help-title" className="font-heading text-h3 text-ink">
          {t('help.title')}
        </h2>
        <span className="flex items-center gap-1.5 text-sm text-muted">
          {t('help.toReach')}
          <StateChip state={plan.target} size="sm" />
        </span>
      </div>
      <p className="mt-1 text-sm text-muted">{t('help.lead')}</p>
      <ul className="mt-4 space-y-2.5">
        {ideas.map((idea) => (
          <li key={idea.text} className="flex items-start gap-3 rounded-xl border border-line bg-surface-2 px-3.5 py-3 text-[15px]">
            <IconTile name={idea.icon} tone="accent" size={30} />
            <span className="num">{idea.text}</span>
          </li>
        ))}
      </ul>
      <Link to="/app/plan" className="btn-secondary mt-4 w-full sm:w-auto">
        <Icon name="sliders" size={18} />
        {t('help.tryInPlan')}
      </Link>
    </section>
  );
}
