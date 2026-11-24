const kiteService = require('./kite.service');
const { SECTORS } = require('../config/sector-mapping');
const { isDemoMode } = require('../config/kite.config');
const logger = require('../utils/logger');

// Deterministic demo change values per sector (no Math.random so they're stable on page reload)
const DEMO_SECTOR_CHANGES = {
  IT:       { sector: +1.42, stocks: { TCS: +0.85, INFY: +2.10, WIPRO: +1.68, HCLTECH: +1.20, TECHM: +0.95, LTIM: +1.50, MPHASIS: +1.80, COFORGE: +2.20, PERSISTENT: +2.50 } },
  Banking:  { sector: -0.63, stocks: { HDFCBANK: -0.45, ICICIBANK: +0.30, SBIN: -1.80, AXISBANK: -0.90, KOTAKBANK: -0.20, INDUSINDBK: -1.10, BANKBARODA: -1.60, PNB: -1.90, FEDERALBNK: -0.50 } },
  Finance:  { sector: +0.28, stocks: { HDFC: +0.55, BAJFINANCE: +0.10, BAJAJFINSV: +0.20 } },
  Energy:   { sector: +0.91, stocks: { RELIANCE: +1.80, ONGC: +0.60, BPCL: +0.75, IOC: +0.50, NTPC: +0.95, POWERGRID: +0.70, TATAPOWER: +1.20 } },
  Pharma:   { sector: -1.05, stocks: { SUNPHARMA: -0.80, DRREDDY: -1.50, CIPLA: -0.90, DIVISLAB: -1.80, BIOCON: -1.20, ALKEM: -0.60 } },
  Auto:     { sector: +0.52, stocks: { MARUTI: +0.80, TATAMOTORS: +1.20, 'BAJAJ-AUTO': +0.40, HEROMOTOCO: +0.30, EICHERMOT: +0.90, M_M: +0.60, TVSMOTORS: +0.50 } },
  FMCG:     { sector: -0.18, stocks: { HINDUNILVR: -0.30, ITC: +0.20, NESTLEIND: -0.50, BRITANNIA: -0.40, DABUR: -0.10, MARICO: +0.05, GODREJCP: -0.25 } },
  Metals:   { sector: +1.75, stocks: { TATASTEEL: +2.10, JSWSTEEL: +1.80, HINDALCO: +1.95, VEDL: +2.50, SAIL: +1.20, NMDC: +1.60, COALINDIA: +1.40 } },
  Realty:   { sector: +2.30, stocks: { DLF: +3.10, GODREJPROP: +2.80, OBEROIRLTY: +1.90, PRESTIGE: +2.20, BRIGADE: +1.50 } },
  Cement:   { sector: -0.42, stocks: { ULTRACEMCO: -0.60, SHREECEM: -0.30, ACC: -0.55, AMBUJACEM: -0.25 } },
  Telecom:  { sector: +0.35, stocks: { BHARTIARTL: +0.35 } },
  Consumer: { sector: +0.78, stocks: { TITAN: +1.20, ASIANPAINT: +0.50, PIDILITIND: +0.65 } },
};

