const { isDemoMode } = require('../config/kite.config');
const { computeMarketState } = require('../utils/market-state');
const { SECTOR_MAP } = require('../config/sector-mapping');
const profileService = require('./profile.service');
const mockService = require('./mock.service');
const logger = require('../utils/logger');

// ── Helpers ────────────────────────────────────────────────────────────────

function pearsonR(xs, ys) {
  const n = Math.min(xs.length, ys.length);
  if (n < 10) return null;
  const xa = xs.slice(-n), ya = ys.slice(-n);
  const mx = xa.reduce((s, v) => s + v, 0) / n;
  const my = ya.reduce((s, v) => s + v, 0) / n;
  let cov = 0, sdx = 0, sdy = 0;
  for (let i = 0; i < n; i++) {
    const dx = xa[i] - mx, dy = ya[i] - my;
    cov += dx * dy; sdx += dx * dx; sdy += dy * dy;
  }
  const denom = Math.sqrt(sdx * sdy);
  return denom === 0 ? 0 : Math.round((cov / denom) * 100) / 100;
}

function deriveHealth(marketState, pnlPct, technicals) {
  const { rsiZone, trendBias, macdBias } = marketState;
  const signals = [], riskFlags = [];

  if (technicals.rsi !== null && technicals.rsi !== undefined) {
    const r = technicals.rsi;
    if (rsiZone === 'overbought')       riskFlags.push(`RSI ${r.toFixed(1)} — overbought (potential exit)`);
    else if (rsiZone === 'extreme_oversold') riskFlags.push(`RSI ${r.toFixed(1)} — extreme oversold`);
    else if (rsiZone === 'oversold')    riskFlags.push(`RSI ${r.toFixed(1)} — oversold`);
    else if (rsiZone === 'momentum' || rsiZone === 'strong') signals.push(`RSI ${r.toFixed(1)} — ${rsiZone} zone`);
    else signals.push(`RSI ${r.toFixed(1)} — building`);
  }

  if (trendBias === 'uptrend')      signals.push('Uptrend intact (above SMA20 & SMA50)');
  else if (trendBias === 'above_sma20') signals.push('Above SMA20');
  else if (trendBias === 'downtrend')   riskFlags.push('Downtrend — price below SMA20 & SMA50');
  else                                  riskFlags.push('Below SMA20');

  if (macdBias === 'bullish') signals.push('MACD bullish');
  else                        riskFlags.push('MACD bearish');

  if (pnlPct > 5)        signals.push(`In profit +${pnlPct.toFixed(1)}%`);
  else if (pnlPct < -5)  riskFlags.push(`Significant loss ${pnlPct.toFixed(1)}%`);

  const urgent = (
    (rsiZone === 'extreme_oversold' && trendBias === 'downtrend') ||
    (rsiZone === 'overbought'       && trendBias === 'downtrend') ||
    pnlPct < -8
  );
  const watch = !urgent && (
    rsiZone === 'overbought' || rsiZone === 'oversold' || rsiZone === 'extreme_oversold' ||
    trendBias === 'downtrend' || pnlPct < -3
  );
  const review = !urgent && !watch && (
    (trendBias === 'below_sma20' && macdBias === 'bearish') || pnlPct < 0
  );

  let health, healthReason;
  if (urgent) {
    health = 'URGENT';
    healthReason = riskFlags[0] || 'Multiple risk factors — review immediately';
  } else if (watch) {
    health = 'WATCH';
    healthReason = riskFlags[0] || 'Potential risk — monitor closely';
  } else if (review) {
    health = 'REVIEW';
    healthReason = 'Mixed signals — review before adding to position';
  } else {
    health = 'HOLD';
    healthReason = signals[0] ? `${signals[0]} — no action needed` : 'Setup looks intact';
  }

  return { health, healthReason, signals, riskFlags };
}

// ── Service ────────────────────────────────────────────────────────────────

class PortfolioIntelligenceService {
  constructor() {
    this.evidenceService = null;
    this.scannerService  = null;
    this._cache    = null;
    this._cacheTTL = 90 * 1000; // 90 seconds
    this._cacheTs  = 0;
  }

  setEvidenceService(e) { this.evidenceService = e; }
  setScannerService(s)  { this.scannerService  = s; }

  async analyze(profileName = 'amol') {
    if (this._cache && Date.now() - this._cacheTs < this._cacheTTL) return this._cache;

    const result = isDemoMode()
      ? mockService.getPortfolioIntelligence()
      : await this._analyzeLive(profileName);

    this._cache  = result;
    this._cacheTs = Date.now();
    return result;
  }

