# Financial model inputs

Prepared by the product strategist and commercial lead (reviewer 11) on 2026-10-20 for `docs/review/model.xlsx`. Every row is either sourced (URL and access date) or labelled **Assumption** with reasoning and a range. "Derived" means arithmetic on sourced figures, shown in the notes. Weak sources (vendor blogs, aggregators, single reports) are flagged in the notes so the modeller can widen ranges. Nothing here is FNB internal data; all bank figures are public.

Conventions: ZAR unless stated. USD prices exclude VAT unless stated. "MAU" means monthly active user. Low and high are the values to use for the conservative and ambitious scenarios (or for the tornado chart), not confidence intervals.

## 1. Market sizing

| key | description | value | low | high | unit | source or Assumption | access date | notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| pop_total | South African mid-year population 2026 | 63522380 | 63100945 | 63522380 | people | https://www.statssa.gov.za/publications/P0302/P03022026.pdf (Table 1) | 2026-10-20 | Low is the 2025 estimate from https://www.statssa.gov.za/?p=18613 |
| pop_15plus | Population aged 15 and over, 2026 | 47276319 | 46700000 | 47276319 | people | Derived from https://www.statssa.gov.za/publications/P0302/P03022026.pdf (Table 5) | 2026-10-20 | 63 522 380 minus ages 0 to 14 (5 325 401 + 5 448 245 + 5 472 415). Low is Findex population 15+ (46.7m) |
| pop_18plus | Adults aged 18 and over, 2026 (estimate) | 43905000 | 43300000 | 44500000 | people | Derived from Stats SA Table 5 plus Assumption | 2026-10-20 | 15+ minus 3/5 of the 15 to 19 cohort (5 618 124). Assumes even spread by single year of age |
| acct_ownership | Adults 15+ with any account (bank, FI or mobile money), 2024 | 81.1 | 78.4 | 85.4 | percent | https://thedocs.worldbank.org/en/doc/be6615202d1f08a25855c8ac2d615122-0050012025/related/Little-Data-Book-2025-Web.pdf (South Africa page) | 2026-10-20 | Global Findex 2025. Low is bank or FI account only (78.4). High is the 2021 value (85.4). Ownership fell from 2021 to 2024 |
| acct_digital_enabled | Adults 15+ with an account used with a card or phone | 67.8 | 60 | 72 | percent | Same Little Data Book, South Africa page | 2026-10-20 | Range is Assumption around the point value |
| acct_poorest40 | Account ownership, poorest 40 percent of households | 74.2 | 70 | 78 | percent | Same Little Data Book, South Africa page | 2026-10-20 | Range Assumption |
| smartphone_own | Adults 15+ with a personal smartphone | 67.5 | 52.6 | 75 | percent | Same Little Data Book, South Africa page | 2026-10-20 | Low is the poorest 40 percent (52.6). High is Assumption for 2026 growth |
| mobile_phone_own | Adults 15+ with any personal mobile phone | 87.0 | 82.5 | 90 | percent | Same Little Data Book, South Africa page | 2026-10-20 | Relevant to SMS reach. Low is poorest 40 percent |
| internet_users | Internet users, October 2025 | 51700000 | 50000000 | 52500000 | people | https://datareportal.com/reports/digital-2026-south-africa | 2026-10-20 | 79.6 percent penetration. Range Assumption |
| internet_pen | Internet penetration of total population | 79.6 | 75 | 82 | percent | https://datareportal.com/reports/digital-2026-south-africa | 2026-10-20 | Range Assumption |
| employed | Employed persons, QLFS Q2 2026 | 16700000 | 16700000 | 16700000 | people | https://www.sanews.gov.za/south-africa/sa-official-unemployment-rate-rises-336 and https://www.statssa.gov.za/publications/P0211/Media%20Release%20QLFS%20Q2%202026.pdf | 2026-10-20 | Released 11 August 2026 |
| unemployed | Unemployed persons, QLFS Q2 2026 | 8500000 | 8500000 | 8500000 | people | Same as above | 2026-10-20 | Official rate 33.6 percent |
| informal_sector_emp | Informal sector employment incl. agriculture, Q2 2026 (new standard) | 3600000 | 3600000 | 4700000 | people | https://www.statssa.gov.za/publications/P0211/Presentation%20QLFS%20Q2%202026.pdf (slide 18) | 2026-10-20 | New three-sector standard: formal 12.1m, informal 3.6m, households 1.1m. High adds private household workers (1.1m), who also tend to have irregular pay |
| household_sector_emp | Private household sector employment, Q2 2026 | 1100000 | 1100000 | 1100000 | people | Same presentation, slide 18 | 2026-10-20 | Domestic workers, gardeners |
| formal_sector_emp | Formal sector employment incl. agriculture, Q2 2026 | 12100000 | 12100000 | 12100000 | people | Same presentation, slide 18 | 2026-10-20 | Some formal workers have irregular pay (commission, shifts). Not counted in base segment |
| bolt_drivers_onboarded | Drivers onboarded by Bolt in South Africa since 2016 (cumulative) | 500000 | 300000 | 500000 | people | https://www.itweb.co.za/videos/category/APero3qZydGMQb6m | 2026-10-20 | Cumulative, not active. Low is Assumption for currently active. Company claim |
| ridehail_primary_share | Share of ride-hailing gig workers for whom it is the primary income | 30 | 20 | 40 | percent | https://www.connectingafrica.com/enterprise-networking/ride-hailing-fuels-income-for-70-of-sa-gig-workers | 2026-10-20 | Bolt and Ipsos survey. Sample size not published in the coverage. Range Assumption |
| fin_resilient | Adults who find it not difficult to raise extra money in 30 days | 30.8 | 18.3 | 30.8 | percent | Little Data Book 2025, South Africa page | 2026-10-20 | Low is the poorest 40 percent. Baseline for the confidence outcome metric |
| cover_2_months | Adults who could cover more than 2 months of expenses if income is lost | 45.0 | 40 | 50 | percent | Little Data Book 2025, South Africa page | 2026-10-20 | Range Assumption |
| saved_informal | Adults who saved using a savings club (stokvel) or person outside the family | 19.6 | 15 | 25 | percent | Little Data Book 2025, South Africa page | 2026-10-20 | Tengo does not model stokvels today |
| borrowed_any | Adults who borrowed formally or informally in the past year | 57.1 | 50 | 60 | percent | Little Data Book 2025, South Africa page | 2026-10-20 | Formal only is 13.2 percent |
| credit_default_share | Credit-active consumers in default (3+ months arrears on at least one loan), Q1 2026 | 41 | 40 | 41 | percent | https://businesstech.co.za/news/wealth/862257/south-africas-middle-class-is-in-serious-trouble-2/ | 2026-10-20 | Eighty20 Credit Stress Report via BusinessTech. Q4 2025 was 40 percent |
| fnb_digital_active | FNB digitally active customers, year to June 2026 | 8160000 | 7780000 | 8160000 | people | https://www.businessday.co.za/companies/2026-09-16-fnb-ceo-bullish-as-deposits-top-r1-trillion-and-private-banking-nears-2-million-clients/ | 2026-10-20 | Low is the June 2025 figure reported in search coverage (not independently checked). App transactions 782m, up 10 percent |
| fnb_retail_clients | FNB retail clients, year to June 2026 | 9000000 | 8000000 | 10000000 | people | Same BusinessDay article | 2026-10-20 | Article gives "almost 9 million" and "almost 10 million" in different places |
| fnb_stokvel_deposits | FNB stokvel deposits, year to June 2026 | 5700000000 | 5700000000 | 5700000000 | ZAR | Same BusinessDay article | 2026-10-20 | Up 31 percent. Signals FNB already serves informal savings groups |
| capitec_app_active | Capitec active banking app clients, year to 28 Feb 2026 | 15300000 | 15300000 | 16500000 | people | https://www.capitecbank.co.za/globalassets/pages/investor-relations/financial-results/2026/audited-results/cpify26_summary.pdf | 2026-10-20 | High is the interim figure reported at https://www.businessday.co.za/companies/2026-10-01-capitec-grows-profits-and-lifts-dividend-as-group-diversifies/ (not opened, from search snippet) |
| capitec_active_clients | Capitec active clients incl. card machine merchants | 25802000 | 25200000 | 25802000 | people | Same Capitec summary PDF | 2026-10-20 | Personal banking 25.2m |
| absa_digital_active | Absa active digital customers (group), six months to June 2026 | 5400000 | 3800000 | 5400000 | people | https://www.businessday.co.za/companies/2026-08-18-absas-digital-users-rise-14-as-it-pushes-technology-adoption/ | 2026-10-20 | Low is the South Africa figure (3.8m) from search coverage, not shown in the fetched article text |
| nedbank_app_active | Nedbank Money app active clients, H1 2026 | 3200000 | 3200000 | 3500000 | people | https://techfinancials.co.za/?p=4061055 | 2026-10-20 | High is digitally active retail clients (3.5m) |
| discovery_bank_clients | Discovery Bank clients, mid 2026 | 1600000 | 1570000 | 1600000 | people | https://www.businessday.co.za/companies/2026-10-15-moodys-forecasts-21-asset-growth-for-discovery-bank/ | 2026-10-20 | From search snippet, not opened. Low from https://en.wikipedia.org/wiki/Discovery_Bank |
| tymebank_customers | TymeBank (GoTyme) customers | 12000000 | 10000000 | 12000000 | people | https://dailyinvestor.com/banking/112501/billionaire-patrice-motsepe-backed-bank-hits-12-million-clients/ | 2026-10-20 | Date of figure unclear. Registered, not active. Low Assumption |

