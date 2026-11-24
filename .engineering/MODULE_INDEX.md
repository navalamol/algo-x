# Module Index — Every File and What It Does

## Backend

### Entry & Config

| File | Role |
|------|------|
| `backend/server.js` | Express app setup, service initialization, Socket.io, route registration, graceful shutdown |
| `backend/config/kite.config.js` | KiteConnect client setup, demo mode detection |
| `backend/config/db.config.js` | MongoDB connection via Mongoose |
| `backend/config/trading.config.js` | Market hours, risk limits, VIX thresholds, order defaults |
| `backend/config/default-strategies.js` | 10 pre-built strategies with metadata (win rate, risk level, conditions) |
| `backend/config/scan-templates.js` | 5 built-in scanner templates with condition arrays |
| `backend/config/sector-mapping.js` | Maps stock symbols to sectors for heatmap |

### Controllers (thin HTTP layer)

| File | Routes It Handles |
|------|------------------|
| `backend/controllers/auth.controller.js` | Login URL, OAuth callback, token validation, logout |
| `backend/controllers/market.controller.js` | Instruments list, quote fetch, watchlist CRUD |
| `backend/controllers/order.controller.js` | Place order, cancel, order history, positions |
| `backend/controllers/strategy.controller.js` | Create/list/toggle/delete strategy, signals |
| `backend/controllers/profile.controller.js` | Profile CRUD, strategy adoption, stats export, Telegram test |
| `backend/controllers/radar.controller.js` | Current radar data, update config, set symbols |
| `backend/controllers/scanner.controller.js` | Run scan by template, run custom scan, get templates |
| `backend/controllers/heatmap.controller.js` | Current heatmap state |
| `backend/controllers/alert.controller.js` | Create/list/delete alerts, trigger test |

### Services (business logic)

| File | Responsibilities |
|------|-----------------|
| `backend/services/kite.service.js` | Wraps Kite Connect SDK; login, getQuote, getInstruments, placeOrder, getPositions, getTicker; switches to mock in demo mode |
| `backend/services/mock.service.js` | Simulated instruments, quotes, order book depth for demo mode |
| `backend/services/ticker.service.js` | Manages Kite WebSocket ticker; subscription management per socket client; broadcasts ticks via Socket.io |
| `backend/services/indicators.service.js` | All technical indicator calculations (RSI, SMA, EMA, VWAP, MACD, StochRSI, BB, ATR, OBV, Buyer/Seller ratio) |
| `backend/services/strategy.service.js` | Loads active strategies from DB; evaluates conditions on each tick; generates signals; calls OrderService |
| `backend/services/order.service.js` | Routes orders to PaperTradingService or KiteService based on profile; saves to MongoDB; sends Telegram |
| `backend/services/paper-trading.service.js` | Simulates trade execution on virtual capital; calculates slippage (0.05%) + brokerage (₹20/trade); tracks open/closed positions |
| `backend/services/profile.service.js` | Reads/writes JSON profile files in `profiles/`; validates config; provides stats |
| `backend/services/vix.service.js` | Fetches India VIX from NSE every 5 min; exposes `getCurrentVIX()` and `getVIXAdjustments()` |
| `backend/services/telegram.service.js` | Sends messages via Telegram Bot API; methods for trade executed, stop-loss, target, daily summary, test |
| `backend/services/radar.service.js` | Polls Kite quotes every 2s; calculates order book imbalance; filters by 30% threshold; emits via Socket.io |
| `backend/services/scanner.service.js` | Maintains price history per symbol; evaluates scan template conditions; returns matching stocks |
| `backend/services/heatmap.service.js` | Groups stocks by sector; calculates sector-level % change; emits heatmap data |
| `backend/services/alert.service.js` | Stores alert definitions; evaluates conditions on each tick; triggers notifications; tracks trigger history |
| `backend/services/auth.service.js` | Exchanges Kite request_token for access_token; saves/loads token from `.kite_token` file; validates token |
| `backend/services/memory-store.service.js` | In-memory ring buffer for price/volume/indicator history per symbol; used by strategy and scanner services |

