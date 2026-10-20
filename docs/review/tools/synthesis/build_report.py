"""Builds docs/review/report/report.html, the source of REPORT.pdf.

All content comes from files in docs/review/. Numbers are read from the evaluated model
(tools/synthesis/model-values.json), the backtest results, the prep outputs and the reviewer files.
Run twice: the second run fills contents page numbers from tools/synthesis/toc-pages.json.
"""
import csv
import html
import json
import re
from pathlib import Path

import markdown

R = Path('docs/review')
OUT = R / 'report' / 'report.html'
NM = Path('node_modules/@fontsource-variable')
V = json.load(open(R / 'tools/synthesis/model-values.json'))
TOC_PAGES = json.load(open(R / 'tools/synthesis/toc-pages.json')) if (R / 'tools/synthesis/toc-pages.json').exists() else {}

ROLES = [
    ('product-lead.md', 'Retail banking product lead'),
    ('technology.md', 'Head of technology and solution architect'),
    ('security-privacy.md', 'Security and privacy lead (POPIA)'),
    ('legal.md', 'Legal and regulatory advisor (South Africa)'),
    ('credit-risk.md', 'Credit and finance risk analyst'),
    ('data-scientist.md', 'Data scientist (forecast validation)'),
    ('ux.md', 'UI and UX designer'),
    ('accessibility.md', 'Accessibility and inclusive design specialist'),
    ('behavioural.md', 'Behavioural economist and financial inclusion researcher'),
    ('localisation.md', 'Localisation and language reviewer'),
    ('commercial.md', 'Product strategist and commercial lead'),
    ('investor.md', 'Investor and sceptic'),
    ('judges.md', 'Hackathon judge panel'),
]
ROLE_IMAGES = {
    'product-lead.md': [('thabo-home-dark-1280', 'Thabo, Home, dark, 1280 px: the date-first answer a bank would embed.')],
    'credit-risk.md': [('ayanda-home-dark-1280', 'Ayanda, Home, dark, 1280 px: Short beside "Safe to spend today R310".')],
    'ux.md': [('ayanda-home-light-390', 'Ayanda, Home, light, 390 px.'), ('thabo-plan-dark-1280', 'Plan opens with a pre-filled R500 what-if and R300 loan.')],
    'accessibility.md': [('thabo-home-light-390', 'Thabo, Home, light, 390 px: fixed tab bar at the bottom.')],
    'security-privacy.md': [('thabo-privacy-light-1280', 'Privacy centre, light, 1280 px.')],
    'legal.md': [('thabo-why-drawer-dark-1280', 'Why this date drawer, where the only "not financial advice" line sits.')],
    'localisation.md': [('picker-light-1280', 'Picker with the language selector.')],
    'behavioural.md': [('lerato-home-light-1280', 'Lerato, Home, light, 1280 px.')],
    'commercial.md': [('landing-dark-1280', 'Landing page, dark, 1280 px.')],
}


def md(text: str) -> str:
    return markdown.markdown(text, extensions=['tables', 'sane_lists'])


def strip_findings_table(text: str) -> str:
    """Reviewer chapters drop the per-reviewer findings table; Appendix A has every finding."""
    return text.split('## Findings table')[0]


def shift_headings(text: str) -> str:
    """Reviewer files use # and ##; inside a chapter they become h3 and h4."""
    text = re.sub(r'^# .*\n', '', text, count=1)
    text = re.sub(r'^### ', '##### ', text, flags=re.M)
    text = re.sub(r'^## ', '### ', text, flags=re.M)
    return text


def v(key):
    x = V.get(key)
    if isinstance(x, (int, float)):
        return x
    try:
        return float(x)
    except (TypeError, ValueError):
        return None


def rand(x, dp=0):
    if x is None:
        return 'n/a'
    s = f'{abs(x):,.{dp}f}'.replace(',', ' ')
    return ('-R' if x < 0 else 'R') + s


def num(x, dp=0):
    return 'n/a' if x is None else f'{x:,.{dp}f}'.replace(',', ' ')


def pct(x, dp=1):
    return 'n/a' if x is None else f'{x * 100:.{dp}f}%'


def img(name, caption, width='100%', folder='img', ext='jpg'):
    return f'<figure><img src="{folder}/{name}.{ext}" style="max-width:{width};max-height:120mm"><figcaption>{html.escape(caption)}</figcaption></figure>'


def chart(path, caption, width='100%'):
    return f'<figure><img src="{path}" style="width:{width}"><figcaption>{html.escape(caption)}</figcaption></figure>'


def table(headers, rows, cls=''):
    h = ''.join(f'<th>{html.escape(str(x))}</th>' for x in headers)
    body = ''.join('<tr>' + ''.join(f'<td>{c}</td>' for c in r) + '</tr>' for r in rows)
    return f'<table class="{cls}"><thead><tr>{h}</tr></thead><tbody>{body}</tbody></table>'


sections = []  # (number, title, html)


def section(no, title, body, page_break=True):
    sections.append((no, title, body, page_break))


