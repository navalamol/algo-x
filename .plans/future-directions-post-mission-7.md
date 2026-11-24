# Algo-X — Future Directions After Mission 7
*Written Nov 2026 — for review before execution*

---

## Where We Are

All 7 missions are complete. The product loop is closed:

```
Morning Brief → Opportunities → Evidence → Paper Trade → Journal → Portfolio Intelligence → What Changed
```

The platform now answers all four original north-star questions:

| Question | Feature | Status |
|----------|---------|--------|
| What matters? | Morning Brief + Opportunities | ✅ |
| Why? | Evidence Cards | ✅ |
| Evidence? | Backtesting (IS/OOS) | ✅ |
| What changed? | What Changed + Portfolio Intelligence | ✅ |

What doesn't exist yet: **feedback**. The system gives signals and records trades, but it cannot yet answer "are the signals any good?" — that's the gap every direction below is trying to close, in different ways.

---

## Immediate Next: Performance Attribution (small, high-signal)

**What:** Add a comparison view in the Trade Journal showing whether intelligence-sourced trades (the AI-chipped ones) outperform manual trades.

**Why first:** This validates the whole intelligence layer. If AI-signal trades win at the same rate as manual trades, the scoring system isn't earning its place. If they win noticeably more, it confirms the architecture is worth extending. Either answer is valuable to know before building more.

**What to build:**

- In `TradeJournal`, add an "Intelligence Performance" panel (collapsed by default, below the equity curve)
- Splits completed trades into two groups: `sourceFlow === 'opportunity'` vs. all others
- Computes per-group: win rate, avg P&L, avg R:R ratio, profit factor
- Shows: a simple 2-column stat comparison + a note on sample size (unreliable below ~15 trades)
- Optionally: breakdown by opportunity score tier (score 75+, 60–74, 45–59)

**Effort:** ~1 day (pure frontend, all data already in trades array).

**Dependencies:** Requires a few paper trades placed via the Paper Trade tab (Mission 7) before the numbers mean anything. In demo mode, can seed 5–6 intelligence-tagged trades to show the UI immediately.

**Acceptance criteria:**
- [ ] Panel shows when at least 1 intelligence-tagged trade exists
- [ ] Correctly splits AI vs. manual trades
- [ ] Win rates, avg P&L, profit factor computed for each group
- [ ] Score tier breakdown (optional but useful for demo)
- [ ] MockService seed extended: 6 intelligence-tagged trades covering both wins and losses

---

## Direction A — Exit Intelligence (medium, high-value)

**What:** Give open paper trades an AI-generated exit recommendation, based on the same evidence engine used at entry.

**Why it matters:** The platform now handles entry intelligently (opportunity score, evidence, strategy match) but exits are entirely manual. A trade entered because RSI was oversold has no corresponding signal for when to close — the user has to remember the original thesis.

**What to build:**

**Backend:**
- Extend `portfolio-intelligence.service.js` with an `assessExitConditions(symbol, entryPrice, stopLoss, target, intelligence)` method
- Uses existing `EvidenceService.getEvidence()` — no new data sources
- Returns: `{ recommendation: 'HOLD' | 'TAKE_PROFIT' | 'CUT_LOSS' | 'REVIEW', reason: string, urgency: 'HIGH' | 'MEDIUM' | 'LOW' }`
- Logic:
  - `TAKE_PROFIT`: RSI now overbought (> 70) AND price > 90% of target OR position in profit > 4%
  - `CUT_LOSS`: RSI now extremely oversold after a failed bounce (< 25) AND position in loss > 2%
  - `REVIEW`: original thesis conditions reversed (e.g., MACD flipped bearish after bullish entry)
  - `HOLD`: everything intact

**New endpoint:** `GET /api/paper-trade/exit-check?symbol=SBIN&entryPrice=625&stopLoss=612&target=652`