### Models (MongoDB Schemas)

| File | Schema |
|------|--------|
| `backend/models/Stock.model.js` | Instrument: exchange, symbol, name, lot size |
| `backend/models/Strategy.model.js` | Strategy: name, conditions, stop-loss, take-profit, quantity, active flag |
| `backend/models/Trade.model.js` | Trade: symbol, type, quantity, price, strategy, profile, outcome, P&L |
| `backend/models/Watchlist.model.js` | Watchlist: name, symbols array |

### Routes

| File | Mounts At |
|------|----------|
| `backend/routes/auth.routes.js` | `/api/auth` |
| `backend/routes/market.routes.js` | `/api/market` |
| `backend/routes/order.routes.js` | `/api/orders` |
| `backend/routes/strategy.routes.js` | `/api/strategies` |
| `backend/routes/profile.routes.js` | `/api/profiles` |
| `backend/routes/radar.routes.js` | `/api/radar` |
| `backend/routes/scanner.routes.js` | `/api/scanner` |
| `backend/routes/heatmap.routes.js` | `/api/heatmap` |
| `backend/routes/alert.routes.js` | `/api/alerts` |

### Utils

| File | Purpose |
|------|---------|
| `backend/utils/logger.js` | Winston logger; writes to `logs/combined.log` and `logs/error.log` |
| `backend/utils/helpers.js` | `average(arr)` and other math helpers used by indicators |

## Frontend (`client/src/`)

| File | Purpose |
|------|---------|
| `App.js` | Router, MUI theme (dark), sidebar nav, ticker connection status indicator |
| `index.js` | React root render |
| `services/api.service.js` | Axios instance pointing at `http://localhost:5000`; all REST calls |
| `services/socket.service.js` | Socket.io client; `connect()`, `on(event, cb)`, `emit(event, data)`, `disconnect()` |
| `components/Dashboard/Dashboard.js` | Main trading view: watchlist, live prices, indicators, signals |
| `components/StockFilter/StockFilter.js` | Filter stocks by RSI, volume, buyer ratio; subscribe to filtered list |
| `components/StrategyBuilder/StrategyBuilder.js` | Create strategies, view active, see recent signals |
| `components/TradeHistory/TradeHistory.js` | Trade table, P&L summary, filter by date/strategy |
| `components/RadarDashboard/RadarDashboard.js` | Real-time order imbalance table, sorted by score |
| `components/StockScanner/StockScanner.js` | Select template, run scan, view matching stocks |
| `components/Heatmap/SectorHeatmap.js` | Sector grid colored by % change (green/red) |
| `components/AlertManager/AlertManager.js` | Create/list/delete price and indicator alerts |
| `components/Settings/Settings.js` | Tabbed settings hub |
| `components/ProfileSelector/ProfileSelector.js` | Dropdown to switch active profile, shows stats |
| `components/PaperTradingDashboard/PaperTradingDashboard.js` | Virtual portfolio: capital, positions, completed trades, P&L |
| `components/StrategyLibrary/StrategyLibrary.js` | Browse 10 pre-built strategies, one-click adopt to profile |
| `components/TelegramSettings/TelegramSettings.js` | Configure bot token, chat ID, notification preferences, test |

## Profile Data (`profiles/`)

Each profile has these files:

| File | Contents |
|------|---------|
| `config.json` | Capital, risk level, paper trading flag, Telegram config, trading hours, limits |
| `strategies.json` | Adopted strategies array (from library or custom) |
| `trades.json` | All trade records for this profile |
| `watchlists.json` | Saved watchlists |
| `journal.json` | Trade notes/journal entries |

## Root Files

| File | Purpose |
|------|---------|
| `package.json` | Root scripts: `dev`, `client`, `dev:all`, `install:all`, `create-profile` |
| `create-profile.js` | CLI tool: interactive prompts to create a new profile JSON |
| `.env` | Environment variables (never commit) |
| `.env.example` | Template showing required env vars |
| `.kite_token` | Saved Kite access token (auto-managed, never commit) |
| `public/auth.html` | Kite OAuth login page served by Express |