# ---------- data ----------
scores = json.load(open(R / 'report/scores.json'))
findings = list(csv.DictReader(open(R / 'findings.csv')))
sev_count = {s: sum(1 for f in findings if f['severity'] == s) for s in ('High', 'Medium', 'Low')}
judge_md = (R / 'judges.md').read_text()
crit = re.findall(r'^\| (Product|Creativity|Usability|Sustainability|Impact|Presentation|Intelligence) \| (\d+) \|', judge_md, flags=re.M)
crit_scores = {c: int(s) for c, s in crit}
crit_total = sum(crit_scores.values())
bt = list(csv.DictReader(open(R / 'backtest/results/summary_headline.csv')))
bt_main = next(r for r in bt if r['slice'].startswith('other seeds, 90 day'))
lh = {n: json.load(open(R / f'prep/lighthouse/{n}.report.json')) for n in ('landing', 'picker')}
perf = json.load(open(R / 'prep/perf-home.json'))
scen = {k: [v(f'Scenarios!{c}{k}') for c in 'BCD'] for k in range(4, 23)}

# ---------- 1. Executive summary ----------
avg = sum(scores.values()) / len(scores)
exec_html = f'''
<div class="limits"><strong>What this review could not establish.</strong> Real user behaviour or comprehension (no user sessions took place);
forecast accuracy on real bank data (the backtest uses synthetic data written to the same assumptions as the engine); legal sign-off
(the legal chapter is a simulated perspective, not legal advice); FNB's internal criteria, systems, data or pricing (all bank figures are public);
real costs at scale; translation quality (no translations exist yet). Every external figure carries a source and access date or is labelled Assumption.</div>
<p class="verdict"><strong>Verdict.</strong> Tengo is a well-built, honest prototype of a distinct idea: give people with irregular income the date their
money runs out, beside the date their next money usually lands. The build is fast, accessible and carefully explained. It is not yet ready for real
users or a bank pilot: the Home screen contradicts itself, the engine misses the moments that matter most for irregular earners (income that stops,
payday, large bills just after payday), some outputs read as permissions or could cause harm, and nothing has been tested with real people or real data.
The 13 reviewers average <strong>{avg:.1f} of 10</strong> (range {min(scores.values())} to {max(scores.values())}); the simulated judge panel scores
<strong>{crit_total} of 70</strong>. They raised <strong>{len(findings)} findings</strong> ({sev_count["High"]} High, {sev_count["Medium"]} Medium, {sev_count["Low"]} Low).</p>
<div class="two">
<div>{table(['Reviewer', 'Score'], [[html.escape(k), str(s)] for k, s in scores.items()], 'compact')}</div>
<div>{table(['Judging criterion', 'Score'], [[c, str(s)] for c, s in crit_scores.items()] + [['<strong>Total</strong>', f'<strong>{crit_total} of 70</strong>']], 'compact')}</div>
</div>
<div class="two">
<div><h4>Top five strengths</h4><ol class="tight">
<li>A distinct, date-first answer for people without a payday, with next money inferred from irregular deposits (PROD, COMM, judge Creativity 7).</li>
<li>A transparent, deterministic engine with 97.6% unit coverage that beats a naive baseline on synthetic data (MAE {float(bt_main["mae_days"]):.1f} against {float(bt_main["baseline_mae_days"]):.1f} days).</li>
<li>An accessible, polished interface: Lighthouse accessibility 100, one axe WCAG 2.2 violation across 15 pages, both themes.</li>
<li>Honest labelling and a privacy-first demo: nothing leaves the device and simulated controls are marked as such.</li>
<li>Fast on a throttled phone: Home in {perf["results"][0]["heroVisibleMs"] / 1000:.1f} s cold, 142 KB of compressed JavaScript.</li>
</ol></div>
<div><h4>Top five risks</h4><ol class="tight">
<li>Home shows Short beside "R310 safe to spend" and a chart saying Enough (R1).</li>
<li>Income that has stopped still counts as coming, so the app can show Enough with high confidence (R3).</li>
<li>"What helps most" can suggest paying a car instalment late; "safe" reads as a promise (R4, R2).</li>
<li>No users, and validation is circular on synthetic data (R8).</li>
<li>No backend, auth or encryption: real data must not be touched yet (R12).</li>
</ol></div></div>
<h4>Top three fixes</h4><ol class="tight">
<li><strong>One rule drives Home</strong> ("Tight until", daily budget not advised when Short, chart labelled "if money lands as usual"): about 4 hours, the largest single score lift (JUDGE-01).</li>
<li><strong>Remove harmful outputs and teach the engine when a pattern breaks</strong> (no late credit or insurance, renamed safe figures, paused-income and no-income rules): about 2 days (JUDGE-03, JUDGE-04).</li>
<li><strong>Make every claim true</strong> (languages "English today", privacy screens as demo statements) and run a six-person comprehension test: 1 hour plus 2 days (JUDGE-02, JUDGE-07).</li>
</ol>
'''
section('1', 'Executive summary', exec_html)

