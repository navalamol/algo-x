# Session Handover — New Session Start Prompt
*Copy the block below into a new Claude Code session to continue from where this left off.*

---

## Handover Prompt (copy this into new session)

```
I'm continuing work on my Kite Algo Trading platform at D:\AI\Zerodha\AlgoTrading.

Before anything else, read these files in order:
1. CLAUDE.md — rules and conventions
2. codebase.md — full codebase reference (all services, APIs, socket events, indicators)
3. .product/01_STATE.md — what's built and working
4. .product/03_NEXT_MISSION.md — what we're building next
5. .product/02_BACKLOG.md — full prioritized backlog

## Current State (Nov 2026)

Everything is committed on branch main. Last 2 commits:
- cc0ac30: VIX live chip in AppBar + StochRSI & MACD scan templates
- dd363f6: Scan Watchdog, VIX fix, sector mapping fix + strategic docs

## What Was Just Built

**Scan Watchdog (complete):**
- Background 2-minute watch loop per template (startWatching/stopWatching/getWatching)
- Diffs current matches vs previous cycle — fires ONLY for new entrants
- Rich Telegram alert: RSI, volume×avg, VWAP status, Radar score, VIX condition, sector
- Morning brief cron: 9:00 AM IST Mon–Fri, all templates, sent to Telegram
- UI: Watch toggle on each template card, new match feed, Snackbar toasts
- Routes: POST/DELETE /api/scanner/watch/:templateId, GET /api/scanner/watching
- Socket.io event: scanner:new_match

**VIX fixed:**
- Was broken: NSE API returns 403, VIX stuck at 15.0 default
- Fixed: kiteService.getQuote(['NSE:INDIA VIX']) as primary, NSE as fallback
- Demo mode: randomized 13–18 so adjustment logic exercises
- Now emits vix_update socket event + GET /api/market/vix REST endpoint
- VIX chip in AppBar: color-coded (green/blue/amber/red by volatility band)

**New scan templates (using previously unused indicators):**
- stochrsi_oversold: StochRSI < 20 + RSI < 45 + buyerRatio > 1.0
- macd_bullish_cross: MACD histogram > 0 + volumeVsAvg > 1.2
- Both wired into scanner _resolve()

## What's Next (from .product/03_NEXT_MISSION.md)

Priority order:
1. **Trade Journal UI** (high priority) — backend logs all trades to profiles/{name}/trades.json, need a frontend component. Add TradeJournal route + component, GET /api/journal/:profileName endpoint.
2. **Bollinger Bands scan template** — indicator exists but unused
3. **ATR-based dynamic stop-loss** in paper trading (uses existing ATR indicator)
4. **Backtesting engine** — needs historical data download from Kite first

## Key Architecture Points

- VixService: singleton (module.exports = new VIXService()), io wired post-instantiation via vixService.io = io
- ScannerService: setRadarService() injection to avoid circular dep
- All services: CommonJS require/module.exports, no TypeScript
- Frontend: React hooks + MUI v5 dark theme
- Demo mode: auto-on when KITE_API_KEY not set, all calls route to mock.service.js
- NEVER touch .env or .kite_token
- NEVER set paperTrading: false
- new Function() in strategy.service.js is RCE risk — don't expand this pattern

The app runs with: npm run dev:all
Backend: http://localhost:5000 | Frontend: http://localhost:3000
```

---

## Session History Log

| Date | What Was Done |
|------|--------------|
| Jun 2026 | Initial build: Order Radar, Market Scanner, Sector Heatmap, Alert Manager, StochRSI + MACD fix |
| Nov 2026 | Strategic review, Scan Watchdog, VIX fix, sector mapping fix, 2 new scan templates, VIX AppBar chip, full docs |
| Nov 2026 | Next: Trade Journal UI |

---

## Files That Change Most Often

When making changes, these files are the most likely touch points:

| Scenario | Files to Read First |
|----------|-------------------|
| New scan template | `backend/config/scan-templates.js`, `backend/services/scanner.service.js` (_resolve) |
| New indicator | `backend/services/indicators.service.js` |
| New frontend page | `client/src/App.js` (add route + nav), create component in `client/src/components/` |
| New API endpoint | Relevant route file + controller + service |
| Telegram notification | `backend/services/telegram.service.js` |
| VIX thresholds | `backend/services/vix.service.js` (getMarketCondition) |
| Profile settings | `backend/services/profile.service.js` |
