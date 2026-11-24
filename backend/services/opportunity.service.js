const logger = require('../utils/logger');
const { isDemoMode } = require('../config/kite.config');
const indicatorsService = require('./indicators.service');
const vixService = require('./vix.service');
const freeMarketData = require('./free-market-data.service');
const mockService = require('./mock.service');

// Max points per factor (must sum to 100)
const WEIGHTS = {
  trend:       25,
  momentum:    20,
  volume:      20,
  relStrength: 20,
  vixRegime:   15,
};

class OpportunityService {
  constructor() {
    this.scannerService = null;
    this._cache = null;
    this._cacheTime = 0;
    this._cacheTTL = 60 * 1000; // 1 minute
  }

  setScannerService(s) { this.scannerService = s; }

  async getRankedOpportunities() {
    if (this._cache && Date.now() - this._cacheTime < this._cacheTTL) {
      return this._cache;
    }

    const result = isDemoMode()
      ? await this._scoreDemoOpportunities()
      : await this._scoreLiveOpportunities();

    this._cache = result;
    this._cacheTime = Date.now();
    return result;
  }

  // ── Demo mode — scores computed from scenario price histories ─────────────

  async _scoreDemoOpportunities() {
    const instruments = mockService.getAllInstruments();
    const vix = 16.4;
    const niftyChangePct = 0.6; // mild bullish day for demo

    const scored = [];
    for (const inst of instruments) {
      const history = mockService.getPriceHistory(inst.tradingsymbol);
      if (history.length < 15) continue;
      try {
        const opp = this._scoreSymbol(inst.tradingsymbol, history, vix, niftyChangePct);
        if (opp) {
          opp.name = inst.name;
          scored.push(opp);
        }
      } catch (e) {
        logger.warn(`Demo opportunity scoring error for ${inst.tradingsymbol}:`, e.message);
      }
    }

    scored.sort((a, b) => b.totalScore - a.totalScore);

    return {
      opportunities: scored.slice(0, 10),
      computedAt: new Date().toISOString(),
      dataSource: 'demo',
      vix,
    };
  }

  // ── Live mode — scores computed from scanner price histories ──────────────

  async _scoreLiveOpportunities() {
    if (!this.scannerService) {
      return { opportunities: [], computedAt: new Date().toISOString(), dataSource: 'live' };
    }

    const vix = vixService.getCurrentVIX() ?? 15;

    let niftyChangePct = null;
    try {
      const market = await freeMarketData.getMarketData();
      niftyChangePct = market.nifty?.changePct ?? null;
    } catch (_) {}

    const histories = this.scannerService.priceHistory;
    if (!histories || histories.size === 0) {
      return { opportunities: [], computedAt: new Date().toISOString(), dataSource: 'live' };
    }

    const scored = [];
    for (const [symbol, history] of histories) {
      if (history.length < 15) continue;
      try {
        const opp = this._scoreSymbol(symbol, history, vix, niftyChangePct);
        if (opp) scored.push(opp);
      } catch (e) {
        logger.warn(`Opportunity scoring error for ${symbol}:`, e.message);
      }
    }

    scored.sort((a, b) => b.totalScore - a.totalScore);

    return {
      opportunities: scored.slice(0, 10),
      computedAt: new Date().toISOString(),
      dataSource: 'live',
      vix,
    };
  }

  // ── Core scoring (same logic for demo and live) ───────────────────────────

