import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usePageTitle } from '../lib/usePageTitle';

type Op = '+' | '-' | '×' | '÷';

function apply(a: number, b: number, op: Op): number {
  if (op === '+') return a + b;
  if (op === '-') return a - b;
  if (op === '×') return a * b;
  return b === 0 ? NaN : a / b;
}

/** Up to 10 significant digits, so floating point noise such as 0.1 + 0.2 never shows. */
function show(n: number): string {
  return Number.isFinite(n) ? String(Number(n.toPrecision(10))) : '0';
}

/**
 * The neutral page quick exit lands on: a plain working calculator, so anyone glancing at the screen
 * sees an ordinary phone tool. No brand, no names, no amounts, nothing stored.
 */
export default function ExitPage() {
  const { t } = useTranslation();
  usePageTitle(t('safety.exitTitle'));
  const [display, setDisplay] = useState('0');
  const [stored, setStored] = useState<{ value: number; op: Op } | null>(null);
  const [fresh, setFresh] = useState(true);

  const digit = (d: string) => {
    if (fresh) {
      setDisplay(d === '.' ? '0.' : d);
      setFresh(false);
      return;
    }
    if (d === '.' && display.includes('.')) return;
    if (display.replace(/[-.]/g, '').length >= 12) return;
    setDisplay(display === '0' && d !== '.' ? d : display + d);
  };
  const operate = (op: Op) => {
    const current = Number(display);
    const value = stored && !fresh ? apply(stored.value, current, stored.op) : current;
    setDisplay(show(value));
    setStored({ value, op });
    setFresh(true);
  };
  const equals = () => {
    if (!stored) return;
    setDisplay(show(apply(stored.value, Number(display), stored.op)));
    setStored(null);
    setFresh(true);
  };
  const clear = () => {
    setDisplay('0');
    setStored(null);
    setFresh(true);
  };

  const key = 'flex min-h-[56px] items-center justify-center rounded-2xl text-xl font-medium transition-colors active:scale-[0.97]';
  const plain = `${key} bg-surface-2 text-ink hover:bg-surface-3`;
  const side = `${key} bg-surface-3 text-ink hover:bg-surface-2`;
  const rows: string[][] = [
    ['7', '8', '9', '÷'],
    ['4', '5', '6', '×'],
    ['1', '2', '3', '-'],
    ['0', '.', '=', '+'],
  ];

  return (
    <main id="main" className="mx-auto flex min-h-dvh max-w-sm flex-col px-5 py-10">
      <h1 className="font-heading text-h2 text-ink">{t('safety.exitTitle')}</h1>
      <output aria-live="polite" aria-label={t('safety.calcResult')} className="num mt-8 block truncate rounded-2xl bg-surface px-5 py-6 text-right font-heading text-[40px] font-semibold leading-none text-ink">
        {display}
      </output>
      <div className="mt-4 grid grid-cols-4 gap-2">
        <button type="button" onClick={clear} className={`${side} col-span-4`}>
          {t('safety.calcClear')}
        </button>
        {rows.flat().map((k) =>
          k === '=' ? (
            <button key={k} type="button" onClick={equals} className={`${key} bg-ink text-bg hover:opacity-90`}>
              =
            </button>
          ) : ['+', '-', '×', '÷'].includes(k) ? (
            <button key={k} type="button" onClick={() => operate(k as Op)} className={side}>
              {k}
            </button>
          ) : (
            <button key={k} type="button" onClick={() => digit(k)} className={plain}>
              {k}
            </button>
          ),
        )}
      </div>
      <Link to="/" className="mt-auto self-start pt-10 text-xs text-subtle underline-offset-4 hover:underline">
        {t('safety.exitBack')}
      </Link>
    </main>
  );
}
