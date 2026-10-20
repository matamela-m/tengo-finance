# Backtest rerun for build 2

A copy of `docs/review/backtest/backtest.ts` with two changes, run against both the old engine (tag `build2-start`) and the build 2 engine. The original results in `docs/review/backtest/results/` are left as published. Read `docs/review/backtest/README.md` first: the same synthetic-data caveat applies.

## Convention changes (applied to both engines)

1. Money that lands on the cut-off day is in the hold-out, not in the balance, so it counts as next money on day 0. The original ignored it, which hid the payday-today case.
2. A second actual run-out adds the small income that really arrived (below the next-money threshold), because the build 2 headline counts a share of it. Errors and false reassurance are reported against both definitions (`err`, `errBg`, `false_reassurance_pct`, `false_reassurance_bg_pct`).

The shown band is now `forecast().band` (calibrated), not the raw pessimistic and optimistic zero dates. Cases where the engine says Not enough to tell are counted in `unclear_pct` and left out of the state and error metrics.

## How to rerun

From the repository root:

```sh
# Build 2 engine. Writes results/.
npx vite-node docs/review/after/backtest/backtest.ts > docs/review/after/backtest/console.txt

# Old engine, same conventions. Extracts the engine at the starting tag into a git-ignored folder first.
rm -rf docs/review/after/backtest/.before-engine && mkdir -p docs/review/after/backtest/.before-engine
git archive build2-start src/engine src/data/seed | tar -x -C docs/review/after/backtest/.before-engine
ENGINE_ROOT=$PWD/docs/review/after/backtest/.before-engine/src OUT=results-before-engine \
  npx vite-node docs/review/after/backtest/backtest.ts > docs/review/after/backtest/console-before-engine.txt

# Stress cases and the comparison tables.
npx vite-node docs/review/after/stress.ts
python3 -I docs/review/after/comparison.py
```

Each backtest run takes about two minutes and is deterministic.

## Files

| File | What it holds |
| --- | --- |
| `backtest.ts` | The rerun, parametrised by `ENGINE_ROOT` and `OUT`. |
| `results/` | Build 2 engine. Same file names as the original. |
| `results-before-engine/` | Old engine under the new conventions. |
| `console*.txt` | Console output of the last runs. |
| `../stress.ts`, `../stress-results.*` | Stress cases rerun with the review's result beside each. |
| `../comparison.py` | Builds the tables in `../COMPARISON.md`. |
