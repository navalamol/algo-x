# Feature Backlog

*Priority order: High → Medium → Low. Each item is scoped for a single session.*

---

## HIGH PRIORITY

### BT-1: Backtesting Engine
**Why:** The single biggest gap. Can't validate a strategy before risking capital without backtesting.

**Scope:**
- Load historical OHLCV data from JSON/CSV files
- Run any strategy's conditions against that data tick-by-tick
- Output: total return %, win rate, avg profit/loss, max drawdown, Sharpe ratio, equity curve
- API: `POST /api/backtest/run { strategyId, symbol, fromDate, toDate }`
- UI: Backtest tab in strategy builder, equity curve chart

**Where to build:**
- `backend/services/backtest.service.js`
- `backend/controllers/backtest.controller.js`
- `backend/routes/backtest.routes.js`
- `client/src/components/Backtest/Backtest.js`

**Data needed:** Historical OHLCV — download from Kite Historical API or NSE bhav copy CSVs into `data/historical/{SYMBOL}.json`

---

### BT-2: Trade Journal UI
**Why:** `journal.json` exists per profile but there's no way to view or annotate trades in the UI.

**Scope:**
- List all past trades with entry/exit context (which indicator triggered it, VIX at time of trade)
- Add manual notes to any trade
- Filter by strategy, outcome (win/loss), date range
- Weekly insights: "win rate Mondays vs Fridays", "best performing strategy last 30 days"

**Where to build:**
- `client/src/components/TradeJournal/TradeJournal.js`
- Route `/journal`
- API already exists: `GET /api/profiles/:name/trades`

---

### BT-3: Historical Data Downloader
**Why:** Backtesting needs historical data. Manual downloads are tedious.

**Scope:**
- Script `scripts/download-history.js` that calls Kite Historical API
- Downloads candle data (1-minute, 5-minute, day) for a list of symbols
- Saves to `data/historical/{SYMBOL}_{timeframe}.json`
- CLI: `node scripts/download-history.js --symbols RELIANCE,TCS --timeframe day --days 365`

---

## MEDIUM PRIORITY

### BT-4: Telegram Activation
**Why:** Currently disabled in `profiles/amol/config.json` (`"enabled": false`). Need to configure real bot token.

**Scope:**
- Create Telegram bot via @BotFather
- Add token + chat ID to profile via Settings UI
- Test alert works
- Enable daily summary at market close (3:35 PM IST via node-cron)

---

### BT-5: Strategy Performance Dashboard
**Why:** No aggregate view of "which of my strategies is best performing" across all paper trades.

**Scope:**
- API: `GET /api/profiles/:name/statistics` already returns totals — enhance with per-strategy breakdown
- UI widget on Dashboard showing: strategy name, trades, win rate, total P&L, avg P&L per trade
- Sort by P&L descending to quickly see what works

---

### BT-6: Real Trading Confidence Gate
**Why:** Need an explicit checkpoint before switching from paper to live trading.

**Scope:**
- API endpoint `GET /api/profiles/:name/readiness` that checks:
  - Total paper trades ≥ 50
  - Win rate ≥ 52%
  - No daily loss limit breaches in last 10 trading days
  - Telegram configured and working
- Dashboard badge: "Paper Ready ✅" or "Not Ready ❌ (need 23 more trades)"
- Explicit toggle in Settings: "Switch to Live Trading" (requires readiness gate pass)

---

### BT-7: Watchlist Persistence
**Why:** Watchlists are saved to `profiles/{name}/watchlists.json` but the Dashboard Stock Filter doesn't auto-load them on page refresh.

**Scope:**
- On Dashboard load, fetch `GET /api/profiles/:name/watchlists` and pre-populate the subscription list
- Save changes back when user adds/removes symbols

---

### BT-8: Second Profile Setup (Shailja)
**Why:** `profiles/shailja/` exists but config is minimal. Set it up properly.

**Scope:**
- Review and fill `profiles/shailja/config.json` with appropriate risk level, capital, Telegram settings
- Verify profile switching in Settings → ProfileSelector works correctly
- Document: which strategies are assigned to which profile

---

## LOW PRIORITY

### BT-9: NSE Sector Mapping Enhancement
**Why:** `backend/config/sector-mapping.js` maps stocks to sectors for the heatmap, but coverage may be incomplete.

**Scope:**
- Audit current sector mapping
- Add missing Nifty 50 / Nifty 500 stocks
- Verify heatmap shows meaningful sector data

---

### BT-10: Group Leaderboard
**Why:** Fun motivation for two or more people using the same instance.

**Scope:**
- API: `GET /api/profiles/leaderboard` — returns all profiles' weekly P&L, win rate, trade count
- Simple table on a `/leaderboard` page
- Opt-in per profile via config

---

### BT-11: Pyramid / Add-to-Winner Logic
**Why:** Strategy engine currently does single entry. Pyramiding (averaging down or adding to winners) could improve returns.

**Scope:**
- Add `pyramiding` config block to strategy schema
- Strategy service checks if position is already open before triggering second entry
- Max 3 entries per symbol per strategy

---

### BT-12: Mobile-Friendly UI
**Why:** MUI layout currently isn't optimized for phone screens.

**Scope:**
- Make sidebar collapsible on small screens
- Key widgets (radar, alerts) work on 375px width
- Good enough to glance at Telegram then check the app on mobile

---

## COMPLETED (do not re-implement)

- ✅ Real-time WebSocket ticker
- ✅ RSI, SMA, EMA, VWAP, MACD, StochasticRSI, Bollinger Bands, ATR, OBV
- ✅ Strategy builder (create, activate, deactivate)
- ✅ Order management (paper + live routing)
- ✅ Paper trading service (virtual ₹1L, slippage, brokerage)
- ✅ India VIX integration (dynamic risk adjustment)
- ✅ Telegram service (trade, stop-loss, target, daily summary)
- ✅ User profiles (JSON file-based, amol + shailja)
- ✅ Order Radar (order book imbalance scanner)
- ✅ Stock Scanner (5 built-in templates + custom)
- ✅ Sector Heatmap
- ✅ Alert Manager (price + indicator watches)
- ✅ Strategy Library (10 pre-built strategies)
- ✅ Kite OAuth authentication flow