## 2. Funnel to a serviceable segment

The base case is one partner bank (FNB-style) embedding Tengo in its app. All shares are **Assumption**.

| key | description | value | low | high | unit | source or Assumption | access date | notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| tam_irregular_adults | Adults with irregular or informal income (total market) | 6000000 | 4700000 | 9000000 | people | Assumption | 2026-10-20 | Starts from informal plus household employment (4.7m, sourced) and adds gig, commission and multi-job earners in the formal sector. No published total exists |
| sam_share_banked_smartphone | Share of the total market with an account and a smartphone | 55 | 40 | 65 | percent | Assumption | 2026-10-20 | Between Findex smartphone ownership in the poorest 40 percent (52.6) and all adults (67.5), times account ownership |
| partner_base | Partner bank digitally active customers | 8160000 | 7780000 | 8160000 | people | Sourced: fnb_digital_active | 2026-10-20 | Swap for another bank's figure in other scenarios |
| share_partner_irregular | Share of partner digital customers with irregular income patterns | 15 | 8 | 25 | percent | Assumption | 2026-10-20 | Informal plus household workers are 28 percent of the employed (4.7m of 16.7m) but are under-represented among app users of a mid to upper market bank |
| share_eligible_offered | Share of eligible customers the bank chooses to show the feature to | 60 | 30 | 90 | percent | Assumption | 2026-10-20 | Banks pilot behind flags and segment carefully |
| offered_to_activated | Share of those shown who activate | 15 | 5 | 30 | percent | Assumption | 2026-10-20 | In-app placement converts far better than paid installs. No public bank benchmark found |
| activated_to_mau | Share of activated users still monthly active after 3 months | 40 | 20 | 60 | percent | Assumption | 2026-10-20 | Informed by weak public benchmarks in section 7 |
| derived_partner_mau | Partner MAU in steady state (derived) | 44064 | 6000 | 220000 | people | Derived | 2026-10-20 | 8.16m x 0.15 x 0.60 x 0.15 x 0.40. Low and high multiply the low and high shares |
| sponsor_reach | Users reached through a sponsor or NGO programme per year | 10000 | 2000 | 50000 | people | Assumption | 2026-10-20 | Field programmes with platforms or NGOs, onboarding by agents |