# ---------- 2. Scope and method ----------
checks = (R / 'prep/checks.md').read_text()
scope = f'''
<p>This is an independent, read-only review of Tengo as it stood at commit <code>d114497</code> on 2026-10-20, following <code>REVIEW.md</code>.
No application code, tests or configuration were changed; everything written lives in <code>docs/review/</code>.</p>
<h3>2.1 What was reviewed</h3>
<ul>
<li>The codebase (6 747 lines of application TypeScript, 642 lines of unit tests), README, BRIEF.md and the README "Redesign" section. <code>REVIEW.md</code> refers to <code>docs/BRIEF.md</code> and <code>docs/REDESIGN.md</code>; those files do not exist, so the root <code>BRIEF.md</code> and the README sections were used.</li>
<li>The production build served locally, driven with Playwright. 264 screenshots: every page, both themes, at 390, 768 and 1280 px, for all three personas (<code>docs/review/screens/</code>).</li>
<li>Build, unit tests, lint, i18n, fonts and contrast checks; the full Playwright suite (221 tests); unit coverage; npm audit; bundle sizes; licence summary; Lighthouse mobile; a throttled timing of the in-app Home page.</li>
<li>A persona walkthrough and a fact sheet of what the product does today, shared with every reviewer (Section 3).</li>
</ul>
<h3>2.2 Panel method</h3>
<p>Thirteen reviewers were run as independent agents. Twelve worked in parallel without reading each other's files, so they could not anchor on one another.
The judge panel ran last and was told to use the others' evidence. Each received the same shared instructions: cite a file and line, a screenshot,
a command output or a source URL for every finding; label anything unsourced as Assumption with a range; do not claim to be FNB staff; name at least
three weaknesses; follow the copy rules. Two reviewers (data scientist, commercial) were interrupted by a usage limit; the data scientist's file
was already complete and the commercial reviewer was resumed with its context to finish.</p>
<p>The synthesis checked every reviewer file for required sections, findings tables and copy rules, merged all findings into <code>findings.csv</code>,
and verified the most consequential claims independently (Section 8.2).</p>
<h3>2.3 Check results</h3>
{table(['Check', 'Result'], [['npm run build', 'pass'], ['npm run test (contrast, then 66 unit tests)', 'pass, 116 of 116 contrast pairs'], ['npm run lint (ESLint and dash check)', 'pass'],
['npm run i18n:check', 'pass, 11 locales with identical keys'], ['npm run fonts:check', 'pass'], ['Playwright (screens, flows, phone, axe)', '221 passed'],
['Unit coverage', 'engine 97.6% of statements; all of src 20.0%'], ['npm audit', '12 advisories (2 critical, 5 high, 5 moderate); 2 moderate ship to users']])}
<h3>2.4 Limits</h3>
<p>Everything in the "could not establish" box in Section 1 applies. In addition: the backtest is only as good as the generator; prices and market
figures move, so every one carries an access date; Lighthouse cannot reach in-app pages because it clears storage, so the in-app timing used a
separate Playwright measurement with matching throttling; and LibreOffice was not available, so the financial model's 1 474 formulas were verified
with the Python <code>formulas</code> engine (zero errors) and the workbook is set to recalculate fully when opened in Excel.</p>
'''
section('2', 'Scope, method and limits', scope)

# ---------- 3. Fact sheet ----------
fact = (R / 'prep/fact-sheet.md').read_text()
fact = re.sub(r'^# .*\n', '', fact, count=1)
fact = re.sub(r'^## ', '### ', fact, flags=re.M)
fact_html = md(fact) + '<h3>Screens</h3><div class="grid2">' + ''.join([
    img('landing-dark-1280', 'Landing, dark, 1280 px'), img('picker-light-1280', 'Persona picker, light, 1280 px'),
    img('thabo-home-dark-1280', 'Home for Thabo (Tight), dark'), img('lerato-home-light-1280', 'Home for Lerato (Enough), light'),
    img('ayanda-home-dark-1280', 'Home for Ayanda (Short), dark'), img('thabo-why-drawer-dark-1280', 'Why this date drawer'),
    img('thabo-plan-dark-1280', 'Plan: what-if and loan check'), img('lerato-money-light-1280', 'Money: history, bills and spending'),
    img('ayanda-import-sample-light-1280', 'Import with the sample statement'), img('lerato-inbox-dark-1280', 'Inbox message preview'),
    img('thabo-privacy-light-1280', 'Privacy centre'), img('ayanda-me-dark-1280', 'Me'),
]) + '</div><div class="grid3">' + ''.join([
    img('landing-light-390', 'Landing, phone'), img('thabo-consent-dark-390', 'Consent, phone'), img('ayanda-home-light-390', 'Home, phone'),
]) + '</div>' + md(re.sub(r'^# .*\n', '', (R / 'prep/walkthrough.md').read_text(), count=1).replace('## ', '### '))
section('3', 'What the product does today', fact_html)

# ---------- 4. Reviewer chapters ----------
for i, (fname, title) in enumerate(ROLES, start=1):
    text = (R / fname).read_text()
    body = md(shift_headings(strip_findings_table(text)))
    figs = ''.join(img(n, c, '34%' if n.endswith('-390') else '78%') for n, c in ROLE_IMAGES.get(fname, []))
    section(f'4.{i}', title, f'<p class="meta">Reviewer file: <code>docs/review/{fname}</code>. Findings are listed in full in Appendix A.</p>{figs}{body}')

# ---------- 5. Backtest ----------
bt_readme = (R / 'backtest/README.md').read_text()
stress = (R / 'tools/credit-risk/results.md').read_text() if (R / 'tools/credit-risk/results.md').exists() else ''
TITLE_RE = r"^# .*\n"
bt_readme_html = md(re.sub(TITLE_RE, "", bt_readme, count=1).replace("## ", "#### "))
def stress_table(text):
    lines = [l for l in text.splitlines() if l.startswith('| ')]
    head = [c.strip() for c in lines[0].strip('|').split('|')]
    keep = ['id', 'scenario', 'state', 'headline', 'safe to spend', 'sts vs usual', 'safe to lend', 'observation']
    idx = [head.index(k) for k in keep]
    rows = []
    for l in lines[2:]:
        cells = [c.strip() for c in l.strip().strip('|').split('|')]
        if len(cells) >= len(head):
            rows.append([html.escape(cells[i]) for i in idx])
    return table(['Id', 'Scenario', 'State', 'Headline', 'Safe to spend (R)', 'Versus usual spend', 'Safe to lend (R)', 'Observation'], rows, 'small stress')


