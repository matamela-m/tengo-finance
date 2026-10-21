# Tengo business case: a bank-embedded money date for irregular earners

Prepared 2026-10-21. Every number comes from `docs/review/model.xlsx` (Base scenario unless stated), whose inputs are sourced or labelled **Assumption** in `docs/review/model-inputs.md`. No user or bank data exists yet: the outcomes a bank would pay for are assumptions until a pilot measures them.

## The offer

Tengo is a feature a bank switches on inside its own app for customers paid by the trip, the client or the till. It shows the date the money runs out, when the next money usually lands, and one state in plain words (Enough, Tight, Short), worked out on the phone from the bank's own data.

**Pricing (model (a), licence):**

| Item | Base | Range in the model |
| --- | --- | --- |
| Licence per monthly active user | R5 a month | R2 to R12 |
| Six month pilot fee | R400 000 | R150 000 to R1 000 000 |
| Annual platform minimum after the pilot | R1 200 000 | R600 000 to R3 000 000 |

Users never pay. A consumer subscription does not fit this segment (model (c) shows negative contribution in the Base scenario).

**Messages: in-app notifications, not paid WhatsApp.** A daily WhatsApp message costs more than the licence leaves; in-app push inside a bank app costs R0 a message in the model. WhatsApp or SMS is used only if the bank pays for it, and every message carries the sender and STOP.

## What a bank already has, and what Tengo adds

| A bank already has | Tengo adds |
| --- | --- |
| Balances, transaction history, debit orders | The date money runs out, with a likely range tuned to about 80 percent coverage on synthetic data, not yet held out or tested on real statements |
| Budgets and spend categories that assume a payday | Next money inferred from irregular income: weekday, interval, daily or paused |
| Overdraft and credit products | One plain state with rules that never suggest borrowing, skipping credit or insurance, or cutting stock |
| A mobile app and notifications | Shared-phone protections, plain-language copy, a design built and tested for people without a payday |

The arithmetic is simple and a bank could build it. Tengo's claim is the tested rules, the copy, the safety design and the evidence from a pilot, delivered faster than an internal build.

## Data contract

| Tengo needs from the bank | Tengo returns to the bank |
| --- | --- |
| Up to 90 days of transactions per consenting customer (date, amount, description, category) | Nothing about individuals. The forecast runs on the phone |
| Available balance, and any overdraft facility shown separately | Aggregated, consented pilot metrics only (below) |
| Scheduled debit orders as known bills | A monthly accuracy report on the bank's own data |

Purpose limit: Tengo's outputs may not be used for credit decisions, pricing, collections or marketing without fresh, separate consent and a POPIA section 71 assessment.

## Unit economics (Base scenario, one partner bank)

| Output | Value |
| --- | --- |
| Serviceable market (people) | 3 300 000 |
| Steady-state monthly active users, one bank | 44 064 |
| Variable cost per active user per month | R1.19 |
| Fixed cost per month | R310 403 |
| Contribution per active user per month, licence | R3.81 |
| Active users needed to break even, licence | 81 374 |
| Peak funding need | R4 728 272 |
| First profitable month | beyond month 24 |

One bank at Base adoption does not break even on the licence alone. The pilot fee and the platform minimum carry the early months; a second bank or a sponsor programme closes the gap. The Ambitious scenario (330 480 active users) is profitable from month 1; the Conservative one never is.

**Value to the bank (assumptions):** about R30.50 per active user a year against R60 of licence, or R0.51 of value per rand of licence, driven mostly by retention and balances. This is the weakest part of the case and is exactly what the pilot measures.

## Pilot design and KPIs

Six months, one bank, a randomised control group of offered-but-not-shown customers.

| KPI | Measured how | Why it matters |
| --- | --- | --- |
| Unpaid debit orders per user | Treatment against control | Fees avoided and bank cost |
| Average balance and days below R0 | Treatment against control | Balances and overdraft use |
| 90 day retention of the account | Treatment against control | The main value driver in the model |
| Forecast accuracy on real data | Error in days and band coverage | Replaces the synthetic backtest |
| Comprehension | The six-person test kit, then in-app questions | People read the date, range and state correctly |
| Opt-in and opt-out of messages | Rates by state | Avoidance and anxiety |

Stop rule: if people read the date as a deadline and make worse decisions, or real-data accuracy is far below the stated range, the pilot pauses.

## Changes from the build

Build 2 does not change any modelled cost: messages are still templates (no paid model calls), in-app push is already modelled at R0, and the forecast still runs on the device. The optional account storage used outside a bank is covered by the hosting line (R0.15 per active user a month, an assumption). So `model.xlsx` is unchanged.