## 3. Unit costs per active user per month

| key | description | value | low | high | unit | source or Assumption | access date | notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| usd_zar | Rand per US dollar | 16.13 | 15.73 | 17.19 | ZAR per USD | https://www.valutafx.com/history/usd-zar-2026-08-20 | 2026-10-20 | Value on 2026-08-20. Low and high are 2026 year low (29 Jan) and high (30 Mar) on the same page. No October quote found |
| vat | South African VAT | 15 | 15 | 15 | percent | https://www.panaceamobile.com/gateways/bulk-sms-gateway/ | 2026-10-20 | Stated on vendor price pages as excluded. B2B buyers usually reclaim it |
| db_base | Supabase Pro plan base fee per project | 25 | 25 | 25 | USD per month | https://supabase.com/pricing | 2026-10-20 | Includes 100 000 MAU, 8 GB disk, 250 GB egress, USD 10 compute credit |
| db_mau_overage | Supabase auth MAU above 100 000 | 0.00325 | 0.00325 | 0.00325 | USD per MAU per month | https://supabase.com/pricing | 2026-10-20 | A bank-embedded deployment may not use Supabase auth at all |
| db_compute | Supabase compute add-on (Large) | 110 | 15 | 410 | USD per month | https://supabase.com/pricing | 2026-10-20 | Low is Small, high is 2XL. A bank will likely require hosting in its own cloud tenancy, which changes this line entirely |
| db_egress_overage | Egress above included 250 GB | 0.09 | 0.09 | 0.09 | USD per GB | https://supabase.com/pricing | 2026-10-20 | |
| hosting_per_mau | All-in cloud, database and hosting cost per MAU | 0.15 | 0.05 | 0.60 | ZAR per MAU per month | Assumption | 2026-10-20 | Fixed base above spread over 20k to 200k MAU, plus storage of about 2 000 transactions per user. Bank tenancy or on-premises could be higher |
| forecast_compute | Forecast engine compute per MAU | 0.02 | 0.005 | 0.10 | ZAR per MAU per month | Assumption | 2026-10-20 | Engine is pure TypeScript percentile maths (`src/engine/forecast.ts`); one run per user per day is negligible |
| llm_in_price | Claude Haiku 5.5 input price (prompts up to 100K tokens) | 0.10 | 0.10 | 2.00 | USD per million tokens | https://claude.com/pricing | 2026-10-20 | High is Sonnet 5.5 input |
| llm_out_price | Claude Haiku 5.5 output price | 0.50 | 0.50 | 10.00 | USD per million tokens | https://claude.com/pricing | 2026-10-20 | High is Sonnet 5.5 output. Batch processing is 50 percent off (same page) |
| tokens_in_msg | Input tokens per generated message | 600 | 300 | 1500 | tokens | Assumption | 2026-10-20 | System prompt, forecast summary and language instruction |
| tokens_out_msg | Output tokens per generated message | 120 | 60 | 250 | tokens | Assumption | 2026-10-20 | WhatsApp template in `src/messages/templates.ts` is five short lines |
| msgs_per_month | Proactive messages per MAU per month | 8 | 4 | 30 | messages | Assumption | 2026-10-20 | Brief describes a daily message (30). Base is twice weekly plus state changes, because daily paid messaging breaks the unit economics (see commercial.md COMM-03) |
| wa_utility | WhatsApp utility template message, South Africa, from 1 Oct 2026 | 0.0095 | 0.0071 | 0.0379 | USD per delivered message | https://chatmaxima.com/whatsapp-api-pricing/south-africa/ | 2026-10-20 | Meta's own page https://developers.facebook.com/docs/whatsapp/pricing confirms a utility increase for South Africa on 1 Oct 2026 but the amount was in a linked CSV not read. Low applies the maximum 25 percent volume tier. High is the marketing rate, if Meta classes daily nudges as marketing. Excludes VAT and BSP fees |
| wa_marketing | WhatsApp marketing template message, South Africa | 0.0379 | 0.0379 | 0.0379 | USD per delivered message | https://chatmaxima.com/whatsapp-api-pricing/south-africa/ | 2026-10-20 | Reseller page quoting Meta list rate. Not tiered |
| wa_service_free | Free service messages per phone number per month | 1000 | 1000 | 1000 | messages | https://chatmaxima.com/whatsapp-api-pricing/south-africa/ | 2026-10-20 | Only user-initiated conversations. Utility inside an open 24 hour window is free |
| wa_bsp_fee | Business solution provider fee per message | 0.05 | 0 | 0.15 | ZAR per message | Assumption | 2026-10-20 | BSPs add platform fees (noted on the ChatMaxima page) but no SA rate card was found |
| sms_price | Bulk SMS to South Africa, 0 to 10 000 per month | 0.24 | 0.14 | 0.24 | ZAR per SMS excl. VAT | https://www.panaceamobile.com/gateways/bulk-sms-gateway/ | 2026-10-20 | Panacea tiers fall to R0.17 at 250k+. Low is SMSFlow 14c reported at https://www.itweb.co.za/office/datanamix/content/xA9POvNE6a9qo4J8 (sponsored article) |
| sms_vodacom | Vodacom Messaging bulk SMS entry tier | 0.20 | 0.14 | 0.20 | ZAR per SMS excl. VAT | https://www.vodacommessaging.co.za/products/pdf/Bulk%20SMS.pdf | 2026-10-20 | From search snippet of the PDF, not opened. Minimum spend R155 per month |
| push_cost | In-app push notification inside a bank app | 0 | 0 | 0.01 | ZAR per message | Assumption | 2026-10-20 | Bank already runs push. This is the main reason to prefer the embedded channel |
| support_per_mau | Customer support cost per MAU | 1.00 | 0.30 | 3.00 | ZAR per MAU per month | Assumption | 2026-10-20 | Embedded: the bank's contact centre handles first line, Tengo handles second line. Standalone consumer would be at the high end |
| compliance_fixed | Compliance fixed cost (Information Officer, legal review, audits, pen test, insurance) | 60000 | 30000 | 150000 | ZAR per month | Assumption | 2026-10-20 | See the legal and security reviews for what is required. Bank vendor due diligence raises the high case |
| team_fixed | Core team cost (3 to 5 people) | 250000 | 150000 | 450000 | ZAR per month | Assumption | 2026-10-20 | No sourced SA salary benchmark used |
| payfast_card_pct | PayFast card payment percentage fee | 3.2 | 3.2 | 3.2 | percent excl. VAT | https://payfast.io/fees | 2026-10-20 | From search index of the official page; direct fetch failed. Plus fixed fee below |
| payfast_card_fixed | PayFast card payment fixed fee | 2.00 | 2.00 | 2.00 | ZAR per transaction excl. VAT | https://payfast.io/fees | 2026-10-20 | On a R29 subscription the fee is R2.93 excl. VAT, about 10 percent |
| yoco_online_uplift | Yoco online payments over card machine rate | 0.5 | 0.5 | 0.5 | percentage points | https://www.yoco.com/za/fees | 2026-10-20 | Card machine debit rates up to R50k turnover: 2.30 percent (Core). Implies about 2.8 percent online |

