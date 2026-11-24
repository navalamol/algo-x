# User Guide — Kite Algo Trading Platform

*Version: Nov 2026 | Paper trading only — no real money executes*

---

## Quick Start (Demo Mode)

The app works **without a Kite API key**. When `KITE_API_KEY` is not set in `.env`, it auto-enters Demo Mode and all market data comes from the mock service.

```bash
npm run dev:all       # starts backend (port 5000) + frontend (port 3000)
```

Open **http://localhost:3000** in your browser.

**What's pre-loaded in demo mode:**
- 7 instruments: SBIN, INFY, TCS, RELIANCE, HDFCBANK, ICICIBANK, WIPRO
- Each instrument is scenario-biased so scanner templates fire immediately (see Scanner section)
- 25 trades in `profiles/amol/trades.json` to populate Trade History
- VIX randomized between 13–18 to exercise volatility adjustment logic
- Two open paper positions: SBIN (15 qty) and TCS (2 qty)

---

## 1. Dashboard (`/`)

**What it shows:** Live watchlist with prices, indicators, and strategy signals.

**How to use:**
1. The watchlist starts with SBIN, INFY, TCS, RELIANCE, HDFCBANK, ICICIBANK, WIPRO in demo mode
2. Each row shows: last price, RSI, VWAP, volume, strategy signal (BUY/SELL/HOLD)
3. Click any row to expand indicator details (SMA, EMA, Bollinger Bands, StochRSI)
4. Active strategies evaluate every second — green chip = BUY signal, red = SELL signal

**What to test:**
- Watch prices update in real-time (mock generates small random ticks)
- Activate a strategy from the Strategies page and watch signals appear here
- The VIX chip in the top bar changes colour as VIX fluctuates:
  - Green ≤ 15: low vol, normal sizing
  - Blue 15–18: moderate vol, 10% smaller positions
  - Amber 18–22: elevated vol, 25% smaller positions
  - Red > 22: high vol, 50% smaller positions

---

## 2. Order Radar (`/radar`)

**What it shows:** Real-time list of stocks with ≥ 30% buyer order book imbalance — stocks where buyers are overwhelming sellers right now.

**How it works:** `RadarService` reads order book depth every 2 seconds and computes `buyerRatio = totalBuyQty / totalSellQty`. A stock enters the Radar when its ratio ≥ 1.3 (more than 30% more buy orders).

**In demo mode:**
- SBIN, TCS, HDFCBANK have biased depths → buyerRatio ~1.3–1.6 → these appear on Radar
- WIPRO has seller-biased depth → buyerRatio ~0.5 → appears as a sell signal

**How to use:**
1. Navigate to `/radar`
2. Watch the feed update — stocks with strong buy imbalance float to the top
3. Click a stock to see the full depth ladder (5 bid/ask levels)
4. Use this alongside the Scanner to confirm: a scan match with a Radar score > 0.6 is a stronger signal

**Key metric:** Radar Score (0–1). Computed from: ratio, volume spike, price position vs VWAP.

---

## 3. Market Scanner (`/scanner`)

**What it shows:** Template-based stock scans. Run any template on demand or watch it in the background.

### Pre-built Templates and What They Find in Demo Mode

| Template | Trigger Condition | Demo Match |
|----------|-------------------|------------|
| Momentum Burst | RSI > 60, volume > 1.5× avg, price > VWAP | INFY, WIPRO |
| Oversold Reversal | RSI < 35, buyerRatio > 1.2 | SBIN |
| Volume Breakout | Volume > 2× average | ICICIBANK |
| VWAP Reclaim | Price > VWAP, buyerRatio > 1.0 | HDFCBANK |
| Weak Hands Exit | RSI > 70, buyerRatio < 0.7 | WIPRO |
| StochRSI Oversold | StochRSI < 20, RSI < 45, buyerRatio > 1.0 | TCS |
| MACD Bullish Cross | MACD histogram > 0, volume > 1.2× avg | RELIANCE |

**How to run a scan:**
1. Navigate to `/scanner`
2. Click **Run** on any template card
3. Results appear below: symbol, price, % change, RSI, VWAP, buyer ratio
4. Click a match to see the full indicator set

