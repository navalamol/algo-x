# User Guide — Algo-X Market Intelligence

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

---

## 12. ATR Dynamic Stop-Loss

**Available in:** Live mode (Kite API key configured) with auto-trading enabled

### What it does
Instead of a fixed percentage stop-loss (e.g. always 2%), the ATR (Average True Range) stop-loss adapts to each stock's current volatility. A stock moving ±50 points per bar gets a wider stop than one moving ±5 points — avoiding premature stops on volatile stocks while keeping tight stops on quiet ones.

**Formula:** `stop_loss_price = entry_price − (1.5 × ATR₁₄)`

The percentage equivalent is clamped between **0.5%** (minimum) and **10%** (maximum) to prevent extreme values.

### How it works
When a strategy signal fires, the engine:
1. Takes the last 14+ price bars from the stock's history
2. Synthesizes OHLC (open, high, low, close) from consecutive close prices
3. Computes ATR(14) using the standard True Range formula
4. Derives `atrStopPct = (1.5 × ATR / entryPrice) × 100`
5. Clamps to [0.5%, 10%], then applies VIX adjustment on top
6. Falls back to the strategy's fixed stop-loss if fewer than 15 history bars are available

### Checking the log
When a trade fires, the backend log shows:
```
📐 ATR Stop-Loss: ATR=12.50, 1.5×ATR=18.75, SL=1.21% (was fixed 2%)
📊 VIX Adjustment: 18.5 (NORMAL) - Qty: 1 → 1, Stop: 1.21% → 1.42%
```

### Config (`backend/config/trading.config.js`)
| Key | Default | Meaning |
|-----|---------|---------|
| `risk.atr.enabled` | `true` | Turn ATR stop-loss on/off |
| `risk.atr.multiplier` | `1.5` | Wider = fewer premature stops; tighter = more protection |
| `risk.atr.period` | `14` | ATR lookback bars |
| `risk.atr.minStopPct` | `0.5` | Minimum stop-loss % |
| `risk.atr.maxStopPct` | `10` | Maximum stop-loss % |

### Demo mode
The mock service exposes `getOHLCHistory(symbol)` which derives deterministic OHLC from the scenario price histories, so ATR can be computed without a real Kite connection. Strategy evaluation is skipped in demo mode (no live ticker feed), so ATR stop-loss activates once a live API key is configured.


---

## Morning Brief (Mission 1)

### What it does
The Morning Brief is the first screen you should check each trading day. It synthesises India VIX, sector performance and scanner results into a single concise view — targetted at under 60 seconds to scan.

**Available from:** `GET /api/morning-brief` and the **Home** page (the `/` route after the Mission 0 navigation update)

### What the brief shows
| Section | What it tells you |
|---------|------------------|
| **India VIX + Regime** | Current volatility level (VERY_LOW / LOW / NORMAL / ELEVATED / HIGH / EXTREME) with a plain-language recommendation |
| **VIX Trend** | Whether VIX is RISING, FALLING or STABLE vs recent history |
| **Market Sentiment** | BULLISH / BEARISH / MIXED based on how many sectors are advancing vs declining |
| **Sector Leaders** | Top 3 advancing sectors with change % |
| **Sector Weakness** | Top 2 declining sectors |
| **Top Setups** | Stocks matching multiple scanner templates — sorted by number of matching templates (more templates = more conviction) |
| **Scan Summary** | Per-template match count with top symbols |

### Telegram delivery
The brief is sent automatically at **9:00 AM IST, Monday–Friday** to every profile that has Telegram configured.

To receive it:
1. Go to **Settings → Telegram** and configure your bot token + chat ID
2. The brief fires automatically at market open

### Demo mode
In demo mode (no Kite API key), the brief returns realistic synthetic data — 7 sector leaders/laggers, 5 top setups from the scenario-biased instruments, and a NORMAL VIX regime. This allows full testing on market holidays.

### No strong setup
If no scanner templates return matches, the brief shows:
> No strong setups today — consider waiting.

This is intentional. The system is not optimised to always produce a signal. Signal quality matters more than signal quantity.

### REST endpoint
```
GET /api/morning-brief
→ { success: true, data: { generatedAt, date, regime, marketSentiment, breadth, sectorLeaders, sectorLaggers, topOpportunities, scanSummary, noSetup, dataSource } }
```

### dataSource field
| Value | Meaning |
|-------|---------|
| `live` | Real Kite Connect data |
| `demo` | Synthetic mock data (no API key configured) |

---

## Opportunity Ranking Engine (Mission 2)

**Route:** `/opportunities`  
**API:** `GET /api/opportunities`

### What it does
The Opportunity Ranking Engine scores every instrument in the universe across five independent factors and returns them ranked from most to least interesting. Each score component includes a plain-English reason so you understand **why** a stock ranks where it does.

