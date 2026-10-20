"""Builds the tables in docs/review/after/COMPARISON.md from the backtest and stress CSV files.
Run from the repo root after the two backtest runs and stress.ts: python3 -I docs/review/after/comparison.py
Standard library only. Prints markdown; the README in this folder says how it is used."""
import csv

PUB = 'docs/review/backtest/results/'
OLD = 'docs/review/after/backtest/results-before-engine/'
NEW = 'docs/review/after/backtest/results/'


def rows(path):
    with open(path) as f:
        return list(csv.DictReader(f))


def num(r, k, digits=1):
    v = r.get(k, '')
    if v in ('', None):
        return 'n/a'
    return f'{float(v):.{digits}f}'


def find(table, **kw):
    for r in table:
        if all(r.get(k) == v for k, v in kw.items()):
            return r
    return {}


METRICS = [
    ('Run-out error, outflows only (MAE, days)', 'mae_days'),
    ('Run-out error, with the small income that arrived (MAE, days)', 'mae_bg_days'),
    ('Naive baseline error (MAE, days)', 'baseline_mae_days'),
    ('Band coverage (percent)', 'band_coverage_pct'),
    ('Band width (mean days)', 'band_width_mean'),
    ('State accuracy (percent)', 'state_acc_pct'),
    ('False reassurance, outflows only (percent)', 'false_reassurance_pct'),
    ('False reassurance, with the small income that arrived (percent)', 'false_reassurance_bg_pct'),
    ('Next money error (MAE, days)', 'nm_mae_days'),
    ('Next money inside the shown window (percent)', 'nm_in_window_pct'),
    ('Not enough to tell (percent of cases)', 'unclear_pct'),
]


def headline():
    slice_name = 'other seeds, 90 day history, all balances'
    a, b, c = (find(rows(p + 'summary_headline.csv'), slice=slice_name) for p in (PUB, OLD, NEW))
    out = [f'Slice: {slice_name} (2 160 cases).', '', '| Metric | Published review | Old engine, new conventions | Build 2 engine |', '| --- | --- | --- | --- |']
    for label, k in METRICS:
        out.append(f'| {label} | {num(a, k)} | {num(b, k)} | {num(c, k)} |')
    return '\n'.join(out)


def by_history():
    out = ['| History | Engine | MAE outflows only | MAE with small income | Band coverage | State accuracy | False reassurance | Not enough to tell |', '| --- | --- | --- | --- | --- | --- | --- | --- |']
    old, new = rows(OLD + 'summary_by_history.csv'), rows(NEW + 'summary_by_history.csv')
    for h in ('14', '28', '60', '90'):
        for name, t in (('old', old), ('build 2', new)):
            r = find(t, source='seeds', historyLen=h)
            out.append(f"| {h} days | {name} | {num(r, 'mae_days')} | {num(r, 'mae_bg_days')} | {num(r, 'band_coverage_pct')} | {num(r, 'state_acc_pct')} | {num(r, 'false_reassurance_pct')} | {num(r, 'unclear_pct')} |")
    return '\n'.join(out)


def lead_time():
    order = ['0 to 6', '7 to 13', '14 to 20', '21 to 29']
    old, new = rows(OLD + 'summary_by_lead_time.csv'), rows(NEW + 'summary_by_lead_time.csv')
    out = ['| Days until money actually ran out | Old coverage | Old width | Build 2 coverage | Build 2 width |', '| --- | --- | --- | --- | --- |']
    for b in order:
        o, n = find(old, actualBucket=b), find(new, actualBucket=b)
        out.append(f"| {b} | {num(o, 'band_coverage_pct')} | {num(o, 'band_width_mean')} | {num(n, 'band_coverage_pct')} | {num(n, 'band_width_mean')} |")
    return '\n'.join(out)


def perturbation():
    old, new = rows(OLD + 'perturbation.csv'), rows(NEW + 'perturbation.csv')
    out = ['| Shock in the hold-out | False reassurance, old | Build 2 | Same, with small income, old | Build 2 | Band coverage, old | Build 2 |', '| --- | --- | --- | --- | --- | --- | --- |']
    for o in old:
        n = find(new, perturb=o['perturb'])
        out.append(
            f"| {o['perturb']} | {num(o, 'false_reassurance_pct')} | {num(n, 'false_reassurance_pct')} | {num(o, 'false_reassurance_bg_pct')} | {num(n, 'false_reassurance_bg_pct')} | {num(o, 'band_coverage_pct')} | {num(n, 'band_coverage_pct')} |"
        )
    return '\n'.join(out)


def stress():
    out = ['| Case | Before (review) | After (build 2) |', '| --- | --- | --- |']
    for r in rows('docs/review/after/stress-results.csv'):
        after = f"{r['status']}, {r['headline']}, budget {r['budget']}, room to lend R{r['roomToLend']}"
        if r['notices']:
            after += f", notices: {r['notices']}"
        out.append(f"| {r['id']} {r['scenario']} | {r['before']} | {after} |")
    return '\n'.join(out)


if __name__ == '__main__':
    for title, fn in (('HEADLINE', headline), ('HISTORY', by_history), ('LEAD', lead_time), ('PERTURB', perturbation), ('STRESS', stress)):
        print(f'<!-- {title} -->')
        print(fn())
        print()
