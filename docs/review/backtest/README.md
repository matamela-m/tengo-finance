# Tengo forecast backtest

Backtest of `src/engine/forecast.ts` against synthetic histories from `src/data/seed/generate.ts`. Findings and definitions are in `docs/review/data-scientist.md`.

**Read this first.** The generator and the engine were written by the same author with matching assumptions (weekly or interval income, monthly bills on a fixed day, stationary everyday spend). Good numbers here show the engine is internally consistent with the world it was designed for. They are weak evidence of accuracy on real bank statements.

## How to rerun

From the repository root:

```sh
# 1. Backtest (about 1 minute). Writes CSV files to docs/review/backtest/results/.
npx vite-node docs/review/backtest/backtest.ts

# 2. Bootstrap intervals for the headline metrics (standard library only).
python3 -I docs/review/backtest/bootstrap.py

# 3. Charts. Needs matplotlib in any Python 3 environment.
python3 -m venv /tmp/tengo-bt && /tmp/tengo-bt/bin/python -m pip install matplotlib
/tmp/tengo-bt/bin/python -I docs/review/backtest/charts.py
```

Everything is deterministic: same code, same results. The script imports the real engine and generator and changes nothing in `src/`.

## Design in one paragraph

3 personas x 24 cut-off dates (every 15 days from 2025-10-06, so they cover 12 months and rotate through all weekdays). Two data sources: **shipped** is the app's own `generateHistory(persona, cutoff + 30)` split at the cut-off (60 days history, 30 days hold-out); **seeds** is a verified line-for-line copy of the generator's persona rules run with 5 other seeds per cut-off (120 independent paths per persona, 90 days history, 30 days hold-out). The script checks that the copy reproduces `generateHistory` exactly before running. History is truncated to 14, 28, 60 and 90 days and reclassified on the history alone. Six balances per case: three from the app's `startingBalance` (enough, tight, short targets) and three engine-independent ones (7, 14, 21 days of mean daily outflow). Perturbations (shipped, 60 days) change only the hold-out.

## Files

| File | What it holds |
| --- | --- |
| `backtest.ts` | The backtest. |
| `bootstrap.py` | 95 percent bootstrap intervals, resampling independent paths. |
| `charts.py` | Charts from the CSV results. |
| `results/cases.csv` | One row per case (12 528 rows), every input and outcome. |
| `results/summary_headline.csv` | Headline slices. |
| `results/summary_by_persona*.csv`, `summary_by_history.csv`, `summary_by_persona_history*.csv` | Breakdowns. |
| `results/summary_by_lead_time.csv` | By how many days until money actually ran out. |
| `results/summary_by_scenario*.csv` | By balance scenario. |
| `results/perturbation*.csv` | Shocks the generator never produces. |
| `results/state_confusion.csv` | Shown state against hindsight state. |
| `results/calibration_points.csv` | Signed errors and band position per observed case. |
| `results/generator_diversity.csv` | Distinct random paths the shipped generator produces across cut-offs. |
| `results/bootstrap_ci.csv` | Confidence intervals. |
| `results/console.txt` | Console output of the last run. |
| `charts/*.png` | Error distribution, calibration, error by history, state confusion, perturbation, band position. |

## Column meanings in `cases.csv`

Day indices count from the cut-off (day 0 is the cut-off day, the engine's "today"). 180 means beyond the engine horizon.

- `fcCentral`, `fcBandFrom`, `fcBandTo`: engine central zero date and band (heavy path to light path).
- `actualRunway`: first day the balance minus actual outflows (spend and bills, no income) is zero or below; -1 if not within 30 days.
- `err`: `fcCentral - actualRunway`. Positive means the forecast was too late (too optimistic).
- `baselineErr`: same for the naive baseline, balance divided by the mean daily outflow of the last 28 days.
- `bandCovered`: 1 inside the band, 0 outside, empty when undecidable (actual not within 30 days and band reaches past day 29).
- `ranOutWithIncome`: first day the real balance, including real income after day 0, is zero or below.
- `nmActual`: first day from day 1 with income at least the engine's significance threshold (10 percent of typical monthly income from the history).
- `hindState`: Short if the outflow-only balance reached zero before `nmActual`; Enough if at least 20 percent of the outflows of that period was left; Tight otherwise. `hindState10` and `hindState30` use 10 and 30 percent.
- `realShort`: 1 when the real balance with all real income hit zero before the next money.
