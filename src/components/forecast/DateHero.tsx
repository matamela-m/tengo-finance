import { useTranslation } from 'react-i18next';
import type { Forecast } from '../../engine/types';
import { headlineKey } from '../../engine/view';
import { useDates } from '../../lib/useLang';

/** The one number that matters, date first. Re-keys on change so it animates in. */
export function DateHero({ forecast, as: Tag = 'h1', size = 'xl' }: { forecast: Forecast; as?: 'h1' | 'h2' | 'p'; size?: 'xl' | 'md' }) {
  const { t } = useTranslation();
  const d = useDates();
  const label = t(headlineKey(forecast));
  const date = d.dayShort(forecast.headlineDate);
  const spoken = d.weekdayLong(forecast.headlineDate);
  return (
    <Tag className="flex flex-col">
      <span className="text-[15px] font-medium text-muted sm:text-base">
        {label}
        <span className="sr-only"> {spoken}</span>
      </span>
      <span
        key={`${forecast.headlineDate}-${forecast.state}`}
        aria-hidden
        className={`num animate-rise font-heading font-bold leading-[0.95] tracking-[-0.04em] text-ink ${
          size === 'xl' ? 'mt-2 text-[56px] sm:text-[72px] xl:text-[88px]' : 'mt-1 text-[38px] sm:text-[44px]'
        }`}
      >
        {date}
      </span>
    </Tag>
  );
}