Scores are always traceable — no "black box" rankings.

### Scoring factors (total 100 pts)

| Factor | Weight | What it measures |
|--------|--------|-----------------|
| **Trend** | 25 pts | Price vs SMA20 (13 pts) + SMA20 vs SMA50 direction (12 pts) |
| **Momentum / RSI** | 20 pts | RSI position: 50–65 is ideal momentum entry; 25–35 is oversold reversal; >80 or <15 score low |
| **Volume** | 20 pts | Current volume vs 20-bar average: 3×+ = 20 pts, below average = 2 pts |
| **Relative Strength vs NIFTY** | 20 pts | Stock's total change vs NIFTY's change over the same window |
| **VIX Regime** | 15 pts | VIX 12–15 = 15 pts (optimal); VIX >35 = 0 pts (avoid) |

### Interpreting scores
| Score | Label | What to do |
|-------|-------|-----------|
| 75–100 | Strong | High-conviction setup — worth deeper research |
| 60–74 | Moderate | Interesting, review the breakdown before acting |
| 45–59 | Weak | Only 1–2 factors aligned — caution |
| 0–44 | Low | Multiple factors against it — skip |

### How to use
1. Navigate to **Opportunities** in the sidebar (Intelligence section).
2. Cards are sorted highest-score-first. Each card shows: symbol, price, score ring (0–100), and a mini factor bar row.
3. Click any card to expand the full 5-factor breakdown with per-factor score, max points, and reason text.
4. Use the **Refresh** button to recompute scores (results are cached for 1 minute server-side).

### Reading the breakdown panel

Each expanded card shows five factor rows:
- **Score / Max** — how many of the available points this stock earned for that factor
- **Reason** — the specific value that drove the score (e.g. "RSI 54.2 — ideal momentum zone (50–65)")
- A progress bar showing the fill percentage

**Missing data** is shown explicitly — if a factor cannot be computed (e.g. fewer than 50 price bars means no SMA50), the reason says so and a neutral score is applied rather than hiding the gap.

### Demo mode
In demo mode (no Kite API key), scores are computed from the same scenario price histories used by the Scanner. Each of the 7 instruments is biased toward a different setup:

| Symbol | Scenario | Expected high score |
|--------|---------|-------------------|
| HDFCBANK | VWAP Reclaim — steady rise | Trend + Momentum |
| RELIANCE | MACD Bullish Cross — recovery after decline | Trend + Momentum |
| INFY | Momentum Burst — strong uptrend | Trend + Rel. Strength |
| ICICIBANK | Volume Breakout — flat price, high volume | Volume |
| WIPRO | Overbought — extended uptrend | Trend (but Momentum penalised) |
| SBIN | Oversold Reversal — falling price | Momentum reversal zone |
| TCS | StochRSI Oversold — sharp recent decline | Momentum (early oversold) |

This gives a diverse, realistic mix every time. Refresh to see updated scores as the demo price histories evolve.

### REST response structure
```json
GET /api/opportunities
{
  "success": true,
  "data": {
    "opportunities": [
      {
        "symbol": "HDFCBANK",
        "name": "HDFC Bank Limited",
        "totalScore": 75,
        "price": 1687.25,
        "dataPoints": 50,
        "breakdown": {
          "trend":       { "score": 25, "max": 25, "reason": "...", "data": { "sma20": 1680, "sma50": 1668, "pctFromSma20": 1.8 } },
          "momentum":    { "score": 20, "max": 20, "reason": "RSI 54.2 — ideal momentum zone (50–65)", "data": { "rsi": 54.2 } },
          "volume":      { "score": 8,  "max": 20, "reason": "Volume 1.2× avg — slightly elevated", "data": { "volumeVsAvg": 1.2 } },
          "relStrength": { "score": 10, "max": 20, "reason": "+0.5% vs NIFTY — inline with market", "data": { "stockChangePct": 1.4, "niftyChangePct": 0.9 } },
          "vixRegime":   { "score": 12, "max": 15, "reason": "VIX 16.4 — normal volatility", "data": { "vix": 16.4 } }
        }
      }
    ],
    "computedAt": "2026-11-24T09:00:00.000Z",
    "dataSource": "demo",
    "vix": 16.4
  }
}
```

### dataSource field
| Value | Meaning |
|-------|---------|
| `live` | Scores computed from live scanner price histories |
| `demo` | Scores computed from scenario price histories (mock service) |

---

## 12. Evidence Cards — Why This Stock (`/opportunities` → expand → "Why This Stock")

**What it does:** Each opportunity card has a second tab — "Why This Stock" — that provides a deeper evidence layer: plain-English signals, all technical indicator values, and key price levels. This answers *why* a stock ranked highly without opening 5 external tools.

