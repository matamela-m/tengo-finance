"""Charts for the Tengo forecast backtest.

Run after backtest.ts, from the repository root:
  <venv>/bin/python -I docs/review/backtest/charts.py
Reads docs/review/backtest/results/*.csv and writes PNG files to docs/review/backtest/charts/.
Needs matplotlib only.
"""
import csv
import os
from collections import defaultdict

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
RES = os.path.join(HERE, "results")
OUT = os.path.join(HERE, "charts")
os.makedirs(OUT, exist_ok=True)

SURFACE = "#fcfcfb"
INK = "#0b0b0b"
INK2 = "#52514e"
GRID = "#e4e3df"
S1, S2, S3, S4 = "#2a78d6", "#eb6834", "#1baf7a", "#6250d6"
PERSONA_COLOR = {"thabo": S1, "lerato": S2, "ayanda": S3}

plt.rcParams.update(
    {
        "figure.facecolor": SURFACE,
        "axes.facecolor": SURFACE,
        "axes.edgecolor": GRID,
        "axes.labelcolor": INK2,
        "xtick.color": INK2,
        "ytick.color": INK2,
        "text.color": INK,
        "axes.grid": True,
        "grid.color": GRID,
        "grid.linewidth": 0.8,
        "axes.axisbelow": True,
        "axes.spines.top": False,
        "axes.spines.right": False,
        "font.size": 10,
        "axes.titlesize": 12,
        "axes.titleweight": "bold",
        "axes.titlelocation": "left",
    }
)


def read(name):
    with open(os.path.join(RES, name)) as f:
        return list(csv.DictReader(f))


def fnum(x):
    return float(x) if x not in ("", None) else float("nan")


cases = [r for r in read("cases.csv") if r["perturb"] == "none"]
seeds90 = [r for r in cases if r["source"] != "shipped" and r["historyLen"] == "90"]
FOOT = "Synthetic data from the app's own generator. Weak evidence of real-world accuracy."


def foot(fig):
    fig.text(0.01, 0.01, FOOT, fontsize=8, color=INK2)


# 1. Error distribution, engine versus naive baseline (seeds, 90 day history).
fig, ax = plt.subplots(figsize=(8, 4.5))
errs = [int(r["err"]) for r in seeds90 if r["err"] != ""]
base = [int(r["baselineErr"]) for r in seeds90 if r["baselineErr"] != ""]
bins = [b - 0.5 for b in range(-12, 14)]
ax.hist([max(-12, min(12, e)) for e in errs], bins=bins, color=S1, alpha=0.85, label="Engine central date", rwidth=0.85)
ax.hist([max(-12, min(12, e)) for e in base], bins=bins, histtype="step", color=S2, linewidth=2, label="Naive baseline (balance / 28 day mean outflow)")
ax.axvline(0, color=INK2, linewidth=1)
ax.set_xlabel("Forecast minus actual runway date, days (positive = forecast too late, too optimistic). Clipped at +/-12")
ax.set_ylabel("Cases")
ax.set_title(f"Runway date error, other seeds, 90 day history (n={len(errs)})")
ax.legend(frameon=False)
foot(fig)
fig.tight_layout(rect=(0, 0.03, 1, 1))
fig.savefig(os.path.join(OUT, "error_distribution.png"), dpi=150)
plt.close(fig)