stress_html = stress_table(stress) + '<p class="meta">Condensed to the columns that carry the finding. Full table with balances, patterns, spend rates and bills: docs/review/tools/credit-risk/results.md and results.csv.</p>'
bt_rows = [[html.escape(r['slice']), r['n'], f'{float(r["mae_days"]):.2f}', f'{float(r["baseline_mae_days"]):.2f}', f'{float(r["within3_pct"]):.1f}%',
            f'{float(r["band_coverage_pct"]):.1f}%', f'{float(r["state_acc_pct"]):.1f}%', f'{float(r["false_reassurance_pct"]):.1f}%'] for r in bt]
backtest_html = f'''
<p>The data scientist backtested the engine on held-out days generated by the app's own seed generator (method and code in
<code>docs/review/backtest/</code>). The credit risk analyst separately stress-tested edge cases the generator does not produce.
The synthetic data and the engine share assumptions, so these results show internal consistency and relative behaviour, not real-world accuracy (DATA-01).</p>
<h3>5.1 Headline results</h3>
{table(['Slice', 'Cases', 'MAE days', 'Naive MAE', 'Within 3 days', 'Band coverage', 'State accuracy', 'False reassurance'], bt_rows, 'small')}
<p class="meta">Source: <code>docs/review/backtest/results/summary_headline.csv</code>. MAE is mean absolute error in days between the forecast runway date and the actual date
computed the same way on held-out data. Band coverage is how often the actual date fell inside the stated range. State accuracy compares the state shown with
hindsight using the data scientist's 20 percent buffer rule.</p>
<div class="grid2">
{chart('../backtest/charts/error_by_history.png', 'Error grows quickly below 28 days of history.')}
{chart('../backtest/charts/calibration.png', 'Calibration of the range band.')}
{chart('../backtest/charts/state_confusion.png', 'State shown against hindsight.')}
{chart('../backtest/charts/perturbation.png', 'Shocks the generator does not produce.')}
{chart('../backtest/charts/error_distribution.png', 'Distribution of errors in days.')}
{chart('../backtest/charts/band_position.png', 'Where the actual date fell relative to the band.')}
</div>
<h3>5.2 How to rerun</h3>
{bt_readme_html}
<h3>5.3 Edge cases (credit risk stress test)</h3>
<p class="meta">Source: <code>docs/review/tools/credit-risk/results.md</code> and <code>stress.ts</code>, run against the real engine.</p>
{stress_html}
<h3>5.4 What synthetic data does and does not prove</h3>
<p>It shows the engine behaves as designed, is stable across seeds and weekdays, degrades predictably with short histories and beats a naive
baseline when its own assumptions hold. It does not show that real irregular earners spend, earn or pay bills the way the generator assumes;
that the range band is calibrated on real data; or that the states would be right for real people. That needs consented real statements,
a held-out period and the same metrics, before any accuracy claim is made in the pitch.</p>
'''
section('5', 'Forecast backtest', backtest_html)

# ---------- 6. Financial model ----------
def srow(label, k, fmt):
    return [label] + [fmt(x) for x in scen[k]]


