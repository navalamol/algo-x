# Current State — What's Built and Working

*Last updated: November 2026 — Post Reorientation*

## Product Direction (Updated Nov 2026)

The product is reorienting from "algorithmic trading platform" to **"personal Indian market intelligence and decision-support engine."**

The four north-star questions Algo-X must answer:
1. **What matters?** — What deserves my attention today?
2. **Why?** — Why does this stock/setup matter?
3. **Evidence?** — Has this setup historically worked?
4. **What changed?** — What changed in my portfolio/watchlist?

Existing modules (scanner, radar, strategy, heatmap, paper trading) are **preserved** as a secondary Advanced Trading layer. They are not the primary product entry point.

See `ALGO_X_PRODUCT_REORIENTATION_AND_EXECUTION_PLAN.md` for the full strategic document.

---

## ⚠️ Integrity Issue (Must Fix Before Claiming Historical Evidence)

- **Backtesting engine uses synthetic OHLCV** in demo mode but displays real-looking metrics (win rate, Sharpe, profit factor) without a clear `SIMULATION / ILLUSTRATIVE ONLY` label. This violates the product trust requirement (§13 of reorientation doc).
- **Strategy library win rates are hardcoded** (65%, 68%, 72% etc.) — these are not evidence-backed. They must either be removed or labelled as illustrative.

---

## Status: Paper Trading Mode, All Services Running

The platform is fully functional in demo/paper trading mode. No real money executes. Both profiles (amol, shailja) are set to `paperTrading: true`.

---

## ✅ Built and Working

### Backend Services

| Service | File | What It Does |
|---------|------|--------------|
| TickerService | `backend/services/ticker.service.js` | Connects to Kite WebSocket for real-time price data; falls back to mock in demo mode |
| StrategyService | `backend/services/strategy.service.js` | Evaluates active strategies every second, generates buy/sell signals |
| OrderService | `backend/services/order.service.js` | Routes orders to paper trading or real Kite API based on profile config |
| PaperTradingService | `backend/services/paper-trading.service.js` | Simulates trade execution with slippage + brokerage on virtual ₹1L capital |
| VixService | `backend/services/vix.service.js` | Fetches India VIX from NSE every 5 min; adjusts stop-loss, take-profit, quantity |
| RadarService | `backend/services/radar.service.js` | Scans order book depth every 2s; surfaces stocks with ≥30% buyer imbalance |
| ScannerService | `backend/services/scanner.service.js` | Runs template-based scans (5 built-in templates) on demand or scheduled |
| HeatmapService | `backend/services/heatmap.service.js` | Aggregates price change by sector for sector heatmap |
| AlertService | `backend/services/alert.service.js` | Watches price/indicator conditions; triggers Telegram or socket alerts |
| ProfileService | `backend/services/profile.service.js` | Reads/writes JSON profiles; each user has isolated strategies, trades, config |
| TelegramService | `backend/services/telegram.service.js` | Sends trade executed, stop-loss, target, daily summary notifications |
| KiteService | `backend/services/kite.service.js` | Wraps Kite Connect SDK; uses MockService when demo mode is on |
| MockService | `backend/services/mock.service.js` | Provides simulated market data when no Kite API key is configured |
| MemoryStoreService | `backend/services/memory-store.service.js` | In-memory price/order history cache for indicators |

### Technical Indicators (all in `backend/services/indicators.service.js`)

| Indicator | Function |
|-----------|----------|
| RSI (14) | `calculateRSI(prices, period)` |
| SMA | `calculateSMA(prices, period)` |
| EMA | `calculateEMA(prices, period)` |
| VWAP | `calculateVWAP(data)` — resets daily |
| MACD (12/26/9) | `calculateMACD(prices)` — returns macd, signal, histogram |
| Stochastic RSI | `calculateStochasticRSI(prices)` — returns value, overbought/oversold flags |
| Bollinger Bands (20, 2σ) | `calculateBollingerBands(prices)` — upper, middle, lower |
| ATR (14) | `calculateATR(ohlc)` |
| OBV | `calculateOBV(data)` |
| Buyer/Seller Ratio | `calculateBuyerSellerRatio(depth)` — from order book depth |
| Support/Resistance | `detectSupportResistance(prices)` — recent high/low |
| Volume Change % | `calculateVolumeChange(current, avg)` |

### Frontend Pages (React, MUI dark theme)

