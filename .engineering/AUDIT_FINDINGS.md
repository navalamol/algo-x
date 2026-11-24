# Codebase Audit Findings
*From strategic review session, Nov 2026*

## Critical Bugs Fixed

### 1. VIX Always Stuck at Default 15.0

**File:** `backend/services/vix.service.js`

**Root cause:** `fetchFromNSE()` scraped `https://www.nseindia.com/api/allIndices` which requires a valid browser session cookie. Automated requests return HTTP 403. The service silently fell back to `this.currentVIX` which was initialized to `15.0` and never updated.

**Impact:** The entire VIX risk adjustment system (stop-loss multipliers: 1.0×/1.3×/1.6×/2.0×, quantity multipliers: 1.0×/0.8×/0.6×/0.4× across four VIX bands) was a complete no-op. Users got the same risk parameters regardless of actual market volatility.

**Fix:** Added `fetchFromKite()` as primary source. Calls `kiteService.getQuote(['NSE:INDIA VIX'])` — an authenticated Kite Connect API call that always works when the token is valid. NSE fetch now serves as fallback only. Demo mode generates randomized VIX (13–18 range, ±2 jitter) so adjustment logic exercises during development.

```js
// vix.service.js
async fetchFromKite() {
  if (isDemoMode()) {
    return Math.round((15 + (Math.random() - 0.5) * 4) * 100) / 100;
  }
  const quotes = await kiteService.getQuote(['NSE:INDIA VIX']);
  return quotes['NSE:INDIA VIX']?.last_price || null;
}
```

---

### 2. Sector Mapping Was Empty

**File:** `backend/config/sector-mapping.js`

**Root cause:** The entire `SECTOR_MAP` and `SECTORS` content was commented out. `module.exports = {}` was the only live code.

**Impact:** `HeatmapService` received an empty sector map, so the sector heatmap showed no data. The new `_buildMatchContext()` in `ScannerService` would also return `null` for all sector fields.

**Fix:** Restored full `SECTOR_MAP` for 50+ Nifty 50 stocks across 10 sectors: IT, Banking, FMCG, Auto, Pharma, Energy, Metals, Telecom, Finance, Cement. Reverse `SECTORS` map built dynamically.

---

## Underutilized Indicators

These indicators are correctly implemented in `backend/services/indicators.service.js` but no scan template or strategy references them:

| Indicator | Method | What It Measures |
|-----------|--------|-----------------|
| StochasticRSI | `calculateStochasticRSI(prices)` | RSI momentum oscillator (overbought/oversold with more sensitivity than RSI alone) |
| MACD Histogram | `calculateMACD(prices).histogram` | Momentum acceleration/deceleration (bullish when histogram turns positive) |
| ATR | `calculateATR(highs, lows, closes)` | Volatility measure — ideal for dynamic stop-loss sizing |
| OBV | `calculateOBV(prices, volumes)` | On-Balance Volume — confirms price moves with volume |

**Recommended next additions to `backend/config/scan-templates.js`:**
1. `stochrsi_oversold` — StochRSI < 20 + RSI < 40 + price > VWAP (early reversal signal)
2. `macd_bullish_cross` — MACD histogram turned positive from negative
3. `atr_expansion` — ATR > 1.5× 20-period ATR average (volatility breakout)

---

## Architecture Observations

### Cross-service circular dependency risk
`scanner.service.js` requires `vix.service.js` and `telegram.service.js` at module load time. `radar.service.js` is injected via `setRadarService()` after instantiation to avoid circular dependency. This pattern should be followed for any future cross-service wiring.

### `customCondition` RCE risk
`strategy.service.js` uses `new Function()` to evaluate custom strategy conditions. This is a known Remote Code Execution risk if user input ever reaches that code path. Currently it's internal (profile JSON), but this pattern must not be expanded to any HTTP endpoint.

### Profile config reads in ScannerService
`_notifyTelegram()` reads `profiles/*/config.json` from disk on every notification. This is fine for the current 2-user setup but would need caching for more users.

### VIX adjustment system location
VIX band multipliers are hardcoded in `vix.service.js`. The strategy service and paper trading service apply them. If VIX bands need tuning, change them in `vix.service.js` only.