**Frontend:**
- In `TradeJournal`, OPEN trades row gets an `Exit Signal` column
- Lazy-loads the exit recommendation on expand (not on page load — avoids hammering evidence API)
- Color-coded: TAKE_PROFIT (green), CUT_LOSS (red), REVIEW (amber), HOLD (grey)

**Demo mode:** MockService `getExitRecommendation(symbol)` with pre-canned recommendations for the 7 scenario instruments (SBIN: CUT_LOSS because URGENT health; INFY: TAKE_PROFIT because overbought; RELIANCE: HOLD).

**Effort:** ~2 days.

**Acceptance criteria:**
- [ ] `assessExitConditions()` returns correct recommendation for each scenario
- [ ] Exit check endpoint works in demo and live mode
- [ ] Journal shows exit signal column for OPEN trades
- [ ] MockService covers all 7 instruments with plausible recommendations
- [ ] USER_GUIDE section added

---

## Direction B — Intraday Intelligence Alerts (medium, operational value)

**What:** Extend the existing alert system so it fires when an opportunity score crosses a threshold, not just when a price hits a level.

**Why it matters:** Currently Telegram sends one morning brief and then goes quiet. The opportunity engine runs and re-scores stocks but users only see updated scores if they manually refresh `/opportunities`. An alert when a stock crosses from "Weak" to "Strong" (score 45→75) is actionable and intraday.

**What to build:**

**Backend:**
- New `IntelligenceAlertService` (or extend existing `AlertService`)
- User configures: `{ symbol, scoreThreshold: 70, direction: 'above' }` — alert when opportunity score crosses the threshold
- `OpportunityService.getRankedOpportunities()` already caches 1 minute — subscribe to cache refreshes, compare new scores vs. saved baselines
- Trigger: `alertService.trigger()` → Telegram + Socket.io `intelligence:score_alert`

**New endpoints:**
- `GET /api/alerts/intelligence` — list configured score alerts
- `POST /api/alerts/intelligence` — create one (symbol, threshold, direction)
- `DELETE /api/alerts/intelligence/:id`

**Frontend:**
- Extend `AlertManager` page with an "Intelligence Alerts" tab
- Simple form: pick symbol from opportunity list, set score threshold
- Alert fires as a browser notification (same `Notification API` as scanner alerts) + Telegram

**Demo mode:** One pre-canned alert fires 30 seconds after page load in demo mode (INFY score crosses 75).

**Effort:** ~2 days.

**Acceptance criteria:**
- [ ] Score alert triggers correctly when opportunity score crosses threshold
- [ ] Telegram + browser notification fire
- [ ] Alert manager UI shows intelligence alerts tab
- [ ] Demo mode shows a pre-canned alert firing
- [ ] USER_GUIDE section added

---

## Direction C — Deeper Journal Analytics (small-medium, trust-building)

**What:** Add a second analytics panel to the Trade Journal with insights beyond the equity curve: best conditions to trade, regime-based performance, day-of-week patterns.

**Why it matters:** The journal currently shows an equity curve and a strategy performance table. Neither answers the question "under what conditions do I actually make money?" This is the most direct learning loop available without any new data sources.

**What to build (all client-side, no new backend):**

1. **Regime Performance** — group completed trades by VIX regime at trade time (LOW/NORMAL/HIGH/EXTREME). Show win rate per regime. Requires storing `vixAtEntry` on new trades (add to `quickTrade` controller).

2. **Day-of-week table** — Monday through Friday, show avg P&L and win rate. Small sample caveat.

3. **Score-to-outcome scatter** — for intelligence-tagged trades only: X axis = opportunity score at entry, Y axis = P&L. If the score is predictive, you'd see a positive slope.

4. **Average hold time** — mean minutes/hours between entry and exit for COMPLETE trades. Useful for understanding whether strategies are behaving as designed (intraday vs. swing).

**Effort:** ~1 day (pure frontend computation on existing trade data, plus minor backend change to store `vixAtEntry`).

**Acceptance criteria:**
- [ ] All 4 analytics panels render correctly on demo trade data
- [ ] `vixAtEntry` stored on new trades going forward
- [ ] Score-to-outcome panel gracefully handles insufficient data (< 10 trades)

