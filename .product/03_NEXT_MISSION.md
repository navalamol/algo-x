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

## ✅ Mission 3 — Why This Stock (Evidence Cards) — VALIDATED

**Objective:** User understands why a stock ranked highly without opening 5 external tools.

**What was built:**
- `EvidenceService` — computes 7 signal types (RSI, MACD, SMA trend, Bollinger, Volume, StochRSI, VWAP), builds plain-English summary
- `GET /api/opportunities/:symbol/evidence` — per-stock evidence card with signals, raw technicals, key levels, sector
- Frontend: 2-tab expanded panel on each OpportunityCard — "Score Breakdown" (existing) + "Why This Stock" (new); evidence loads on first tab view
- Full demo mode support — all 7 instruments generate realistic evidence from scenario histories
- USER_GUIDE.md section 12 added

**Validation status: ✅ VALIDATED** — all 7 instruments return complete evidence cards with realistic signals.

**Validated:**
- [x] All 7 instruments (INFY, RELIANCE, TCS, HDFCBANK, ICICIBANK, SBIN, ITC) produce evidence cards
- [x] 7 signal types computed per instrument (RSI, MACD, SMA Trend, Bollinger, Volume, StochRSI, VWAP)
- [x] Summary, signals, technicals, keyLevels, sector all populated
- [x] 2-minute cache working
- [x] Evidence endpoint: `GET /api/opportunities/INFY/evidence` ✓

---

## ✅ Mission 4 — What Changed — VALIDATED

**Objective:** User can stop manually polling every stock in their watchlist.

**What was built:**
- `backend/utils/market-state.js` — shared primitive: derives categorical state (rsiZone, volumeBand, trendBias, macdBias, vwapPosition) from raw indicator values. Reused by Mission 6.
- `ChangeDetectionService` — takes snapshots of categorical state per symbol; detects transitions on re-evaluate; sorts by significance (HIGH/MEDIUM/LOW)
- Change types: rsi_zone, volume_band, trend_bias, macd_flip, vwap_cross
- `GET /api/changes` — returns sorted ChangeEvent list vs last snapshot
- `POST /api/changes/snapshot` — resets baseline to current state ("New Session")
- Frontend `WhatChangedCard` in IntelligenceHome — replaces COMING SOON placeholder; loads on page load; New Session button; significance-colored event list
- MockService `getChanges()` — 5 pre-canned realistic changes for demo mode
- USER_GUIDE.md section 13 added
- Roadmap strip in IntelligenceHome updated: M2/M3/M4 all marked ✓

**Validation status: ✅ VALIDATED** — 5 pre-canned changes confirmed, all significance levels correct.

**Validated:**
- [x] 5 changes returned (INFY, SBIN, RELIANCE, TCS, ICICIBANK)
- [x] 2 HIGH significance (SBIN RSI extreme, INFY trend flip)
- [x] 2 MEDIUM significance (RELIANCE MACD, TCS volume)
- [x] 1 LOW significance (ICICIBANK VWAP)
- [x] Sort order: HIGH first, then MEDIUM, then LOW
- [x] Snapshot reset endpoint working

---

## ✅ Mission 5 — Real Historical Backtesting — VALIDATED

**What was built:**
- `KiteService.getHistoricalData()` wired properly (uses rate-limited KiteService, not raw kite object)
- `splitCandles(candles, outOfSamplePct)` in `backtest.service.js` — in-sample / out-of-sample split
- `mockService.getHistoricalOHLCV(symbol, days)` — deterministic LCG-seeded OHLCV for demo mode
- Response: `dataSource` (HISTORICAL_KITE / SYNTHETIC_DEMO / SYNTHETIC_FALLBACK), `inSample`, `outOfSample`, combined `equity` with `period` field
- Frontend: dynamic banner, two metric panels, equity curve split reference line, tabbed trade log, overfitting warning
- USER_GUIDE section 14 added

**Validation status: ✅ VALIDATED** — IS/OOS split, deterministic demo data, OOS warmup bug fixed.

**Validated:**
- [x] `splitCandles()` splits correctly (365d/20% → 292 IS + 73 OOS bars)
- [x] `runBacktestOOS()` with IS tail warmup: 365d/20% yields 53 OOS equity points
- [x] Fixed: OOS equity was `slice(tail.length)=slice(50)` → now `slice(1)` (correct: only 1 initial entry)
- [x] `mockService.getHistoricalOHLCV()` deterministic LCG seed per symbol ✓
- [x] IS metrics computed separately from OOS metrics
- [x] dataSource: SYNTHETIC_DEMO in demo mode, SYNTHETIC_FALLBACK on Kite error
- [x] Overfitting warning logic: IS−OOS win rate gap > 15pp

---

## ✅ Mission 6 — Portfolio Intelligence — VALIDATED

**What was built:**
- `portfolio-intelligence.service.js` — reuses `computeMarketState()` (market-state.js) and `EvidenceService.getEvidence()` to score each open holding; Pearson r correlation between holding pairs; sector concentration from SECTOR_MAP
- `GET /api/portfolio/intelligence?profile=amol` → holdings with health (URGENT/WATCH/REVIEW/HOLD), sectors with allocation %, correlations with r value
- `mockService.getPortfolioIntelligence()` — 5 pre-canned holdings covering all 4 health states (INFY HOLD, SBIN URGENT, RELIANCE HOLD, TCS REVIEW, ICICIBANK WATCH)
- Frontend `PortfolioIntelligence.js` — summary strip (4 health counts + portfolio value + P&L), expandable holdings table sorted URGENT-first, sector concentration progress bars, correlation pair table
- Added to nav under Intelligence section at `/portfolio`
- USER_GUIDE section 15 added

**Validation status: ✅ VALIDATED** — all health states, sectors, and correlations confirmed.

**Validated:**
- [x] dataSource: demo ✓, totalHoldings: 5 ✓
- [x] 1 URGENT (SBIN -5.23%), 1 WATCH (ICICIBANK), 1 REVIEW (TCS), 2 HOLD (INFY, RELIANCE)
- [x] IT sector 43.4% HIGH, Banking 33.1% MEDIUM, Energy 23.5% LOW
- [x] INFY↔TCS r=0.86 HIGH, SBIN↔ICICIBANK r=0.74 HIGH, INFY↔RELIANCE r=0.42 MODERATE
- [x] 90-second cache working
- [x] Demo mode toggle correctly routes to mockService.getPortfolioIntelligence()

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
