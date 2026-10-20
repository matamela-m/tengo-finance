"""Builds docs/review/model.xlsx: a live-formula financial model for the Tengo review.

Inputs come from docs/review/model-inputs.md (sourced or labelled Assumption) plus a few
model-structure assumptions defined below. Every calculation is an Excel formula.
Scenarios: Conservative takes the unfavourable end of each range, Ambitious the favourable end.
"""
import re
from pathlib import Path

from openpyxl import Workbook
from openpyxl.chart import BarChart, LineChart, Reference
from openpyxl.comments import Comment
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter
from openpyxl.workbook.properties import CalcProperties

BASE = Path('docs/review')
FONT = 'Arial'
BLUE = Font(name=FONT, color='0000FF')
BLACK = Font(name=FONT, color='000000')
GREEN = Font(name=FONT, color='008000')
BOLD = Font(name=FONT, bold=True)
TITLE = Font(name=FONT, bold=True, size=14)
HEAD = Font(name=FONT, bold=True, color='FFFFFF')
HEAD_FILL = PatternFill('solid', fgColor='1F2937')
SECTION_FILL = PatternFill('solid', fgColor='E5E7EB')
YELLOW = PatternFill('solid', fgColor='FFFF00')
THIN = Side(style='thin', color='D1D5DB')
WRAP = Alignment(wrap_text=True, vertical='top')

ZAR0 = '"R"#,##0;("R"#,##0);"-"'
ZAR2 = '"R"#,##0.00;("R"#,##0.00);"-"'
NUM0 = '#,##0;(#,##0);"-"'
NUM2 = '#,##0.00;(#,##0.00);"-"'
PCT = '0.0%;(0.0%);"-"'
USD4 = '"$"#,##0.0000'
RATIO = '0.0"x";(0.0"x");"-"'

# Direction: '+' when a higher value is better for the business case, '-' when worse.
WORSE_WHEN_HIGH = {
    'hosting_per_mau', 'forecast_compute', 'llm_in_price', 'llm_out_price', 'tokens_in_msg', 'tokens_out_msg',
    'msgs_per_month', 'wa_utility', 'wa_marketing', 'wa_bsp_fee', 'sms_price', 'sms_vodacom', 'push_cost',
    'support_per_mau', 'compliance_fixed', 'team_fixed', 'payfast_card_pct', 'payfast_card_fixed',
    'yoco_online_uplift', 'db_base', 'db_mau_overage', 'db_compute', 'db_egress_overage', 'usd_zar',
    'churn_embedded', 'churn_consumer', 'cac_consumer', 'cac_embedded', 'cac_sponsor', 'uninstall_m1', 'cpi_global',
    'pilot_months', 'ramp_months',
}

# Model structure assumptions not in model-inputs.md.
EXTRA = [
    ('pilot_months', 'Months of paid pilot before rollout', 6, 9, 4, 'months', 'Assumption', 'Typical bank pilots run one to two quarters'),
    ('pilot_mau_share', 'Pilot MAU as a share of steady-state MAU', 0.05, 0.02, 0.1, 'fraction', 'Assumption', 'Pilot cohort behind a feature flag'),
    ('ramp_months', 'Months from end of pilot to steady-state MAU', 12, 18, 9, 'months', 'Assumption', 'Linear ramp'),
    ('opening_cash', 'Cash available at month 0', 0, 0, 0, 'ZAR', 'Assumption', 'Set to zero so the projection shows the funding need'),
]


def parse_inputs():
    text = (BASE / 'model-inputs.md').read_text()
    rows = []
    for line in text.splitlines():
        if not line.startswith('| ') or line.startswith('| key') or line.startswith('| ---'):
            continue
        cells = [c.strip() for c in line.strip().strip('|').split('|')]
        if len(cells) < 9:
            continue
        key, desc, val, low, high, unit, src, acc, notes = cells[:9]

        def num(x):
            try:
                return float(x.replace(' ', ''))
            except ValueError:
                return None

        v, lo, hi = num(val), num(low), num(high)
        if v is None:
            continue
        rows.append(dict(key=key, desc=desc, val=v, low=lo if lo is not None else v, high=hi if hi is not None else v,
                         unit=unit, src=src, acc=acc, notes=notes))
    return rows


def style_header(ws, row, headers, widths=None):
    for i, h in enumerate(headers, start=1):
        c = ws.cell(row=row, column=i, value=h)
        c.font = HEAD
        c.fill = HEAD_FILL
        c.alignment = Alignment(wrap_text=True, vertical='center')
    if widths:
        for i, w in enumerate(widths, start=1):
            ws.column_dimensions[get_column_letter(i)].width = w