---

## Direction D — Smart Watchlist (medium, discoverability)

**What:** Let the opportunity engine populate a "Smart Watchlist" automatically — the top 5 stocks by opportunity score, refreshed daily. The existing static watchlist remains for manual stocks.

**Why it matters:** Currently `/opportunities` is a separate page users have to navigate to. A smart watchlist on the Dashboard puts the ranked list in front of users who primarily live on the dashboard — bridging the two parts of the product.

**What to build:**

**Backend:**
- `GET /api/market/smart-watchlist` — returns `opportunityService.getRankedOpportunities()` sliced to top 5, reformatted as watchlist items (symbol, name, price, score)
- No new service — thin wrapper over existing `OpportunityService`

**Frontend:**
- Dashboard (`/`) gains a "Smart Watchlist" toggle on the existing watchlist section
- When enabled: shows top-5 opportunity stocks with their score rings inline (small, 24px variant of the CircularProgress score ring from OpportunityCard)
- Clicking a row opens the full opportunity card at `/opportunities`

**Effort:** ~1 day.

---

## Direction E — Instrument Universe Expansion (medium, demo quality)

**What:** Expand the MockService from 7 instruments to 25–30, covering all major Nifty 50 sectors more fully.

**Why it matters:** Demo mode shows only 7 instruments. When the app is shown to someone new (or used on a market holiday), only 7 stocks appear in scans, opportunities, and portfolio intelligence. It feels like a prototype, not a product.

**What to build:**

- Add 18–23 instruments to `mockService.mockInstruments` array
- Build deterministic scenario histories for each (using the existing LCG pattern)
- Cover: more Banking (AXISBANK, KOTAKBANK), IT (WIPRO already in), Auto (MARUTI, TATAMOTORS), Pharma (SUNPHARMA, DRREDDY), FMCG (HINDUNILVR, ITC), Infra (LTIM, LTTS), PSU (NTPC, COALINDIA)
- Each new instrument gets a scenario bias that fires one scanner template

**Effort:** ~1 day (mechanical work, no logic changes).

**Benefit:** Makes the demo feel like a real product. Every scan template fires on multiple instruments. Portfolio intelligence has a richer selection.

---

## Direction F — Real-Time Score Push (small, polish)

**What:** When an opportunity score changes by ≥ 10 points on a cache refresh, push a Socket.io event `opportunity:score_change` to the frontend, and animate the score ring on the Opportunities page.

**Why it matters:** Currently the Opportunities page shows a manual "Refresh" button. Users who leave the tab open see stale data. A live score pulse would make the page feel like a live feed rather than a report.

**What to build:**

**Backend:**
- In `OpportunityService.getRankedOpportunities()`, after each cache refresh compare new scores vs. the previous cycle
- If any symbol changes by ≥ 10 points: emit `opportunity:score_change` on `io` with `{ symbol, oldScore, newScore, delta }`
- Requires passing `io` instance to `OpportunityService` (same pattern as other services)

**Frontend:**
- OpportunityCard subscribes to the socket event for its symbol
- On score change: briefly pulse the score ring border (CSS animation, 1 second)
- Update the displayed score without a full page reload

**Effort:** ~half a day backend + ~half a day frontend.

---

## Direction G — Token Auto-Refresh (operational, reduces friction)

**What:** Auto-refresh the Kite access token when it's about to expire, without requiring the user to open the auth page.

**Why it matters:** The Kite access token expires daily at ~6 AM. Every single day, any automated feature (morning brief cron, scan watchdog) silently fails unless the user has manually authenticated that day. This is the #1 pain point for anyone using the platform in a "mostly automated" way.

**What to build:**

- Kite Connect does not support programmatic token refresh (requires a browser redirect)
- **Workaround**: a lightweight auth redirect page that auto-opens at 8:50 AM IST (10 mins before market open) if the token is expired or expiring, using the system's default browser (`open` command on Mac, `start` on Windows)
- Alternatively: run the auth server as a local service that handles the redirect automatically