// Rough reference prices for demo stocks not in MockService
const DEMO_PRICES = {
  HCLTECH: 1520, TECHM: 1310, LTIM: 5200, MPHASIS: 2450, COFORGE: 7800, PERSISTENT: 5100,
  AXISBANK: 1050, KOTAKBANK: 1750, INDUSINDBK: 1420, BANKBARODA: 230, PNB: 115, FEDERALBNK: 185,
  HDFC: 2800, BAJFINANCE: 6900, BAJAJFINSV: 1580,
  ONGC: 265, BPCL: 480, IOC: 155, NTPC: 325, POWERGRID: 295, TATAPOWER: 440,
  SUNPHARMA: 1680, DRREDDY: 6300, CIPLA: 1430, DIVISLAB: 3850, BIOCON: 310, ALKEM: 5500,
  MARUTI: 10500, TATAMOTORS: 950, 'BAJAJ-AUTO': 9200, HEROMOTOCO: 4800, EICHERMOT: 4600, M_M: 2850, TVSMOTORS: 2100,
  HINDUNILVR: 2550, ITC: 460, NESTLEIND: 24000, BRITANNIA: 5100, DABUR: 580, MARICO: 620, GODREJCP: 1250,
  TATASTEEL: 150, JSWSTEEL: 920, HINDALCO: 650, VEDL: 420, SAIL: 125, NMDC: 215, COALINDIA: 440,
  DLF: 820, GODREJPROP: 2100, OBEROIRLTY: 1850, PRESTIGE: 1600, BRIGADE: 950,
  ULTRACEMCO: 10200, SHREECEM: 25000, ACC: 2050, AMBUJACEM: 580,
  BHARTIARTL: 1680,
  TITAN: 3450, ASIANPAINT: 2850, PIDILITIND: 2950,
};

class HeatmapService {
  constructor() {
    this.io = null; // set by server.js after io is ready
    this.sectorData = {};
    this.lastUpdate = null;
    this.updateInterval = null;
    this.updateIntervalMs = 30000;
  }

  start() {
    this.update();
    this.updateInterval = setInterval(() => this.update(), this.updateIntervalMs);
    logger.info('🗺️  Heatmap service started');
  }

  stop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  _buildDemoData() {
    const sectorPerformance = {};

    for (const [sector, symbols] of Object.entries(SECTORS)) {
      const bias = DEMO_SECTOR_CHANGES[sector] || { sector: 0, stocks: {} };
      const sectorStocks = symbols.map(symbol => {
        const basePrice = DEMO_PRICES[symbol] || 1000;
        const changePct = bias.stocks[symbol] ?? bias.sector;
        return {
          symbol,
          price: Math.round(basePrice * (1 + changePct / 100) * 100) / 100,
          change: Math.round(changePct * 100) / 100,
          volume: Math.floor(300000 + (symbol.length * 17919) % 500000),
        };
      });

      sectorPerformance[sector] = {
        name: sector,
        change: Math.round(bias.sector * 100) / 100,
        stocks: sectorStocks,
        stockCount: sectorStocks.length,
      };
    }

    return sectorPerformance;
  }

  async update() {
    try {
      if (isDemoMode()) {
        this.sectorData = this._buildDemoData();
        this.lastUpdate = new Date();
        if (this.io) this.io.emit('heatmap_update', this.getSectorData());
        return;
      }

      const allSymbols = Object.values(SECTORS).flat().map(s => `NSE:${s}`);
      const quotes = await kiteService.getQuote(allSymbols);

      const sectorPerformance = {};

      for (const [sector, stocks] of Object.entries(SECTORS)) {
        const sectorStocks = [];
        let totalChange = 0;
        let count = 0;

        for (const symbol of stocks) {
          const quote = quotes[`NSE:${symbol}`];
          if (!quote) continue;

          const openPrice = quote.ohlc?.open || quote.last_price;
          const changePct = openPrice > 0
            ? ((quote.last_price - openPrice) / openPrice) * 100
            : 0;

          sectorStocks.push({
            symbol,
            price: Math.round(quote.last_price * 100) / 100,
            change: Math.round(changePct * 100) / 100,
            volume: quote.volume || 0,
          });

          totalChange += changePct;
          count++;
        }

        sectorPerformance[sector] = {
          name: sector,
          change: count > 0 ? Math.round((totalChange / count) * 100) / 100 : 0,
          stocks: sectorStocks,
          stockCount: count,
        };
      }

      this.sectorData = sectorPerformance;
      this.lastUpdate = new Date();
      if (this.io) this.io.emit('heatmap_update', this.getSectorData());

    } catch (error) {
      logger.error('Heatmap update error:', error.message);
    }
  }

  getSectorData() {
    return { sectors: this.sectorData, lastUpdate: this.lastUpdate };
  }
}

module.exports = new HeatmapService();