## 4. Revenue inputs per model

| key | description | value | low | high | unit | source or Assumption | access date | notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| lic_fee_per_mau | (a) Bank licence fee per MAU | 5 | 2 | 12 | ZAR per MAU per month | Assumption | 2026-10-20 | No public price for bank PFM engines (Personetics, Meniga, Moneythor publish none). Anchor: Capitec's whole main account costs R7.50 a month (capitec_monthly_fee), so a bank will resist paying a vendor more than a few rand per user for one feature |
| lic_pilot_fee | (a) Fixed fee for a 6 month bank pilot | 400000 | 150000 | 1000000 | ZAR per pilot | Assumption | 2026-10-20 | Covers integration, security review support and evaluation |
| lic_platform_floor | (a) Annual platform minimum after pilot | 1200000 | 600000 | 3000000 | ZAR per year | Assumption | 2026-10-20 | Protects against low activation |
| outcome_share | (b) Share of measured bank benefit paid to Tengo | 20 | 10 | 30 | percent of benefit | Assumption | 2026-10-20 | Requires an agreed control group. Benefit comes from section 5 |
| sub_price | (c) Consumer premium subscription | 29 | 15 | 49 | ZAR per month incl. VAT | Assumption | 2026-10-20 | Comparables below. Target users pay R7.50 a month for a whole Capitec account |
| comp_spotify_student | Spotify Premium Student, South Africa | 47.99 | 47.99 | 47.99 | ZAR per month | https://www.spotify.com/za-en/duo | 2026-10-20 | From search snippet of the official page |
| comp_spotify_individual | Spotify Premium Individual, South Africa (Aug 2025 increase) | 69.99 | 64.99 | 69.99 | ZAR per month | https://fastcompany.co.za/tech/2025-08-07-are-you-prepared-for-spotifys-new-subscription-prices-in-south-africa/ | 2026-10-20 | May have changed since |
| comp_youtube_premium | YouTube Premium individual, South Africa (2025) | 81.99 | 71.99 | 81.99 | ZAR per month | https://www.ewn.co.za/google-increases-youtube-premium-prices-in-south-africa-by-36 | 2026-10-20 | A later increase was reported at https://stuff.co.za/2026/04/13/youtube-premiums-price-is-about-to-go-up-again/ (amount not checked) |
| comp_vault22 | Vault22 (successor platform to 22seven) paid tiers | 0 | 0 | 0 | ZAR | https://vault22.com/ | 2026-10-20 | Free, Basic and Premium tiers exist; prices not shown on the page. Value 0 is the free tier only |
| free_to_paid | (c) Free to paid conversion | 2 | 0.5 | 5 | percent of MAU | Assumption | 2026-10-20 | Low-income target segment, free bank tools available (see commercial.md) |
| sponsor_per_user_year | (d) Sponsor funding per reached user per year | 60 | 20 | 150 | ZAR per user per year | Assumption | 2026-10-20 | Must cover messaging and support; see unit costs |
| grant_saib | Southern Africa Innovation Bridge fintech challenge award | 5000 | 5000 | 5000 | USD per startup | https://engineeringnews.co.za/print-version/world-bank-awards-ten-southern-african-fintech-startups-with-solution-growing-capital-2023-07-17 | 2026-10-20 | 2023 round, World Bank and SECO funded. Shows grant sizes are small |
| grant_mcf_finmark | Mastercard Foundation partnership with FinMark Trust and Cenfri (data facility) | 9600000 | 0 | 9600000 | USD programme | https://africaglobalfunds.com/shop/product/finmark-trust-cenfri-and-mastercard-foundation-to-launch-data-facility-for-service-providers | 2026-10-20 | Aggregator, undated. Programme size, not a grant available to Tengo. Low 0 reflects that |

