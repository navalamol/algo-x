const logger = require('../utils/logger');
const { isDemoMode } = require('../config/kite.config');
const indicatorsService = require('./indicators.service');
const mockService = require('./mock.service');
const { SECTOR_MAP } = require('../config/sector-mapping');

class EvidenceService {
  constructor() {
    this.scannerService = null;
    this._cache = new Map();
    this._cacheTTL = 2 * 60 * 1000; // 2 minutes
  }

  setScannerService(s) { this.scannerService = s; }

  async getEvidence(symbol) {
    const cached = this._cache.get(symbol);
    if (cached && Date.now() - cached.ts < this._cacheTTL) return cached.data;

    const result = isDemoMode()
      ? this._buildDemoEvidence(symbol)
      : this._buildLiveEvidence(symbol);

    this._cache.set(symbol, { data: result, ts: Date.now() });
    return result;
  }

  _buildDemoEvidence(symbol) {
    const instruments = mockService.getAllInstruments();
    const inst = instruments.find(i => i.tradingsymbol === symbol);
    const history = mockService.getPriceHistory(symbol);
    const ohlcHistory = mockService.getOHLCHistory(symbol);

    if (!history.length) return this._notFoundEvidence(symbol);
    return this._computeEvidence(symbol, inst?.name || symbol, history, ohlcHistory, 'demo');
  }

  _buildLiveEvidence(symbol) {
    if (!this.scannerService) return this._notFoundEvidence(symbol);
    const history = this.scannerService.priceHistory.get(symbol);
    if (!history?.length) return this._notFoundEvidence(symbol);

    const ohlcHistory = history.map((bar, i) => {
      const open = i > 0 ? history[i - 1].price : bar.price;
      const close = bar.price;
      return { open, close, high: Math.max(open, close) * 1.003, low: Math.min(open, close) * 0.997 };
    });

    return this._computeEvidence(symbol, symbol, history, ohlcHistory, 'live');
  }

  _computeEvidence(symbol, name, history, ohlcHistory, dataSource) {
    const prices = history.map(h => h.price);
    const volumes = history.map(h => h.volume);
    const latestPrice = prices[prices.length - 1];

    const rsi        = indicatorsService.calculateRSI(prices, 14);
    const sma20      = indicatorsService.calculateSMA(prices, 20);
    const sma50      = indicatorsService.calculateSMA(prices, 50);
    const macd       = indicatorsService.calculateMACD(prices);
    const stochRsi   = indicatorsService.calculateStochasticRSI(prices);
    const bb         = indicatorsService.calculateBollingerBands(prices);
    const atr        = indicatorsService.calculateATR(ohlcHistory);
    const vwap       = indicatorsService.calculateVWAP(history);
    const supportRes = indicatorsService.detectSupportResistance(prices);

    const slice     = volumes.slice(-20);
    const avgVolume = slice.reduce((a, b) => a + b, 0) / slice.length;
    const volumeVsAvg = avgVolume > 0 ? volumes[volumes.length - 1] / avgVolume : 1;

    let bbPctB = null;
    if (bb) {
      const range = bb.upper - bb.lower;
      bbPctB = range > 0 ? (latestPrice - bb.lower) / range : 0.5;
    }

    const sector  = SECTOR_MAP[symbol] || null;
    const signals = this._buildSignals({ rsi, sma20, sma50, macd, stochRsi, bbPctB, latestPrice, volumeVsAvg, vwap });
    const summary = this._buildSummary(symbol, signals, latestPrice);

    return {
      symbol,
      name,
      price: parseFloat(latestPrice.toFixed(2)),
      generatedAt: new Date().toISOString(),
      dataSource,
      summary,
      signals,
      technicals: {
        rsi:   rsi   !== null ? parseFloat(rsi.toFixed(1)) : null,
        macd:  macd  ? { macd: macd.macd, signal: macd.signal, histogram: macd.histogram, bullish: macd.histogram > 0 } : null,
        stochRsi: stochRsi ? { value: parseFloat(stochRsi.value.toFixed(1)), overbought: stochRsi.overbought, oversold: stochRsi.oversold } : null,
        bollingerBands: bb ? {
          upper:  parseFloat(bb.upper.toFixed(2)),
          middle: parseFloat(bb.middle.toFixed(2)),
          lower:  parseFloat(bb.lower.toFixed(2)),
          pctB:   bbPctB !== null ? parseFloat(bbPctB.toFixed(2)) : null,
        } : null,
        atr:  atr  !== null ? parseFloat(atr.toFixed(2))  : null,
        sma20: sma20 !== null ? parseFloat(sma20.toFixed(2)) : null,
        sma50: sma50 !== null ? parseFloat(sma50.toFixed(2)) : null,
        vwap:  vwap  !== null ? parseFloat(vwap.toFixed(2))  : null,
        volumeVsAvg: parseFloat(volumeVsAvg.toFixed(2)),
      },
      keyLevels: {
        support:    supportRes?.support    ? parseFloat(supportRes.support.toFixed(2))    : null,
        resistance: supportRes?.resistance ? parseFloat(supportRes.resistance.toFixed(2)) : null,
        vwap:       vwap !== null          ? parseFloat(vwap.toFixed(2))                  : null,
      },
      sector,
      dataPoints: history.length,
    };
  }

