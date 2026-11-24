# Kite Algo Trading — Full Codebase Reference
*Last synced: Nov 2026 | Branch: main | Last commit: cc0ac30*

---

## Quick Facts

| Item | Value |
|------|-------|
| Stack | Node.js/Express + React/MUI v5 (dark theme) |
| Backend port | 5000 |
| Frontend port | 3000 |
| DB | MongoDB (Mongoose) + JSON flat-files for profiles |
| Real-time | Socket.io bidirectional |
| Trading | Paper mode only (no real money yet) |
| Profiles | amol (AGGRESSIVE), shailja (default) |
| API | Zerodha Kite Connect v3 |
| Demo mode | Auto-activated when KITE_API_KEY is not set |

---

## How to Run

```bash
npm run dev:all        # Both backend (5000) + frontend (3000)
npm run dev            # Backend only
npm run client         # Frontend only
npm run create-profile # Interactive CLI to add a new profile
```

Auth page: http://localhost:5000/auth.html (required once per day for real trading)

---

## Architecture

```
React Client (3000)
    │  REST (axios → /api/*)
    │  Socket.io (live ticks, signals, alerts)
    ▼
Express Server (5000) ── server.js
    │
    ├── 7 Services (all instantiated at startup, share same io instance)
    │     TickerService     → Kite WebSocket → real-time prices
    │     StrategyService   → evaluates rules every 1s → signals
    │     VixService        → India VIX every 5min → risk multipliers
    │     RadarService      → order book depth every 2s → imbalance score
    │     ScannerService    → template scans on-demand + watch mode (2min loop)
    │     HeatmapService    → sector % change every 30s
    │     AlertService      → price/indicator watches → Telegram + Socket.io
    │
    ├── MongoDB (strategies, trades, watchlists, stocks)
    │
    └── profiles/ (JSON flat files per user)
          amol/config.json, strategies.json, trades.json, watchlists.json, journal.json
          shailja/ (same structure)
```

---

## Service Details

### VixService (`backend/services/vix.service.js`)
- Singleton exported as `module.exports = new VIXService()`
- Constructor accepts optional `io` (socket). After Nov 2026 fix: `vixService.io = io` is set in server.js
- Primary source: `kiteService.getQuote(['NSE:INDIA VIX'])` (authenticated, works reliably)
- Fallback: NSE HTML scrape (blocked by 403 in practice)
- Demo mode: returns randomized VIX 13–18 so adjustment logic exercises
- Emits `vix_update` socket event: `{ vix, condition, lastUpdate }`
- REST endpoint: `GET /api/market/vix` → `{ vix, condition, description, lastUpdate }`
- VIX bands and multipliers:
  - < 15: VERY_LOW — stop-loss 1.0×, qty 1.0×
  - 15–20: LOW — stop-loss 1.0×, qty 1.0×
  - 20–25: NORMAL — stop-loss 1.3×, qty 0.8×
  - 25–30: HIGH — stop-loss 1.6×, qty 0.6×
  - > 30: EXTREME — stop-loss 2.0×, qty 0.4×

### ScannerService (`backend/services/scanner.service.js`)
- Accepts `io` in constructor
- Watch mode: `startWatching(templateId)` / `stopWatching(templateId)` / `getWatching()`
- 2-minute interval polls watched templates; diffs matches vs `lastMatchMap` (Map<templateId, Set<symbol>>)
- Fires `scanner:new_match` Socket.io event for newly matching stocks
- Cross-service: `setRadarService(radarService)` injected after instantiation to avoid circular dep
- Indicators computed per symbol: RSI (≥15 prices), SMA20 (≥20), VWAP, buyerRatio, volumeAvg, stochrsi (≥29), macd (≥35)
- `_resolve()` handles: `rsi`, `price`, `volume`, `vwap`, `sma20`, `buyerRatio`, `volumeVsAvg`, `priceVsVwap`, `stochrsi`, `macd_histogram`

### TelegramService (`backend/services/telegram.service.js`)
- `notifyScanMatch(chatId, match)` — rich alert: RSI, volume×avg, VWAP status, Radar score, VIX, sector
- `sendMorningBrief(chatId, brief)` — 9 AM daily: VIX + top 3 matches per template
- Telegram config lives in `profiles/{name}/config.json` → `trading.notifications.telegram`

### RadarService (`backend/services/radar.service.js`)
- Polls every 2s, score = `imbalance * 0.6 + clampedMomentum * 0.4`
- Emits `radar_update` Socket.io event

---

## Scan Templates (`backend/config/scan-templates.js`)

| ID | Name | Conditions |
|----|------|------------|
| `momentum_burst` | Momentum Burst | RSI > 60, volumeVsAvg > 1.5, priceVsVwap > 1.0 |
| `oversold_reversal` | Oversold Reversal | RSI < 35, buyerRatio > 1.2 |
| `volume_breakout` | Volume Breakout | volumeVsAvg > 2.0 |
| `vwap_reclaim` | VWAP Reclaim | priceVsVwap > 1.0, buyerRatio > 1.0 |
| `weak_hands_exit` | Weak Hands Exit | RSI > 70, buyerRatio < 0.7 |
| `stochrsi_oversold` | StochRSI Oversold | stochrsi < 20, rsi < 45, buyerRatio > 1.0 |
| `macd_bullish_cross` | MACD Bullish Cross | macd_histogram > 0, volumeVsAvg > 1.2 |

---

## REST API Reference

