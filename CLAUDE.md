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