| Page | Route | Component | What It Shows |
|------|-------|-----------|---------------|
| Dashboard | `/` | `Dashboard.js` | Watchlist with live prices, indicators, strategy signals |
| Stock Filter | `/filter` | `StockFilter.js` | Filter stocks by RSI, volume, buyer ratio, price range |
| Strategies | `/strategies` | `StrategyBuilder.js` | Create, activate, deactivate, delete strategies |
| Trade History | `/trades` | `TradeHistory.js` | All executed trades (paper + real) with P&L |
| Order Radar | `/radar` | `RadarDashboard.js` | Real-time list of stocks with buyer imbalance |
| Scanner | `/scanner` | `StockScanner.js` | Run pre-built or custom condition scans |
| Heatmap | `/heatmap` | `SectorHeatmap.js` | Sector performance grid |
| Alerts | `/alerts` | `AlertManager.js` | Create/manage price and indicator alerts |
| Settings | `/settings` | `Settings.js` | Profile selector, paper trading dashboard, strategy library, Telegram config |

### Strategy Library (10 pre-built, in `backend/config/default-strategies.js`)

1. RSI Oversold Reversal — RSI < 30, Low risk, 65% win rate
2. Golden Cross Momentum — SMA20 > SMA50 crossover, Medium risk, 58%
3. VWAP Breakout — Price above VWAP with volume, Medium risk, 62%
4. Morning Gap Up — 2%+ gap at open, High risk, 57%
5. Support Bounce — Price at support with confirmation, Low risk, 68%
6. Volume Spike Catcher — Volume > 2x average, High risk, 53%
7. Trend Following — Trailing stop on strong trends, Medium risk, 55%
8. Mean Reversion — Fade extreme moves, Low risk, 72%
9. Resistance Breakout — Price breaks above resistance, Medium risk, 57%
10. Intraday Scalper — Quick 0.5–1% profits, High risk, 63%

### Scanner Templates (in `backend/config/scan-templates.js`)

1. Momentum Burst — RSI > 60, volume > 1.5x avg, price > VWAP
2. Oversold Reversal Candidate — RSI < 35, buyer ratio > 1.2
3. Volume Breakout — Volume > 2x average
4. VWAP Reclaim — Price > VWAP, buyer ratio > 1.0
5. Weak Hands Exit — RSI > 70, buyer ratio < 0.7 (short/exit signal)
6. StochRSI Oversold — StochRSI < 20, RSI < 45, buyer ratio > 1.0 *(Added Nov 2026)*
7. MACD Bullish Cross — MACD histogram > 0, volume > 1.2x avg *(Added Nov 2026)*

### Scanner Watch Mode (Added Nov 2026)

Background watchdog: `startWatching(templateId)` triggers a 2-minute scan loop. New matches (stocks not seen last cycle) fire `scanner:new_match` Socket.io event and Telegram alert with full context (RSI, volume, VWAP, Radar score, VIX, sector). UI has watch toggle + new match feed per template.

Routes: `POST /api/scanner/watch/:templateId`, `DELETE /api/scanner/watch/:templateId`, `GET /api/scanner/watching`

### Profiles

| Profile | Location | Status |
|---------|----------|--------|
| amol | `profiles/amol/` | Active, AGGRESSIVE, paper trading, 20 trades/day limit |
| shailja | `profiles/shailja/` | Active, default config |

### Auth Flow

The app uses Kite Connect OAuth. The access token is saved to `.kite_token` after login via `http://localhost:5000/auth.html`. On server startup, it attempts to reload the saved token. If expired, it redirects to auth page.

---

### Trade Journal (`/journal`, added Nov 2026)

Paper / Live / All tabs. Stat cards (total, win rate, net P&L, open positions). Equity curve (Recharts AreaChart). Strategy performance breakdown table. Filterable trades table (status, strategy, symbol, date range). CSV export. All seeded with 25 demo paper trades.

### Backtesting Engine (`/backtest`, added Nov 2026)

Bar-by-bar simulator on historical or synthetic OHLCV data. Computes RSI, SMA20/50, MACD, Bollinger Bands, VWAP per bar. Checks strategy entry conditions; executes stop-loss / take-profit. Returns 6 metrics (win rate, profit factor, max drawdown, Sharpe approx), equity curve, monthly P&L bars, and full trade log. Runs entirely on synthetic data in demo mode — no Kite API key needed.

### Change Detection — What Changed (`/` → "What Changed" card, added Nov 2026)

Categorical state-transition engine answering "what changed enough that I should care?"

- `backend/utils/market-state.js` — shared primitive: `computeMarketState(symbol, technicals, price)` → `{ rsiZone, volumeBand, trendBias, macdBias, vwapPosition }`. Used by ChangeDetectionService and future PortfolioIntelligence.
- `ChangeDetectionService` — snapshots state per symbol; compares on each detect cycle; emits ChangeEvents only on categorical transitions
- Change types: `rsi_zone`, `volume_band`, `trend_bias`, `macd_flip`, `vwap_cross`
- Significance: HIGH (RSI extreme crossings), MEDIUM (MACD flip, major trend, volume spike), LOW (VWAP cross, minor band)
- `GET /api/changes` → sorted ChangeEvent list; `POST /api/changes/snapshot` → reset baseline
- Frontend: `WhatChangedCard` in IntelligenceHome — loads on page load, New Session button, significance-colored list
- 90-second server-side cache; full demo mode support via MockService.getChanges()