### Auth
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/auth/login-url` | Get Kite OAuth URL |
| GET | `/api/auth/callback` | OAuth callback, saves token |
| GET | `/api/auth/validate` | Check if token is valid |
| POST | `/api/auth/logout` | Clear token |

### Market
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/market/instruments` | Full instrument list |
| GET | `/api/market/instruments/search?q=` | Search instruments |
| GET | `/api/market/quote?symbols=` | Get live quotes |
| GET | `/api/market/vix` | Current India VIX + condition |
| GET | `/api/market/watchlist` | Get watchlists |
| POST | `/api/market/watchlist` | Create watchlist |
| POST | `/api/market/stocks/filter` | Filter stocks by criteria |

### Scanner
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/scanner/templates` | List all templates |
| POST | `/api/scanner/run` | Run scan `{ templateId }` |
| GET | `/api/scanner/results` | Last scan results |
| GET | `/api/scanner/watching` | List watched templates |
| POST | `/api/scanner/watch/:templateId` | Start watching a template |
| DELETE | `/api/scanner/watch/:templateId` | Stop watching |

### Orders
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/orders/place` | Place order (paper or real) |
| GET | `/api/orders/history` | Trade history |
| GET | `/api/orders/positions/list` | Open positions |

### Strategies
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/strategies` | List strategies |
| POST | `/api/strategies` | Create strategy |
| PUT | `/api/strategies/:id/toggle` | Activate/deactivate |
| DELETE | `/api/strategies/:id` | Delete strategy |

### Radar
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/radar` | Current radar stocks |
| POST | `/api/radar/config` | Update config |

### Heatmap
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/heatmap` | Current sector heatmap data |

### Alerts
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/alerts` | List alerts |
| POST | `/api/alerts` | Create alert |
| DELETE | `/api/alerts/:id` | Delete alert |

---

## Socket.io Events

### Server → Client
| Event | Payload | Source |
|-------|---------|--------|
| `tick` | `{ symbol, price, volume, ... }` | TickerService on each WebSocket tick |
| `strategy:signal` | `{ strategy, symbol, action, price }` | StrategyService on condition match |
| `vix_update` | `{ vix, condition, lastUpdate }` | VixService after each fetch |
| `radar_update` | `[{ symbol, score, imbalance, ... }]` | RadarService every 2s |
| `scanner_results` | `{ templateId, count, results }` | ScannerService on scan complete |
| `scanner:new_match` | `{ templateId, templateName, symbol, price, rsi, vwap, radarScore, vix, sector, ... }` | ScannerService watch cycle (new entrants only) |
| `heatmap_update` | `{ sectors: { IT: { change }, ... } }` | HeatmapService every 30s |
| `alert_triggered` | `{ alert, currentValue, ... }` | AlertService on condition match |
| `ticker:connected` | `{}` | TickerService on WebSocket connect |
| `ticker:disconnected` | `{}` | TickerService on WebSocket disconnect |

### Client → Server
| Event | Payload | Action |
|-------|---------|--------|
| `subscribe` | `['NSE:RELIANCE', ...]` | TickerService subscribes to these symbols |
| `unsubscribe` | `['NSE:RELIANCE', ...]` | TickerService unsubscribes |

---

## Indicators Reference

All in `backend/services/indicators.service.js`:

| Indicator | Method | Min Prices | Returns |
|-----------|--------|-----------|---------|
| RSI | `calculateRSI(prices, period=14)` | 15 | number 0–100 |
| SMA | `calculateSMA(prices, period)` | period | number |
| EMA | `calculateEMA(prices, period)` | period | number |
| VWAP | `calculateVWAP(history)` | 1 | number |
| MACD | `calculateMACD(prices)` | 35 | `{ macd, signal, histogram }` |
| StochRSI | `calculateStochasticRSI(prices)` | 29 | `{ value 0–100, rsi, overbought, oversold }` |
| Bollinger Bands | `calculateBollingerBands(prices)` | 20 | `{ upper, middle, lower }` |
| ATR | `calculateATR(highs, lows, closes)` | 15 | number |
| OBV | `calculateOBV(prices, volumes)` | 2 | number |
| Buyer/Seller Ratio | `calculateBuyerSellerRatio(depth)` | — | number (>1 = buyers dominant) |

---

## Profile Config Shape

```json
{
  "profile": { "name": "amol", "displayName": "amol" },
  "trading": {
    "capital": 100000,
    "paperTrading": true,
    "riskLevel": "AGGRESSIVE",
    "maxPositions": 5,
    "maxDailyTrades": 20,
    "slippage": 0.001,
    "brokerage": 20,
    "notifications": {
      "telegram": {
        "enabled": false,
        "botToken": "",
        "chatId": ""
      }
    }
  }
}
```

---

## Critical Rules for AI

1. **Never touch `.env` or `.kite_token`**
2. **Never set `paperTrading: false`** in any profile
3. **Demo mode** activates automatically when `KITE_API_KEY` is not set — all Kite calls go to MockService
4. **`new Function()` in strategy.service.js** is an RCE risk — never expose to HTTP endpoints
5. **Cross-service wiring** uses `setXService()` injection after instantiation (not in constructor) to avoid circular deps
6. **VixService is a singleton** — `module.exports = new VIXService()`. Socket.io is wired via `vixService.io = io` in server.js
7. **CommonJS throughout** — `require/module.exports`, no TypeScript, no ES modules in backend
8. **Frontend** is React functional components + hooks + MUI v5. No class components.

---

## Known Bugs Fixed (Nov 2026)

1. **VIX stuck at 15.0**: NSE API blocked by 403. Fixed: Kite Connect primary, NSE fallback.
2. **Sector mapping empty**: SECTOR_MAP was commented out. Fixed: restored 50+ stocks.

## Underutilized (Good Next Targets)

- `calculateBollingerBands()` — computed in `calculateAllIndicators()` but no scan template uses it
- `calculateATR()` — implemented, not used for dynamic stop-loss sizing yet
- `calculateOBV()` — implemented, not surfaced anywhere