## 5. Bank value inputs

| key | description | value | low | high | unit | source or Assumption | access date | notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| capitec_returned_do | Capitec returned debit order fee (insufficient funds), personal | 6.00 | 6.00 | 6.00 | ZAR per item | https://www.capitecbank.co.za/globalassets/pages/documents-library/transact/personal-banking-fees-2026.pdf | 2026-10-20 | Valid from 1 March 2026 |
| capitec_do_fee | Capitec debit order fee | 3.00 | 3.00 | 3.00 | ZAR per item | Same Capitec PDF | 2026-10-20 | |
| capitec_monthly_fee | Capitec main account monthly fee | 7.50 | 7.50 | 7.50 | ZAR per month | Same Capitec PDF | 2026-10-20 | Price anchor for the segment |
| sb_unpaid_payt | Standard Bank Access Account unpaid debit order, pay as you transact | 25 | 25 | 25 | ZAR per item | https://www.standardbank.co.za/static_file/South%20Africa/PDF/Personal%20Pricing/2026/Access_Account_Pricing_Guide_2026.pdf | 2026-10-20 | 2026 guide |
| sb_unpaid_bundle | Standard Bank Access Account bundle: unpaid debit orders after 3 free per 12 months | 130 | 130 | 130 | ZAR per item | Same Standard Bank PDF | 2026-10-20 | First 3 in a rolling 12 months are free |
| sb_business_unpaid | Standard Bank business current account unpaid debit order | 155 | 155 | 155 | ZAR per item | https://www.standardbank.co.za/static_file/South%20Africa/PDF/Business%20Pricing/2026/Business%20Current%20Account%20Pricing%20Guide%202026.pdf | 2026-10-20 | From search snippet, not opened. Relevant for spaza owners on business accounts |
| fnb_unpaid_fee | FNB personal unpaid debit order fee | 0 | 0 | 0 | ZAR per item | Not sourced | 2026-10-20 | fnb.co.za pricing pages returned a bot check and the 2025/26 SA guide was not retrievable. Use Capitec and Standard Bank as the range until the FNB guide is checked by hand |
| repo_rate | SARB repo rate | 7.00 | 7.00 | 7.25 | percent | https://www.ewn.co.za/2026/07/23/sarb-keeps-interest-rates-unchanged-surprising-markets-and-analysts | 2026-10-20 | July 2026 hold at 7 percent. High is a single-source report of a September hike to 7.25 at https://briefly.co.za/business-economy/money/254111-sarb-raises-repo-rate-725-what-means-bills-sa/ |
| nca_cap_unsecured | NCA maximum rate, unsecured credit | 21 | 21 | 21 | percentage points over repo | https://mjkinc.co.za/finance-credit-law/interest-cap-and-in-duplum-calculator | 2026-10-20 | Regulation 42 Table A per a law firm summary. 28 percent at 7 percent repo |
| nca_cap_facility | NCA maximum rate, credit facilities (cards, overdrafts likely) | 14 | 14 | 14 | percentage points over repo | Same page | 2026-10-20 | Whether overdrafts fall here is not confirmed by the source |
| pasa_unpaid_benchmark | Acceptable unpaid debit order ratio for collectors | 10 | 4 | 10 | percent of debit orders | https://help.netcash.co.za/?p=9799 | 2026-10-20 | Undated. Low is 2016 PASA data (1.2m unpaid of 31m a month, 3.9 percent) at https://businesstech.co.za/news/?p=136339 |
| share_users_unpaid | Share of target users with at least one unpaid debit order a year | 25 | 10 | 40 | percent | Assumption | 2026-10-20 | Informed by 41 percent of credit-active consumers in default (credit_default_share) |
| unpaid_events_per_user | Unpaid events a year among affected users | 2 | 1 | 4 | events per year | Assumption | 2026-10-20 | |
| unpaid_reduction | Reduction in unpaid events among active users | 10 | 0 | 30 | percent | Assumption | 2026-10-20 | No evidence yet. Must be measured in a pilot with a control group |
| bank_cost_per_unpaid | Bank operational cost per unpaid item (processing, contact) | 15 | 5 | 40 | ZAR per item | Assumption | 2026-10-20 | Not public |
| deposit_uplift | Change in average balance held by an active user | 200 | 0 | 1000 | ZAR per user | Assumption | 2026-10-20 | Could also be negative if users spend up to "safe to spend" |
| nim_on_deposits | Bank margin earned on retail deposits | 4 | 2 | 6 | percent per year | Assumption | 2026-10-20 | Not taken from any bank disclosure |
| attrition_reduction | Reduction in annual customer attrition among active users | 1 | 0 | 3 | percentage points | Assumption | 2026-10-20 | |
| value_per_customer_year | Annual net revenue per retained retail customer in segment | 1500 | 800 | 3000 | ZAR per year | Assumption | 2026-10-20 | Not public at segment level |
| contact_avoided | Contact centre calls avoided per MAU per year | 0.2 | 0 | 1 | calls per year | Assumption | 2026-10-20 | Balance and "why was I charged" calls |
| cost_per_call | Bank cost per contact centre call | 40 | 20 | 80 | ZAR per call | Assumption | 2026-10-20 | |