model_html = f'''
<p>The model is <code>docs/review/model.xlsx</code>: an Inputs sheet with 120 inputs (each with low, base and high values and a source URL with access date or
the label Assumption), a Model sheet computing every line for three scenarios side by side, a 24 month Projection, Sensitivity tables and Metrics.
Conservative takes the unfavourable end of every range, Ambitious the favourable end. All 1 474 formulas evaluate without errors.
Of the 116 inputs prepared by the commercial reviewer, 69 are sourced, 46 are Assumptions and one (FNB's unpaid debit order fee) could not be sourced.
Bank outcomes are modelled possibilities, not facts.</p>
<h3>6.1 Market sizing</h3>
<p>Stats SA's QLFS for Q2 2026 counts 3.6 million people in informal sector employment and 1.1 million in private households. The total market of adults with
irregular or informal income is an Assumption of 6.0 million (range 4.7 to 9.0 million). With an account and a smartphone, the serviceable market is
{num(scen[4][1])} in the base case. One FNB-sized partner (8.16 million digitally active customers, BusinessDay, 16 September 2026) yields about
{num(scen[5][1])} monthly active users at steady state in the base case ({num(scen[5][0])} conservative, {num(scen[5][2])} ambitious).</p>
{chart('charts/funnel.png', 'Base funnel from irregular earners to monthly active users at one bank (log scale).', '85%')}
<h3>6.2 Unit economics and business models</h3>
{table(['Output', 'Conservative', 'Base', 'Ambitious'], [
    srow('Variable cost per MAU per month, embedded', 6, lambda x: rand(x, 2)),
    srow('Fixed cost per month', 7, rand),
    srow('(a) Bank licence: contribution per MAU per month', 8, lambda x: rand(x, 2)),
    srow('(a) MAU needed to break even', 9, lambda x: 'never' if x is None else num(x)),
    srow('(b) Revenue share: contribution per MAU per month', 10, lambda x: rand(x, 2)),
    srow('(c) Consumer subscription: contribution per MAU per month', 12, lambda x: rand(x, 2)),
    srow('(c) Consumer: lifetime value to acquisition cost', 13, lambda x: 'n/a' if x is None else f'{x:.2f}x'),
    srow('(d) Sponsored: contribution per user per month', 14, lambda x: rand(x, 2)),
])}
<p class="meta">Source: model.xlsx, Scenarios sheet. Blank break-even means contribution is zero or negative, so the model never breaks even.</p>
<p><strong>Which model fits.</strong> (a) a per-active-user licence to a bank, with a pilot fee and an annual platform minimum, is the only model with positive
contribution in the base case and a credible distribution path. (b) revenue share depends on a bank value case that is thin and unproven. (c) a consumer
subscription loses money in every scenario because conversion is low and acquisition is expensive for this segment. (d) sponsorship is a useful secondary
channel for reach outside banks but does not fund a company on its own. This matches the commercial reviewer (COMM verdict).</p>
{chart('charts/scenarios.png', 'Scenario comparison: contribution per MAU (model a), bank value per MAU per year, peak funding need.')}
<h3>6.3 Value to a bank</h3>
<p>Base value to the bank is {rand(scen[15][1], 2)} per active user per year, against a base licence of R60 per user per year: about
{scen[16][1]:.2f} rand of value per rand of licence. The case rests on retention, balances and avoided calls, all Assumptions. Avoided unpaid debit orders also
remove fee income from the bank, which offsets part of the operational saving. A pilot with a control group is the only way to establish this.</p>
{chart('charts/tornado-bank-value.png', 'Which bank value assumptions matter most (base case, one input at a time).')}
<h3>6.4 Break-even, scenarios and sensitivity</h3>
{table(['Model (a), one partner bank', 'Conservative', 'Base', 'Ambitious'], [
    srow('First profitable month', 20, lambda x: 'beyond 24' if x is None else num(x)),
    srow('Peak funding need', 21, rand),
    srow('Cumulative cash at month 24', 22, rand),
])}
{chart('charts/cumulative-cash.png', '24 month cumulative cash for model (a), by scenario.')}
{chart('charts/tornado-breakeven.png', 'What moves break-even most (base case).')}
<p>The licence fee per user dominates: at R2 a month break-even needs about 381 000 active users, at R12 about 29 000. Support cost per user and the team
cost come next. Messaging and LLM costs barely matter when notifications go in-app; paid daily WhatsApp would cost more than the base licence leaves (COMM-03).</p>
'''
section('6', 'Financial model', model_html)

# ---------- 7. Impact ----------
impact_html = f'''
<p>Impact must separate what Tengo produces (outputs) from what changes in people's lives (outcomes). No outcome has been measured.</p>
{table(['Type', 'Metric', 'Base case value', 'How to measure'], [
    ['Output', 'People reached per year (one bank plus a sponsor programme)', num(scen[17][1]), 'Activated users and sponsor sign-ups'],
    ['Output', 'Forecasts viewed, messages opted in', 'not measured', 'Consented product analytics'],
    ['Outcome', 'Days of cover gained per year (all users)', num(scen[18][1]), 'Forecast date against actual run-out, before and after'],
    ['Outcome', 'Short episodes avoided per year', 'Assumption: 0.5 per user', 'Balance hitting zero before next money, pilot against control'],
    ['Outcome', 'Fees avoided by users per year', rand(scen[19][1]), 'Unpaid debit order and late fees, pilot against control'],
    ['Outcome', 'Confidence that money lasts', 'Assumption: +5 points', 'Survey item below, before and after, with a comparison group'],
])}
<p><strong>Proposed survey item.</strong> "How sure are you that your money will last until your next money?" on a five point scale from "not at all" to
"completely". The baseline proxy from the World Bank Findex 2025 is that 30.8 percent of South African adults could easily raise emergency money in 30 days,
18.3 percent among the poorest 40 percent (model-inputs.md).</p>
<h3>7.1 Measurement plan</h3>
<ol>
<li>Before any pilot: the six-person comprehension test (behavioural chapter) to check people read the date, range and states as intended.</li>
<li>Pilot design: a randomised or matched control group at the partner bank, 3 to 6 months, with outcomes defined in advance.</li>
<li>Track the product metrics in model.xlsx (Metrics sheet): activation, weekly use, day 7 and day 30 retention, imports completed, messages opted in,
field forecast accuracy and state transitions acted on.</li>
<li>Report harms as well as benefits: users who followed "safe to spend" and ran short, anxiety reported with Short, any late payment linked to a suggestion.</li>
</ol>
'''
section('7', 'Impact case and measurement plan', impact_html)

