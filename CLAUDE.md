# Algo-X — AI Instructions

## Project Summary

A personal-use **Indian market intelligence and decision-support engine** built on top of Zerodha Kite Connect API. Two users: **amol** and **shailja** (see `profiles/` folder). Currently running in paper trading mode (no real money executes). Full-stack: Node.js/Express backend + React/MUI frontend.

The product reoriented in Nov 2026 from "algo trading platform" to answering four daily questions:
1. **What matters?** — What deserves attention today?
2. **Why?** — Why does this stock/setup matter?
3. **Evidence?** — Has this setup historically worked?
4. **What changed?** — What changed in my portfolio/watchlist?

See `ALGO_X_PRODUCT_REORIENTATION_AND_EXECUTION_PLAN.md` for the full strategic document.

## Always Read First

Before making any change, read:
- `.product/01_STATE.md` — what's built and working
- `.product/03_NEXT_MISSION.md` — what we're building next
- `.engineering/MODULE_INDEX.md` — where every file lives

## Key Rules

1. **Never touch `.env` or `.kite_token`** — credentials live there
2. **Paper trading is on by default** — `profiles/amol/config.json` has `"paperTrading": true`
3. **Demo mode** — `isDemoMode()` in `backend/config/kite.config.js` checks `DEMO_MODE=true` in `.env`. It does NOT auto-detect absent `KITE_API_KEY`. When demo, market data comes from `backend/services/mock.service.js`
4. **Yahoo Finance is always live** — `FreeMarketDataService` fetches NIFTY/BANK NIFTY/VIX/sectors from Yahoo Finance v8 chart API with no auth, in both live and demo mode
5. **Two package.json files** — root (`backend/`) and `client/` (React). Run `npm run install:all` to install both.
6. **Profiles are JSON files** — `profiles/{name}/config.json`, `strategies.json`, `trades.json`, `watchlists.json`, `journal.json`

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

The backend is a single Express server (`backend/server.js`) that initializes 9 services at startup: TickerService (Kite WebSocket), StrategyService (evaluates rules every second), VixService (fetches India VIX every 5 min), RadarService (scans order book imbalance every 2s), ScannerService (runs template-based scans on demand + background watch mode), HeatmapService (sector aggregation), AlertService (price/indicator watches), MorningBriefService (assembles daily intelligence brief from Yahoo Finance + scanner), and OpportunityService (multi-factor opportunity ranking). FreeMarketDataService is a singleton helper (not a started service) used by MorningBriefService. All services receive a shared Socket.io instance and broadcast real-time updates to the React client.

## Free Market Data — Yahoo Finance

`backend/services/free-market-data.service.js` fetches live data with no API key:

- **API**: `https://query2.finance.yahoo.com/v8/finance/chart/{SYMBOL}?interval=1d&range=1d`
- **Symbols**: `^NSEI` (NIFTY 50), `^NSEBANK` (BANK NIFTY), `^INDIAVIX` (India VIX), `^CNXIT`, `^CNXPHARMA`, `^CNXAUTO`, `^CNXFMCG`, `^CNXMETAL`, `^CNXREALTY`, `^CNXENERGY`
- **Cache**: 5-minute TTL to avoid hammering the free API
- **Resilience**: `Promise.allSettled` — per-symbol failures are logged but don't break the whole fetch
- **Note**: Yahoo Finance v7 quote API (`/v7/finance/quote`) returns 401 — do NOT use it. NSE allIndices times out. Use v8 chart only.
- Data is 15-minute delayed during market hours (standard for free feeds)

## Morning Brief

`backend/services/morning-brief.service.js` assembles the daily intelligence brief:

