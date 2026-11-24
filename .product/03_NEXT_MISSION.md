# Next Mission

*Updated Nov 2026 — after Trade Journal UI, Demo Infrastructure, and Backtesting Engine are DONE.*

## Just Completed (this session)

**Demo Infrastructure overhaul:**
- Runtime demo toggle chip in AppBar — no `.env` edits needed
- KiteService & RadarService: `demoMode` converted to getter (live re-checks `isDemoMode()` on every call)
- `db.config.js`: skip MongoDB in demo mode, 5s connection timeout, no `process.exit(1)`
- `kite.config.js`: `runtimeDemoOverride` + `setDemoModeOverride()` / `getDemoModeOverride()`
- `demo.controller.js` + `demo.routes.js`: GET/POST `/api/demo/mode`
- Heatmap: fixed `SECTORS` import, added `_buildDemoData()` with 50+ stock demo prices
- Radar: lazy `watchSymbols` init from MockService in demo mode
- Strategy service: guard against undefined `instruments` array

**Trade Journal UI** (`/journal`):
- Paper / Live / All tabs (Live correctly shows 0 paper trades)
- Stat cards, equity curve (AreaChart), strategy performance table
- Filterable trades table (status, strategy, symbol, date range)
- CSV export button

**Dashboard P&L chart:** Daily P&L bar chart from journal trades (last 14 days)

**Browser notifications:** `Notification API` for `scanner:new_match` socket events

**Strategy Library fix:** Express route ordering bug — static `/library/strategies` moved before `/:name`

**Backtesting Engine** (`/backtest`):
- `backtest.service.js`: bar-by-bar simulator — RSI, SMA20/50, MACD, BB, VWAP computed per bar; stop-loss/take-profit execution; equity curve, drawdown, Sharpe approximation
- `backtest.controller.js`: loads strategy from default library; generates synthetic OHLCV in demo mode; uses Kite historical data when API key is live
- `Backtest.js` frontend: strategy/symbol/days/capital config, equity curve, monthly P&L bars, 6 metric cards, trade log accordion

---

## Mission 4: Strategy Performance Analytics (Priority: Medium)

**Trigger:** 50+ paper trades logged — we now have 25 seeded. Run the platform for a week in demo mode to accumulate real signal data.

**What to build:**
- Win rate by strategy, by time-of-day, by VIX band (LOW/NORMAL/HIGH/EXTREME)
- Average P&L per setup
- Best/worst performing conditions
- Heat map: day-of-week × hour showing which slots generate alpha
- Backend: `backend/services/analytics.service.js` aggregating `profiles/{name}/trades.json`
- Frontend: new Analytics page with Recharts charts

**Effort:** ~2 days

---

## Mission 5: Backtest Improvements (Priority: Medium)

The basic engine is live. Next iteration:

1. **Real historical data** — when Kite API key is live, `backtest.controller.js` already attempts `kite.getHistoricalData()` but the instrument lookup needs testing on real NSE data
2. **Strategy comparison** — run multiple strategies on same symbol/period side-by-side
3. **Walk-forward testing** — split data into in-sample (train) and out-of-sample (test) windows
4. **Parameter optimization** — sweep RSI period, SL%, TP% over grid and report best combo

**Effort:** ~3 days for items 1–2; ~1 week for 3–4

---

## Mission 6: ATR-based Dynamic Stop-Loss (Priority: Low, Quick Win)

`calculateATR()` is implemented in `indicators.service.js` but unused in live trading. Wire it into `paper-trading.service.js` so stop-loss = `entry_price - (ATR_multiplier × ATR)` instead of fixed %.

**Files:**
- `backend/services/paper-trading.service.js` — read ATR from `memoryStore`, compute dynamic SL
- `backend/config/trading.config.js` — add `atrMultiplier` default (1.5)

**Effort:** ~2 hours

---

## Never Build (Until Paper Trading is Consistently Profitable)

- Real money execution
- Group leaderboard
- Chartink webhook bridge