# ---------- 8. Cross-cutting ----------
cross = '''
<h3>8.1 Themes raised by several reviewers</h3>
<ol>
<li><strong>Home contradicts itself.</strong> Raised by product, UX, accessibility, credit risk, behavioural, legal, investor and the judges (PROD-03, UX-01 to UX-04, A11Y-03, RISK-04, BEH-04, LEGAL-08, INV-03). The most cited problem and the cheapest to fix.</li>
<li><strong>The engine misses pattern breaks.</strong> Stopped or absent income, payday morning, stale imported data, bills just after payday (RISK-01 to RISK-03, RISK-10, TECH-01, DATA-02).</li>
<li><strong>Advice-like or harmful outputs.</strong> Late-payment suggestions, "safe" wording, lending framed as safe (LEGAL-01, LEGAL-02, RISK-09, RISK-11, BEH-03).</li>
<li><strong>Claims that are not yet true.</strong> Eleven languages, retention, data minimisation, security ticks (INV-05, L10N-01, SEC-01 to SEC-03).</li>
<li><strong>The money people live on is invisible.</strong> Cash, wallets, stokvels and family transfers (BEH-02, BEH-07, COMM-04, INV-10, PROD-01).</li>
<li><strong>No evidence yet.</strong> No users, synthetic validation, no bank value proof (INV-01, DATA-01, COMM-05).</li>
</ol>
<h3>8.2 Conflicts and how they were resolved</h3>
<table><thead><tr><th>Conflict</th><th>Resolution</th></tr></thead><tbody>
<tr><td>Offline: the accessibility reviewer reports a blank page offline after a first visit (A11Y-02); the app's own Playwright test passes an offline reload.</td>
<td>Both are true. A synthesis test (<code>docs/review/tools/synthesis/offline-matrix.csv</code>) shows offline works only after a second load, because the service worker caches files fetched after it takes control. The app's test reloads before going offline, which hides the gap. A11Y-02 stands.</td></tr>
<tr><td>Novelty: the product lead and commercial lead find no South African bank offering a date-first view for irregular income; the investor says FNB has shown funds after debit orders since 2018.</td>
<td>Compatible. FNB's feature (BusinessTech, 11 June 2018, cited by the investor) shows money after known payments, not a run-out date with inferred next money. The insight is distinct in framing and segment but not defensible as technology (COMM-01, INV-02).</td></tr>
<tr><td>Severity of legal risk: the legal advisor sees low risk for the demo; the credit risk analyst rates the same outputs as High harm.</td>
<td>Both stand: they answer different questions. As a demo with fictional data the legal exposure is low; for real users the harm risk is high. The roadmap treats the fixes as before-submission items because judges will read them as product judgement.</td></tr>
<tr><td>Translation route: the build and earlier guidance assumed Google Cloud Translation covers all 11 languages; the localisation reviewer says it does not support Tshivenda.</td>
<td>Verified on Google's supported-languages page (last updated 2026-10-13, accessed 2026-10-20): Tshivenda is absent; the other nine non-English languages are supported by the standard NMT model. Tshivenda needs a human translator (L10N-02).</td></tr>
<tr><td>Stopped income: the credit risk analyst reports Enough after 35 days without pay.</td>
<td>Confirmed in the analyst's saved run (<code>tools/credit-risk/results.md</code>, case S11: Enough with R1 990 set aside after five missed paydays).</td></tr>
<tr><td>Scores: reviewers range from 4 to 6, with technical roles higher and case-making roles lower.</td>
<td>Not reconciled into one number on purpose. The spread reflects a strong build and a weak case, which is the main message of this report.</td></tr>
</tbody></table>
'''
section('8', 'Cross-cutting themes and conflicts', cross)

# ---------- 9-11 from markdown files ----------
def md_file(path, drop_title=True):
    t = (R / path).read_text()
    if drop_title:
        t = re.sub(r'^# .*\n', '', t, count=1)
    t = re.sub(r'^## ', '### ', t, flags=re.M)
    return md(t)


section('9', 'Risk register', '<div class="small">' + md_file('risk-register.md') + '</div>')
section('10', 'Prioritised roadmap', '<div class="small">' + md_file('ROADMAP.md') + '</div>')
section('11', 'Judge Q&A and demo script', md_file('judge-qa.md'))

# ---------- 12. Appendices ----------
fa_rows = [[f['id'], f['severity'], f['effort'], html.escape(f['title']), html.escape(f['evidence']), html.escape(f['recommendation'])] for f in findings]
appendix_a = table(['Id', 'Severity', 'Effort', 'Finding', 'Evidence', 'Recommendation'], fa_rows, 'tiny findings')

audit = (R / 'prep/audit.md').read_text()
cov = (R / 'prep/coverage.txt').read_text()
cov_table = '\n'.join(l for l in cov.splitlines() if '|' in l and ('%' in l or 'File' in l or 'All files' in l or 'src' in l))[:6000]
pw = (R / 'prep/playwright.txt').read_text()
pw_tail = '\n'.join(pw.strip().splitlines()[-3:])
checks_html = md(re.sub(TITLE_RE, "", checks, count=1).replace("## ", "##### ").replace("(!)", "(warning)"))
audit_html = md(re.sub(TITLE_RE, "", audit, count=1).replace("## ", "##### "))
offline_txt = html.escape((R / 'tools/synthesis/offline-matrix.csv').read_text())
appendix_b = f'''
<h4>B.1 Check outputs</h4><p class="small">Tool output is quoted as produced, except that the build warning marker is shown as "(warning)".</p>{checks_html}
<h4>B.2 Playwright</h4><pre>{html.escape(pw_tail)}</pre>
<h4>B.3 Unit coverage</h4><pre class="tiny">{html.escape(cov_table)}</pre>
<h4>B.4 Audit, bundle and licences</h4><div class="small">{audit_html}</div>
<h4>B.5 Home timing under mobile throttling</h4>{table(['Run', 'Date visible', 'First paint', 'DOM ready', 'Transferred'], [[r['run'], f"{r['heroVisibleMs']} ms", f"{r['fcpMs']} ms", f"{r['domContentLoadedMs']} ms", f"{r['transferredKB']} KB"] for r in perf['results']])}
<p class="meta">{html.escape(perf['conditions'])}. Source: docs/review/prep/perf-home.json.</p>
<h4>B.6 Offline matrix</h4><pre>{offline_txt}</pre>
'''
lh_rows = []
for n, r in lh.items():
    c = {k: round(x['score'] * 100) for k, x in r['categories'].items()}
    a = r['audits']
    lh_rows.append([n, c['performance'], c['accessibility'], c['best-practices'], c['seo'], a['first-contentful-paint']['displayValue'],
                    a['largest-contentful-paint']['displayValue'], a['total-blocking-time']['displayValue'], a['cumulative-layout-shift']['displayValue']])