  _scoreSymbol(symbol, history, vix, niftyChangePct) {
    const prices = history.map(h => h.price);
    const volumes = history.map(h => h.volume);
    const latestPrice = prices[prices.length - 1];

    // Trend
    const sma20 = indicatorsService.calculateSMA(prices, 20);
    const sma50 = indicatorsService.calculateSMA(prices, 50);
    const { trendScore, trendReason, trendData } = this._scoreTrend(latestPrice, sma20, sma50);

    // Momentum
    const rsi = indicatorsService.calculateRSI(prices, 14);
    const { momentumScore, momentumReason } = this._scoreMomentum(rsi);

    // Volume
    const slice = volumes.length >= 20 ? volumes.slice(-20) : volumes;
    const avgVolume = slice.reduce((a, b) => a + b, 0) / slice.length;
    const currentVolume = volumes[volumes.length - 1];
    const volumeVsAvg = avgVolume > 0 ? currentVolume / avgVolume : 1;
    const { volumeScore, volumeReason } = this._scoreVolume(volumeVsAvg);

    // Relative strength (stock total change vs NIFTY)
    const startPrice = prices[0];
    const stockChangePct = startPrice > 0 ? ((latestPrice - startPrice) / startPrice) * 100 : null;
    const { relStrengthScore, relStrengthReason } = this._scoreRelStrength(stockChangePct, niftyChangePct);

    // VIX regime
    const { vixScore, vixReason } = this._scoreVixRegime(vix);

    const totalScore = Math.round(trendScore + momentumScore + volumeScore + relStrengthScore + vixScore);

    return {
      symbol,
      name: symbol, // overridden by caller in demo mode
      totalScore,
      breakdown: {
        trend: {
          score: Math.round(trendScore),
          max: WEIGHTS.trend,
          reason: trendReason,
          data: trendData,
        },
        momentum: {
          score: Math.round(momentumScore),
          max: WEIGHTS.momentum,
          reason: momentumReason,
          data: { rsi: rsi !== null ? parseFloat(rsi.toFixed(1)) : null },
        },
        volume: {
          score: Math.round(volumeScore),
          max: WEIGHTS.volume,
          reason: volumeReason,
          data: { volumeVsAvg: parseFloat(volumeVsAvg.toFixed(2)), currentVolume },
        },
        relStrength: {
          score: Math.round(relStrengthScore),
          max: WEIGHTS.relStrength,
          reason: relStrengthReason,
          data: {
            stockChangePct: stockChangePct !== null ? parseFloat(stockChangePct.toFixed(2)) : null,
            niftyChangePct: niftyChangePct !== null ? parseFloat(niftyChangePct.toFixed(2)) : null,
          },
        },
        vixRegime: {
          score: Math.round(vixScore),
          max: WEIGHTS.vixRegime,
          reason: vixReason,
          data: { vix },
        },
      },
      price: parseFloat(latestPrice.toFixed(2)),
      dataPoints: history.length,
    };
  }

  // ── Factor scorers ────────────────────────────────────────────────────────

  _scoreTrend(price, sma20, sma50) {
    if (sma20 === null) {
      return {
        trendScore: 12.5,
        trendReason: 'Insufficient history for SMA — neutral score',
        trendData: { sma20: null, sma50: null, pctFromSma20: null },
      };
    }

    const pct = ((price - sma20) / sma20) * 100;
    let priceScore, priceNote;
    if (pct > 2)        { priceScore = 13; priceNote = `Price ${pct.toFixed(1)}% above SMA20`; }
    else if (pct > 0)   { priceScore = 10; priceNote = `Price ${pct.toFixed(1)}% above SMA20`; }
    else if (pct > -1)  { priceScore = 6;  priceNote = `Price near SMA20 (${pct.toFixed(1)}%)`; }
    else if (pct > -3)  { priceScore = 3;  priceNote = `Price ${Math.abs(pct).toFixed(1)}% below SMA20`; }
    else                { priceScore = 0;  priceNote = `Price ${Math.abs(pct).toFixed(1)}% below SMA20`; }

    let maScore = 6, maNote = 'SMA50 insufficient — neutral';
    if (sma50 !== null) {
      if (sma20 > sma50) { maScore = 12; maNote = `SMA20 (${sma20.toFixed(0)}) > SMA50 (${sma50.toFixed(0)}) — uptrend`; }
      else               { maScore = 0;  maNote = `SMA20 (${sma20.toFixed(0)}) < SMA50 (${sma50.toFixed(0)}) — downtrend`; }
    }

    return {
      trendScore: priceScore + maScore,
      trendReason: `${priceNote}; ${maNote}`,
      trendData: {
        sma20: parseFloat(sma20.toFixed(2)),
        sma50: sma50 !== null ? parseFloat(sma50.toFixed(2)) : null,
        pctFromSma20: parseFloat(pct.toFixed(2)),
      },
    };
  }

