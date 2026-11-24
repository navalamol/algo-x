# Strategic Review — Nov 2026
*Competitive landscape, real gaps, and what we built*

## Competitive Landscape: Top 10 Tools

| # | Tool | Killer Feature | Gap vs This Platform | Price |
|---|------|---------------|----------------------|-------|
| 1 | TradingView | Best charting + Pine Script | No India F&O execution to Zerodha, NSE delayed on free tier | $15–60/mo |
| 2 | Chartink | Real-time NSE scanner + Telegram alerts | No execution (scan→Telegram→Streak→Kite = 3 hops), no L2 order book | ₹780/mo |
| 3 | Sensibull | Options strategy builder + live payoff charts | Zero backtesting, no logic/screener | ₹800–1,300/mo |
| 4 | Streak (Zerodha) | No-code algo, free for Zerodha users, 80+ indicators | No options, no AND/OR logic, weak backtest quality | Free |
| 5 | AlgoTest | Options-first backtesting, 7.5yr F&O history | Smaller community, newer, less customizable | Freemium |
| 6 | Tradetron | Strategy marketplace (run others' algos), 70+ brokers | Steep learning curve, strategy quality varies | Subscription |
| 7 | Trendlyne | Deepest data: promoter pledging, FII/DII, analyst revisions | Not for intraday, overwhelming UI, no execution | ₹2,990/yr |
| 8 | Tickertape | Clean research UI, 200+ screener filters | Not real-time, not built for active traders | ₹2,999/yr |
| 9 | StockEdge | Mobile-first daily insights: FII/DII, sector rotation | Not for intraday/technical trading | ₹1,625/yr |
| 10 | Smallcase | Thematic basket investing, auto-rebalance | Not a trading tool at all | Per smallcase |

## 5 Real Trader Pain Points

1. **Kite access token expires daily** — unattended bots silently stop. #1 complaint on kite.trade developer forum.
2. **Screener-to-execution gap** — Chartink finds the stock, Streak executes it, 3-system chain with failure points.
3. **No pre-trade decision capture** — Every analytics tool tracks outcomes but not *why you entered*. Without the reasoning, the journal is just a ledger.
4. **Scanner results are ephemeral** — You run the scan, see results, they disappear. No "notify me when new stock matches Momentum Burst." ← **This is what we just fixed.**
5. **Tools are siloed** — RSI, order flow, VIX, sector trend all live in separate screens. No single view that says "here's the full picture for this trade."

## What This Platform Has That Others Don't

| Capability | Why It Matters |
|-----------|----------------|
| Order book L2 imbalance (Radar) | No retail tool in India does real-time order flow for equities |
| 12 correct technical indicators | Wilder smoothing RSI, full MACD series, StochRSI, BB, ATR, OBV |
| Template-based scanner engine | Extendable — add a template in one file |
| VIX-based dynamic risk adjustment | Auto-widens stops, shrinks qty in volatile markets |
| Profile-based paper trading | Realistic slippage + brokerage simulation |
| Telegram delivery | The entire signal delivery chain is wired and tested |

## Decision: Why We Built Scan Watchdog First

**Directly replaces Chartink Premium (₹780/mo)** — their core value is "alert me when my scan matches a new stock, in real time." That's exactly what this builds, but free, with more data, and with direct execution capability Chartink will never have.

**Unique edge: order flow + indicator + VIX in one alert** — No tool in India delivers this combination at signal time. TradingView shows indicators. Chartink shows scan hits. Radar shows order flow. VIX is on a separate website. This alert shows all four together, at the moment of signal, on your phone.

**Zero friction on mobile** — You don't open the app. The match comes to you on Telegram with full context assembled. This satisfies the "quick to use" requirement completely.

**Pure wiring, not new code** — Every component existed. The work was connecting them.

**Creates data pipeline for future features** — Once signals fire and the user replies Y/N, that IS the beginning of the decision journal. The first 50 trades will naturally have Y/N capture.

## What We're Not Building (and Why)

| Idea | Why Not Now |
|------|------------|
| Backtesting engine | Needs historical data infrastructure first. Right long-term investment, just not first. |
| Strategy Performance Heatmap | No data yet — strategies.json is empty. Build after 50+ paper trades. |
| Group leaderboard | Nice-to-have social feature. Not on the critical path to profit. |
| Real money trading | Paper mode must run 30+ days with consistent results first. |
| Chartink Webhook Bridge | Great utility feature, but requires Chartink Premium subscription. Build later. |

## Audit Findings (from this review session)

1. **VIX was broken** — `vix.service.js` scraped `nseindia.com/api/allIndices` which blocks automated requests (403). VIX was permanently stuck at the 15.0 default. The entire VIX risk adjustment system was a no-op. Fixed: now uses `kiteService.getQuote(['NSE:INDIA VIX'])` as primary source.

2. **Sector mapping was empty** — `sector-mapping.js` had all content commented out, exporting `{}`. This broke the heatmap. Fixed: restored full SECTOR_MAP for 50+ Nifty stocks across 10 sectors.

3. **StochasticRSI, MACD histogram, ATR are computed but never used** — These indicators are correctly implemented in `indicators.service.js` but no scan template or strategy rule references them. High-value next step: add scan templates that use these.
