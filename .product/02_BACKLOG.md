# Feature Backlog

*Prioritized as of Nov 2026 strategic review*

## ✅ Done

| Feature | Completed | Notes |
|---------|-----------|-------|
| Core backend (Express + Socket.io) | Earlier | Stable |
| Kite Connect integration + paper trading | Earlier | 2 profiles, paper mode on |
| 12 technical indicators | Earlier | RSI, SMA, EMA, VWAP, MACD, StochRSI, BB, ATR, OBV, BuyerRatio |
| Radar (order book imbalance) | Earlier | Scoring: imbalance×0.6 + momentum×0.4 |
| Stock Scanner (5 templates) | Earlier | Momentum Burst, Oversold Reversal, Volume Breakout, VWAP Reclaim, Weak Hands Exit |
| Sector Heatmap | Earlier | 10 sectors, 50+ Nifty stocks |
| Alert Service | Earlier | Price + indicator watches, Telegram delivery |
| Telegram notifications | Earlier | Bot integration, profile-based config |
| **VIX fix** | Nov 2026 | Was broken (NSE 403), now uses Kite Connect API |
| **Sector mapping fix** | Nov 2026 | Was empty, restored full SECTOR_MAP |
| **Scan Watchdog** | Nov 2026 | Background watch, new-match detection, rich Telegram alerts |
| **Morning Brief cron** | Nov 2026 | 9:00 AM IST, all templates, sent to Telegram |
| **Scanner Watch UI** | Nov 2026 | Toggle button per template, new match feed, Snackbar |

## 🔜 Up Next (Prioritized)

| # | Feature | Why | Effort |
|---|---------|-----|--------|
| 1 | **Trade Journal UI** | Backend already logs all trades, no UI to review them | 2 days |
| 2 | **StochRSI + MACD scan templates** | Indicators built but unused — quick high-value addition | 2 hours |
| 3 | **VIX display on Dashboard** | VIX now works; expose it in the header as "VIX: 16.2 — NORMAL" | 1 hour |
| 4 | **Backtesting engine** | Needs historical data infrastructure first | 1 week |
| 5 | **Strategy Performance Dashboard** | Needs 50+ paper trades of data first | 2 days |
| 6 | **Chartink Webhook Bridge** | Receive Chartink alerts → execute in Kite | 1 day |
| 7 | **Telegram Y/N reply handler** | Reply Y → place paper trade from phone | 1 day |
| 8 | **Real money execution** | Only after 30+ days of profitable paper trading | — |

## 🚫 Out of Scope (For Now)

- Group leaderboard / social features
- Options strategy builder (Sensibull territory, complex)
- Mobile app (web is sufficient for paper trading phase)