  _scoreMomentum(rsi) {
    if (rsi === null) {
      return { momentumScore: 10, momentumReason: 'Insufficient history for RSI — neutral score' };
    }

    let score, reason;
    if      (rsi >= 50 && rsi < 65) { score = 20; reason = `RSI ${rsi.toFixed(1)} — ideal momentum zone (50–65)`; }
    else if (rsi >= 25 && rsi < 35) { score = 17; reason = `RSI ${rsi.toFixed(1)} — oversold reversal zone (25–35)`; }
    else if (rsi >= 40 && rsi < 50) { score = 15; reason = `RSI ${rsi.toFixed(1)} — building momentum (40–50)`; }
    else if (rsi >= 65 && rsi < 72) { score = 14; reason = `RSI ${rsi.toFixed(1)} — strong momentum (65–72)`; }
    else if (rsi >= 35 && rsi < 40) { score = 12; reason = `RSI ${rsi.toFixed(1)} — approaching oversold (35–40)`; }
    else if (rsi >= 15 && rsi < 25) { score = 10; reason = `RSI ${rsi.toFixed(1)} — deeply oversold (15–25)`; }
    else if (rsi >= 72 && rsi < 80) { score = 7;  reason = `RSI ${rsi.toFixed(1)} — overbought (72–80), momentum extended`; }
    else if (rsi >= 80)             { score = 3;  reason = `RSI ${rsi.toFixed(1)} — very overbought (>80), high reversal risk`; }
    else                            { score = 5;  reason = `RSI ${rsi.toFixed(1)} — extreme oversold (<15), very high risk`; }

    return { momentumScore: score, momentumReason: reason };
  }

  _scoreVolume(ratio) {
    let score, reason;
    if      (ratio >= 3.0) { score = 20; reason = `Volume ${ratio.toFixed(1)}× avg — exceptional breakout volume`; }
    else if (ratio >= 2.0) { score = 17; reason = `Volume ${ratio.toFixed(1)}× avg — strong breakout volume`; }
    else if (ratio >= 1.5) { score = 13; reason = `Volume ${ratio.toFixed(1)}× avg — above average`; }
    else if (ratio >= 1.2) { score = 8;  reason = `Volume ${ratio.toFixed(1)}× avg — slightly elevated`; }
    else if (ratio >= 1.0) { score = 5;  reason = `Volume ${ratio.toFixed(1)}× avg — normal`; }
    else                   { score = 2;  reason = `Volume ${ratio.toFixed(1)}× avg — below average (weak conviction)`; }
    return { volumeScore: score, volumeReason: reason };
  }

  _scoreRelStrength(stockPct, niftyPct) {
    if (stockPct === null || niftyPct === null) {
      return { relStrengthScore: 10, relStrengthReason: 'NIFTY data unavailable — neutral score' };
    }

    const out = stockPct - niftyPct;
    let score, reason;
    if      (out >= 3)  { score = 20; reason = `+${out.toFixed(1)}% vs NIFTY — strong outperformance`; }
    else if (out >= 2)  { score = 16; reason = `+${out.toFixed(1)}% vs NIFTY — good outperformance`; }
    else if (out >= 1)  { score = 12; reason = `+${out.toFixed(1)}% vs NIFTY — mild outperformance`; }
    else if (out >= 0)  { score = 8;  reason = `+${out.toFixed(1)}% vs NIFTY — inline with market`; }
    else if (out >= -1) { score = 4;  reason = `${out.toFixed(1)}% vs NIFTY — slight underperformance`; }
    else                { score = 0;  reason = `${out.toFixed(1)}% vs NIFTY — underperforming market`; }
    return { relStrengthScore: score, relStrengthReason: reason };
  }

  _scoreVixRegime(vix) {
    if (vix === null) {
      return { vixScore: 7, vixReason: 'VIX unavailable — neutral score' };
    }
    let score, reason;
    if      (vix < 12) { score = 13; reason = `VIX ${vix.toFixed(1)} — very low, favorable for entries`; }
    else if (vix < 15) { score = 15; reason = `VIX ${vix.toFixed(1)} — optimal zone, strong risk/reward`; }
    else if (vix < 20) { score = 12; reason = `VIX ${vix.toFixed(1)} — normal volatility, standard risk management`; }
    else if (vix < 25) { score = 8;  reason = `VIX ${vix.toFixed(1)} — elevated, widen stops and reduce size`; }
    else if (vix < 35) { score = 4;  reason = `VIX ${vix.toFixed(1)} — high volatility, only high-conviction setups`; }
    else               { score = 0;  reason = `VIX ${vix.toFixed(1)} — extreme fear, avoid new positions`; }
    return { vixScore: score, vixReason: reason };
  }
}

module.exports = new OpportunityService();