### How to use
1. Navigate to **Opportunities** in the sidebar.
2. Click any opportunity card to expand it.
3. The expanded panel now has two tabs: **Score Breakdown** (factor scores) and **Why This Stock** (evidence).
4. Switch to **Why This Stock** — evidence loads automatically on first view.
5. Evidence is cached for 2 minutes server-side; switch away and back to reload.

### Reading the evidence panel

**Summary line** — a 1–2 sentence plain-English narrative describing the stock's technical posture (e.g. "HDFCBANK has a favorable setup with 3 positive signals and no major risks").

**Technical Signals** — up to 6 key signals extracted from all computed indicators:
| Signal type | Icon | Meaning |
|-------------|------|---------|
| Positive | ✅ green | Bullish signal worth noting |
| Risk | ⚠️ red | A flag that warrants caution |
| Neutral | ⬛ grey | Present but not decisively bullish or bearish |

Each signal has a short label (e.g. "RSI Momentum Zone") and a detail line explaining the specific value.

**Indicators panel** — raw computed values:
- RSI (14), SMA 20, SMA 50, VWAP, ATR (14), Volume vs Avg
- BB Upper / Lower, MACD Histogram, StochRSI

**Key Levels** — Support, Resistance, VWAP anchors from recent price history.

**Sector** — sector classification from the sector mapping (e.g. Banking, IT, Energy).

### Signal types generated

| Signal label | Positive when | Risk when |
|---|---|---|
| RSI | 25–65 (oversold or momentum zone) | >72 overbought |
| MACD | Histogram > 0 | Histogram < 0 |
| SMA Trend | Price > SMA20, SMA20 > SMA50 | Price < SMA20 or death cross |
| Bollinger Band | Near lower band (<10%) | Near upper band (>90%) |
| Volume | ≥ 1.5× average | < 0.7× average |
| StochRSI | Oversold (<20) | Overbought (>80) |
| VWAP | Price above VWAP | Price below VWAP |

### Demo mode
Evidence works fully in demo mode — all 7 instruments generate a complete evidence card from their scenario price histories. Each instrument's pre-biased history produces realistic (and different) signals:

| Symbol | Expected evidence signals |
|--------|--------------------------|
| HDFCBANK | Above VWAP, SMA Uptrend, Elevated Volume |
| INFY | RSI Overbought risk (RSI ~80), MACD Bullish, Near Upper Band risk |
| RELIANCE | MACD Bullish, SMA Uptrend, Above VWAP |
| SBIN | RSI Oversold positive, Near Lower Band, Below VWAP risk |
| TCS | StochRSI Oversold positive, Below SMA20 risk |
| ICICIBANK | Volume Surge positive, Mid Bollinger neutral |
| WIPRO | RSI Overbought risk, StochRSI Overbought risk, Above VWAP |

### REST endpoint
```
GET /api/opportunities/:symbol/evidence
→ { success: true, data: { symbol, name, price, generatedAt, dataSource, summary, signals, technicals, keyLevels, sector, dataPoints } }
```

**signals array item:**
```json
{ "type": "positive|risk|neutral", "label": "RSI Momentum Zone", "detail": "RSI at 54.2 — ideal momentum zone. Not overbought, trending higher." }
```

**technicals object:**
```json
{ "rsi": 54.2, "sma20": 1680.5, "sma50": 1668.0, "vwap": 1675.0, "atr": 12.5, "volumeVsAvg": 1.4,
  "macd": { "macd": 5.2, "signal": 3.1, "histogram": 2.1, "bullish": true },
  "stochRsi": { "value": 62.0, "overbought": false, "oversold": false },
  "bollingerBands": { "upper": 1720.0, "middle": 1680.0, "lower": 1640.0, "pctB": 0.72 } }
```

---

## 13. What Changed (`/` → "What Changed" card)

**What it does:** Answers "what changed enough that I should care?" by detecting categorical state transitions in tracked stocks since your last session. Only changes significant enough to alter an investor's attention are surfaced — not every minor price move.

### How to use
1. Open the **Intelligence Home** (`/`). The "What Changed" card loads automatically.
2. Changes are sorted by significance: **HIGH** (red) first, then **MEDIUM** (orange), then **LOW** (grey).
3. Click **New Session** to reset the baseline to now — future changes will be detected relative to this new snapshot.
4. The header shows when the snapshot was taken and how many symbols are being tracked.

### Change types detected

| Change Type | Trigger | Significance |
|---|---|---|
| RSI Zone | RSI crossed into/out of oversold (<30), extreme oversold (<20), or overbought (>72) | HIGH |
| RSI Zone | RSI moved between building/momentum/strong | MEDIUM |
| MACD | MACD histogram flipped positive ↔ negative | MEDIUM |
| Trend | Price vs SMA20/SMA50 structure changed (e.g. uptrend → downtrend) involving a major state | MEDIUM |
| Volume | Volume moved into spike territory (≥2× average) | MEDIUM |
| Trend | Minor SMA20 cross (above ↔ below) | LOW |
| Volume | Volume moved from normal to elevated or weak | LOW |
| VWAP | Price crossed above/below VWAP | LOW |