## 6. Impact inputs

| key | description | value | low | high | unit | source or Assumption | access date | notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| share_behaviour_change | Share of MAU who change a decision because of the forecast in a month | 20 | 5 | 35 | percent | Assumption | 2026-10-20 | Outcome metric: track "state transitions acted on" |
| days_cover_gained | Days of cover gained per behaviour-changing user per month | 2 | 0.5 | 5 | days | Assumption | 2026-10-20 | Measured as forecast date versus actual run-out |
| shortfalls_avoided | Short episodes avoided per active user per year | 0.5 | 0 | 2 | episodes per year | Assumption | 2026-10-20 | |
| fees_avoided | Bank and informal fees avoided per active user per year | 30 | 0 | 260 | ZAR per year | Assumption | 2026-10-20 | Unpaid debit order fees alone give share_users_unpaid x unpaid_events_per_user x unpaid_reduction x fee: 0.25 x 2 x 0.10 x R25 = R1.25 in the base. The rest of the R30 is assumed avoided late-payment and informal lending costs. High uses 0.40 x 4 x 0.30 x R130 plus other costs, capped at R260 |
| confidence_baseline | Baseline share able to raise money in 30 days (proxy for confidence) | 30.8 | 18.3 | 30.8 | percent | Little Data Book 2025, South Africa page | 2026-10-20 | Proposed survey item: "How sure are you that your money will last until your next money?" (5 point scale) |
| confidence_change | Change in share reporting confidence after 3 months | 5 | 0 | 10 | percentage points | Assumption | 2026-10-20 | Needs a pre and post survey with a comparison group |