**Custom scan:**
1. Click **+ Custom Scan**
2. Add conditions (indicator, operator, value) — e.g. `rsi < 30` AND `buyerRatio > 1.5`
3. Click **Run** — results use the same 7 demo instruments

---

## 4. Scan Watchdog

**What it does:** Puts a scanner template into background watch mode. Every 2 minutes it re-scans. Stocks that newly appear (were absent last cycle) trigger a Telegram alert and a UI notification.

**How to enable:**
1. On the Scanner page, toggle the **Watch** switch on any template card
2. The card gains a "WATCHING" badge
3. The **New Matches** feed on the right shows the last 20 newly-matched stocks across all watched templates

**Telegram alert format:**
```
👁 New Scanner Match
Template: Oversold Reversal Candidate
Symbol: SBIN | ₹625.50
RSI: 28.4 | Volume: 1.6×
VWAP: Below | Buyer Ratio: 1.58
Radar Score: 0.72 | Sector: Banking
VIX: 15.2 (Low Volatility)
```

**Morning brief:** Every weekday at 9:00 AM IST, a Telegram message summarises all watched templates + their current matches. Configure Telegram in Settings.

**Stopping watch mode:** Toggle the Watch switch off, or restart the server.

---

## 5. Sector Heatmap (`/heatmap`)

**What it shows:** A colour-coded grid of Nifty sectors, each tile showing the sector's aggregate price change %.

**Sectors displayed:** Banking, IT, Auto, Pharma, FMCG, Metal, Energy, Infra, Realty, NBFCs (10 sectors, 50+ stocks mapped).

**Colour scale:** Dark red (< −2%) → Red → Yellow → Green → Dark green (> +2%)

**In demo mode:** Sector values are estimated from mock instrument prices. SBIN drives Banking, INFY + TCS + WIPRO drive IT, RELIANCE drives Energy.

**How to use:**
1. Navigate to `/heatmap`
2. Hover over a sector tile to see the top movers within that sector
3. Use it for top-down analysis: identify which sectors are strong before running stock-level scans
4. Rotate between heatmap + scanner: green sectors → run Momentum Burst scan; red sectors → run Oversold Reversal scan

---

## 6. Alert Manager (`/alerts`)

**What it shows:** Create and manage price/indicator alerts. When a condition is met, a Telegram message fires and a browser notification appears.

**Alert types:**
| Type | Example | Trigger |
|------|---------|---------|
| Price above | SBIN > ₹650 | Fires when last_price crosses above threshold |
| Price below | INFY < ₹1400 | Fires when last_price crosses below threshold |
| RSI above | TCS RSI > 70 | Fires when RSI crosses above value |
| RSI below | SBIN RSI < 30 | Fires when RSI crosses below value |
| Volume spike | ICICIBANK volume > 2× | Fires when volume ratio exceeds multiplier |

**How to create an alert:**
1. Navigate to `/alerts`
2. Click **+ New Alert**
3. Select: Symbol, Alert Type, Threshold Value
4. Toggle Telegram notification on/off per alert
5. Click **Save** — the alert goes active immediately

**In demo mode:** SBIN RSI will naturally drop below 35 (see Scanner scenarios), so setting a "SBIN RSI < 35" alert will fire within a few scan cycles.

**Managing alerts:**
- Alerts show status: ACTIVE, TRIGGERED, PAUSED
- Once triggered, an alert auto-pauses (re-activate manually)
- Delete alerts you no longer need — they persist across restarts in memory

---

## 7. Trade History (`/trades`)

**What it shows:** All paper trades with P&L, strategy attribution, and summary stats.

**Pre-loaded demo data (25 trades, Nov 2–24 2026):**
- 23 completed trades + 2 open positions
- Stocks: SBIN, INFY, TCS, RELIANCE, HDFCBANK, ICICIBANK, WIPRO
- Strategies used: RSI Oversold, VWAP Breakout, Support Bounce, Volume Spike, Momentum, Mean Reversion, Resistance Breakout, Trend Following, Intraday Scalper
- Net P&L: approximately +₹1,799
- Win rate: ~65% (15 wins / 23 closed)

**Summary cards:**
- Total Trades / Completed Trades / Win Rate / Total P&L

**Filter by status:** OPEN, COMPLETE, CANCELLED

**How to generate new trades:**
1. Go to Strategies page, activate a strategy
2. When a strategy fires a signal on the Dashboard, the paper trading service places a mock order
3. The order appears here with entry price, quantity, and brokerage