- **Market data** (NIFTY, BANK NIFTY, VIX, sectors): Yahoo Finance — always real, no Kite needed
- **Opportunities**: Kite scanner in live mode; `mock.getMorningBrief()` in demo mode
- **Full fallback**: if Yahoo Finance is unreachable, falls back to `mock.getMorningBrief()`
- **REST endpoint**: `GET /api/morning-brief` → `{ success, data: { generatedAt, date, dataSource, marketDataSource, nifty, bankNifty, regime, marketSentiment, breadth, sectorLeaders, sectorLaggers, topOpportunities, scanSummary, noSetup } }`
- **Cron**: fires at 9:00 AM IST Mon–Fri; calls `morningBriefService.assembleBrief()` and sends Telegram to each profile with notifications enabled
- Cross-service deps wired via `setVixService()`, `setHeatmapService()`, `setScannerService()`

## Navigation Structure (Updated Nov 2026)

App is titled **Algo-X**. Navigation is grouped into sections:

| Section | Items |
|---------|-------|
| Home | Intelligence Home (`/`) |
| Intelligence | Opportunities (`/opportunities`), What Changed *(soon)* |
| Market | Scanner, Order Radar, Sector Heatmap, Stock Filter |
| Trading | Strategies, Backtest, Trade Journal, Trade History, Alerts, Dashboard |
| Settings | Settings |

Old Dashboard moved from `/` to `/dashboard`. Items with `soon: true` render as disabled `<div>` with a "soon" Chip, not a Link.

## Mission Status (Nov 2026)

| Mission | Description | Status |
|---------|-------------|--------|
| Mission 0 | Product reorientation — Algo-X branding, nav restructure, simulation disclaimers | ✅ Done |
| Mission 1 | Morning Brief — Yahoo Finance, REST endpoint, Telegram upgrade, Intelligence Home | ✅ Done |
| Mission 2 | Opportunity Ranking Engine — multi-factor score, explainable breakdown | ✅ Done |
| Mission 3 | Evidence Layer — Why This Stock evidence cards with signals, indicators, key levels | 🔧 Implemented |
| Mission 4 | What Changed — categorical state-transition detection, WhatChangedCard | 🔧 Implemented |
| Mission 5 | Real Historical Backtesting — Kite data, IS/OOS split, overfitting warning | 🔧 Implemented |
| Mission 6 | Portfolio Intelligence — holding health, sector concentration, correlations | 🔧 Implemented |
| Mission 7 | Strategy/Paper Trading integration with intelligence layer | Planned |

## ⚠️ Integrity Warning — Backtesting & Win Rates

- **Backtesting engine uses synthetic OHLCV** in demo mode. The Backtest page now shows a prominent `SIMULATION / ILLUSTRATIVE ONLY` warning.
- **Strategy library win rates** (65%, 68%, etc.) are hardcoded, not evidence-backed. They are labelled "(illustrative)" in the UI.
- Do NOT present these numbers as real historical performance without replacing them with genuine backtested results.

## What Does NOT Exist Yet

- What Changed — portfolio/watchlist diff since last session (Mission 4 — next)
- Real historical backtesting with Kite `getHistoricalData()` (Mission 5)
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
3. **Morning Brief showed "Could not load brief"** — root cause: `isDemoMode()` returns `false` when `KITE_API_KEY` is absent but `DEMO_MODE=true` is not in `.env`. Fix: `MorningBriefService` now uses Yahoo Finance as primary source regardless of mode; no longer depends on Kite services being initialized.
4. **Yahoo Finance v7 returns 401** — switched to v8 chart API (`/v8/finance/chart/{SYMBOL}`). NSE allIndices was also dropped (times out, requires session cookies).

## Scan Watchdog (Added Nov 2026)

The scanner now has a background watch mode:
- `POST /api/scanner/watch/:templateId` — start watching a template
- `DELETE /api/scanner/watch/:templateId` — stop watching
- `GET /api/scanner/watching` — list active watches
- Socket.io event `scanner:new_match` fires when a stock newly matches a watched template
- Telegram alert sent with RSI, volume, VWAP, Radar score, VIX condition, sector
- Morning brief cron fires at 9:00 AM IST Mon–Fri via `morningBriefService.assembleBrief()`

## Security Notes

- `strategy.service.js` uses `new Function()` for custom conditions — **never** expose this to HTTP endpoints, it's an RCE risk
- Cross-service wiring uses `setXService()` injection pattern to avoid circular requires
