const logger = require('../utils/logger');
const { isDemoMode } = require('../config/kite.config');
const freeMarketData = require('./free-market-data.service');

// VIX condition bands — mirrors vix.service.js logic
function vixCondition(vix) {
  if (vix < 12)  return { condition: 'VERY_LOW',  recommendation: 'Extremely low volatility. Be cautious of sudden reversals.' };
  if (vix < 15)  return { condition: 'LOW',       recommendation: 'Calm market. Normal trading conditions.' };
  if (vix < 20)  return { condition: 'NORMAL',    recommendation: 'Standard risk management. Most setups have a reasonable edge.' };
  if (vix < 25)  return { condition: 'ELEVATED',  recommendation: 'Elevated uncertainty. Widen stops, reduce position sizes.' };
  if (vix < 35)  return { condition: 'HIGH',      recommendation: 'High volatility. Reduce exposure significantly or sit out.' };
  return          { condition: 'EXTREME',          recommendation: 'Market panic. Avoid new positions or trade very small.' };
}

class MorningBriefService {
  constructor() {
    this.vixService = null;
    this.heatmapService = null;
    this.scannerService = null;
  }

  setVixService(s)     { this.vixService = s; }
  setHeatmapService(s) { this.heatmapService = s; }
  setScannerService(s) { this.scannerService = s; }

  /**
   * Assemble the full morning brief.
   *
   * Data strategy:
   *   - Market overview (NIFTY, BANK NIFTY, VIX, sectors): Yahoo Finance — always real, no Kite needed
   *   - Opportunities: Kite scanner when available, demo mock otherwise
   *   - Full fallback to mock if Yahoo Finance is unreachable (network down)
   */
  async assembleBrief() {
    try {
      // ── 1. Real market data from Yahoo Finance (free, no auth) ──────────
      const market = await freeMarketData.getMarketData();

      // ── 2. Market regime from Yahoo VIX ─────────────────────────────────
      const vixPrice = market.vix?.price ?? this.vixService?.getCurrentVIX() ?? 15;
      const { condition, recommendation } = vixCondition(vixPrice);

      // VIX trend from Kite VIX service history if available
      let trend = 'STABLE';
      try {
        if (this.vixService?.getVIXStats) {
          const stats = this.vixService.getVIXStats();
          if (stats?.readingsCount >= 6) {
            const diff = stats.current - stats.average;
            if (diff > 1.5)  trend = 'RISING';
            else if (diff < -1.5) trend = 'FALLING';
          }
        }
      } catch (_) {}

      const regime = {
        vix: parseFloat(vixPrice.toFixed(2)),
        condition,
        recommendation,
        trend,
      };

      // ── 3. Sector context from Yahoo Finance sector indices ──────────────
      const sectors = market.sectors;
      const advancing = sectors.filter(s => s.changePct > 0).length;
      const declining  = sectors.filter(s => s.changePct < 0).length;
      const total      = sectors.length;

      const sectorLeaders = sectors.slice(0, 3).filter(s => s.changePct > 0);
      const sectorLaggers = [...sectors].reverse().slice(0, 2).filter(s => s.changePct < 0);

      let marketSentiment = 'MIXED';
      const pctAdv = advancing / (total || 1);
      if (pctAdv >= 0.65)      marketSentiment = 'BULLISH';
      else if (pctAdv <= 0.35) marketSentiment = 'BEARISH';

      const breadth = { advancing, declining, total };

      // ── 4. Opportunities from scanner ───────────────────────────────────
      const { topOpportunities, scanSummary, noSetup } = isDemoMode()
        ? await this._demoOpportunities()
        : await this._buildOpportunities();

      // ── 5. Assemble ───────────────────────────────────────────────────────
      return {
        generatedAt: new Date().toISOString(),
        date: new Date().toLocaleDateString('en-IN', {
          weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        }),
        dataSource: 'live',
        marketDataSource: market.source,
        nifty:     market.nifty,
        bankNifty: market.bankNifty,
        regime,
        marketSentiment,
        breadth,
        sectorLeaders,
        sectorLaggers,
        topOpportunities,
        scanSummary,
        noSetup,
      };

    } catch (err) {
      logger.warn('Morning brief: live data unavailable, using demo mock:', err.message);
      const mock = require('./mock.service');
      return mock.getMorningBrief();
    }
  }

  // Scanner opportunities — used in live Kite mode
  async _buildOpportunities() {
    if (!this.scannerService) return { topOpportunities: [], scanSummary: [], noSetup: true };

    const templates = this.scannerService.getTemplates?.() ?? [];
    const symbolMap = new Map();
    const scanSummary = [];

    for (const template of templates) {
      try {
        const results = await this.scannerService.runScan(template.id);
        scanSummary.push({
          templateId: template.id,
          templateName: template.name,
          count: results.length,
          topSymbols: results.slice(0, 3).map(r => r.symbol),
        });
        for (const r of results) {
          if (!symbolMap.has(r.symbol)) {
            symbolMap.set(r.symbol, { symbol: r.symbol, templates: [], rsi: r.rsi, volumeVsAvg: r.volumeVsAvg, radarScore: r.radarScore ?? null });
          }
          symbolMap.get(r.symbol).templates.push(template.name);
        }
      } catch (e) {
        logger.error(`Morning brief scan error (${template.id}):`, e.message);
      }
    }

    const topOpportunities = Array.from(symbolMap.values())
      .sort((a, b) => b.templates.length - a.templates.length)
      .slice(0, 5);

    return { topOpportunities, scanSummary, noSetup: topOpportunities.length === 0 };
  }

  // Demo scanner opportunities from mock service
  async _demoOpportunities() {
    try {
      const mock = require('./mock.service');
      const brief = mock.getMorningBrief();
      return {
        topOpportunities: brief.topOpportunities,
        scanSummary: brief.scanSummary,
        noSetup: brief.noSetup,
      };
    } catch (_) {
      return { topOpportunities: [], scanSummary: [], noSetup: true };
    }
  }
}

module.exports = new MorningBriefService();