**P&L calculation:** `(exitPrice - entryPrice) × qty − brokerage (0.03%) − slippage (0.1%)`

---

## 8. Strategy Builder (`/strategies`)

**What it shows:** Create, activate, and manage automated trading strategies.

**Pre-built strategies (10 in library):**

| Strategy | Risk | Win Rate | Key Condition |
|----------|------|----------|---------------|
| RSI Oversold Reversal | Low | 65% | RSI < 30 |
| Golden Cross Momentum | Medium | 58% | SMA20 > SMA50 |
| VWAP Breakout | Medium | 62% | Price above VWAP with volume |
| Morning Gap Up | High | 57% | 2%+ gap at open |
| Support Bounce | Low | 68% | Price at support level |
| Volume Spike Catcher | High | 53% | Volume > 2× average |
| Trend Following | Medium | 55% | Trailing stop on strong trends |
| Mean Reversion | Low | 72% | Fade extreme RSI moves |
| Resistance Breakout | Medium | 57% | Price breaks resistance |
| Intraday Scalper | High | 63% | Quick 0.5–1% profits |

**How to activate a strategy:**
1. Navigate to `/strategies`
2. Click **Load from Library** to browse pre-built strategies
3. Select one, click **Add to My Strategies**
4. Toggle the **Active** switch — the strategy now evaluates every second on your watchlist
5. Signals appear on the Dashboard and in the trade history when executed

**Creating a custom strategy:**
1. Click **+ New Strategy**
2. Set: Name, risk tolerance, instruments to trade
3. Add conditions using the visual rule builder
4. Set stop-loss % and target %
5. Save and activate

**Safety note:** `paperTrading: true` is locked in `profiles/amol/config.json`. No real orders will be placed.

---

## 9. Settings (`/settings`)

**Profile selector:**
- Switch between `amol` (AGGRESSIVE, 20 trades/day limit, ₹1L capital) and `shailja` (default config)
- Each profile has independent strategies, watchlists, trades, and journal

**Paper Trading Dashboard:**
- Shows open positions, available capital, day P&L, total P&L
- Capital resets to ₹1,00,000 on each server restart

**Telegram Setup:**
1. Create a Telegram bot via @BotFather → get bot token
2. Get your chat ID (message @userinfobot)
3. Enter token + chat ID in Settings → Telegram section
4. Test with the **Send Test** button
5. All alerts, scan matches, and trade notifications will now go to Telegram

**Strategy library:** View all pre-built strategies and their performance stats

---

## 10. Trade Journal (`/journal`)

**What it shows:** A complete view of your paper trading history with performance analytics, an equity curve, and filterable trade records.

**How to use:**
1. Navigate to `/journal` via the sidebar (**Trade Journal** item)
2. The page loads all trades from `profiles/amol/trades.json` automatically
3. Summary cards at the top show: Total Trades, Completed, Win Rate, Net P&L, Open Positions

**Equity Curve:**
- Shows cumulative P&L across all completed trades sorted by date
- Green area = profitable run, red area = drawdown
- Hover a data point to see the instrument name, date, and P&L for that trade

**Strategy Performance Table:**
- Groups completed trades by strategy name
- Shows trade count, win rate chip (green ≥ 60%, amber 40–60%, red < 40%), net P&L, and avg P&L per trade

**Filtering Trades:**
| Filter | Options |
|--------|---------|
| Status | All / Wins / Losses / Open |
| Strategy | dropdown of all strategy names in the journal |
| Symbol | dropdown of all instruments traded |
| Date range | From / To date pickers |

**Trade table columns:** Date, Symbol, Exchange, Strategy, Type (BUY/SELL), Qty, Entry Price, Exit Price, Status chip, P&L, P&L%

**Testing in demo mode:**
- 25 paper trades are pre-loaded on every server start (23 complete, 2 open)
- Net P&L ≈ +₹1,799 | Win rate ≈ 65% | Date range: Nov 2–24 2026
- Try each filter combination: filter by "RSI Oversold Reversal", set date to Nov 10–20, then toggle to "Wins only"

**Config needed:** None — data comes from `profiles/amol/trades.json` which is seeded automatically.

---

## 11. VIX Indicator (AppBar)