### Shared architecture note
Change detection uses `backend/utils/market-state.js` — a shared utility that derives categorical states (rsiZone, volumeBand, trendBias, macdBias, vwapPosition) from raw indicator values. This same utility will be reused by Mission 6 (Portfolio Intelligence) to avoid duplicating threshold logic.

### Demo mode
In demo mode, 5 pre-canned changes are returned that match the scenario instrument states:

| Symbol | Change | Significance |
|---|---|---|
| INFY | RSI: momentum → overbought | HIGH |
| SBIN | RSI: building → oversold | HIGH |
| RELIANCE | MACD: bearish → bullish | MEDIUM |
| TCS | Trend: above_sma20 → downtrend | MEDIUM |
| ICICIBANK | Volume: normal → spike | MEDIUM |

### REST endpoints
```
GET  /api/changes           → { changes, snapshotAt, detectedAt, dataSource, symbolCount }
POST /api/changes/snapshot  → { snapshotAt, symbolCount }   (resets baseline)
```

**ChangeEvent object:**
```json
{
  "symbol": "SBIN",
  "sector": "Banking",
  "changeType": "rsi_zone",
  "significance": "high",
  "from": "building",
  "to": "oversold",
  "detail": "SBIN RSI dropped into oversold zone (20–30) — potential mean-reversion setup forming.",
  "price": 601.80,
  "detectedAt": "2026-11-24T09:15:00.000Z"
}
```



---

## 14. Backtesting — Historical vs Synthetic Data (Mission 5)

### What changed in Mission 5

The backtest engine now distinguishes clearly between **real historical data** and **synthetic demo data**, and adds an **in-sample / out-of-sample validation split** to catch overfitting.

### Data sources

| Mode | Data Source | Label shown |
|------|-------------|-------------|
| Demo mode (no Kite key) | Deterministic synthetic OHLCV per symbol | `SYNTHETIC DATA — Demo Mode` (orange banner) |
| Live mode (Kite key present) | Real NSE daily candles via `kite.getHistoricalData()` | `HISTORICAL DATA (Kite)` (green banner) |
| Live mode — Kite error/offline | Falls back to synthetic | `SYNTHETIC DATA — Kite unavailable` (orange banner) |

### In-sample / Out-of-sample split

The **OOS %** field (default 20%) holds back the final portion of candles as a validation window:

- **In-Sample Training** — the strategy is evaluated here. Metrics here are "what this strategy did on training data."
- **Out-of-Sample Validation** — a held-out period never used in strategy evaluation. Metrics here are "how the strategy actually generalised."

If in-sample win rate is 65% but out-of-sample is 35%, the strategy is overfit. The UI shows a red overfitting warning when the gap exceeds 15 percentage points.

Set OOS % to 0 to skip the split and run a full-window backtest.

### How to test in demo mode

1. Start the app: `npm run dev:all`
2. Navigate to `/backtest`
3. Select any strategy (e.g., "RSI Oversold Reversal")
4. Select a symbol (e.g., INFY or SBIN)
5. Leave OOS % at 20 and click **Run**
6. The orange `SYNTHETIC DATA — Demo Mode` banner should appear
7. Two metric panels show: "In-Sample Training" and "Out-of-Sample Validation"
8. The equity curve shows a vertical orange line marking the OOS split date
9. The Trade Log accordion has two tabs: In-Sample and Out-of-Sample

### How to test with a live Kite key

1. Set `KITE_API_KEY`, `KITE_API_SECRET` in `.env` and authenticate at `http://localhost:5000/auth.html`
2. Run a backtest — the green `HISTORICAL DATA (Kite)` banner appears
3. Results are computed on real NSE daily candles

### REST endpoint

```
POST /api/backtest/run
Body: {
  strategyId: "rsi_oversold",
  symbol: "INFY",
  days: 180,
  capital: 100000,
  slippage: 0.1,
  brokerage: 20,
  outOfSamplePct: 20
}

Response:
{
  strategyName, symbol, dataSource,
  totalBars, splitDate, capital,
  inSample:    { fromDate, toDate, bars, metrics, trades },
  outOfSample: { fromDate, toDate, bars, metrics, trades } | null,
  equity: [{ date, value, period }]
}
```

### dataSource values

| Value | Meaning |
|-------|---------|
| `HISTORICAL_KITE` | Real NSE candles from Kite Connect |
| `SYNTHETIC_DEMO` | Deterministic synthetic candles (demo mode) |
| `SYNTHETIC_FALLBACK` | Synthetic candles used because Kite failed |
