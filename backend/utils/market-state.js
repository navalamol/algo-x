/**
 * market-state.js — shared intelligence primitive
 *
 * Derives a normalized categorical market state from raw indicator values
 * (the technicals object returned by EvidenceService).
 *
 * Reused by ChangeDetectionService (Mission 4) and PortfolioIntelligence
 * (Mission 6) so indicator-to-category thresholds live in one place.
 */

/**
 * @param {string} symbol
 * @param {object} technicals - from evidence.technicals
 * @param {number} price      - latest price
 * @returns {{ symbol, price, rsiZone, volumeBand, trendBias, macdBias, vwapPosition }}
 */
function computeMarketState(symbol, technicals, price) {
  const t = technicals || {};

  // ── RSI zone ────────────────────────────────────────────────────────────────
  let rsiZone = 'unknown';
  if (t.rsi !== null && t.rsi !== undefined) {
    const r = t.rsi;
    if      (r < 20) rsiZone = 'extreme_oversold';
    else if (r < 30) rsiZone = 'oversold';
    else if (r < 50) rsiZone = 'building';
    else if (r < 65) rsiZone = 'momentum';
    else if (r < 72) rsiZone = 'strong';
    else             rsiZone = 'overbought';
  }

  // ── Volume band ─────────────────────────────────────────────────────────────
  let volumeBand = 'unknown';
  if (t.volumeVsAvg !== null && t.volumeVsAvg !== undefined) {
    const v = t.volumeVsAvg;
    if      (v >= 2.0) volumeBand = 'spike';
    else if (v >= 1.5) volumeBand = 'elevated';
    else if (v >= 0.7) volumeBand = 'normal';
    else               volumeBand = 'weak';
  }

  // ── Trend bias ──────────────────────────────────────────────────────────────
  let trendBias = 'unknown';
  const sma20 = t.sma20 ?? null;
  const sma50 = t.sma50 ?? null;
  if (price !== null && price !== undefined && sma20 !== null) {
    if (price > sma20 && sma50 !== null && sma20 > sma50) {
      trendBias = 'uptrend';
    } else if (price > sma20) {
      trendBias = 'above_sma20';
    } else if (sma50 !== null && sma20 < sma50) {
      trendBias = 'downtrend';
    } else {
      trendBias = 'below_sma20';
    }
  }

  // ── MACD bias ───────────────────────────────────────────────────────────────
  let macdBias = 'unknown';
  if (t.macd !== null && t.macd !== undefined) {
    macdBias = t.macd.bullish ? 'bullish' : 'bearish';
  }

  // ── VWAP position ───────────────────────────────────────────────────────────
  let vwapPosition = 'unknown';
  if (price !== null && price !== undefined && t.vwap !== null && t.vwap !== undefined) {
    vwapPosition = price > t.vwap ? 'above' : 'below';
  }

  return { symbol, price, rsiZone, volumeBand, trendBias, macdBias, vwapPosition };
}

module.exports = { computeMarketState };
