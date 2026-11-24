const fs = require('fs');
const path = require('path');
const kiteService = require('./kite.service');
const indicatorsService = require('./indicators.service');
const scanTemplates = require('../config/scan-templates');
const { SECTOR_MAP } = require('../config/sector-mapping');
const vixService = require('./vix.service');
const telegramService = require('./telegram.service');
const { isDemoMode } = require('../config/kite.config');
const mockService = require('./mock.service');
const logger = require('../utils/logger');

const PROFILES_DIR = path.join(__dirname, '../../profiles');
const WATCH_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes

class ScannerService {
  constructor(io) {
    this.io = io;
    this.isRunning = false;
    this.results = [];
    this.watchSymbols = [];
    this.priceHistory = new Map(); // symbol -> [{price, volume}]
    this.demoMode = isDemoMode();

    // Watch mode state
    this.watchedTemplates = new Set();
    this.lastMatchMap = new Map();   // templateId -> Set<symbol>
    this.watchInterval = null;
    this.radarService = null;        // injected via setRadarService()
  }

  setRadarService(service) {
    this.radarService = service;
  }

  start() {
    if (this.isRunning) return;

    if (this.demoMode && this.watchSymbols.length === 0) {
      const instruments = mockService.getAllInstruments();
      this.watchSymbols = instruments.map(i => `${i.exchange}:${i.tradingsymbol}`);
    }

    this.isRunning = true;
    logger.info('🔍 Scanner service started');
  }

  stop() {
    this.isRunning = false;
    this._stopWatchInterval();
  }

  setSymbols(symbols) {
    this.watchSymbols = symbols;
  }

  getTemplates() {
    return scanTemplates;
  }

  // ── Watch Mode ───────────────────────────────────────────────────────────

  startWatching(templateId) {
    const template = scanTemplates.find(t => t.id === templateId);
    if (!template) throw new Error(`Template '${templateId}' not found`);

    this.watchedTemplates.add(templateId);
    if (!this.lastMatchMap.has(templateId)) {
      this.lastMatchMap.set(templateId, new Set());
    }

    if (!this.watchInterval) {
      this.watchInterval = setInterval(() => this._runWatchCycle(), WATCH_INTERVAL_MS);
      logger.info(`👁  Scanner watch started (${WATCH_INTERVAL_MS / 1000}s interval)`);
    }

    logger.info(`👁  Watching template: ${template.name}`);
    return { watching: true, templateId, templateName: template.name };
  }

  stopWatching(templateId) {
    this.watchedTemplates.delete(templateId);
    this.lastMatchMap.delete(templateId);

    if (this.watchedTemplates.size === 0) {
      this._stopWatchInterval();
    }

    logger.info(`👁  Stopped watching template: ${templateId}`);
    return { watching: false, templateId };
  }

  getWatching() {
    return Array.from(this.watchedTemplates).map(id => {
      const t = scanTemplates.find(t => t.id === id);
      return { templateId: id, templateName: t?.name || id };
    });
  }

  _stopWatchInterval() {
    if (this.watchInterval) {
      clearInterval(this.watchInterval);
      this.watchInterval = null;
      logger.info('👁  Scanner watch interval stopped');
    }
  }

  async _runWatchCycle() {
    for (const templateId of this.watchedTemplates) {
      try {
        const matches = await this.runScan(templateId);
        const prevSet = this.lastMatchMap.get(templateId) || new Set();
        const currentSet = new Set(matches.map(m => m.symbol));

        const newMatches = matches.filter(m => !prevSet.has(m.symbol));

        this.lastMatchMap.set(templateId, currentSet);

        for (const match of newMatches) {
          const context = this._buildMatchContext(match, templateId);
          this.io.emit('scanner:new_match', context);
          logger.info(`👁  New match: ${match.symbol} on ${templateId}`);
          await this._notifyTelegram(context);
        }
      } catch (err) {
        logger.error(`Watch cycle error for ${templateId}:`, err.message);
      }
    }
  }

  _buildMatchContext(match, templateId) {
    const template = scanTemplates.find(t => t.id === templateId);
    const radarEntry = this.radarService?.radarStocks?.find(r => r.symbol === match.symbol);
    const vix = vixService.getCurrentVIX();
    const { condition: vixCondition } = vixService.getMarketCondition();

    // Compute volumeVsAvg and priceAboveVwap from the match data we already have
    const volumeVsAvg = match.buyerRatio !== null && match.volume > 0
      ? null  // already have buyerRatio; volumeVsAvg computed inside runScan below
      : null;

    return {
      templateId,
      templateName: template?.name || templateId,
      symbol: match.symbol,
      exchange: match.exchange,
      price: match.price,
      change: match.change,
      rsi: match.rsi,
      vwap: match.vwap,
      priceAboveVwap: match.vwap ? match.price > match.vwap : null,
      buyerRatio: match.buyerRatio,
      radarScore: radarEntry?.score || 0,
      vix,
      vixCondition,
      sector: SECTOR_MAP[match.symbol] || null,
      timestamp: new Date()
    };
  }