appendix_c = table(['Page', 'Performance', 'Accessibility', 'Best practices', 'SEO', 'FCP', 'LCP', 'TBT', 'CLS'], lh_rows) + \
    f'<p class="meta">Lighthouse {lh["landing"]["lighthouseVersion"]}, mobile form factor, simulated throttling (150 ms RTT, about 1.6 Mbps, 4x CPU). Reports: docs/review/prep/lighthouse/.</p>'
appendix_d = '<p>Production dependencies: MIT 18, SIL Open Font License 1.1 2 (Inter and Figtree), ISC 1, Apache 2.0 1, UNLICENSED 1 (the private Tengo package itself). No copyleft licences ship to users. Source: docs/review/prep/audit.md.</p>'

# Sources: every URL with an access date across reviewer files and model inputs
src = {}
for fname, title in ROLES + [('model-inputs.md', 'Model inputs')]:
    t = (R / fname).read_text()
    for url in re.findall(r'https?://[^\s)\]|>"`,]+', t):
        url = url.rstrip('.;:')
        src.setdefault(url, set()).add(title.split(' (')[0])
src_rows = [[html.escape(u), html.escape(', '.join(sorted(w))), '2026-10-20'] for u, w in sorted(src.items())]
appendix_e = f'<p>{len(src_rows)} distinct URLs cited across the reviewer files and model inputs, all accessed on 2026-10-20 unless the citing file states otherwise.</p>' + table(['URL', 'Cited by', 'Accessed'], src_rows, 'tiny')
glossary = [
    ('Band', 'The likely range for the run-out date, from a heavy week (early) to a light week (late).'),
    ('B2B2C', 'A business sells to a business (a bank) that serves consumers.'),
    ('CAC', 'Customer acquisition cost.'), ('Enough, Tight, Short', 'Tengo cover states: covered until the latest likely next money; covered only on a normal week; runs out before the usual next money.'),
    ('FAIS', 'Financial Advisory and Intermediary Services Act, 2002.'), ('LTV', 'Lifetime value: contribution per user times expected months as a user.'),
    ('MAE', 'Mean absolute error, here in days.'), ('MAU', 'Monthly active user.'), ('NCA', 'National Credit Act, 2005.'),
    ('Next money', 'The next significant deposit, inferred from past deposits.'), ('POPIA', 'Protection of Personal Information Act, 2013.'),
    ('Runway date', "The day the balance reaches zero if spending continues at the usual rate and no new income arrives."),
    ('Safe to spend today', "Balance minus bills before the latest next money, spread over the days until then, rounded down to R5."),
    ('Synthetic data', "Fictional transactions produced by the app's seed generator."), ('WCAG', 'Web Content Accessibility Guidelines.'),
]
appendix_f = table(['Term', 'Meaning'], glossary)
section('12', 'Appendices', '<h3>A. Full findings table</h3>' + appendix_a)
section('12.B', 'Appendix B: Test and audit outputs', appendix_b)
section('12.C', 'Appendix C: Lighthouse results', appendix_c)
section('12.D', 'Appendix D: Licence summary', appendix_d, page_break=False)
section('12.E', 'Appendix E: Source list', appendix_e)
section('12.F', 'Appendix F: Glossary', appendix_f)

