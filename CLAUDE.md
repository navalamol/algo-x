# Kite Algo Trading — AI Instructions

## Project Summary

A personal-use algorithmic trading platform built on Zerodha Kite Connect API. Two users: **amol** and **shailja** (see `profiles/` folder). Currently running in paper trading mode (no real money executes). Full-stack: Node.js/Express backend + React/MUI frontend.

## Always Read First

Before making any change, read:
- `.product/01_STATE.md` — what's built and working
- `.product/03_NEXT_MISSION.md` — what we're building next
- `.engineering/MODULE_INDEX.md` — where every file lives

## Key Rules

1. **Never touch `.env` or `.kite_token`** — credentials live there
2. **Paper trading is on by default** — `profiles/amol/config.json` has `"paperTrading": true`
3. **Demo mode** — when `KITE_API_KEY` is not set, all market data comes from `backend/services/mock.service.js`
4. **Two package.json files** — root (`backend/`) and `client/` (React). Run `npm run install:all` to install both.
5. **Profiles are JSON files** — `profiles/{name}/config.json`, `strategies.json`, `trades.json`, `watchlists.json`, `journal.json`

## Running the App

```bash
# Backend only (port 5000)
npm run dev

# Frontend only (port 3000)
npm run client

# Both together (recommended)
npm run dev:all

# Create a new profile
npm run create-profile
```

Access: Frontend http://localhost:3000 | Backend API http://localhost:5000 | Auth page http://localhost:5000/auth.html

## Architecture in One Paragraph

The backend is a single Express server (`backend/server.js`) that initializes 7 services at startup: TickerService (Kite WebSocket), StrategyService (evaluates rules every second), VixService (fetches India VIX every 5 min from NSE), RadarService (scans order book imbalance every 2s), ScannerService (runs template-based scans on demand), HeatmapService (sector aggregation), and AlertService (price/indicator watches). All services receive a shared Socket.io instance and broadcast real-time updates to the React client.

## What Does NOT Exist Yet

- Backtesting engine (planned, see `.product/02_BACKLOG.md`)
- Trade journal UI (backend journal.json exists, no frontend)
- Group dashboard / leaderboard
- Real money execution (paper trading only)

## Coding Conventions

- Backend: CommonJS (`require/module.exports`), no TypeScript
- Frontend: React functional components + hooks, Material-UI v5
- Services are classes instantiated in `server.js`; controllers are thin wrappers
- Indicators live in `backend/services/indicators.service.js` — add new ones there
- Scan templates live in `backend/config/scan-templates.js` — array of condition objects

## Feature Shipping Checklist (Rule Added Nov 2026)

Every new feature **must ship with**:

1. **MockService extension** — if the feature uses market data, prices, volumes, or depth, add scenario-biased data to `backend/services/mock.service.js` so it fires correctly in demo mode without a real Kite API key.
2. **User guide entry** — add a section to `docs/USER_GUIDE.md` covering: what the feature does, how to use it, what to test in demo mode, and any config needed.

This rule ensures the app is always fully testable on market holidays and without Kite credentials.

---

## .plans/ Folder Convention

Strategic review plans are saved to `.plans/` for reference. They are **not** read by default AI context. Only read them when doing a strategic review. Copy interesting plans there after approval.

## Known Issues Fixed (Nov 2026)

1. **VIX was broken** — `vix.service.js` now uses Kite Connect API as primary source. NSE is fallback only. Demo mode generates randomized VIX.
2. **Sector mapping was empty** — `backend/config/sector-mapping.js` was entirely commented out. Now has full 50+ stock SECTOR_MAP.

## Scan Watchdog (Added Nov 2026)

The scanner now has a background watch mode:
- `POST /api/scanner/watch/:templateId` — start watching a template
- `DELETE /api/scanner/watch/:templateId` — stop watching
- `GET /api/scanner/watching` — list active watches
- Socket.io event `scanner:new_match` fires when a stock newly matches a watched template
- Telegram alert sent with RSI, volume, VWAP, Radar score, VIX condition, sector
- Morning brief cron fires at 9:00 AM IST Mon–Fri

## Security Notes

- `strategy.service.js` uses `new Function()` for custom conditions — **never** expose this to HTTP endpoints, it's an RCE risk
- Cross-service wiring uses `setXService()` injection pattern to avoid circular requires