  _buildSignals({ rsi, sma20, sma50, macd, stochRsi, bbPctB, latestPrice, volumeVsAvg, vwap }) {
    const positives = [];
    const risks     = [];
    const neutrals  = [];

    // RSI
    if (rsi !== null) {
      if (rsi < 30) {
        positives.push({ type: 'positive', label: 'RSI Oversold', detail: `RSI at ${rsi.toFixed(1)} — historically a mean-reversion zone. Wait for reversal confirmation.` });
      } else if (rsi >= 50 && rsi < 65) {
        positives.push({ type: 'positive', label: 'RSI Momentum Zone', detail: `RSI at ${rsi.toFixed(1)} — ideal momentum zone. Not overbought, trending higher.` });
      } else if (rsi >= 65 && rsi < 72) {
        neutrals.push({ type: 'neutral', label: 'RSI Strong', detail: `RSI at ${rsi.toFixed(1)} — strong momentum, monitor for overextension.` });
      } else if (rsi >= 72) {
        risks.push({ type: 'risk', label: 'RSI Overbought', detail: `RSI at ${rsi.toFixed(1)} — extended. Momentum may be fading soon.` });
      }
    }

    // MACD
    if (macd) {
      if (macd.histogram > 0) {
        positives.push({ type: 'positive', label: 'MACD Bullish', detail: `Histogram +${macd.histogram.toFixed(4)} — buying momentum confirmed by MACD.` });
      } else {
        risks.push({ type: 'risk', label: 'MACD Bearish', detail: `Histogram ${macd.histogram.toFixed(4)} — selling pressure active on MACD.` });
      }
    }

    // SMA trend
    if (sma20 !== null) {
      if (latestPrice > sma20) {
        const pct = ((latestPrice - sma20) / sma20 * 100).toFixed(1);
        if (sma50 !== null && sma20 > sma50) {
          positives.push({ type: 'positive', label: 'SMA Uptrend', detail: `Price ${pct}% above SMA20; SMA20 above SMA50 — confirmed uptrend structure.` });
        } else {
          neutrals.push({ type: 'neutral', label: 'Above SMA20', detail: `Price ${pct}% above SMA20. SMA50 alignment pending.` });
        }
      } else {
        const pct = ((sma20 - latestPrice) / sma20 * 100).toFixed(1);
        if (sma50 !== null && sma20 < sma50) {
          risks.push({ type: 'risk', label: 'Death Cross Zone', detail: `Price ${pct}% below SMA20 and SMA20 < SMA50 — downtrend confirmed.` });
        } else {
          risks.push({ type: 'risk', label: 'Below SMA20', detail: `Price ${pct}% below SMA20 — short-term trend is down.` });
        }
      }
    }

    // Bollinger Band position
    if (bbPctB !== null) {
      if (bbPctB > 0.9) {
        risks.push({ type: 'risk', label: 'Near Upper Band', detail: `Price at ${(bbPctB * 100).toFixed(0)}% of Bollinger range — approaching statistical resistance.` });
      } else if (bbPctB < 0.1) {
        positives.push({ type: 'positive', label: 'Near Lower Band', detail: `Price at ${(bbPctB * 100).toFixed(0)}% of Bollinger range — potential support/bounce zone.` });
      } else if (bbPctB >= 0.4 && bbPctB <= 0.6) {
        neutrals.push({ type: 'neutral', label: 'Mid Bollinger', detail: `Price near middle of Bollinger Bands — no band extreme, balanced range.` });
      }
    }

    // Volume
    if (volumeVsAvg >= 2.0) {
      positives.push({ type: 'positive', label: 'Volume Surge', detail: `Volume ${volumeVsAvg.toFixed(1)}× average — strong participation, likely institutional activity.` });
    } else if (volumeVsAvg >= 1.5) {
      positives.push({ type: 'positive', label: 'Elevated Volume', detail: `Volume ${volumeVsAvg.toFixed(1)}× average — above-average conviction behind price move.` });
    } else if (volumeVsAvg < 0.7) {
      risks.push({ type: 'risk', label: 'Low Volume', detail: `Volume ${volumeVsAvg.toFixed(1)}× average — move may lack conviction, false breakout risk.` });
    }

    // StochRSI
    if (stochRsi) {
      if (stochRsi.oversold) {
        positives.push({ type: 'positive', label: 'StochRSI Oversold', detail: `StochRSI at ${stochRsi.value.toFixed(1)} — short-term momentum at an extreme low, reversal likely.` });
      } else if (stochRsi.overbought) {
        risks.push({ type: 'risk', label: 'StochRSI Overbought', detail: `StochRSI at ${stochRsi.value.toFixed(1)} — short-term momentum overextended, pullback risk.` });
      }
    }

    // VWAP
    if (vwap !== null) {
      if (latestPrice > vwap) {
        positives.push({ type: 'positive', label: 'Above VWAP', detail: `Price ₹${latestPrice.toFixed(2)} above VWAP ₹${vwap.toFixed(2)} — buyers in control for the session.` });
      } else {
        risks.push({ type: 'risk', label: 'Below VWAP', detail: `Price ₹${latestPrice.toFixed(2)} below VWAP ₹${vwap.toFixed(2)} — sellers in control for the session.` });
      }
    }

    // Return up to 6 signals, weighted toward positives and risks over neutrals
    return [...positives, ...risks, ...neutrals].slice(0, 6);
  }

