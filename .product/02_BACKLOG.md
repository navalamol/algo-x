# Feature Backlog

*Restructured Nov 2026 around Market Intelligence reorientation.*
*See `ALGO_X_PRODUCT_REORIENTATION_AND_EXECUTION_PLAN.md` for strategic rationale.*

---

## ✅ Done — Advanced Trading Layer (Secondary)

| Feature | Completed | Notes |
|---------|-----------|-------|
| Core backend (Express + Socket.io) | Earlier | Stable |
| Kite Connect integration + paper trading | Earlier | 2 profiles, paper mode on |
| 12 technical indicators | Earlier | RSI, SMA, EMA, VWAP, MACD, StochRSI, BB, ATR, OBV, BuyerRatio |
| Radar (order book imbalance) | Earlier | Scoring: imbalance×0.6 + momentum×0.4 |
| Stock Scanner (7 templates) | Earlier + Nov 2026 | Added StochRSI + MACD templates Nov 2026 |
| Sector Heatmap | Earlier | 10 sectors, 50+ Nifty stocks |
| Alert Service | Earlier | Price + indicator watches, Telegram delivery |
| Telegram notifications | Earlier | Bot integration, profile-based config |
| VIX fix | Nov 2026 | Was broken (NSE 403), now uses Kite Connect API |
| Sector mapping fix | Nov 2026 | Was empty, restored full SECTOR_MAP |
| Scan Watchdog | Nov 2026 | Background watch, new-match detection, rich Telegram alerts |
| Morning Brief cron (basic) | Nov 2026 | 9:00 AM IST scanner results to Telegram — needs upgrade to Mission 1 |
| Scanner Watch UI | Nov 2026 | Toggle button per template, new match feed |
| Trade Journal UI | Nov 2026 | P&L curve, strategy perf table, CSV export |
| Backtesting Engine (synthetic) | Nov 2026 | ⚠️ Synthetic data only — needs SIMULATION label + real data path |
| Demo Infrastructure | Nov 2026 | Runtime toggle, MockService, demo seed |
| Dashboard P&L chart | Nov 2026 | Last 14 days bar chart |
| Browser notifications | Nov 2026 | Native OS alerts on scanner:new_match |
| ATR-based dynamic stop-loss | Nov 2026 | Wired into strategy.service.js |

---

## 🔜 Missions (Prioritized — Market Intelligence Primary Layer)

| # | Mission | What It Delivers | Effort |
|---|---------|-----------------|--------|
| **0** | **Product Reorganization** | New navigation, HOME page, simulation disclaimer, IA update | 1 day |
| **1** | **Morning Brief** | <60s daily market understanding, Telegram delivery | 2 days |
| **2** | **Opportunity Ranking Engine** | Multi-factor scored stock list, explainable | 3 days |
| **3** | **Why This Stock (Evidence Cards)** | Per-stock evidence panel with data freshness | 2 days |
| **4** | **What Changed** | Portfolio/watchlist change detection, noise-filtered | 2 days |
| **5** | **Real Historical Backtesting** | Replace synthetic metrics with real historical evidence | 3–5 days |
| **6** | **Portfolio Intelligence** | Holdings health, risk, sector concentration | 3 days |
| **7** | **Strategy/Paper Trading Integration** | Full loop: Opportunity → Evidence → Paper Trade → Journal | 3 days |

---

## 🔵 Medium Priority (After Mission 1–4 Validated)

| Feature | Why | Effort |
|---------|-----|--------|
| Strategy Performance Analytics (by VIX band, time-of-day) | Useful after 50+ real paper trades | 2 days |
| Walk-forward backtesting | Stronger evidence quality | 1 week |
| Multi-timeframe evidence | Richer opportunity context | 2 days |
| Telegram Y/N reply handler | Mobile paper trade execution | 1 day |

---

## 🚫 Explicitly Deprioritized

- Mobile app
- SaaS multi-tenancy / payment gateway / subscriptions
- Group leaderboard / social features
- LLM stock prediction chatbot ("what will XYZ do tomorrow?")
- Options strategy builder
- ML prediction engine
- Chartink webhook bridge (nice-to-have, not core mission)
- More indicators (12 is sufficient)
- Dozens of new generic strategies

*Reconsider only after 30-day personal validation test passes.*
