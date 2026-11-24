# Next Mission — Backtesting Engine

*Status: Queued. Previous: Alert Manager, Sector Heatmap, Order Radar (all complete).*

---

## Problem

We have 10 strategies ready to activate and a paper trading engine — but no way to know if a strategy actually worked on past data before turning it on. Without backtesting, we're guessing. The first real validation loop is weeks of paper trading, which is slow. A backtesting engine compresses that validation from weeks to minutes.

---

## Part A — Historical Data Foundation

**Goal:** Download and store OHLCV data for Nifty 50 stocks locally so backtests can run offline.

### What It Includes

1. **`scripts/download-history.js`** — CLI script using Kite Historical API to download candle data for a list of symbols, saves to `data/historical/{SYMBOL}_{timeframe}.json`
2. **Data format contract** — standardize the JSON schema so the backtest engine reads it cleanly: `{ symbol, timeframe, candles: [{timestamp, open, high, low, close, volume}] }`
3. **Seed data for 10 key symbols** — RELIANCE, TCS, INFY, SBIN, HDFC, ICICIBANK, TATAMOTORS, ITC, AXISBANK, WIPRO — 1 year of daily candles minimum

### Why This Matters

The backtest engine is useless without data. This creates a reusable offline data store that also supports future features like correlation analysis and drawdown studies.

---

## Part B — Backtest Engine

**Goal:** Run any saved strategy against historical data and get a performance report in under 10 seconds.

### What It Does

- Takes a strategy (by ID from the strategy library or custom conditions) and a symbol + date range
- Replays candle data, recalculates indicators at each bar, evaluates strategy conditions
- Simulates entry/exit with the same stop-loss and take-profit rules as the live engine
- Outputs: total return %, win rate, # trades, avg profit per trade, max drawdown, Sharpe ratio, best/worst trade, equity curve (array of portfolio values over time)

### What It Reuses

- `backend/services/indicators.service.js` — all indicator calculations are already there
- Strategy condition evaluation logic from `backend/services/strategy.service.js`
- Same stop-loss/take-profit math as `backend/services/paper-trading.service.js`

### API

```
POST /api/backtest/run
Body: { strategyId, symbol, fromDate, toDate, capital }
Response: { totalReturn, winRate, trades, maxDrawdown, sharpe, equityCurve }
```

### UI

- New tab "Backtest" inside Strategy Builder page
- Input: symbol dropdown, date range picker, run button
- Output: metrics cards + simple line chart for equity curve
- Compare button: run same strategy on 3 different symbols side by side

### Success Criteria

1. Can backtest RSI Oversold Reversal on RELIANCE for Jan–Jun 2025 and get a result in < 15 seconds
2. Equity curve renders correctly in the UI
3. Results are consistent: running the same backtest twice gives identical output

---

## Why Now

We have profiles set up, strategies ready, and paper trading running. The natural next question is "which strategy should I actually activate?" Backtesting answers that. Without it, we're flying blind and might waste weeks paper trading a losing strategy.

---

## Platform State After This Mission

- ✅ Real-time data
- ✅ Paper trading
- ✅ Strategy engine
- ✅ Telegram alerts
- ✅ Order Radar, Scanner, Heatmap, Alerts
- ✅ **Backtesting** ← this mission completes it
- ⬜ Trade Journal UI
- ⬜ Live trading confidence gate
- ⬜ Real money execution

---

## Next Mission Queue (After This Completes)

1. Trade Journal UI (BT-2)
2. Strategy Performance Dashboard (BT-5)
3. Live Trading Confidence Gate (BT-6)