# ---------- assemble ----------
font_face = f'''
@font-face {{ font-family: 'Inter'; src: url('../../../{NM}/inter/files/inter-latin-wght-normal.woff2') format('woff2'); font-weight: 100 900; }}
@font-face {{ font-family: 'Inter'; src: url('../../../{NM}/inter/files/inter-latin-ext-wght-normal.woff2') format('woff2'); font-weight: 100 900; unicode-range: U+0100-024F, U+1E00-1EFF; }}
@font-face {{ font-family: 'Figtree'; src: url('../../../{NM}/figtree/files/figtree-latin-wght-normal.woff2') format('woff2'); font-weight: 300 900; }}
'''
css = font_face + '''
@page { size: A4; margin: 18mm 16mm 18mm 16mm; }
body { font-family: Inter, sans-serif; font-size: 9.6pt; line-height: 1.45; color: #1C1B19; }
h1, h2, h3, h4, h5 { font-family: Figtree, Inter, sans-serif; color: #1C1B19; letter-spacing: -0.01em; break-after: avoid; }
h2.chapter { font-size: 22pt; margin: 0 0 6mm; letter-spacing: -0.02em; }
h2.chapter .no { color: #3755CC; margin-right: 6px; }
h3 { font-size: 13pt; margin: 6mm 0 2mm; }
h4 { font-size: 11pt; margin: 4mm 0 1.5mm; }
h5 { font-size: 10pt; margin: 3mm 0 1mm; }
.chapter-start { break-before: page; }
p { margin: 0 0 2.4mm; }
ul, ol { margin: 0 0 2.4mm; padding-left: 5mm; }
li { margin-bottom: 1mm; }
code { font-family: Menlo, monospace; font-size: 8.4pt; background: #F4F3F1; padding: 0 2px; border-radius: 2px; }
pre { font-family: Menlo, monospace; font-size: 7.6pt; background: #F4F3F1; padding: 3mm; white-space: pre-wrap; word-break: break-word; border-radius: 3px; }
table { border-collapse: collapse; width: 100%; margin: 2mm 0 4mm; font-size: 8.6pt; }
th, td { border: 0.5px solid #D6D3CD; padding: 1.4mm 2mm; vertical-align: top; text-align: left; word-break: break-word; }
th { background: #ECEAE6; font-weight: 600; }
tr { break-inside: avoid; }
table.small, .small table { font-size: 7.8pt; }
table.tiny, .tiny { font-size: 6.8pt; }
table.compact td, table.compact th { padding: 0.8mm 2mm; }
figure { margin: 3mm 0 4mm; break-inside: avoid; text-align: center; }
figure img { max-width: 100%; border: 0.5px solid #D6D3CD; border-radius: 3px; }
figcaption { font-size: 7.8pt; color: #66635D; margin-top: 1mm; }
.stress td:nth-child(1), .stress td:nth-child(3) { white-space: nowrap; }
.findings td:nth-child(-n+3), .findings th:nth-child(-n+3) { white-space: nowrap; word-break: normal; }
figure img { width: auto; }
.grid2 figure img { max-width: 100% !important; }
.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 4mm; }
.grid3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4mm; }
.two { display: grid; grid-template-columns: 1fr 1fr; gap: 6mm; }
.limits { border: 1px solid #A9390A; background: #F9ECE7; padding: 3mm 4mm; border-radius: 3px; margin-bottom: 3mm; font-size: 8.8pt; }
.verdict { font-size: 9.8pt; }
.meta { color: #66635D; font-size: 8.2pt; }
ol.tight li, ul.tight li { margin-bottom: 0.6mm; }
.exec { font-size: 9pt; }
.exec h4 { margin-top: 2mm; }
.cover { height: 255mm; display: flex; flex-direction: column; justify-content: space-between; }
.cover h1 { font-size: 40pt; letter-spacing: -0.035em; margin: 40mm 0 4mm; }
.cover .sub { font-size: 15pt; color: #66635D; }
.cover .brand { font-family: Figtree; font-weight: 700; font-size: 18pt; letter-spacing: -0.035em; }
.toc { list-style: none; padding: 0; }
.toc li { display: flex; justify-content: space-between; border-bottom: 0.5px dotted #D6D3CD; padding: 1.2mm 0; margin: 0; }
.toc li.sub { padding-left: 6mm; font-size: 9pt; }
'''

toc_items = []
body_parts = []
for no, title, content, pb in sections:
    anchor = 'sec-' + no.replace('.', '-')
    label = f'{no} {title}' if not no.startswith('12.') else title
    toc_items.append((no, label, anchor))
    cls = 'chapter-start' if pb else ''
    heading = f'<h2 class="chapter" id="{anchor}"><span class="no">{no if not no.startswith("12.") else ""}</span>{html.escape(title)}</h2>'
    wrap = f'<div class="exec">{content}</div>' if no == '1' else content
    body_parts.append(f'<section class="{cls}">{heading}{wrap}</section>')

toc_html = '<ul class="toc">' + ''.join(
    f'<li class="{"sub" if "." in no else ""}"><span>{html.escape(label)}</span><span>{TOC_PAGES.get(anchor, "")}</span></li>'
    for no, label, anchor in toc_items) + '</ul>'

cover = f'''
<section class="cover">
<div><div class="brand">Tengo</div>
<h1>Independent expert review</h1>
<p class="sub">Product, technology, privacy, legal, risk, data, design, accessibility, behaviour, language, commercial and judging perspectives</p></div>
<div><p><strong>Subject:</strong> Tengo, a money app for people with irregular income, entered in the FNB App of the Year hackathon (Financial inclusion and money confidence).</p>
<p><strong>State reviewed:</strong> commit d114497, reviewed 2026-10-20.</p>
<p><strong>Nature of the review:</strong> a structured review by thirteen simulated professional perspectives, run as independent agents, with a synthesis.
No reviewer is or claims to be FNB staff. Nothing here is legal or financial advice. All app data is fictional.</p>
<p><strong>Files:</strong> docs/review/ (REPORT.pdf, findings.csv, ROADMAP.md, risk-register.md, judge-qa.md, model.xlsx, backtest/, reviewer files).</p></div>
</section>
<section class="chapter-start"><h2 class="chapter">Contents</h2>{toc_html}</section>
'''
doc = f'<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Tengo independent review</title><style>{css}</style></head><body>{cover}{"".join(body_parts)}</body></html>'
OUT.write_text(doc)
json.dump([[a, l] for _, l, a in toc_items], open(R / 'tools/synthesis/toc-items.json', 'w'))
print('wrote', OUT, len(doc) // 1024, 'KB', 'sections', len(sections), 'sources', len(src_rows))