**Effort:** ~1 day. **Caveat:** Requires the machine to be on and the user to briefly authorize in the browser once. Fully headless token refresh is not supported by Kite Connect's OAuth.

---

## Direction H — Sector Rotation Dashboard (medium, macro view)

**What:** A dedicated page showing sector momentum trends over time — which sectors are rotating in and out of favour over the last 5–10 trading days.

**Why it matters:** The existing Sector Heatmap shows today's sector moves. But sector rotation is a multi-day pattern. Knowing that IT has been declining for 4 consecutive days while Energy has been rising gives a macro overlay that improves individual stock decisions.

**What to build:**

**Backend:**
- Extend `HeatmapService` to store a 10-day rolling history of sector % changes (in-memory, lost on restart — acceptable)
- `GET /api/heatmap/rotation` returns: per-sector time series of daily % change over last N days

**Frontend:**
- New route `/sectors` under the Market section
- Recharts `LineChart` per sector, overlaid on one chart (10 lines, 10 days)
- Sector trend direction chip: "IT ↓ 3-day streak", "Energy ↑ 2-day streak"

**Demo mode:** 10-day synthetic history generated deterministically for each sector.

**Effort:** ~2 days.

---

## Directions Not Recommended (and why)

| Direction | Why Not Now |
|-----------|-------------|
| Real money execution | Paper trading hasn't proven consistent profitability yet — premature |
| LLM stock prediction | Hallucination risk; can't explain predictions; no audit trail |
| Options automation | Requires F&O data (Kite instruments list is different), significant complexity, high risk |
| Group leaderboard | Requires multi-user auth, shared state — SaaS infrastructure not in scope |
| Mobile app | Web app first; not enough daily active usage pattern established yet |
| External data sources (screener.in, Trendlyne scraping) | Legal/ToS risk; Yahoo Finance is already a stable free source |

---

## Recommended Sequence

If this document is approved, the suggested order:

| Priority | Direction | Effort | Why This Order |
|----------|-----------|--------|----------------|
| 1 | Performance Attribution | 1 day | Validates the intelligence layer before extending it |
| 2 | Instrument Universe Expansion (E) | 1 day | Makes demo feel production-quality; unblocks realistic testing |
| 3 | Exit Intelligence (A) | 2 days | Completes the position lifecycle; natural follow-on to M7 |
| 4 | Deeper Journal Analytics (C) | 1 day | Closes the learning loop — shows what conditions actually work |
| 5 | Intraday Alerts (B) | 2 days | Adds proactive value; requires a few live/paper trade sessions first |
| 6 | Smart Watchlist (D) | 1 day | Polish; bridges dashboard and intelligence |
| 7 | Sector Rotation Dashboard (H) | 2 days | Macro overlay; more useful once individual stock layer is solid |
| 8 | Real-Time Score Push (F) | 1 day | Polish; defer until core features are stable |
| 9 | Token Auto-Refresh (G) | 1 day | Operational quality-of-life; do when moving to daily live use |

**Total estimated effort: ~12 days of work across 9 directions.**

---

## Open Questions for Review

1. **Performance Attribution threshold**: How many trades are needed before the comparison is meaningful? Suggest showing results at 5+ trades with a "low sample size" warning, meaningful signal at 20+.

2. **Exit Intelligence scope**: Should exit recommendations be purely advisory (shown in journal) or should they optionally trigger an auto-close of the paper trade? Starting advisory-only seems safer.

3. **Instrument Universe**: Should the expansion focus on Nifty 50 completeness (institutional relevance) or the most actively traded F&O names (more practical for the strategies in use)?

4. **Score alert threshold**: What default threshold makes sense for the intelligence alert? 70 (Strong) seems right — avoids noise from stocks moving in and out of the 60–70 "Moderate" band.

5. **Token refresh strategy**: Is daily manual auth acceptable for the current usage pattern, or is this urgent enough to prioritise above analytics work?