  async _analyzeLive(profileName) {
    // ── 1. Load open positions ────────────────────────────────────────────
    let allTrades = [];
    try {
      allTrades = await profileService.getTrades(profileName);
    } catch (err) {
      logger.warn('[Portfolio] Could not load trades:', err.message);
    }
    const openTrades = allTrades.filter(t => t.status === 'OPEN' && t.transactionType === 'BUY');

    if (!openTrades.length) {
      return this._emptyResponse(profileName);
    }

    // ── 2. For each holding, compute health ───────────────────────────────
    const holdings = await Promise.all(openTrades.map(t => this._analyzeHolding(t)));

    // ── 3. Sector concentration ───────────────────────────────────────────
    const totalValue = holdings.reduce((s, h) => s + h.currentValue, 0) || 1;
    const sectorMap  = {};
    for (const h of holdings) {
      const sec = h.sector;
      if (!sectorMap[sec]) sectorMap[sec] = { sector: sec, symbols: [], totalValue: 0 };
      sectorMap[sec].symbols.push(h.symbol);
      sectorMap[sec].totalValue += h.currentValue;
    }
    const sectors = Object.values(sectorMap).map(s => {
      const alloc = Math.round((s.totalValue / totalValue) * 1000) / 10;
      return {
        sector:       s.sector,
        holdingCount: s.symbols.length,
        allocation:   alloc,
        allocRisk:    alloc >= 40 ? 'HIGH' : alloc >= 25 ? 'MEDIUM' : 'LOW',
        symbols:      s.symbols,
      };
    }).sort((a, b) => b.allocation - a.allocation);

    // ── 4. Pairwise correlations ──────────────────────────────────────────
    const symbols = holdings.map(h => h.symbol);
    const priceHistories = this._getPriceHistories(symbols);
    const correlations = this._computeCorrelations(symbols, priceHistories);

    // ── 5. Summary ────────────────────────────────────────────────────────
    const counts = { URGENT: 0, WATCH: 0, REVIEW: 0, HOLD: 0 };
    for (const h of holdings) counts[h.health] = (counts[h.health] || 0) + 1;
    const totalPnL    = holdings.reduce((s, h) => s + h.pnlAbs, 0);
    const totalPnLPct = Math.round((totalPnL / (totalValue - totalPnL)) * 10000) / 100;

    const urgentHoldings = holdings.filter(h => h.health === 'URGENT');
    const watchHoldings  = holdings.filter(h => h.health === 'WATCH');
    const topRisk = urgentHoldings[0]?.healthReason || watchHoldings[0]?.healthReason || null;

    return {
      holdings,
      sectors,
      correlations,
      summary: {
        ...counts,
        totalHoldings: holdings.length,
        portfolioValue: Math.round(totalValue),
        totalPnL:    Math.round(totalPnL),
        totalPnLPct,
        topRisk,
        dataSource: 'live',
      },
    };
  }

  async _analyzeHolding(trade) {
    const symbol     = trade.tradingSymbol;
    const qty        = trade.quantity;
    const entryPrice = trade.entryPrice;
    const sector     = SECTOR_MAP[symbol] || 'Other';

    // Get current price + technicals from evidence service
    let currentPrice = entryPrice;
    let technicals   = {};
    try {
      if (this.evidenceService) {
        const ev = await this.evidenceService.getEvidence(symbol);
        currentPrice = ev?.technicals?.latestPrice ?? entryPrice;
        technicals   = ev?.technicals ?? {};
      }
    } catch (err) {
      logger.warn(`[Portfolio] Evidence unavailable for ${symbol}:`, err.message);
    }

    const pnlAbs    = Math.round((currentPrice - entryPrice) * qty * 100) / 100;
    const pnlPct    = entryPrice > 0 ? Math.round(((currentPrice - entryPrice) / entryPrice) * 10000) / 100 : 0;
    const currentValue = currentPrice * qty;

    const marketState = computeMarketState(symbol, technicals, currentPrice);
    const { health, healthReason, signals, riskFlags } = deriveHealth(marketState, pnlPct, technicals);

    return {
      symbol, sector, qty, entryPrice, currentPrice,
      pnlAbs, pnlPct, currentValue,
      health, healthReason, signals, riskFlags, marketState,
    };
  }

  _getPriceHistories(symbols) {
    const histories = {};
    for (const sym of symbols) {
      const h = this.scannerService?.priceHistory?.get(sym);
      histories[sym] = h ? h.map(p => p.price) : [];
    }
    return histories;
  }

  _computeCorrelations(symbols, histories) {
    const corrs = [];
    for (let i = 0; i < symbols.length; i++) {
      for (let j = i + 1; j < symbols.length; j++) {
        const a = symbols[i], b = symbols[j];
        const r = pearsonR(histories[a], histories[b]);
        if (r === null) continue;
        const absR = Math.abs(r);
        const risk = absR >= 0.7 ? 'HIGH' : absR >= 0.4 ? 'MODERATE' : 'LOW';
        if (risk !== 'LOW') {
          corrs.push({
            symbolA: a, symbolB: b,
            r,
            risk,
            note: `${risk === 'HIGH' ? 'Highly' : 'Moderately'} correlated — ${SECTOR_MAP[a] === SECTOR_MAP[b] ? 'same sector (' + (SECTOR_MAP[a] || 'Other') + ')' : 'cross-sector'}`,
          });
        }
      }
    }
    return corrs.sort((a, b) => Math.abs(b.r) - Math.abs(a.r));
  }

  _emptyResponse(profileName) {
    return {
      holdings: [],
      sectors: [],
      correlations: [],
      summary: {
        URGENT: 0, WATCH: 0, REVIEW: 0, HOLD: 0,
        totalHoldings: 0,
        portfolioValue: 0,
        totalPnL: 0,
        totalPnLPct: 0,
        topRisk: null,
        dataSource: 'live',
        note: `No open positions found in profile "${profileName}".`,
      },
    };
  }
}

module.exports = new PortfolioIntelligenceService();
