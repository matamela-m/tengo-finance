"""Report charts from the evaluated model (model-values.json), findings.csv and reviewer scores."""
import csv
import json
import re
from pathlib import Path

import matplotlib

matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.ticker

OUT = Path('docs/review/report/charts')
OUT.mkdir(parents=True, exist_ok=True)
V = json.load(open('docs/review/tools/synthesis/model-values.json'))
INK, MUTED, ACCENT, GOOD, WARN, BAD = '#1C1B19', '#66635D', '#3755CC', '#046E50', '#9B4708', '#A9390A'
SCEN = [('Conservative', BAD), ('Base', ACCENT), ('Ambitious', GOOD)]
plt.rcParams.update({'font.family': 'DejaVu Sans', 'font.size': 10, 'axes.edgecolor': '#D6D3CD', 'axes.labelcolor': INK,
                     'xtick.color': MUTED, 'ytick.color': MUTED, 'axes.spines.top': False, 'axes.spines.right': False})


def v(key):
    x = V.get(key)
    return x if isinstance(x, (int, float)) else 0.0


def save(fig, name):
    fig.tight_layout()
    fig.savefig(OUT / name, dpi=200)
    plt.close(fig)


# 1. Cumulative cash, 24 months
fig, ax = plt.subplots(figsize=(8, 3.6))
for (name, color), start in zip(SCEN, (4, 20, 36)):
    row = start + 7
    ys = [v(f'Projection!{chr(ord("B") + i)}{row}') / 1e6 for i in range(24)]
    ax.plot(range(1, 25), ys, label=name, color=color, lw=2)
ax.axhline(0, color=MUTED, lw=0.8, ls='--')
ax.set_xlabel('Month')
ax.set_ylabel('Cumulative cash (R million)')
ax.set_title('Model (a), one partner bank: cumulative cash by scenario', loc='left', fontsize=11, color=INK)
ax.legend(frameon=False)
save(fig, 'cumulative-cash.png')

# 2. Tornado: break-even MAU for model (a)
labels = {'lic_fee_per_mau': 'Licence fee per MAU', 'team_fixed': 'Team cost', 'compliance_fixed': 'Compliance cost',
          'support_per_mau': 'Support per MAU', 'hosting_per_mau': 'Hosting per MAU', 'msgs_per_month': 'Messages per month',
          'tokens_out_msg': 'LLM output tokens', 'llm_out_price': 'LLM output price', 'usd_zar': 'Rand per dollar'}
base = v('Sensitivity!G4')
rows = []
for i, key in enumerate(labels, start=5):
    lo, hi = V.get(f'Sensitivity!D{i}'), V.get(f'Sensitivity!E{i}')
    rows.append((labels[key], lo if isinstance(lo, (int, float)) else None, hi if isinstance(hi, (int, float)) else None))
rows.sort(key=lambda r: -abs((r[2] or base * 3) - (r[1] or base * 3)))
fig, ax = plt.subplots(figsize=(8, 3.8))
cap = max([x for r in rows for x in r[1:] if x is not None] + [base]) * 1.08
for y, (lab, lo, hi) in enumerate(reversed(rows)):
    lo_v = lo if lo is not None else cap
    hi_v = hi if hi is not None else cap
    ax.barh(y, lo_v - base, left=base, color=BAD if lo_v > base else GOOD, height=0.6)
    ax.barh(y, hi_v - base, left=base, color=BAD if hi_v > base else GOOD, height=0.6)
    if lo is None or hi is None:
        ax.text(cap * 0.98, y, 'never breaks even', va='center', ha='right', fontsize=8, color='white', fontweight='bold')
ax.set_yticks(range(len(rows)))
ax.set_yticklabels([r[0] for r in reversed(rows)])
ax.axvline(base, color=INK, lw=1)
ax.set_xlim(0, cap)
ax.xaxis.set_major_formatter(matplotlib.ticker.FuncFormatter(lambda x, _: f'{x:,.0f}'))
ax.set_xlabel(f'Active users needed to break even (base {base:,.0f})')
ax.set_title('What moves break-even most, model (a), Base scenario', loc='left', fontsize=11, color=INK)
save(fig, 'tornado-breakeven.png')

# 3. Tornado: bank value per MAU per year
blabels = {'share_users_unpaid': 'Users with unpaid debit orders', 'unpaid_events_per_user': 'Unpaid events per user',
           'unpaid_reduction': 'Reduction in unpaid events', 'bank_cost_per_unpaid': 'Bank cost per unpaid item',
           'sb_unpaid_payt': 'Unpaid fee income lost', 'deposit_uplift': 'Balance uplift', 'nim_on_deposits': 'Margin on deposits',
           'attrition_reduction': 'Lower attrition', 'value_per_customer_year': 'Value per retained customer',
           'contact_avoided': 'Calls avoided', 'cost_per_call': 'Cost per call'}
