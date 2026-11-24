# System Architecture

## Overview

A monorepo with a Node.js/Express backend and a React frontend. The backend is a single process that initializes all services at startup and runs them in-memory. The frontend is a Create React App instance that connects via REST (Axios) and WebSocket (Socket.io).

```
D:\AI\Zerodha\AlgoTrading\
├── backend/          # Node.js/Express server
├── client/           # React app (CRA)
├── profiles/         # Per-user JSON data (amol, shailja)
├── data/             # Historical OHLCV (planned, not yet populated)
├── logs/             # Winston log files
├── public/           # Static files served by Express (auth.html)
└── package.json      # Root — runs backend + both
```

## Backend Architecture

### Entry Point: `backend/server.js`

Responsibilities:
1. Configure Express middleware (helmet, cors, compression, json)
2. Connect to MongoDB via `connectDB()`
3. Load saved Kite access token
4. Instantiate all services, passing the shared `io` Socket.io instance
5. Register all route modules
6. Start all services
7. Handle graceful shutdown on SIGTERM

### Service Layer

All services are classes. Stateful services are singletons instantiated in `server.js` and injected into routes via `app.locals`.

```
server.js
  ├── TickerService(io)       # Kite WebSocket → emits tick events → Socket.io broadcast
  ├── StrategyService(io)     # setInterval 1s → evaluates active strategies → OrderService
  ├── VixService              # setInterval 5min → NSE scrape → stores current VIX
  ├── RadarService(io)        # setInterval 2s → Kite quotes → order book analysis → emits radar:update
  ├── ScannerService(io)      # on-demand + setInterval → runs scan templates → emits scanner:results
  ├── HeatmapService          # setInterval → aggregates sector data → emits heatmap:update
  └── AlertService(io)        # stores alert conditions → evaluates on each tick → emits alert:triggered
```

### Data Flow: Real-Time Tick

```
Kite WebSocket (ticker.service.js)
  → tick event (last_price, volume, depth)
  → MemoryStoreService.updateTick(symbol, data)
  → Socket.io emit('tick:update', data)      ← React client receives this
  → StrategyService.onTick(symbol, data)
  → AlertService.onTick(symbol, data)
  → RadarService.scan() [every 2s via interval]
```

### Data Flow: Order Execution

```
StrategyService detects signal
  → OrderService.placeOrder(params, strategyId, signal, profileName)
      → ProfileService.getProfileConfig(profileName)
          if paperTrading: PaperTradingService.placeOrder()
          else: KiteService.placeOrder() → real API
      → TradeModel.save() [MongoDB]
      → TelegramService.notifyTradeExecuted() [if enabled in profile]
      → Socket.io emit('trade:executed', data)
```

### Authentication Flow

```
User visits http://localhost:5000/auth.html
  → Clicks "Login with Zerodha"
  → Redirects to Kite login page
  → Kite redirects back with request_token
  → auth.controller.js exchanges request_token for access_token
  → access_token saved to .kite_token file
  → KiteService.setAccessToken(token)
  → All subsequent API calls use this token
```

Token expires daily. Run auth flow once per trading day before 9:15 AM.

### Demo Mode

When `KITE_API_KEY` is not set in `.env`, `isDemoMode()` returns `true`. In demo mode:
- `KiteService` delegates all calls to `MockService`
- `MockService` returns static/simulated data for a fixed set of instruments
- Real money cannot execute; paper trading still works

### Database (MongoDB)

Collections managed by Mongoose:

| Model | File | Purpose |
|-------|------|---------|
| Stock | `backend/models/Stock.model.js` | Instrument cache |
| Strategy | `backend/models/Strategy.model.js` | Strategy definitions |
| Trade | `backend/models/Trade.model.js` | Trade execution records |
| Watchlist | `backend/models/Watchlist.model.js` | Per-user watchlists |

Profile data (config, strategies, trades, journal) is stored in **JSON files** in `profiles/`, not MongoDB. This was a design decision to keep things simple for a personal tool.

### API Routes

