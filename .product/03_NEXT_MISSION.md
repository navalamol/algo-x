# Next Mission

*Updated Nov 2026 — Product Reorientation. See `ALGO_X_PRODUCT_REORIENTATION_AND_EXECUTION_PLAN.md`.*

## Just Completed (this session)

**Demo Infrastructure, Trade Journal UI, Backtesting Engine, Dashboard P&L Chart, Browser Notifications** — all done. See `01_STATE.md` for full details.

---

## Current Direction: Reorientation to Market Intelligence

The product is shifting from "algo trading platform" to "personal Indian market intelligence engine."

Primary user question: **"What deserves my attention today, and why?"**

Do not build new trading features until Mission 0–3 are validated.

---

## ✅ Mission 0 — Product Reorganization (DONE)

**Objective:** Reorganize the UI around the new mission without touching existing backend logic.

**User value:** New user understands what the product does in <30 seconds.

**What to build:**
- New landing/home page: "Morning Brief" card + "Top Opportunities" card + "What Changed" card (data can be placeholder/mock initially)
- Reorganize top navigation: HOME / OPPORTUNITIES / PORTFOLIO / MARKET / STRATEGIES / JOURNAL / ALERTS / SETTINGS
- Existing routes (radar, scanner, heatmap, strategies, backtesting) move under MARKET / STRATEGIES — they don't disappear, just deprioritized
- Landing page communicates product through 6 Missions (not feature list) — see §26 of reorientation doc
- Label the backtesting page clearly: **"SIMULATION / ILLUSTRATIVE ONLY — demo mode uses synthetic data"**
- Remove or label hardcoded win rates in strategy library (not evidence-backed)

**Acceptance criteria:**
- [ ] New HOME route shows Morning Brief + Opportunities + What Changed sections (even if data is placeholder)
- [ ] Navigation updated to new IA
- [ ] Backtesting page has clear simulation disclaimer
- [ ] Strategy library win rates labelled as "illustrative"

**Effort:** ~1 day frontend work, no backend changes

---

## ✅ Mission 1 — Morning Brief (DONE)

**Objective:** Build the first daily habit. User understands the market in <60 seconds.

**User value:** Replaces the need to check 3 different sites to understand the day.

**What to build (backend):**
- `MorningBriefService` consuming existing: VixService, HeatmapService, ScannerService, AlertService
- Output: `{ regime, vix, sectorLeaders, topOpportunities, watchlistChanges, portfolioWarnings }`
- Telegram delivery at 9:00 AM IST (extend existing morning brief cron in `scanner.service.js`)
- REST endpoint: `GET /api/morning-brief`

**What to build (frontend):**
- HOME page `MorningBrief` component — regime chip, VIX chip, sector pills, top 3 opportunities, watchlist changes
- Target: scannable in <60 seconds

**MockService extension required:** `getMorningBrief()` with realistic demo data

**USER_GUIDE.md section required**

**Acceptance criteria:**
- [ ] HOME page shows today's brief on load
- [ ] Brief is delivered to Telegram at 9 AM IST
- [ ] Demo mode shows realistic brief without Kite key
- [ ] User can scan it in <60 seconds

**Effort:** ~2 days

---

## ✅ Mission 2 — Opportunity Ranking Engine (DONE)

**Objective:** Surface 5–10 stocks worth researching, ranked by multi-factor score.

**User value:** Replaces manual scanning of hundreds of stocks.

**What was built:**
- `OpportunityService` — scores stocks across: Trend (25%), Momentum/RSI (20%), Volume (20%), Relative Strength vs NIFTY (20%), VIX regime (15%)
- Scores are explainable: every point traceable to a reason string
- Missing data shown explicitly (neutral score + "insufficient history" reason)
- `GET /api/opportunities` → ranked list with score breakdown
- Frontend `/opportunities` — expandable cards with score ring, mini factor bars, full breakdown panel
- Demo mode computes real scores from scenario price histories (not hardcoded)
- `soon: true` removed from nav — route is live
- USER_GUIDE section added

---

## Mission 3 — Why This Stock (Evidence Cards)

**Objective:** User understands why a stock ranked highly without opening 5 external tools.

**What to build:**
- Per-stock evidence card: Fundamental summary (if available), Technical positives/risks, Market/sector context, Data freshness timestamps
- `GET /api/opportunities/:symbol/evidence`
- Frontend: expandable evidence panel on each opportunity card

**Effort:** ~2 days

---

## Mission 4 — What Changed

**Objective:** User can stop manually polling every stock in their watchlist.

**What to build:**
- `ChangeDetectionService` — compares current snapshot vs last known state per watchlist stock
- Change types: Price breakout/breakdown, Momentum shift, Volume anomaly, Relative strength change, Sector leadership change
- Surfaces only meaningful changes, filters noise
- Hooks into AlertService for Telegram delivery

**Effort:** ~2 days

---

## Mission 5 — Real Historical Backtesting

**Objective:** Every claimed strategy performance can be traced to real historical data.

**What to build:**
- When Kite API key is live: use `kite.getHistoricalData()` (already partially wired)
- In-sample / out-of-sample split
- Clear label distinction: `HISTORICAL BACKTEST` vs `SIMULATION / ILLUSTRATIVE ONLY`
- Remove or gate synthetic-data metrics that look like real evidence
- Walk-forward testing (stretch goal)

**Effort:** ~3 days core, ~1 week with walk-forward

---

## Mission 6 — Portfolio Intelligence

**Objective:** Algo-X becomes useful even when the user doesn't want to place a trade.

**What to build:**
- Portfolio health summary: HOLD / REVIEW / WATCH / URGENT per holding
- Sector concentration risk
- Correlations between holdings
- Changes in portfolio context (opportunity score, risk)

**Effort:** ~3 days

---

## Mission 7 — Strategy / Paper Trading Integration

**Objective:** Connect the new intelligence layer with the existing execution layer.

**Flow:** Opportunity → Evidence → Strategy → Paper Trade → Journal → Validation

This completes the full product loop.

---

## Never Build (Until Paper Trading is Consistently Profitable)

- Real money execution
- Group leaderboard
- SaaS multi-tenancy / payment gateway
- Mobile app
- LLM stock prediction ("what will XYZ do tomorrow?")
- Options automation
