import { useTranslation } from 'react-i18next';
import type { Forecast } from '../../engine/types';
import { useDates } from '../../lib/useLang';

/** The one number that matters, date first. Re-keys on change so it animates in. */
export function DateHero({ forecast, as: Tag = 'h1', size = 'xl' }: { forecast: Forecast; as?: 'h1' | 'h2' | 'p'; size?: 'xl' | 'md' }) {
  const { t } = useTranslation();
  const d = useDates();
  const label = forecast.state === 'short' ? t('hero.shortFrom') : forecast.beyondHorizon ? t('hero.enoughBeyond') : t('hero.enoughUntil');
  const date = d.dayShort(forecast.headlineDate);
  const spoken = d.weekdayLong(forecast.headlineDate);
  return (
    <Tag className="flex flex-col">
      <span className="text-base font-semibold text-muted sm:text-lg">
        {label}
        <span className="sr-only"> {spoken}</span>
      </span>
      <span
        key={`${forecast.headlineDate}-${forecast.state}`}
        aria-hidden
        className={`num animate-rise font-heading font-extrabold leading-[0.95] tracking-tight text-ink ${
          size === 'xl' ? 'mt-1 text-[52px] sm:text-[68px] xl:text-[80px]' : 'mt-0.5 text-[40px] sm:text-[44px]'
        }`}
      >
        {date}
      </span>
    </Tag>
  );
}