The **VIX chip** in the top navigation bar shows India VIX (volatility index) in real-time.

**Colour bands:**
| VIX Range | Colour | Meaning | Position Size Adjustment |
|-----------|--------|---------|--------------------------|
| ≤ 15 | Green | Low volatility | Normal (100%) |
| 15–18 | Blue | Moderate | −10% |
| 18–22 | Amber | Elevated | −25% |
| > 22 | Red | High | −50% |

**In live mode:** VIX fetched every 5 min from Kite Connect (`NSE:INDIA VIX`), NSE website as fallback.

**In demo mode:** Randomized 13–18 every 5 minutes so position sizing logic is exercised.

---

## Demo Mode Scenario Summary

| Symbol | Designed to match | Key indicators |
|--------|------------------|----------------|
| SBIN | Oversold Reversal Candidate | RSI ~28, buyerRatio ~1.6 |
| INFY | Momentum Burst | RSI ~80, volume 1.7× avg, price > VWAP |
| TCS | StochRSI Oversold | StochRSI ~0, RSI ~25, buyerRatio ~1.3 |
| RELIANCE | MACD Bullish Cross | histogram > 0, volume 1.3× avg |
| HDFCBANK | VWAP Reclaim | price > VWAP, buyerRatio ~1.3 |
| ICICIBANK | Volume Breakout | volume 3× avg (~950k vs ~300k) |
| WIPRO | Weak Hands Exit | RSI ~85, buyerRatio ~0.5 |

> Run **all 7 scanner templates** in one session to see every template fire at least once.

---

## Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| Scanner returns 0 matches | Server just started, history not built yet | Wait 1 scan cycle or restart; demo mode pre-seeds history now |
| VIX stuck at 15.0 | NSE API blocked (403) | App now uses Kite API as primary; this only affects live mode |
| Telegram alerts not arriving | Bot not configured | Go to Settings → Telegram, enter token + chat ID |
| Trade history empty | `trades.json` cleared | Pre-loaded demo data is in `profiles/amol/trades.json` |
| Prices not updating | WebSocket disconnected in live mode | Demo mode uses polling; check `.kite_token` for live mode |

---

## 11. Backtesting

**Route:** `/backtest`

### What it does
Simulates a strategy against historical price data bar-by-bar to measure performance before risking real capital. Each bar checks the strategy's entry conditions, then manages the open position with a stop-loss and take-profit until exit.

### How to use
1. Navigate to **Backtest** in the sidebar.
2. Select a **Strategy** from the dropdown (all 10 built-in strategies are available).
3. Choose a **Symbol** (10 Nifty stocks pre-loaded) and **Days** (60–730).
4. Set **Capital** (starting ₹), **Slippage %** (cost of market impact), and **Brokerage ₹** (per trade flat fee).
5. Click **Run** — results appear in ~1 second.

### What you get
- **6 metric cards**: Total Trades, Win Rate, Net P&L, Profit Factor, Max Drawdown %, Sharpe (approx)
- **Equity curve**: Portfolio value over time with entry capital reference line
- **Monthly P&L bar chart**: green/red bars per calendar month
- **Trade log**: every simulated trade with entry/exit date, price, qty, reason (TAKE_PROFIT / STOP_LOSS / END), and RSI at entry

### Demo mode
In demo mode, **synthetic OHLCV data is generated automatically** — no Kite API key needed. The price series uses realistic random-walk with ~2.5% daily volatility. Results will vary between runs (data is generated fresh each time), which is useful for understanding how a strategy behaves under different market conditions.

### Config options
| Field | Default | Notes |
|-------|---------|-------|
| Strategy | — | Any built-in or custom strategy's conditions + SL/TP are used |
| Symbol | RELIANCE | Symbol is decorative in demo mode (synthetic data only) |
| Days | 180 | Number of calendar days of history to simulate |
| Capital | ₹1,00,000 | Starting portfolio value |
| Slippage | 0.1% | Added to entry price, subtracted from exit proceeds |
| Brokerage | ₹20 | Flat fee per trade (both sides) |

### Interpreting results
- **Profit Factor > 1.5** — strategy has an edge
- **Max Drawdown < 15%** — acceptable risk
- **Win Rate > 50%** — but check avg win vs avg loss too
- **Sharpe > 1** — good risk-adjusted return