  _buildSummary(symbol, signals, price) {
    const pCount = signals.filter(s => s.type === 'positive').length;
    const rCount = signals.filter(s => s.type === 'risk').length;

    if (pCount >= 4 && rCount === 0) {
      return `${symbol} shows strong technical alignment — ${pCount} bullish signals active with no major risks flagged. High-conviction setup.`;
    }
    if (pCount >= 3 && rCount <= 1) {
      return `${symbol} has a favorable technical setup with ${pCount} positive signals${rCount === 1 ? ' and one risk to monitor' : ''}.`;
    }
    if (rCount >= 3 && pCount <= 1) {
      return `${symbol} carries ${rCount} active risk signals — approach with caution or wait for a cleaner setup before entering.`;
    }
    if (pCount >= rCount) {
      return `${symbol} leans bullish with ${pCount} positive and ${rCount} risk signals — defined risk management recommended.`;
    }
    return `${symbol} shows mixed technicals (${pCount} positive, ${rCount} risk) — wait for signal alignment or use tight stops.`;
  }

  _notFoundEvidence(symbol) {
    return {
      symbol,
      name: symbol,
      price: null,
      generatedAt: new Date().toISOString(),
      dataSource: 'none',
      summary: `Insufficient price history for ${symbol}. Wait for data to accumulate (a few minutes in live mode).`,
      signals: [],
      technicals: {},
      keyLevels: {},
      sector: SECTOR_MAP[symbol] || null,
      dataPoints: 0,
    };
  }
}

module.exports = new EvidenceService();
