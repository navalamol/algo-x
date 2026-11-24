# Current State — What's Built and Working

*Last updated: November 2026*

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

## Known Limitations / Not Working

- **No backtesting** — strategies can't be tested on historical data
- **Trade journal has no frontend** — `journal.json` exists in profiles but no UI to read/write it
- **No group features** — leaderboard, shared watchlists not implemented
- **Heatmap data freshness** — HeatmapService is mocked/estimated when real sector data isn't available
- **MockService data is static** — demo mode shows fixed instruments, not real NSE universe

## Fixed (Nov 2026)

- **VIX was stuck at 15.0** — NSE API blocked (403). Fixed: Kite Connect API primary source, NSE fallback. VIX now shows in AppBar as a live color-coded chip.
- **Sector mapping was empty** — SECTOR_MAP was commented out in `sector-mapping.js`. Fixed: 50+ Nifty stocks across 10 sectors restored.
