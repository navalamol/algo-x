const logger = require('../utils/logger');
const { isDemoMode } = require('../config/kite.config');

class MorningBriefService {
  constructor() {
    this.vixService = null;
    this.heatmapService = null;
    this.scannerService = null;
  }

  setVixService(s) { this.vixService = s; }
  setHeatmapService(s) { this.heatmapService = s; }
  setScannerService(s) { this.scannerService = s; }

  /**
   * Assemble the full morning brief. Called by REST endpoint and by the 9 AM cron.
   */
  async assembleBrief() {
    if (isDemoMode()) {
      const mock = require('./mock.service');
      return mock.getMorningBrief();
    }

    const regime = this._buildRegime();
    const { sectorLeaders, sectorLaggers, breadth, marketSentiment } = this._buildSectorContext();
    const { topOpportunities, scanSummary, noSetup } = await this._buildOpportunities();

    return {
      generatedAt: new Date().toISOString(),
      date: new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
      dataSource: 'live',
      regime,
      marketSentiment,
      breadth,
      sectorLeaders,
      sectorLaggers,
      topOpportunities,
      scanSummary,
      noSetup,
    };
  }

  _buildRegime() {
    if (!this.vixService) return { vix: null, condition: 'UNKNOWN', recommendation: '' };
    const vix = this.vixService.getCurrentVIX();
    const { condition, description, recommendation } = this.vixService.getMarketCondition();

    // Derive trend from VIX history
    let trend = 'STABLE';
    try {
      const stats = this.vixService.getVIXStats ? this.vixService.getVIXStats() : null;
      if (stats && stats.readingsCount >= 6) {
        const diff = stats.current - stats.average;
        if (diff > 1.5) trend = 'RISING';
        else if (diff < -1.5) trend = 'FALLING';
      }
    } catch (_) {}

    return { vix, condition, description, recommendation, trend };
  }

  _buildSectorContext() {
    if (!this.heatmapService) {
      return { sectorLeaders: [], sectorLaggers: [], breadth: null, marketSentiment: 'NEUTRAL' };
    }

    const { sectors } = this.heatmapService.getSectorData();
    if (!sectors || Object.keys(sectors).length === 0) {
      return { sectorLeaders: [], sectorLaggers: [], breadth: null, marketSentiment: 'NEUTRAL' };
    }

    const entries = Object.entries(sectors)
      .map(([sector, data]) => ({ sector, changePct: data.change ?? data.sector ?? 0 }))
      .sort((a, b) => b.changePct - a.changePct);

    const advancing = entries.filter(e => e.changePct > 0).length;
    const declining = entries.filter(e => e.changePct < 0).length;
    const total = entries.length;

    const sectorLeaders = entries.slice(0, 3).filter(e => e.changePct > 0);
    const sectorLaggers = entries.slice(-2).reverse().filter(e => e.changePct < 0);

    let marketSentiment = 'MIXED';
    const pctAdvancing = advancing / total;
    if (pctAdvancing >= 0.65) marketSentiment = 'BULLISH';
    else if (pctAdvancing <= 0.35) marketSentiment = 'BEARISH';
    else marketSentiment = 'MIXED';

    return {
      sectorLeaders,
      sectorLaggers,
      breadth: { advancing, declining, total },
      marketSentiment
    };
  }

  async _buildOpportunities() {
    if (!this.scannerService) return { topOpportunities: [], scanSummary: [], noSetup: true };

    const templates = this.scannerService.getTemplates ? this.scannerService.getTemplates() : [];
    const symbolMap = new Map(); // symbol -> { symbol, templates: [], rsi, volumeVsAvg, radarScore }
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
            symbolMap.set(r.symbol, {
              symbol: r.symbol,
              templates: [],
              rsi: r.rsi,
              volumeVsAvg: r.volumeVsAvg,
              radarScore: r.radarScore ?? null,
              vwap: r.vwap ?? null,
            });
          }
          symbolMap.get(r.symbol).templates.push(template.name);
        }
      } catch (e) {
        logger.error(`Morning brief scan error (${template.id}):`, e.message);
      }
    }

    // Sort by number of matching templates descending (more matches = more conviction)
    const topOpportunities = Array.from(symbolMap.values())
      .sort((a, b) => b.templates.length - a.templates.length)
      .slice(0, 5);

    return { topOpportunities, scanSummary, noSetup: topOpportunities.length === 0 };
  }
}

module.exports = new MorningBriefService();