# 2. Calibration: band coverage and miss direction, by persona and by lead time.
lead = {r["actualBucket"]: r for r in read("summary_by_lead_time.csv")}
pers = {r["persona"]: r for r in read("summary_by_persona_seeded90.csv")}
groups = [("Thabo", pers["thabo"]), ("Lerato", pers["lerato"]), ("Ayanda", pers["ayanda"])] + [
    (f"Runs out day {k}", lead[k]) for k in ["0 to 6", "7 to 13", "14 to 20", "21 to 29"] if k in lead
]
fig, ax = plt.subplots(figsize=(9, 4.8))
labels = [g[0] for g in groups]
inside = [fnum(g[1]["band_coverage_pct"]) for g in groups]
early = [fnum(g[1]["band_miss_early_pct"]) for g in groups]
late = [fnum(g[1]["band_miss_late_pct"]) for g in groups]
y = range(len(groups))
ax.barh(y, early, color=S2, label="Ran out before the band (worse than the heavy path)", edgecolor=SURFACE, linewidth=2)
ax.barh(y, inside, left=early, color=S1, label="Inside the band", edgecolor=SURFACE, linewidth=2)
ax.barh(y, late, left=[a + b for a, b in zip(early, inside)], color="#b9b8b2", label="Lasted beyond the band", edgecolor=SURFACE, linewidth=2)
for i, (e, v) in enumerate(zip(early, inside)):
    ax.text(e + v / 2, i, f"{v:.0f}%", va="center", ha="center", color="white", fontsize=9, fontweight="bold")
    ax.text(max(e, 2) / 2 if e > 6 else e + 0.5, i, f"{e:.0f}%" if e > 6 else "", va="center", ha="center", color="white", fontsize=8)
ax.axvline(60, color=INK, linewidth=1, linestyle="--")
ax.text(60.5, len(groups) - 0.4, "implied ~60% (P20 to P80)", fontsize=8, color=INK)
ax.set_yticks(list(y))
ax.set_yticklabels(labels)
ax.invert_yaxis()
ax.set_xlim(0, 100)
ax.set_xlabel("Share of cases, percent")
ax.set_title("Range band calibration, other seeds, 90 day history")
ax.legend(frameon=False, loc="lower center", bbox_to_anchor=(0.5, -0.38), ncol=2, fontsize=8)
foot(fig)
fig.tight_layout(rect=(0, 0.03, 1, 1))
fig.savefig(os.path.join(OUT, "calibration.png"), dpi=150)
plt.close(fig)

# 3. Error by history length, per persona, engine vs baseline.
ph = read("summary_by_persona_history_seeds.csv")
fig, axes = plt.subplots(1, 2, figsize=(10, 4.2), sharex=True)
for p, c in PERSONA_COLOR.items():
    rows = sorted([r for r in ph if r["persona"] == p], key=lambda r: int(r["historyLen"]))
    xs = [int(r["historyLen"]) for r in rows]
    axes[0].plot(xs, [fnum(r["mae_days"]) for r in rows], color=c, linewidth=2, marker="o", markersize=7, label=p.capitalize())
    axes[0].plot(xs, [fnum(r["baseline_mae_days"]) for r in rows], color=c, linewidth=1.5, linestyle=":", marker="s", markersize=5)
    axes[1].plot(xs, [fnum(r["band_coverage_pct"]) for r in rows], color=c, linewidth=2, marker="o", markersize=7, label=p.capitalize())
axes[0].set_title("Mean absolute error, days")
axes[0].text(0.98, 0.95, "solid: engine   dotted: naive baseline", transform=axes[0].transAxes, ha="right", fontsize=8, color=INK2)
axes[1].set_title("Band coverage, percent")
axes[1].axhline(60, color=INK, linewidth=1, linestyle="--")
for a in axes:
    a.set_xticks([14, 28, 60, 90])
    a.set_xlabel("Days of history")
axes[0].set_ylim(bottom=0)
axes[1].set_ylim(0, 100)
axes[1].legend(frameon=False, loc="lower right")
foot(fig)
fig.tight_layout(rect=(0, 0.03, 1, 1))
fig.savefig(os.path.join(OUT, "error_by_history.png"), dpi=150)
plt.close(fig)

# 4. State confusion (seeds, 90 day history), row percentages.
conf = defaultdict(lambda: defaultdict(int))
for r in seeds90:
    conf[r["engineState"]][r["hindState"]] += 1