## 7. Churn, retention and CAC

| key | description | value | low | high | unit | source or Assumption | access date | notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| d30_finance_apps | Day 30 retention, finance apps | 4.2 | 4.2 | 15 | percent | https://www.getpanto.ai/blog/mobile-app-retention-statistics | 2026-10-20 | Vendor blog, unattributed figure. High is the same page's 10 to 15 percent for fintech and banking apps |
| d1_fintech | Day 1 retention, fintech apps | 22 | 15 | 30 | percent | Same page | 2026-10-20 | Weak source. Range Assumption |
| uninstall_m1 | Share of finance app installs uninstalled in month one | 47.5 | 45 | 50 | percent | https://clevertap.com/wp-content/uploads/2025/11/BFSI-Benchmark-Report-Retention.pdf | 2026-10-20 | From search snippet, not opened |
| churn_embedded | Monthly churn of activated users, embedded in a bank app | 4 | 2 | 8 | percent per month | Assumption | 2026-10-20 | Bank app is opened anyway; feature churn is lower than app churn |
| churn_consumer | Monthly churn of paying subscribers, standalone | 12 | 8 | 25 | percent per month | Assumption | 2026-10-20 | Above the weak public figure of about 10 percent for budgeting subscriptions |
| cpi_global | Facebook cost per app install, global median baseline | 15.6 | 1.98 | 26.21 | USD per install | https://www.superads.ai/facebook-ads-costs/cost-per-app-install/marketplaces/south-africa | 2026-10-20 | Vendor tool, global not South African, not finance specific. Use only as a ceiling check. SA CPI is likely lower (Assumption) |
| install_to_active | Share of installs that become monthly active | 25 | 10 | 40 | percent | Assumption | 2026-10-20 | |
| cac_consumer | Blended CAC for a standalone consumer user | 120 | 40 | 400 | ZAR per MAU | Assumption | 2026-10-20 | Assumes SA CPI of R30 (R10 to R100) divided by install_to_active |
| cac_embedded | Tengo's CAC per MAU when the bank distributes | 10 | 0 | 50 | ZAR per MAU | Assumption | 2026-10-20 | Bank bears placement cost; Tengo bears onboarding content and co-marketing |
| cac_sponsor | Cost to onboard one user through agents or NGOs | 80 | 30 | 200 | ZAR per user | Assumption | 2026-10-20 | Field onboarding, data-light |

## 8. Coverage count

- Rows: 116 inputs in total across sections 1 to 7 (including comparables and benchmarks).
- Sourced (URL and access date, including values derived by arithmetic from sourced figures): 69.
- Assumption (no source, reasoning and range given, including values derived only from assumptions): 46.
- Not sourced and unresolved: 1 (`fnb_unpaid_fee`, FNB's South African pricing guide could not be retrieved).
- Weak sources the modeller should widen: `chatmaxima` WhatsApp rates (reseller), `getpanto`, `superads`, `clevertap` snippet, `africaglobalfunds`, `briefly` repo hike, `dailyinvestor` TymeBank count.