  async _notifyTelegram(context) {
    try {
      if (!fs.existsSync(PROFILES_DIR)) return;

      const profileDirs = fs.readdirSync(PROFILES_DIR);
      for (const name of profileDirs) {
        const cfgPath = path.join(PROFILES_DIR, name, 'config.json');
        if (!fs.existsSync(cfgPath)) continue;
        const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
        const tg = cfg?.trading?.notifications?.telegram;
        if (!tg?.enabled || !tg.botToken || !tg.chatId) continue;

        telegramService.registerBot(tg.chatId, tg.botToken, true);
        await telegramService.notifyScanMatch(tg.chatId, context);
      }
    } catch (err) {
      logger.error('Telegram scan match notify error:', err.message);
    }
  }

  async runScan(templateId, customConditions = null) {
    const template = customConditions
      ? { id: 'custom', name: 'Custom Scan', conditions: customConditions }
      : scanTemplates.find(t => t.id === templateId);

    if (!template) throw new Error(`Template '${templateId}' not found`);

    const symbols = this.watchSymbols.length > 0
      ? this.watchSymbols
      : mockService.getAllInstruments().map(i => `${i.exchange}:${i.tradingsymbol}`);

    const quotes = await kiteService.getQuote(symbols);
    const matches = [];

    for (const [key, quote] of Object.entries(quotes)) {
      const symbol = key.split(':')[1];

      // Accumulate price history for indicator computation
      const history = this.priceHistory.get(symbol) || [];
      history.push({ price: quote.last_price, volume: quote.volume || 0 });
      if (history.length > 100) history.shift();
      this.priceHistory.set(symbol, history);

      const prices = history.map(h => h.price);
      const indicators = {
        rsi: prices.length >= 15 ? indicatorsService.calculateRSI(prices) : null,
        sma20: prices.length >= 20 ? indicatorsService.calculateSMA(prices, 20) : null,
        vwap: indicatorsService.calculateVWAP(history),
        buyerRatio: indicatorsService.calculateBuyerSellerRatio(quote.depth),
        volumeAvg: history.length > 5
          ? history.slice(-6, -1).reduce((s, h) => s + h.volume, 0) / 5
          : quote.volume || 1,
        stochrsi: prices.length >= 29 ? indicatorsService.calculateStochasticRSI(prices) : null,
        macd: prices.length >= 35 ? indicatorsService.calculateMACD(prices) : null
      };

      const stockData = {
        symbol,
        price: quote.last_price,
        volume: quote.volume || 0,
        depth: quote.depth || { buy: [], sell: [] }
      };

      if (this._checkConditions(template.conditions, stockData, indicators)) {
        const openPrice = quote.ohlc?.open || quote.last_price;
        matches.push({
          symbol,
          exchange: key.split(':')[0],
          price: Math.round(quote.last_price * 100) / 100,
          change: openPrice > 0
            ? Math.round(((quote.last_price - openPrice) / openPrice) * 10000) / 100
            : 0,
          volume: quote.volume || 0,
          rsi: indicators.rsi !== null ? Math.round(indicators.rsi * 100) / 100 : null,
          vwap: indicators.vwap ? Math.round(indicators.vwap * 100) / 100 : null,
          buyerRatio: indicators.buyerRatio ? Math.round(indicators.buyerRatio * 100) / 100 : null,
          matchedTemplate: template.name,
          timestamp: new Date()
        });
      }
    }

    this.results = matches;
    this.io.emit('scanner_results', {
      templateId: template.id,
      templateName: template.name,
      count: matches.length,
      results: matches
    });

    logger.info(`🔍 Scan '${template.name}' found ${matches.length} matches`);
    return matches;
  }

  _checkConditions(conditions, stockData, indicators) {
    for (const cond of conditions) {
      const val = this._resolve(cond.indicator, stockData, indicators);
      if (val === null || val === undefined) continue;
      if (!this._compare(val, cond.operator, cond.value)) return false;
    }
    return true;
  }

  _resolve(indicator, stockData, indicators) {
    switch (indicator) {
      case 'rsi': return indicators.rsi;
      case 'price': return stockData.price;
      case 'volume': return stockData.volume;
      case 'vwap': return indicators.vwap;
      case 'sma20': return indicators.sma20;
      case 'buyerRatio': return indicators.buyerRatio;
      case 'volumeVsAvg':
        return indicators.volumeAvg > 0 ? stockData.volume / indicators.volumeAvg : null;
      case 'priceVsVwap':
        return indicators.vwap > 0 ? stockData.price / indicators.vwap : null;
      case 'stochrsi':
        return indicators.stochrsi?.value ?? null;
      case 'macd_histogram':
        return indicators.macd?.histogram ?? null;
      default: return null;
    }
  }

  _compare(value, operator, threshold) {
    switch (operator) {
      case '>': return value > threshold;
      case '<': return value < threshold;
      case '>=': return value >= threshold;
      case '<=': return value <= threshold;
      case '==': return Math.abs(value - threshold) < 0.001;
      default: return false;
    }
  }

  getResults() {
    return this.results;
  }
}

module.exports = ScannerService;