bbase = v('Sensitivity!G17')
brows = [(blabels[k], v(f'Sensitivity!D{i}'), v(f'Sensitivity!E{i}')) for i, k in enumerate(blabels, start=18)]
brows.sort(key=lambda r: -abs(r[2] - r[1]))
fig, ax = plt.subplots(figsize=(8, 4.2))
for y, (lab, lo, hi) in enumerate(reversed(brows)):
    for val in (lo, hi):
        ax.barh(y, val - bbase, left=bbase, color=GOOD if val > bbase else BAD, height=0.6)
ax.set_yticks(range(len(brows)))
ax.set_yticklabels([r[0] for r in reversed(brows)])
ax.axvline(bbase, color=INK, lw=1)
ax.axvline(60, color=ACCENT, lw=1, ls='--')
ax.text(59, len(brows) - 0.4, 'Base licence the bank pays: R60 per user per year', color=ACCENT, fontsize=8, ha='right')
ax.set_xlabel(f'Value to the bank per active user per year, rand (base R{bbase:,.2f})')
ax.set_title('Bank value case is driven by retention and balances, all assumptions', loc='left', fontsize=11, color=INK)
save(fig, 'tornado-bank-value.png')

# 4. Scenario comparison bars
sc_rows = {'Steady-state MAU': 5, 'MAU to break even (a)': 9}
fig, axes = plt.subplots(1, 3, figsize=(9, 3))
items = [('Contribution per MAU, model (a), R', 8), ('Bank value per MAU per year, R', 15), ('Peak funding need, R million', 21)]
for ax, (title, row) in zip(axes, items):
    vals = [v(f'Scenarios!{c}{row}') for c in 'BCD']
    if 'million' in title:
        vals = [x / 1e6 for x in vals]
    ax.bar([s[0] for s in SCEN], vals, color=[s[1] for s in SCEN])
    ax.axhline(0, color=MUTED, lw=0.8)
    ax.set_title(title, fontsize=9, color=INK)
    ax.tick_params(axis='x', labelsize=8)
    for i, x in enumerate(vals):
        ax.text(i, x, f'{x:,.1f}', ha='center', va='bottom' if x >= 0 else 'top', fontsize=8, color=INK)
save(fig, 'scenarios.png')

# 5. Market funnel (Base)
funnel_keys = [('Irregular earners (total market)', 6000000), ('With account and smartphone', v('Scenarios!C4')),
               ('Partner bank digital customers with irregular income', 8160000 * 0.15),
               ('Shown the feature', 8160000 * 0.15 * 0.6), ('Activated', 8160000 * 0.15 * 0.6 * 0.15), ('Monthly active (steady state)', v('Scenarios!C5'))]
fig, ax = plt.subplots(figsize=(8, 3.2))
names = [k for k, _ in funnel_keys][::-1]
vals = [x for _, x in funnel_keys][::-1]
ax.barh(names, vals, color=ACCENT)
ax.set_xscale('log')
for i, x in enumerate(vals):
    ax.text(x * 1.1, i, f'{x:,.0f}', va='center', fontsize=8, color=INK)
ax.set_xlabel('People (log scale)')
ax.set_title('Base funnel: from irregular earners to active users at one bank', loc='left', fontsize=11, color=INK)
save(fig, 'funnel.png')

# 6. Findings by role and severity, and reviewer scores
rows = list(csv.DictReader(open('docs/review/findings.csv')))
roles = []
for r in rows:
    if r['role'] not in roles:
        roles.append(r['role'])
counts = {role: {s: 0 for s in ('High', 'Medium', 'Low')} for role in roles}
for r in rows:
    counts[r['role']][r['severity']] += 1
fig, ax = plt.subplots(figsize=(8, 4.4))
left = [0] * len(roles)
for sev, color in (('High', BAD), ('Medium', WARN), ('Low', MUTED)):
    vals = [counts[r][sev] for r in roles]
    ax.barh(roles[::-1], vals[::-1], left=left[::-1], color=color, label=sev)
    left = [a + b for a, b in zip(left, vals)]
ax.legend(frameon=False, loc='lower right')
ax.set_xlabel('Findings')
ax.set_title('Findings by reviewer and severity', loc='left', fontsize=11, color=INK)
save(fig, 'findings-by-role.png')

scores = json.load(open('docs/review/report/scores.json'))
fig, ax = plt.subplots(figsize=(8, 4))
names = list(scores.keys())[::-1]
vals = [scores[n] for n in names]
ax.barh(names, vals, color=[GOOD if x >= 6 else WARN if x >= 5 else BAD for x in vals])
for i, x in enumerate(vals):
    ax.text(x + 0.1, i, str(x), va='center', fontsize=9, color=INK)
ax.set_xlim(0, 10)
ax.set_xlabel('Score out of 10')
ax.set_title('Reviewer scores', loc='left', fontsize=11, color=INK)
save(fig, 'scores.png')
print('charts written to', OUT)