states = ["enough", "tight", "short"]
mat = [[100 * conf[e][h] / max(1, sum(conf[e].values())) for h in states] for e in states]
fig, ax = plt.subplots(figsize=(6, 4.6))
ax.grid(False)
ax.imshow(mat, cmap="Blues", vmin=0, vmax=100)
for i, e in enumerate(states):
    n = sum(conf[e].values())
    for j in range(3):
        v = mat[i][j]
        ax.text(j, i, f"{v:.0f}%\n({conf[e][states[j]]})", ha="center", va="center", color="white" if v > 55 else INK, fontsize=10)
ax.set_xticks(range(3))
ax.set_xticklabels([s.capitalize() for s in states])
ax.set_yticks(range(3))
ax.set_yticklabels([f"{s.capitalize()} (n={sum(conf[s].values())})" for s in states])
ax.set_xlabel("State in hindsight (buffer rule 20%)")
ax.set_ylabel("State the engine showed")
ax.set_title("What the shown state turned out to be")
foot(fig)
fig.tight_layout(rect=(0, 0.03, 1, 1))
fig.savefig(os.path.join(OUT, "state_confusion.png"), dpi=150)
plt.close(fig)

# 5. Perturbation: how errors grow under shocks the generator never produces (shipped, 60 days).
pt = {r["perturb"]: r for r in read("perturbation.csv")}
order = ["none", "noise35", "income_late3", "new_bill800", "spend+25pct", "shock2000", "income_missed"]
names = {
    "none": "No change",
    "noise35": "Noisier daily spend",
    "income_late3": "Income 3 days late",
    "new_bill800": "New R800 debit order",
    "spend+25pct": "Prices up 25%",
    "shock2000": "One R2 000 emergency",
    "income_missed": "One payout missed",
}
fig, axes = plt.subplots(1, 3, figsize=(12, 4.2), sharey=True)
yy = range(len(order))
for a, key, title, col in [
    (axes[0], "mae_days", "Runway MAE, days", S1),
    (axes[1], "band_coverage_pct", "Band coverage, percent", S1),
    (axes[2], "false_reassurance_pct", "Shown covered, ran short, percent", S2),
]:
    vals = [fnum(pt[o][key]) for o in order]
    a.barh(list(yy), vals, color=col, height=0.6)
    for i, v in enumerate(vals):
        a.text(v, i, f" {v:.1f}", va="center", fontsize=8, color=INK)
    a.set_title(title, fontsize=10)
axes[0].set_yticks(list(yy))
axes[0].set_yticklabels([names[o] for o in order])
axes[0].invert_yaxis()
fig.suptitle("Perturbations of the hold-out only (shipped generator, 60 day history, n=432 each)", x=0.01, ha="left", fontweight="bold")
foot(fig)
fig.tight_layout(rect=(0, 0.03, 1, 0.95))
fig.savefig(os.path.join(OUT, "perturbation.png"), dpi=150)
plt.close(fig)

# 6. Where the actual date lands within the band (0 = heavy-path edge, 1 = light-path edge).
pts = [r for r in read("calibration_points.csv") if r["source"] == "seeds" and r["historyLen"] == "90"]
pos = [max(-1.0, min(2.0, float(r["position"]))) for r in pts]
fig, ax = plt.subplots(figsize=(8, 4))
ax.hist(pos, bins=[-1 + 0.125 * i for i in range(25)], color=S4, rwidth=0.85)
ax.axvspan(0, 1, color=S1, alpha=0.08)
ax.text(0.5, ax.get_ylim()[1] * 0.92, "inside band", ha="center", fontsize=9, color=INK2)
ax.set_xlabel("Position of actual date in the band (0 = heavy-spend edge, 1 = light-spend edge), clipped to [-1, 2]")
ax.set_ylabel("Cases")
ax.set_title(f"Position of the actual runway date relative to the band (n={len(pos)})")
foot(fig)
fig.tight_layout(rect=(0, 0.03, 1, 1))
fig.savefig(os.path.join(OUT, "band_position.png"), dpi=150)
plt.close(fig)

print("charts written to", OUT)