def build():
    rows = parse_inputs()
    wb = Workbook()

    # ---------- README ----------
    rd = wb.active
    rd.title = 'README'
    rd.column_dimensions['A'].width = 120
    lines = [
        ('Tengo review: financial model', TITLE),
        ('Prepared 2026-10-20 for docs/review/REPORT.pdf. A model of possibilities, not a forecast of results.', BOLD),
        ('', None),
        ('How it works', BOLD),
        ('Inputs: every number the model uses, with low, base and high values, a source URL and access date, or the label Assumption.', None),
        ('Scenarios: Conservative uses the unfavourable end of every range, Base the central value, Ambitious the favourable end (column G gives the direction).', None),
        ('Model: market funnel, unit economics per active user, four business models, value to a bank, impact and break-even, for all three scenarios side by side.', None),
        ('Projection: 24 months for the recommended model (a, bank licence) in each scenario, with monthly and cumulative cash.', None),
        ('Sensitivity: tornado tables for break-even users and for the bank value case, and a two-way table of licence fee against fixed costs.', None),
        ('Metrics: product, forecast-quality, technical and impact metrics, with sources (test outputs and the backtest).', None),
        ('', None),
        ('Colour code', BOLD),
        ('Blue text: hard-coded inputs. Black text: formulas. Green text: links to another sheet. Yellow fill: key assumptions with no source.', None),
        ('', None),
        ('Important', BOLD),
        ('Nothing here is FNB internal data. Bank figures are from public reports. Every Assumption is a judgement with a range, and outcomes for a bank (fees, deposits, retention) are not facts.', None),
        ('Percentages are stored as fractions. Money is in South African rand unless the unit says USD.', None),
        ('The workbook is set to recalculate fully when opened.', None),
    ]
    for i, (t, f) in enumerate(lines, start=1):
        c = rd.cell(row=i, column=1, value=t)
        c.font = f or BLACK
        c.alignment = WRAP

    # ---------- Inputs ----------
    ws = wb.create_sheet('Inputs')
    headers = ['key', 'description', 'unit', 'low', 'base', 'high', 'direction', 'source or Assumption', 'access date', 'notes',
               'Conservative', 'Base', 'Ambitious']
    style_header(ws, 1, headers, [24, 46, 18, 13, 13, 13, 10, 48, 12, 60, 14, 14, 14])
    ws.freeze_panes = 'B2'
    all_rows = rows + [dict(key=k, desc=d, val=v, low=lo, high=hi, unit=u, src=s, acc='2026-10-20', notes=n)
                       for k, d, v, lo, hi, u, s, n in EXTRA]
    for r_i, r in enumerate(all_rows, start=2):
        unit = r['unit']
        is_pct = 'percent' in unit.lower() or unit.lower().startswith('percentage')
        scale = 0.01 if is_pct else 1
        low, base, high = r['low'] * scale, r['val'] * scale, r['high'] * scale
        if r['key'] in ('pilot_months', 'ramp_months'):
            pass
        ws.cell(row=r_i, column=1, value=r['key']).font = BLACK
        ws.cell(row=r_i, column=2, value=r['desc']).alignment = WRAP
        ws.cell(row=r_i, column=3, value=('fraction' if is_pct else unit))
        for col, val in ((4, low), (5, base), (6, high)):
            c = ws.cell(row=r_i, column=col, value=val)
            c.font = BLUE
            c.number_format = PCT if is_pct else ('#,##0.0000' if abs(val) < 1 and val != 0 else '#,##0.00')
        direction = '-' if r['key'] in WORSE_WHEN_HIGH else '+'
        ws.cell(row=r_i, column=7, value=direction).font = BLUE
        src_cell = ws.cell(row=r_i, column=8, value=r['src'])
        src_cell.alignment = WRAP
        ws.cell(row=r_i, column=9, value=r['acc'])
        ws.cell(row=r_i, column=10, value=r['notes']).alignment = WRAP
        assumption = r['src'].lower().startswith('assumption') or r['src'].lower().startswith('not sourced')
        if assumption:
            for col in (4, 5, 6):
                ws.cell(row=r_i, column=col).fill = YELLOW
        # Scenario columns: Conservative takes the unfavourable end.
        ws.cell(row=r_i, column=11, value=f'=IF($G{r_i}="+",MIN(D{r_i},F{r_i}),MAX(D{r_i},F{r_i}))')
        ws.cell(row=r_i, column=12, value=f'=E{r_i}')
        ws.cell(row=r_i, column=13, value=f'=IF($G{r_i}="+",MAX(D{r_i},F{r_i}),MIN(D{r_i},F{r_i}))')
        for col in (11, 12, 13):
            ws.cell(row=r_i, column=col).number_format = ws.cell(row=r_i, column=5).number_format
    n_inputs = len(all_rows)
    last = n_inputs + 1

    # ---------- Model ----------
    m = wb.create_sheet('Model')
    m.column_dimensions['A'].width = 62
    for col in 'BCD':
        m.column_dimensions[col].width = 18
    m.column_dimensions['E'].width = 70
    m['A1'] = 'Model: three scenarios side by side'
    m['A1'].font = TITLE
    style_header(m, 3, ['Line', 'Conservative', 'Base', 'Ambitious', 'Formula or note'])
    scen_cols = {'B': 'K', 'C': 'L', 'D': 'M'}
    names = {}
    row = [4]

    def section(title):
        r = row[0]
        m.cell(row=r, column=1, value=title).font = BOLD
        for c in range(1, 6):
            m.cell(row=r, column=c).fill = SECTION_FILL
        row[0] += 1

    def pull(key, fmt=NUM2, label=None):
        r = row[0]
        m.cell(row=r, column=1, value=label or f'Input: {key}')
        for col, sc in scen_cols.items():
            c = m[f'{col}{r}']
            c.value = f'=INDEX(Inputs!${sc}$2:${sc}${last},MATCH("{key}",Inputs!$A$2:$A${last},0))'
            c.font = GREEN
            c.number_format = fmt
        m.cell(row=r, column=5, value=f'From Inputs, key {key}')
        names[key] = r
        row[0] += 1
        return r

    def calc(name, label, expr, fmt=NUM2, note=''):
        """expr uses {key} placeholders, replaced by the same-column cell of that line."""
        r = row[0]
        m.cell(row=r, column=1, value=label)
        for col in scen_cols:
            f = expr
            for k, rr in names.items():
                f = f.replace('{' + k + '}', f'{col}{rr}')
            c = m[f'{col}{r}']
            c.value = '=' + f
            c.font = BLACK
            c.number_format = fmt
        m.cell(row=r, column=5, value=note or expr.replace('{', '').replace('}', ''))
        names[name] = r
        row[0] += 1
        return r

    section('Inputs used (linked from the Inputs sheet)')
    for key, fmt in [
        ('pop_15plus', NUM0), ('acct_ownership', PCT), ('smartphone_own', PCT), ('informal_sector_emp', NUM0),
        ('household_sector_emp', NUM0), ('tam_irregular_adults', NUM0), ('sam_share_banked_smartphone', PCT),
        ('partner_base', NUM0), ('share_partner_irregular', PCT), ('share_eligible_offered', PCT),
        ('offered_to_activated', PCT), ('activated_to_mau', PCT), ('sponsor_reach', NUM0),
        ('usd_zar', NUM2), ('vat', PCT), ('hosting_per_mau', ZAR2), ('forecast_compute', ZAR2),
        ('llm_in_price', USD4), ('llm_out_price', USD4), ('tokens_in_msg', NUM0), ('tokens_out_msg', NUM0),
        ('msgs_per_month', NUM0), ('wa_utility', USD4), ('wa_bsp_fee', ZAR2), ('sms_price', ZAR2), ('push_cost', ZAR2),
        ('support_per_mau', ZAR2), ('compliance_fixed', ZAR0), ('team_fixed', ZAR0), ('db_base', NUM2),
        ('payfast_card_pct', PCT), ('payfast_card_fixed', ZAR2),
        ('lic_fee_per_mau', ZAR2), ('lic_pilot_fee', ZAR0), ('lic_platform_floor', ZAR0), ('outcome_share', PCT),
        ('sub_price', ZAR2), ('free_to_paid', PCT), ('sponsor_per_user_year', ZAR2),
        ('share_users_unpaid', PCT), ('unpaid_events_per_user', NUM2), ('unpaid_reduction', PCT),
        ('bank_cost_per_unpaid', ZAR2), ('sb_unpaid_payt', ZAR2), ('deposit_uplift', ZAR0), ('nim_on_deposits', PCT),
        ('attrition_reduction', PCT), ('value_per_customer_year', ZAR0), ('contact_avoided', NUM2), ('cost_per_call', ZAR2),
        ('share_behaviour_change', PCT), ('days_cover_gained', NUM2), ('shortfalls_avoided', NUM2), ('fees_avoided', ZAR0),
        ('confidence_change', PCT), ('churn_embedded', PCT), ('churn_consumer', PCT),
        ('cac_embedded', ZAR0), ('cac_consumer', ZAR0), ('cac_sponsor', ZAR0),
        ('pilot_months', NUM0), ('pilot_mau_share', PCT), ('ramp_months', NUM0),
    ]:
        pull(key, fmt)

    section('1. Market sizing and funnel (people)')
    calc('acct_adults', 'Adults 15+ with an account', '{pop_15plus}*{acct_ownership}', NUM0, 'Context: population 15+ x account ownership (Findex 2025)')
    calc('informal_total', 'Informal plus private household workers (sourced floor)', '{informal_sector_emp}+{household_sector_emp}', NUM0, 'Stats SA QLFS Q2 2026')
    calc('tam', 'Total market: adults with irregular or informal income', '{tam_irregular_adults}', NUM0, 'Assumption built up from the sourced floor')
    calc('sam', 'Serviceable market: with an account and a smartphone', '{tam}*{sam_share_banked_smartphone}', NUM0)
    calc('partner_irregular', 'Partner bank digital customers with irregular income', '{partner_base}*{share_partner_irregular}', NUM0)
    calc('offered', 'Shown the feature by the bank', '{partner_irregular}*{share_eligible_offered}', NUM0)
    calc('activated', 'Activated', '{offered}*{offered_to_activated}', NUM0)
    calc('mau', 'Steady-state monthly active users (one partner bank)', '{activated}*{activated_to_mau}', NUM0)
    calc('mau_share_sam', 'Share of the serviceable market reached', 'IFERROR({mau}/{sam},0)', PCT)

    section('2. Unit costs per active user per month (ZAR)')
    calc('llm_per_msg', 'LLM cost per generated message', '({tokens_in_msg}*{llm_in_price}+{tokens_out_msg}*{llm_out_price})/1000000*{usd_zar}', ZAR2)
    calc('llm_per_mau', 'LLM cost per MAU', '{llm_per_msg}*{msgs_per_month}', ZAR2)
    calc('push_per_mau', 'In-app push messages per MAU (embedded channel)', '{push_cost}*{msgs_per_month}', ZAR2)
    calc('wa_per_mau', 'WhatsApp messages per MAU (standalone channel)', '({wa_utility}*{usd_zar}+{wa_bsp_fee})*{msgs_per_month}', ZAR2)
    calc('sms_per_mau', 'SMS messages per MAU (sponsor channel, feature phones)', '{sms_price}*{msgs_per_month}', ZAR2)
    calc('var_embedded', 'Variable cost per MAU, embedded in a bank app', '{hosting_per_mau}+{forecast_compute}+{llm_per_mau}+{push_per_mau}+{support_per_mau}', ZAR2)
    calc('var_consumer', 'Variable cost per MAU, standalone consumer app', '{hosting_per_mau}+{forecast_compute}+{llm_per_mau}+{wa_per_mau}+{support_per_mau}', ZAR2)
    calc('var_sponsor', 'Variable cost per MAU, sponsored programme', '{hosting_per_mau}+{forecast_compute}+{llm_per_mau}+{sms_per_mau}+{support_per_mau}', ZAR2)
    calc('fixed_month', 'Fixed cost per month (team, compliance, database base fee)', '{team_fixed}+{compliance_fixed}+{db_base}*{usd_zar}', ZAR0)

    section('3. Value to a bank per active user per year (ZAR, all assumptions)')
    calc('unpaid_avoided', 'Unpaid debit orders avoided per MAU per year', '{share_users_unpaid}*{unpaid_events_per_user}*{unpaid_reduction}', NUM2)
    calc('bv_ops', 'Operational cost saved on unpaid items', '{unpaid_avoided}*{bank_cost_per_unpaid}', ZAR2)
    calc('bv_fees_lost', 'Fee income the bank no longer earns (negative)', '-{unpaid_avoided}*{sb_unpaid_payt}', ZAR2, 'Standard Bank pay-as-you-transact unpaid fee used as the proxy')
    calc('bv_deposits', 'Margin on higher balances held', '{deposit_uplift}*{nim_on_deposits}', ZAR2)
    calc('bv_retention', 'Value of lower attrition', '{attrition_reduction}*{value_per_customer_year}', ZAR2)
    calc('bv_contact', 'Contact centre calls avoided', '{contact_avoided}*{cost_per_call}', ZAR2)
    calc('bank_value_year', 'Net value to the bank per MAU per year', '{bv_ops}+{bv_fees_lost}+{bv_deposits}+{bv_retention}+{bv_contact}', ZAR2)
    calc('bank_value_total', 'Net value to the bank per year at steady-state MAU', '{bank_value_year}*{mau}', ZAR0)
    calc('bank_cost_year', 'Licence the bank pays per MAU per year (model a)', '{lic_fee_per_mau}*12', ZAR2)
    calc('bank_roi', 'Bank value per rand of licence fee', 'IFERROR({bank_value_year}/{bank_cost_year},0)', RATIO)

    section('4. Revenue per active user per month, by business model (ZAR)')
    calc('rev_a', '(a) Bank licence per MAU', '{lic_fee_per_mau}', ZAR2)
    calc('rev_b', '(b) Revenue share on measured bank benefit', '{outcome_share}*{bank_value_year}/12', ZAR2)
    calc('rev_c', '(c) Freemium consumer subscription, per MAU', '{free_to_paid}*({sub_price}/(1+{vat})-({sub_price}*{payfast_card_pct}+{payfast_card_fixed}))', ZAR2, 'Paying share x (price excl. VAT minus PayFast fees)')
    calc('rev_d', '(d) Sponsored or partner-funded, per user', '{sponsor_per_user_year}/12', ZAR2)

    section('5. Unit economics per model')
    for code, var, churn, cac in (('a', 'var_embedded', 'churn_embedded', 'cac_embedded'), ('b', 'var_embedded', 'churn_embedded', 'cac_embedded'),
                                  ('c', 'var_consumer', 'churn_consumer', 'cac_consumer'), ('d', 'var_sponsor', 'churn_consumer', 'cac_sponsor')):
        calc(f'cm_{code}', f'({code}) Contribution per MAU per month', '{rev_' + code + '}-{' + var + '}', ZAR2)
        calc(f'cmpct_{code}', f'({code}) Contribution margin', 'IFERROR({cm_' + code + '}/{rev_' + code + '},0)', PCT)
        calc(f'life_{code}', f'({code}) Expected lifetime, months (1 / monthly churn)', 'IFERROR(1/{' + churn + '},0)', NUM2)
        calc(f'ltv_{code}', f'({code}) Lifetime value per MAU', '{cm_' + code + '}*{life_' + code + '}', ZAR2)
        calc(f'cac_{code}', f'({code}) Acquisition cost per MAU', '{' + cac + '}', ZAR2)
        calc(f'ltvcac_{code}', f'({code}) LTV to CAC', 'IFERROR({ltv_' + code + '}/{cac_' + code + '},0)', RATIO)
        calc(f'payback_{code}', f'({code}) Payback, months (blank means never)', 'IF({cm_' + code + '}>0,{cac_' + code + '}/{cm_' + code + '},"")', NUM2)
        calc(f'be_{code}', f'({code}) MAU needed to cover fixed costs (blank means never)', 'IF({cm_' + code + '}>0,{fixed_month}/{cm_' + code + '},"")', NUM0)

    section('6. Impact at steady state (outputs and outcomes)')
    calc('reach', 'Output: people reached per year (MAU plus sponsor reach)', '{mau}+{sponsor_reach}', NUM0)
    calc('changers', 'Outcome: users who change a decision in a month', '{mau}*{share_behaviour_change}', NUM0)
    calc('days_gained', 'Outcome: days of cover gained per year (all users)', '{changers}*{days_cover_gained}*12', NUM0)
    calc('shortfalls', 'Outcome: Short episodes avoided per year', '{mau}*{shortfalls_avoided}', NUM0)
    calc('fees_total', 'Outcome: fees avoided by users per year (ZAR)', '{mau}*{fees_avoided}', ZAR0)
    calc('conf', 'Outcome: change in share confident money lasts (points)', '{confidence_change}', PCT)

    # ---------- Projection ----------
    p = wb.create_sheet('Projection')
    p['A1'] = 'Projection: 24 months, model (a) bank licence, one partner bank'
    p['A1'].font = TITLE
    p['A2'] = 'Pilot fee spread over the pilot months, then the larger of licence revenue and the platform floor. Costs are fixed plus embedded variable cost per MAU.'
    p.column_dimensions['A'].width = 34
    for i in range(2, 27):
        p.column_dimensions[get_column_letter(i)].width = 12
    blocks = {}
    r0 = 4
    for scen, col in (('Conservative', 'B'), ('Base', 'C'), ('Ambitious', 'D')):
        p.cell(row=r0, column=1, value=scen).font = BOLD
        for c in range(1, 27):
            p.cell(row=r0, column=c).fill = SECTION_FILL
        p.cell(row=r0 + 1, column=1, value='Month')
        for mth in range(1, 25):
            c = p.cell(row=r0 + 1, column=1 + mth, value=mth)
            c.font = BOLD
        ref = lambda key: f"Model!${col}${names[key]}"
        labels = ['MAU', 'Revenue', 'Fixed cost', 'Variable cost', 'Net cash flow', 'Cumulative cash', 'Profitable month flag']
        for j, lab in enumerate(labels):
            p.cell(row=r0 + 2 + j, column=1, value=lab)
        for mth in range(1, 25):
            cl = get_column_letter(1 + mth)
            mr, rv, fx, vr, nt, cu, fl = (f'{cl}{r0 + 2 + j}' for j in range(7))
            p[mr] = (f'=IF({cl}${r0 + 1}<={ref("pilot_months")},{ref("mau")}*{ref("pilot_mau_share")}*{cl}${r0 + 1}/{ref("pilot_months")},'
                     f'MIN({ref("mau")},{ref("mau")}*{ref("pilot_mau_share")}+({ref("mau")}-{ref("mau")}*{ref("pilot_mau_share")})*({cl}${r0 + 1}-{ref("pilot_months")})/{ref("ramp_months")}))')
            p[rv] = f'=IF({cl}${r0 + 1}<={ref("pilot_months")},{ref("lic_pilot_fee")}/{ref("pilot_months")},MAX({ref("lic_fee_per_mau")}*{mr},{ref("lic_platform_floor")}/12))'
            p[fx] = f'={ref("fixed_month")}'
            p[vr] = f'={ref("var_embedded")}*{mr}'
            p[nt] = f'={rv}-{fx}-{vr}'
            prev = f'{get_column_letter(mth)}{r0 + 7}' if mth > 1 else None
            p[cu] = f'={nt}+{prev}' if prev else f'={nt}+INDEX(Inputs!$L$2:$L${last},MATCH("opening_cash",Inputs!$A$2:$A${last},0))'
            p[fl] = f'=IF({nt}>0,1,0)'
            for cell, fmt in ((mr, NUM0), (rv, ZAR0), (fx, ZAR0), (vr, ZAR0), (nt, ZAR0), (cu, ZAR0), (fl, '0')):
                p[cell].number_format = fmt
                p[cell].font = GREEN if cell in (fx,) else BLACK
        s = r0 + 10
        p.cell(row=s, column=1, value='First profitable month')
        p.cell(row=s, column=2, value=f'=IFERROR(MATCH(1,B{r0 + 8}:Y{r0 + 8},0),"beyond 24")')
        p.cell(row=s + 1, column=1, value='Peak funding need (ZAR)')
        p.cell(row=s + 1, column=2, value=f'=MAX(0,-MIN(B{r0 + 7}:Y{r0 + 7}))').number_format = ZAR0
        p.cell(row=s + 2, column=1, value='Cumulative cash at month 24 (ZAR)')
        p.cell(row=s + 2, column=2, value=f'=Y{r0 + 7}').number_format = ZAR0
        p.cell(row=s + 3, column=1, value='Revenue in year 2 (ZAR)')
        p.cell(row=s + 3, column=2, value=f'=SUM(N{r0 + 3}:Y{r0 + 3})').number_format = ZAR0
        blocks[scen] = dict(start=r0, summary=s)
        r0 += 16

    # line chart of cumulative cash
    ch = LineChart()
    ch.title = 'Cumulative cash, model (a)'
    ch.y_axis.title = 'ZAR'
    ch.x_axis.title = 'Month'
    for scen in ('Conservative', 'Base', 'Ambitious'):
        b = blocks[scen]['start']
        data = Reference(p, min_col=1, max_col=25, min_row=b + 7, max_row=b + 7)
        ch.add_data(data, titles_from_data=True, from_rows=True)
    for s_, scen in zip(ch.series, ('Conservative', 'Base', 'Ambitious')):
        from openpyxl.chart.series import SeriesLabel
        s_.tx = SeriesLabel(v=scen)
    ch.set_categories(Reference(p, min_col=2, max_col=25, min_row=5, max_row=5))
    ch.height, ch.width = 9, 22
    p.add_chart(ch, f'A{r0 + 1}')

    # ---------- Sensitivity ----------
    s = wb.create_sheet('Sensitivity')
    s['A1'] = 'Sensitivity (Base scenario, one input at a time)'
    s['A1'].font = TITLE
    s.column_dimensions['A'].width = 40
    for col in 'BCDEFGH':
        s.column_dimensions[col].width = 16

    def inp(key, col):
        return f'INDEX(Inputs!${col}$2:${col}${last},MATCH("{key}",Inputs!$A$2:$A${last},0))'

    # Break-even MAU for model (a) as a closed-form expression in base inputs.
    be_terms = ['team_fixed', 'compliance_fixed', 'db_base', 'usd_zar', 'lic_fee_per_mau', 'hosting_per_mau', 'forecast_compute',
                'tokens_in_msg', 'llm_in_price', 'tokens_out_msg', 'llm_out_price', 'msgs_per_month', 'push_cost', 'support_per_mau']

    def be_expr(over=None, col_over='D'):
        v = {k: inp(k, 'E') for k in be_terms}
        if over:
            v[over] = inp(over, col_over)
        fixed = f'({v["team_fixed"]}+{v["compliance_fixed"]}+{v["db_base"]}*{v["usd_zar"]})'
        var = (f'({v["hosting_per_mau"]}+{v["forecast_compute"]}+({v["tokens_in_msg"]}*{v["llm_in_price"]}+{v["tokens_out_msg"]}*{v["llm_out_price"]})'
               f'/1000000*{v["usd_zar"]}*{v["msgs_per_month"]}+{v["push_cost"]}*{v["msgs_per_month"]}+{v["support_per_mau"]})')
        return f'IFERROR(IF({v["lic_fee_per_mau"]}-{var}>0,{fixed}/({v["lic_fee_per_mau"]}-{var}),""),"")'

    style_header(s, 3, ['Break-even MAU for model (a)', 'Input at low', 'Input at high', 'MAU at low', 'MAU at high', 'Swing', 'Base MAU'])
    s['A4'] = 'Base case'
    s['G4'] = '=' + be_expr()
    s['G4'].number_format = NUM0
    tornado_a = ['lic_fee_per_mau', 'team_fixed', 'compliance_fixed', 'support_per_mau', 'hosting_per_mau', 'msgs_per_month', 'tokens_out_msg', 'llm_out_price', 'usd_zar']
    for i, key in enumerate(tornado_a, start=5):
        s.cell(row=i, column=1, value=key)
        s.cell(row=i, column=2, value='=' + inp(key, 'D'))
        s.cell(row=i, column=3, value='=' + inp(key, 'F'))
        s.cell(row=i, column=4, value='=' + be_expr(key, 'D')).number_format = NUM0
        s.cell(row=i, column=5, value='=' + be_expr(key, 'F')).number_format = NUM0
        s.cell(row=i, column=6, value=f'=IFERROR(ABS(E{i}-D{i}),"")').number_format = NUM0
        s.cell(row=i, column=7, value='=$G$4').number_format = NUM0
    t_end = 4 + len(tornado_a)

    # Bank value tornado
    bv_terms = ['share_users_unpaid', 'unpaid_events_per_user', 'unpaid_reduction', 'bank_cost_per_unpaid', 'sb_unpaid_payt', 'deposit_uplift',
                'nim_on_deposits', 'attrition_reduction', 'value_per_customer_year', 'contact_avoided', 'cost_per_call']

    def bv_expr(over=None, col_over='D'):
        v = {k: inp(k, 'E') for k in bv_terms}
        if over:
            v[over] = inp(over, col_over)
        ua = f'({v["share_users_unpaid"]}*{v["unpaid_events_per_user"]}*{v["unpaid_reduction"]})'
        return (f'{ua}*{v["bank_cost_per_unpaid"]}-{ua}*{v["sb_unpaid_payt"]}+{v["deposit_uplift"]}*{v["nim_on_deposits"]}'
                f'+{v["attrition_reduction"]}*{v["value_per_customer_year"]}+{v["contact_avoided"]}*{v["cost_per_call"]}')

    r = t_end + 3
    style_header(s, r, ['Bank value per MAU per year (ZAR)', 'Input at low', 'Input at high', 'Value at low', 'Value at high', 'Swing', 'Base value'])
    s.cell(row=r + 1, column=1, value='Base case')
    s.cell(row=r + 1, column=7, value='=' + bv_expr()).number_format = ZAR2
    for i, key in enumerate(bv_terms, start=r + 2):
        s.cell(row=i, column=1, value=key)
        s.cell(row=i, column=2, value='=' + inp(key, 'D'))
        s.cell(row=i, column=3, value='=' + inp(key, 'F'))
        s.cell(row=i, column=4, value='=' + bv_expr(key, 'D')).number_format = ZAR2
        s.cell(row=i, column=5, value='=' + bv_expr(key, 'F')).number_format = ZAR2
        s.cell(row=i, column=6, value=f'=ABS(E{i}-D{i})').number_format = ZAR2
        s.cell(row=i, column=7, value=f'=$G${r + 1}').number_format = ZAR2
    bv_end = r + 1 + len(bv_terms)

    # Two-way table: licence fee x fixed cost multiplier
    r = bv_end + 3
    s.cell(row=r, column=1, value='Two-way: break-even MAU for model (a), licence fee per MAU (rows) against fixed cost per month (columns)').font = BOLD
    fixed_options = [200000, 310000, 450000, 600000]
    fees = [2, 3, 5, 8, 12]
    s.cell(row=r + 1, column=1, value='Licence fee / Fixed cost')
    var_ref = "Model!$C$" + str(names['var_embedded'])
    for j, fxv in enumerate(fixed_options, start=2):
        c = s.cell(row=r + 1, column=j, value=fxv)
        c.font = BLUE
        c.number_format = ZAR0
    for i, fee in enumerate(fees, start=r + 2):
        c = s.cell(row=i, column=1, value=fee)
        c.font = BLUE
        c.number_format = ZAR2
        for j in range(2, 2 + len(fixed_options)):
            cl = get_column_letter(j)
            cell = s.cell(row=i, column=j, value=f'=IF($A{i}-{var_ref}>0,{cl}${r + 1}/($A{i}-{var_ref}),"never")')
            cell.number_format = NUM0
    s.cell(row=r + 3 + len(fees), column=1, value='Variable cost per MAU is the Base scenario embedded cost from the Model sheet. Fixed cost options and fees are blue inputs to vary.')

    bar = BarChart()
    bar.type = 'bar'
    bar.title = 'Break-even MAU swing by input (Base)'
    bar.add_data(Reference(s, min_col=6, min_row=4, max_row=t_end), titles_from_data=True)
    bar.set_categories(Reference(s, min_col=1, min_row=5, max_row=t_end))
    bar.height, bar.width = 8, 16
    s.add_chart(bar, 'I3')

    # ---------- Scenarios summary ----------
    sm = wb.create_sheet('Scenarios', 1)
    sm['A1'] = 'Scenario summary'
    sm['A1'].font = TITLE
    sm.column_dimensions['A'].width = 58
    for col in 'BCD':
        sm.column_dimensions[col].width = 18
    style_header(sm, 3, ['Output', 'Conservative', 'Base', 'Ambitious'])
    summary_rows = [
        ('Serviceable market (people)', 'sam', NUM0), ('Steady-state MAU, one partner bank', 'mau', NUM0),
        ('Variable cost per MAU per month, embedded (ZAR)', 'var_embedded', ZAR2), ('Fixed cost per month (ZAR)', 'fixed_month', ZAR0),
        ('(a) Licence: contribution per MAU per month', 'cm_a', ZAR2), ('(a) Licence: MAU to break even', 'be_a', NUM0),
        ('(b) Revenue share: contribution per MAU per month', 'cm_b', ZAR2), ('(b) Revenue share: MAU to break even', 'be_b', NUM0),
        ('(c) Consumer: contribution per MAU per month', 'cm_c', ZAR2), ('(c) Consumer: LTV to CAC', 'ltvcac_c', RATIO),
        ('(d) Sponsored: contribution per user per month', 'cm_d', ZAR2),
        ('Bank value per MAU per year (ZAR)', 'bank_value_year', ZAR2), ('Bank value per rand of licence', 'bank_roi', RATIO),
        ('People reached per year', 'reach', NUM0), ('Days of cover gained per year', 'days_gained', NUM0),
        ('Fees avoided by users per year (ZAR)', 'fees_total', ZAR0),
    ]
    for i, (label, key, fmt) in enumerate(summary_rows, start=4):
        sm.cell(row=i, column=1, value=label)
        for j, col in enumerate('BCD', start=2):
            c = sm.cell(row=i, column=j, value=f'=Model!{col}{names[key]}')
            c.font = GREEN
            c.number_format = fmt
    base_i = 4 + len(summary_rows)
    for k, (label, off, fmt) in enumerate((('First profitable month, model (a)', 0, '0'), ('Peak funding need, model (a) (ZAR)', 1, ZAR0),
                                          ('Cumulative cash at month 24, model (a) (ZAR)', 2, ZAR0))):
        sm.cell(row=base_i + k, column=1, value=label)
        for j, scen in enumerate(('Conservative', 'Base', 'Ambitious'), start=2):
            c = sm.cell(row=base_i + k, column=j, value=f'=Projection!B{blocks[scen]["summary"] + off}')
            c.font = GREEN
            c.number_format = fmt

    # ---------- Metrics ----------
    mt = wb.create_sheet('Metrics')
    mt['A1'] = 'Metrics: what to track, and the values measured in this review'
    mt['A1'].font = TITLE
    mt.column_dimensions['A'].width = 44
    mt.column_dimensions['B'].width = 18
    mt.column_dimensions['C'].width = 60
    mt.column_dimensions['D'].width = 50
    r = 3
    groups = [
        ('Product metrics to track in a pilot (definitions; no values exist yet)', [
            ('Activation', None, 'Share of offered users who complete consent and see a date', 'Pilot analytics (needs consent)'),
            ('Weekly active use', None, 'Users who open Home at least once in a week, over MAU', 'Pilot analytics'),
            ('Retention day 7 and day 30', None, 'Share of activated users active on day 7 and day 30', 'Pilot analytics'),
            ('Statement imports completed', None, 'Imports confirmed over imports started', 'Pilot analytics'),
            ('Messages opted in', None, 'Users with daily messages on over activated users', 'Consent records'),
            ('Forecast accuracy in the field', None, 'Mean absolute error in days between forecast date and actual run-out', 'Stored forecasts plus later balances'),
            ('State transitions acted on', None, 'Users who use Plan or change spend within 3 days of a Tight or Short state', 'Pilot analytics'),
        ]),
        ('Forecast quality (synthetic backtest, seeds, 90 day history, all personas)', [
            ('Mean absolute error, days', 2.073, 'Forecast runway date against held-out actual', 'docs/review/backtest/results/summary_headline.csv'),
            ('Within 3 days, percent', 0.7807, 'Share of cases within three days', 'same file'),
            ('Range band coverage, percent', 0.7177, 'Actual date inside the stated range', 'same file'),
            ('State accuracy, percent', 0.7185, 'Shown state right in hindsight (20 percent buffer rule)', 'same file'),
            ('False reassurance, percent', 0.0759, 'Shown covered, actually short', 'same file'),
            ('Mean absolute error with 14 days of history, days', 5.4, 'Seeds, 14 day history', 'docs/review/data-scientist.md, Backtest summary'),
        ]),
        ('Technical metrics (measured 2026-10-20 at commit d114497)', [
            ('Unit tests', 66, 'Vitest, all passing', 'docs/review/prep/checks.md'),
            ('Playwright tests', 221, 'Screenshot, flow, phone and axe suites, all passing', 'docs/review/prep/playwright.txt'),
            ('Unit coverage, engine statements', 0.9755, 'src/engine', 'docs/review/prep/coverage.txt'),
            ('Unit coverage, all statements', 0.1995, 'All of src', 'docs/review/prep/coverage.txt'),
            ('Lighthouse mobile performance, landing', 94, 'Simulated slow 4G, 4x CPU', 'docs/review/prep/lighthouse/landing.report.json'),
            ('Lighthouse mobile accessibility, landing', 100, 'Same run', 'same file'),
            ('JavaScript bundle, gzip KB', 141.9, 'One file including all 11 locales', 'docs/review/prep/audit.md'),
            ('Home first paint, cold, throttled, ms', 1188, '390 px, 4x CPU, 1.6 Mbps', 'docs/review/prep/perf-home.json'),
            ('axe violations in the app test suite', 0, 'tests/a11y.spec.ts, both themes, 390 and 1280', 'docs/review/prep/playwright.txt'),
            ('npm audit, production dependencies', 2, 'Moderate, react-router', 'docs/review/prep/audit.md'),
            ('npm audit, all dependencies', 12, '2 critical, 5 high, 5 moderate, dev tooling', 'docs/review/prep/audit.md'),
            ('Production licences', 'MIT 18, OFL 2, ISC 1, Apache 1', 'license-checker summary', 'docs/review/prep/audit.md'),
        ]),
    ]
    for title, items in groups:
        mt.cell(row=r, column=1, value=title).font = BOLD
        for c in range(1, 5):
            mt.cell(row=r, column=c).fill = SECTION_FILL
        r += 1
        style_header(mt, r, ['Metric', 'Value', 'Definition', 'Source'])
        r += 1
        for name, val, defin, src in items:
            mt.cell(row=r, column=1, value=name)
            c = mt.cell(row=r, column=2, value=val if val is not None else 'not measured yet')
            c.font = BLUE
            if isinstance(val, float) and val < 1:
                c.number_format = PCT
            mt.cell(row=r, column=3, value=defin).alignment = WRAP
            mt.cell(row=r, column=4, value=src).alignment = WRAP
            r += 1
        r += 1

    # Order and properties
    wb.move_sheet('Scenarios', offset=-(wb.sheetnames.index('Scenarios') - 1))
    for sheet in wb.worksheets:
        for row_ in sheet.iter_rows():
            for cell in row_:
                if cell.font and cell.font.name != FONT:
                    f = cell.font
                    cell.font = Font(name=FONT, bold=f.bold, color=f.color, size=f.size)
    wb.calculation = CalcProperties(fullCalcOnLoad=True)
    out = BASE / 'model.xlsx'
    wb.save(out)
    print('saved', out, 'inputs', n_inputs, 'model rows', row[0])
    return names


if __name__ == '__main__':
    build()
