"""95% bootstrap intervals for the headline metrics, resampling independent paths
(other seeds, 90 day history; 360 paths = 3 personas x 24 cut-offs x 5 seeds; the six
balances on one path are kept together). Run: python3 -I docs/review/backtest/bootstrap.py"""
import csv
import os
import random
from collections import defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
paths = defaultdict(list)
with open(os.path.join(HERE, "results", "cases.csv")) as f:
    for x in csv.DictReader(f):
        if x["perturb"] == "none" and x["source"] != "shipped" and x["historyLen"] == "90":
            paths[(x["source"], x["persona"], x["cutoff"])].append(x)


def metrics(rows):
    e = [abs(int(r["err"])) for r in rows if r["err"] != ""]
    d = [r for r in rows if r["bandCovered"] != ""]
    return {
        "mae_days": sum(e) / len(e),
        "band_coverage_pct": 100 * sum(r["bandCovered"] == "1" for r in d) / len(d),
        "state_acc_pct": 100 * sum(r["engineState"] == r["hindState"] for r in rows) / len(rows),
        "covered_acc_pct": 100 * sum(r["engineCovered"] == r["hindCovered"] for r in rows) / len(rows),
        "false_reassurance_pct": 100 * sum(r["engineCovered"] == "1" and r["hindCovered"] == "0" for r in rows) / len(rows),
    }


random.seed(1)
out = []
for persona in ["all", "thabo", "lerato", "ayanda"]:
    keys = [k for k in paths if persona == "all" or k[1] == persona]
    point = metrics([r for k in keys for r in paths[k]])
    boots = [metrics([r for k in random.choices(keys, k=len(keys)) for r in paths[k]]) for _ in range(1000)]
    for m, v in point.items():
        s = sorted(b[m] for b in boots)
        out.append({"persona": persona, "paths": len(keys), "metric": m, "value": round(v, 2), "ci_low": round(s[25], 2), "ci_high": round(s[975], 2)})
with open(os.path.join(HERE, "results", "bootstrap_ci.csv"), "w", newline="") as f:
    w = csv.DictWriter(f, fieldnames=list(out[0]))
    w.writeheader()
    w.writerows(out)
for o in out:
    print(o)