### Real Historical Backtesting — Mission 5 (added Nov 2026)

Backtest engine now fully distinguishes real NSE data from synthetic demo data. Added in-sample / out-of-sample split with overfitting detection.

- `backtest.service.js` — added `splitCandles(candles, outOfSamplePct)` utility
- `backtest.controller.js` — rewritten: uses `KiteService.getAllInstruments()` + `KiteService.getHistoricalData()` in live mode; `mockService.getHistoricalOHLCV()` in demo mode; runs backtest on inSample and outOfSample windows separately
- `mock.service.js` — `getHistoricalOHLCV(symbol, days)`: deterministic LCG-seeded OHLCV candles per symbol (consistent runs, scenario-biased drift)
- Response now includes `dataSource: HISTORICAL_KITE | SYNTHETIC_DEMO | SYNTHETIC_FALLBACK`, plus `inSample` and `outOfSample` metric blocks, and combined `equity` array with `period` field
- Frontend: dynamic banner (`HISTORICAL DATA (Kite)` green vs `SYNTHETIC DATA` orange), two metric panels (In-Sample Training / Out-of-Sample Validation), split date reference line on equity curve, tabbed trade log, overfitting warning when IS−OOS win rate gap > 15pp
- USER_GUIDE section 14 added

---

### Evidence Cards — Why This Stock (`/opportunities` → expand → "Why This Stock", added Nov 2026)

Per-stock evidence layer answering "why does this stock rank highly?" without opening external tools.

- `EvidenceService` — computes 7 signal types: RSI, MACD, SMA Trend, Bollinger Bands, Volume, StochRSI, VWAP
- Generates a plain-English 1–2 sentence summary + up to 6 classified signals (positive/risk/neutral)
- Returns raw indicator values, key price levels (support, resistance, VWAP), and sector tag
- `GET /api/opportunities/:symbol/evidence` → `{ summary, signals, technicals, keyLevels, sector, dataPoints }`
- 2-minute server-side cache per symbol
- Frontend: OpportunityCard now has two tabs when expanded — "Score Breakdown" and "Why This Stock"; evidence loads on first view
- Demo mode: all 7 scenario instruments generate complete realistic evidence cards

### Opportunity Ranking Engine (`/opportunities`, added Nov 2026)

Multi-factor scoring engine. `OpportunityService` scores every instrument across five factors (Trend 25%, Momentum/RSI 20%, Volume 20%, Relative Strength vs NIFTY 20%, VIX Regime 15%). Each factor returns a numeric score and a plain-English reason string — no black-box rankings.

- `GET /api/opportunities` → ranked list (top 10) with full breakdown
- In demo mode: scores computed directly from scenario price histories (consistent with Scanner scenarios)
- In live mode: scores from scanner's `priceHistory` map; NIFTY change from Yahoo Finance
- 1-minute server-side cache; refresh button in UI
- UI: expandable cards with score ring (CircularProgress), mini factor bars, and full breakdown panel on expand
- `soon` flag removed from Opportunities nav item — route is live at `/opportunities`

---

### Demo Infrastructure (overhauled Nov 2026)

- Runtime demo toggle chip in AppBar — switches mock/live without editing `.env` or restarting
- `kite.config.js`: `runtimeDemoOverride` + `setDemoModeOverride()` — services re-check on every call via getter pattern
- MongoDB skipped in demo mode (fast-fail, no crash)
- `demo.controller.js` + `GET/POST /api/demo/mode`
- `demo-seed.service.js` — seeds MemoryStore with 25 trades + 5 strategies from `profiles/amol/trades.json`

### Browser Notifications (added Nov 2026)

`Notification API` for `scanner:new_match` socket events — permission requested on first load, fires native OS notification with RSI + volume data.

### Dashboard Daily P&L Chart (added Nov 2026)

Recharts `BarChart` above signals table showing last 14 days of journal P&L with green/red bars per day.

---

## Known Limitations / Not Working

- **Backtesting uses synthetic data in demo mode** — real historical candles require a live Kite API key
- **No group features** — leaderboard, shared watchlists not implemented
- **MockService data is static** — demo mode shows 7 fixed instruments, not real NSE universe
- **ATR stop-loss active in live mode** — `calculateATR()` wired into `strategy.service.js`; falls back to fixed % in demo mode (no ticker feed)

## Fixed (Nov 2026)

- **VIX was stuck at 15.0** — NSE API blocked (403). Fixed: Kite Connect API primary source, NSE fallback. VIX now shows in AppBar as a live color-coded chip.
- **Sector mapping was empty** — SECTOR_MAP was commented out in `sector-mapping.js`. Fixed: 50+ Nifty stocks across 10 sectors restored.