| Prefix | File | Handles |
|--------|------|---------|
| `/api/auth` | `auth.routes.js` | Kite OAuth login/callback, token validation |
| `/api/market` | `market.routes.js` | Instruments, quotes, watchlist CRUD |
| `/api/orders` | `order.routes.js` | Place, cancel, list orders; positions |
| `/api/strategies` | `strategy.routes.js` | Strategy CRUD, signals, activate/deactivate |
| `/api/profiles` | `profile.routes.js` | Profile CRUD, strategy adoption, stats, Telegram test |
| `/api/radar` | `radar.routes.js` | Current radar state, config update |
| `/api/scanner` | `scanner.routes.js` | Run scan, get templates |
| `/api/heatmap` | `heatmap.routes.js` | Current heatmap state |
| `/api/alerts` | `alert.routes.js` | CRUD alerts, test alert |

## Frontend Architecture

React SPA with MUI v5 dark theme. State is local (useState/useEffect per component) — no Redux. Real-time data via Socket.io client.

### Component Tree (simplified)

```
App.js
  ├── Sidebar nav (Material-UI Drawer)
  ├── Route: / → Dashboard.js
  │     └── Live price tiles, indicators, strategy signals
  ├── Route: /filter → StockFilter.js
  │     └── Filter controls, filtered stock list
  ├── Route: /strategies → StrategyBuilder.js
  │     └── Active strategies, create form, signal log
  ├── Route: /trades → TradeHistory.js
  │     └── Trade table with P&L
  ├── Route: /radar → RadarDashboard.js
  │     └── Real-time imbalance table
  ├── Route: /scanner → StockScanner.js
  │     └── Template picker, results table
  ├── Route: /heatmap → SectorHeatmap.js
  │     └── Sector grid with color coding
  ├── Route: /alerts → AlertManager.js
  │     └── Alert CRUD, trigger history
  └── Route: /settings → Settings.js
        ├── ProfileSelector.js
        ├── PaperTradingDashboard.js
        ├── StrategyLibrary.js
        └── TelegramSettings.js
```

### Socket.io Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `tick:update` | Server → Client | Live price tick for subscribed instrument |
| `ticker:connected` | Server → Client | Kite WebSocket connected |
| `ticker:disconnected` | Server → Client | Kite WebSocket disconnected |
| `strategy:signal` | Server → Client | Strategy triggered a signal |
| `trade:executed` | Server → Client | Trade placed (paper or real) |
| `radar:update` | Server → Client | Updated radar stock list |
| `scanner:results` | Server → Client | Scan completed with results |
| `heatmap:update` | Server → Client | Sector heatmap data refreshed |
| `alert:triggered` | Server → Client | Alert condition met |
| `subscribe` | Client → Server | Subscribe to instrument ticks |
| `unsubscribe` | Client → Server | Unsubscribe from instrument ticks |

## VIX Adjustment Logic

India VIX drives dynamic risk management. Applied by StrategyService before placing any order:

| VIX Range | Label | Stop-Loss Multiplier | Take-Profit Multiplier | Quantity Multiplier |
|-----------|-------|---------------------|----------------------|-------------------|
| < 12 | VERY_LOW | 0.8× | 1.3× | 1.2× |
| 12–15 | LOW | 0.9× | 1.2× | 1.1× |
| 15–20 | NORMAL | 1.0× | 1.0× | 1.0× |
| 20–25 | ELEVATED | 1.2× | 0.9× | 0.8× |
| 25–30 | HIGH | 1.5× | 0.8× | 0.6× |
| > 30 | EXTREME | 2.0× | 0.7× | 0.5× |

## Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `kiteconnect` | ^5.1.0 | Zerodha Kite Connect SDK |
| `express` | ^4.18.2 | HTTP server |
| `socket.io` | ^4.7.2 | Real-time server→client push |
| `mongoose` | ^7.6.3 | MongoDB ODM |
| `node-cron` | ^3.0.2 | Scheduled jobs (daily summary) |
| `winston` | ^3.11.0 | Structured logging |
| `helmet` | ^7.0.0 | HTTP security headers |
| `axios` | ^1.5.1 | HTTP client (VIX fetch, Telegram) |
| React | 18.x | Frontend UI |
| MUI | v5 | Component library (dark theme) |
| `socket.io-client` | ^4.x | Client-side real-time connection |
