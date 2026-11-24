# Next Mission

*Updated after strategic review Nov 2026. Scan Watchdog is DONE.*

## Just Completed: Scan Watchdog + VIX Fix

**What's now live:**
- Background watch mode: `ScannerService.startWatching(templateId)` polls every 2 minutes
- New match detection: diffs current matches vs previous cycle, fires only on new entrants
- Rich Telegram alert: RSI, volume×avg, VWAP status, Radar score, VIX condition, sector
- Morning brief cron: 9:00 AM IST Mon–Fri, all templates summarized, sent to Telegram
- UI: Watch toggle on each template card, new match feed, Snackbar notifications
- VIX fixed: Kite Connect API primary source, NSE fallback, demo mode randomized

---

## Mission 2: Trade Journal UI (Priority: High)

**Why:** Every paper trade is logged to `profiles/{name}/trades.json` but there's no UI to review them. Without a journal UI, learning from trades is impossible.

**What to build:**
- Trade history table: entry/exit price, P&L, duration, strategy/template used
- Filter by date range, strategy, outcome (win/loss)
- P&L chart over time (equity curve)
- Per-trade notes field (Y/N reply from Telegram + optional reason)

**Files:**
- Create `client/src/components/TradeJournal/TradeJournal.js`
- Add `/api/journal/:profileName` route reading `profiles/{name}/trades.json`
- Wire into sidebar nav

**Effort:** ~2 days

---

## Mission 3: Backtesting Engine (Priority: Medium)

**Why:** Before risking real money, you need to know if a strategy actually worked on historical data.

**Prerequisites:**
- Historical OHLCV data download from Kite (`kiteService.getHistoricalData()`)
- Data storage format decision (JSON files per instrument vs SQLite)

**What to build:**
- Download script: fetch N days of daily/minute candles for watchlist instruments
- Backtest runner: replay price history through scan conditions, simulate entries/exits
- Results: total return, win rate, max drawdown, Sharpe ratio
- Compare templates head-to-head

**Effort:** ~1 week

---

## Mission 4: Strategy Performance Dashboard (Priority: Medium, needs data)

**Trigger:** Build this after 50+ paper trades exist

**What to build:**
- Win rate by template, by time-of-day, by VIX band
- Average P&L per setup
- Best/worst performing conditions
- Heat map: day × hour showing which slots generate alpha

**Files:**
- Backend aggregation in `backend/services/analytics.service.js`
- Dashboard component with Recharts

---

## Indicators Waiting to Be Used

These are correctly implemented but no scan template references them:
- `StochasticRSI` — add "StochRSI oversold" scan template
- `MACD histogram` — add "MACD bullish cross" scan template
- `ATR` — use for dynamic stop-loss sizing in paper trading

---

## Never Build (Until Paper Trading is Consistently Profitable)

- Real money execution
- Group leaderboard
- Chartink webhook bridge (nice to have, not on critical path)
