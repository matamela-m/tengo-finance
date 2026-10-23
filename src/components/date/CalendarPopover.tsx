import { DayPicker } from 'react-day-picker';
import { useTranslation } from 'react-i18next';
import { INTL_LOCALE } from '../../i18n/languages';
import { useSession } from '../../store/session';
import { Icon } from '../Icon';

// Calendar after shadcn/ui Calendar (MIT), built on react-day-picker (MIT, by Giampaolo Bellavite and
// contributors). Styled with our tokens only; no react-day-picker stylesheet is loaded.

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const fromIso = (s: string | undefined) => (s && /^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(`${s}T12:00:00`) : undefined);

interface Props {
  value: string;
  min?: string;
  onPick: (iso: string) => void;
  onClose: () => void;
}

export default function CalendarPopover({ value, min, onPick, onClose }: Props) {
  const { t } = useTranslation();
  const lang = useSession((s) => s.language);
  // Month and day names come from the same place as every other date in the app: local names where the
  // browser has them (Afrikaans, isiZulu), en-ZA otherwise.
  const locale = INTL_LOCALE[lang];
  const month = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' });
  const weekday = new Intl.DateTimeFormat(locale, { weekday: 'short' });
  const long = new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const selected = fromIso(value);
  const earliest = fromIso(min);

  return (
    <div
      role="dialog"
      aria-label={t('calendar.title')}
      className="absolute right-0 top-full z-30 mt-2 rounded-2xl border border-line bg-surface p-3 shadow-lift"
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          onClose();
        }
      }}
    >
      <DayPicker
        mode="single"
        autoFocus
        weekStartsOn={1}
        selected={selected}
        defaultMonth={selected ?? earliest}
        disabled={earliest ? { before: earliest } : undefined}
        onSelect={(d) => d && onPick(iso(d))}
        formatters={{
          formatCaption: (d) => month.format(d),
          formatWeekdayName: (d) => weekday.format(d),
        }}
        labels={{
          labelNext: () => t('calendar.next'),
          labelPrevious: () => t('calendar.previous'),
          labelDayButton: (d, modifiers) =>
            [long.format(d), modifiers.today ? t('calendar.today') : '', modifiers.selected ? t('calendar.selected') : ''].filter(Boolean).join(', '),
          labelGrid: (d) => month.format(d),
        }}
        components={{
          Chevron: ({ orientation }) => <Icon name={orientation === 'left' ? 'chevronLeft' : 'chevronRight'} size={18} />,
        }}
        classNames={{
          root: 'relative text-ink',
          months: 'relative',
          month: 'space-y-2',
          month_caption: 'flex h-11 items-center px-2 font-heading text-sm font-semibold',
          caption_label: '',
          nav: 'absolute right-0 top-0 z-10 flex gap-1',
          button_previous: 'inline-flex h-11 w-11 items-center justify-center rounded-xl text-ink hover:bg-surface-2 disabled:opacity-40',
          button_next: 'inline-flex h-11 w-11 items-center justify-center rounded-xl text-ink hover:bg-surface-2 disabled:opacity-40',
          month_grid: 'border-collapse',
          weekdays: '',
          weekday: 'h-8 w-11 text-center text-xs font-medium text-muted',
          week: '',
          day: 'p-0 text-center',
          day_button:
            'num h-11 w-11 rounded-xl text-sm text-ink hover:bg-surface-2 disabled:cursor-not-allowed disabled:text-subtle disabled:opacity-60 disabled:hover:bg-transparent',
          today: '[&>button]:font-bold [&>button]:underline [&>button]:underline-offset-4',
          selected: '[&>button]:bg-accent [&>button]:font-semibold [&>button]:text-on-accent [&>button]:hover:bg-accent',
          outside: '[&>button]:text-subtle',
          disabled: '',
          hidden: 'invisible',
        }}
      />
    </div>
  );
}
