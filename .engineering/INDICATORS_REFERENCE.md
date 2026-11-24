# Technical Indicators Reference

All indicators live in `backend/services/indicators.service.js`.

---

## Implemented Indicators

### RSI — Relative Strength Index
```
calculateRSI(prices[], period=14) → number (0–100)
```
- Returns `null` if fewer than `period+1` prices
- Uses Wilder's smoothing (not simple average) for the running averages
- Returns `100` if average loss is 0 (all gains)

**Trading use:** RSI < 30 = oversold (potential buy). RSI > 70 = overbought (potential sell).

---

### SMA — Simple Moving Average
```
calculateSMA(prices[], period) → number | null
```
- Returns `null` if fewer than `period` prices

**Trading use:** SMA20/SMA50 crossover = Golden Cross (buy signal when SMA20 > SMA50).

---

### EMA — Exponential Moving Average
```
calculateEMA(prices[], period) → number | null
```
- Starts with SMA for the first `period` bars, then applies EMA multiplier
- Multiplier = 2 / (period + 1)
- Returns `null` if fewer than `period` prices

**Trading use:** Faster than SMA; EMA12/EMA26 form the basis of MACD.

---

### VWAP — Volume Weighted Average Price
```
calculateVWAP(data[{price, volume}]) → number | null
```
- Resets daily (data should be intraday only)
- Returns `null` if total volume is 0

**Trading use:** Price > VWAP = bullish intraday bias. Used in VWAP Breakout strategy and scanner templates.

---

### MACD — Moving Average Convergence Divergence
```
calculateMACD(prices[], fastPeriod=12, slowPeriod=26, signalPeriod=9)
  → { macd, signal, histogram } | null
```
- Builds a series of `(EMA_fast - EMA_slow)` values, then applies EMA(signal) to that series
- Returns `null` if fewer than `slowPeriod + signalPeriod` prices

**Trading use:**
- MACD line crosses above signal line = bullish
- MACD line crosses below signal line = bearish
- Histogram turning positive/negative = early momentum signal

---

### Stochastic RSI
```
calculateStochasticRSI(prices[], rsiPeriod=14, stochPeriod=14)
  → { value, rsi, overbought, oversold } | null
```
- Applies stochastic formula to the RSI series (not to price directly)
- `value`: 0–100 (Stochastic of RSI values)
- `overbought`: true if value > 80
- `oversold`: true if value < 20

**Trading use:** More sensitive than RSI. StochRSI < 20 + turning up = strong buy signal.

---

### Bollinger Bands
```
calculateBollingerBands(prices[], period=20, stdDev=2)
  → { upper, middle, lower } | null
```
- Middle = SMA(period)
- Upper = Middle + stdDev × standard deviation
- Lower = Middle − stdDev × standard deviation

**Trading use:** Price touching lower band + RSI oversold = reversal. Price outside upper band = potential exit.

---

### ATR — Average True Range
```
calculateATR(ohlc[{high, low, close}], period=14) → number | null
```
- True Range = max(high−low, |high−prevClose|, |low−prevClose|)
- ATR = simple average of true ranges over period
- Returns `null` if fewer than `period` bars

**Trading use:** Use ATR as a stop-loss multiplier for volatility-adjusted stops (e.g., stop at entry − 2×ATR).

---

### OBV — On-Balance Volume
```
calculateOBV(data[{price, volume}]) → number
```
- Up day: OBV += volume
- Down day: OBV -= volume
- Flat day: OBV unchanged

**Trading use:** OBV rising while price consolidates = accumulation (bullish). OBV falling while price holds = distribution (bearish).

---

### Buyer/Seller Ratio (Order Book Depth)
```
calculateBuyerSellerRatio(depth{buy[], sell[]}) → number | null
```
- `buyVolume / sellVolume` from the top 5 bid/ask levels
- Returns `999` if sellVolume = 0 (pure buyer)
- Returns `null` if depth data missing

```
detectBuyerSellerState(depth, threshold=3) → 'ONLY_BUYER' | 'ONLY_SELLER' | 'NEUTRAL'
```
- `ONLY_BUYER` if ratio > 3
- `ONLY_SELLER` if ratio < 0.33
- Used by RadarService to identify high-imbalance stocks

**Trading use:** Buyer ratio > 2 with price rising = strong intraday momentum. Used in Radar and Scanner.

---

### Support/Resistance
```
detectSupportResistance(prices[], lookback=20) → { resistance, support, range } | null
```
- Simple: resistance = max of last `lookback` prices, support = min
- Returns `null` if fewer than `lookback` prices

**Trading use:** Current price near support + RSI oversold = entry zone. Price near resistance = exit zone.

---

### Volume Change %
```
calculateVolumeChange(currentVolume, averageVolume) → number
```
- Returns `((current - avg) / avg) * 100`
- Returns `0` if average is 0

**Trading use:** Volume change > 100% = volume spike (unusual activity signal).

---

## `calculateAllIndicators(stockData)` — Convenience Method

Calculates all indicators for a stock in one call:

```javascript
{
  rsi, sma20, sma50, ema12, ema26,
  vwap, macd, bollingerBands, stochasticRSI,
  buyerSellerRatio, buyerSellerState,
  supportResistance, volumeChange
}
```

Used by Strategy Service and Scanner Service.

---

## Indicators NOT Yet Implemented (Backlog)

| Indicator | Use Case |
|-----------|----------|
| Ichimoku Cloud | Multi-component trend system |
| Williams %R | Momentum oscillator, similar to StochRSI |
| CCI (Commodity Channel Index) | Overbought/oversold with trend context |
| Parabolic SAR | Trailing stop placement |
| Pivot Points (R1/S1) | Intraday support/resistance levels |
| Fibonacci Retracement | Key levels after a swing move |
