const logger = require('../utils/logger');

/**
 * Mock Service for testing without Kite API credentials.
 *
 * Each instrument has a scenario-biased price history so that scanner
 * templates fire immediately in demo mode without waiting for history to
 * accumulate over real ticks:
 *
 *   SBIN       → oversold_reversal   (RSI < 35, buyerRatio > 1.2)
 *   INFY       → momentum_burst      (RSI > 60, volumeVsAvg > 1.5, price > VWAP)
 *   TCS        → stochrsi_oversold   (StochRSI < 20, RSI < 45, buyerRatio > 1.0)
 *   RELIANCE   → macd_bullish_cross  (histogram > 0, volumeVsAvg > 1.2)
 *   HDFCBANK   → vwap_reclaim        (price > VWAP, buyerRatio > 1.0)
 *   ICICIBANK  → volume_breakout     (volumeVsAvg > 2.0)
 *   WIPRO      → weak_hands_exit     (RSI > 70, buyerRatio < 0.7)
 */
class MockService {
  constructor() {
    this.mockInstruments = [
      { instrument_token: 738561,  exchange_token: 2885,  tradingsymbol: 'SBIN',      name: 'STATE BANK OF INDIA',          last_price: 625.50,  expiry: '', strike: 0, tick_size: 0.05, lot_size: 1, instrument_type: 'EQ', segment: 'NSE', exchange: 'NSE' },
      { instrument_token: 408065,  exchange_token: 1594,  tradingsymbol: 'INFY',      name: 'INFOSYS LIMITED',               last_price: 1456.75, expiry: '', strike: 0, tick_size: 0.05, lot_size: 1, instrument_type: 'EQ', segment: 'NSE', exchange: 'NSE' },
      { instrument_token: 2953217, exchange_token: 11536, tradingsymbol: 'TCS',       name: 'TATA CONSULTANCY SERVICES',     last_price: 3780.30, expiry: '', strike: 0, tick_size: 0.05, lot_size: 1, instrument_type: 'EQ', segment: 'NSE', exchange: 'NSE' },
      { instrument_token: 81153,   exchange_token: 317,   tradingsymbol: 'RELIANCE',  name: 'RELIANCE INDUSTRIES LIMITED',   last_price: 2456.80, expiry: '', strike: 0, tick_size: 0.05, lot_size: 1, instrument_type: 'EQ', segment: 'NSE', exchange: 'NSE' },
      { instrument_token: 54273,   exchange_token: 212,   tradingsymbol: 'HDFCBANK',  name: 'HDFC BANK LIMITED',             last_price: 1687.25, expiry: '', strike: 0, tick_size: 0.05, lot_size: 1, instrument_type: 'EQ', segment: 'NSE', exchange: 'NSE' },
      { instrument_token: 1270529, exchange_token: 4963,  tradingsymbol: 'ICICIBANK', name: 'ICICI BANK LIMITED',            last_price: 1089.90, expiry: '', strike: 0, tick_size: 0.05, lot_size: 1, instrument_type: 'EQ', segment: 'NSE', exchange: 'NSE' },
      { instrument_token: 341249,  exchange_token: 1333,  tradingsymbol: 'WIPRO',     name: 'WIPRO LIMITED',                 last_price: 445.60,  expiry: '', strike: 0, tick_size: 0.05, lot_size: 1, instrument_type: 'EQ', segment: 'NSE', exchange: 'NSE' },
    ];

    this.prices = new Map();
    this.initializePrices();
    this.scenarioHistories = this._initScenarioHistories();
  }

  initializePrices() {
    this.mockInstruments.forEach(i => this.prices.set(i.instrument_token, i.last_price));
  }

  // ── Scenario price histories ─────────────────────────────────────────────

  /**
   * Build a 50-entry {price, volume} history from a base price and a
   * percent-change array. Volume is deterministic (no Math.random).
   */
  _buildHistory(basePrice, changes, volumeBase = 350000) {
    const history = [{ price: basePrice, volume: volumeBase }];
    for (let i = 1; i < changes.length; i++) {
      const price = Number((history[i - 1].price * (1 + changes[i])).toFixed(2));
      // Deterministic volume variation using index-based pseudorandom
      const volNoise = ((i * 7919 + 13337) % 100000) - 50000;
      history.push({ price, volume: Math.max(100000, volumeBase + volNoise) });
    }
    return history;
  }

  _initScenarioHistories() {
    const h = new Map();

    // SBIN: Oversold Reversal — consistent bearish grind, RSI targets ~28
    h.set('SBIN', this._buildHistory(625.50, [
      0, -0.006, -0.006, 0.004, -0.006, -0.006, 0.004, -0.006, -0.006, 0.004,
      -0.006, 0.004, -0.006, -0.006, 0.004, -0.006, -0.006, 0.004, -0.006, -0.006,
      0.004, -0.006, -0.006, 0.004, -0.006, 0.004, -0.006, -0.006, 0.004, -0.006,
      -0.006, 0.004, -0.006, -0.006, 0.004, -0.006, -0.006, 0.004, -0.006, 0.004,
      -0.006, -0.006, 0.004, -0.006, -0.006, 0.004, -0.006, -0.006, 0.004, -0.006,
    ], 350000));

    // INFY: Momentum Burst — strong consistent rise, RSI targets ~80
    h.set('INFY', this._buildHistory(1456.75, [
      0, 0.009, 0.009, -0.002, 0.009, 0.009, -0.002, 0.009, 0.009, -0.002,
      0.009, 0.009, -0.002, 0.009, 0.009, -0.002, 0.009, 0.009, -0.002, 0.009,
      0.009, -0.002, 0.009, 0.009, -0.002, 0.009, 0.009, -0.002, 0.009, 0.009,
      -0.002, 0.009, 0.009, -0.002, 0.009, 0.009, -0.002, 0.009, 0.009, -0.002,
      0.009, 0.009, -0.002, 0.009, 0.009, -0.002, 0.009, 0.009, -0.002, 0.009,
    ], 400000));

    // TCS: StochRSI Oversold — stable then sharp recent decline
    // Stable first 25 prices (RSI ~50 in stoch window history),
    // then sharp 25-price decline (RSI crashes → becomes stoch minimum)
    h.set('TCS', this._buildHistory(3780.30, [
      0, 0.003, -0.003, 0.003, -0.003, 0.003, -0.003, 0.003, -0.003, 0.003,
      -0.003, 0.003, -0.003, 0.003, -0.003, 0.003, -0.003, 0.003, -0.003, 0.003,
      -0.003, 0.003, -0.003, 0.003, -0.003, 0.003,
      // sharp decline starts at index 26
      -0.014, 0.001, -0.014, 0.001, -0.014, 0.001, -0.014, 0.001, -0.014, 0.001,
      -0.014, 0.001, -0.014, 0.001, -0.014, 0.001, -0.014, 0.001, -0.014, 0.001,
      -0.014, 0.001, -0.014, 0.001,
    ], 320000));

    // RELIANCE: MACD Bullish Cross — 25 declining then 25 strong recovery
    h.set('RELIANCE', this._buildHistory(2456.80, [
      0,
      // 25 bearish periods
      -0.007, 0.003, -0.007, 0.003, -0.007, 0.003, -0.007, 0.003, -0.007, 0.003,
      -0.007, 0.003, -0.007, 0.003, -0.007, 0.003, -0.007, 0.003, -0.007, 0.003,
      -0.007, 0.003, -0.007, 0.003, -0.007,
      // 24 bullish recovery periods — EMA12 crosses above EMA26 signal
      0.010, -0.002, 0.010, -0.002, 0.010, -0.002, 0.010, -0.002, 0.010, -0.002,
      0.010, -0.002, 0.010, -0.002, 0.010, -0.002, 0.010, -0.002, 0.010, -0.002,
      0.010, -0.002, 0.010, -0.002,
    ], 400000));

    // HDFCBANK: VWAP Reclaim — steady rise keeps last_price above VWAP
    h.set('HDFCBANK', this._buildHistory(1687.25, [
      0, 0.004, 0.003, -0.001, 0.004, 0.003, -0.001, 0.004, 0.003, -0.001,
      0.004, 0.003, -0.002, 0.004, 0.003, -0.001, 0.004, 0.003, -0.001, 0.004,
      0.003, -0.002, 0.004, 0.003, -0.001, 0.004, 0.003, -0.001, 0.004, 0.003,
      -0.001, 0.004, 0.003, -0.002, 0.004, 0.003, -0.001, 0.004, 0.003, -0.001,
      0.004, 0.003, -0.002, 0.004, 0.003, -0.001, 0.004, 0.003, -0.001, 0.004,
    ], 350000));

    // ICICIBANK: Volume Breakout — flat price, matches via volume spike in getQuote
    h.set('ICICIBANK', this._buildHistory(1089.90, [
      0, 0.001, -0.001, 0.001, -0.001, 0.001, -0.001, 0.001, -0.001, 0.001,
      -0.001, 0.001, -0.001, 0.001, -0.001, 0.001, -0.001, 0.001, -0.001, 0.001,
      -0.001, 0.001, -0.001, 0.001, -0.001, 0.001, -0.001, 0.001, -0.001, 0.001,
      -0.001, 0.001, -0.001, 0.001, -0.001, 0.001, -0.001, 0.001, -0.001, 0.001,
      -0.001, 0.001, -0.001, 0.001, -0.001, 0.001, -0.001, 0.001, -0.001, 0.001,
    ], 300000));

    // WIPRO: Weak Hands Exit — strong consistent rise, RSI targets ~85
    h.set('WIPRO', this._buildHistory(445.60, [
      0, 0.009, 0.009, -0.002, 0.009, 0.009, -0.002, 0.009, 0.009, -0.002,
      0.009, 0.009, -0.002, 0.009, 0.009, -0.002, 0.009, 0.009, -0.002, 0.009,
      0.009, -0.002, 0.009, 0.009, -0.002, 0.009, 0.009, -0.002, 0.009, 0.009,
      -0.002, 0.009, 0.009, -0.002, 0.009, 0.009, -0.002, 0.009, 0.009, -0.002,
      0.009, 0.009, -0.002, 0.009, 0.009, -0.002, 0.009, 0.009, -0.002, 0.009,
    ], 300000));

    return h;
  }

  /** Returns the 50-entry pre-seeded price history for a symbol. */
  getPriceHistory(symbol) {
    return this.scenarioHistories.get(symbol) || [];
  }

  /**
   * Derives synthetic OHLC from the scenario price history.
   * Each bar: open = previous close, close = current price,
   * high/low use a deterministic ±0.3% range so ATR is computable
   * without Math.random (keeps demo data stable across runs).
   */
  getOHLCHistory(symbol) {
    const history = this.scenarioHistories.get(symbol) || [];
    return history.map((bar, i) => {
      const open  = i > 0 ? history[i - 1].price : bar.price;
      const close = bar.price;
      return {
        open,
        close,
        high: Math.max(open, close) * 1.003,
        low:  Math.min(open, close) * 0.997
      };
    });
  }

  // ── Depth bias ───────────────────────────────────────────────────────────

  _getDepthBias(symbol) {
    const biases = {
      SBIN:      { buyMult: 1.6, sellMult: 1.0 },  // buyerRatio ~1.6
      TCS:       { buyMult: 1.3, sellMult: 1.0 },  // buyerRatio ~1.3
      HDFCBANK:  { buyMult: 1.3, sellMult: 1.0 },  // buyerRatio ~1.3
      WIPRO:     { buyMult: 0.5, sellMult: 1.0 },  // buyerRatio ~0.5 (< 0.7)
    };
    return biases[symbol] || { buyMult: 1.0, sellMult: 1.0 };
  }

  generateDepth(price, symbol = null) {
    const { buyMult, sellMult } = this._getDepthBias(symbol);
    const depth = { buy: [], sell: [] };

    for (let i = 0; i < 5; i++) {
      const baseQty = Math.floor(Math.random() * 3000) + 500;
      depth.buy.push({
        price: price - (i + 1) * 0.5,
        quantity: Math.floor(baseQty * buyMult),
        orders: Math.floor(Math.random() * 50) + 5,
      });
      depth.sell.push({
        price: price + (i + 1) * 0.5,
        quantity: Math.floor(baseQty * sellMult),
        orders: Math.floor(Math.random() * 50) + 5,
      });
    }

    return depth;
  }

  // ── Core API methods ──────────────────────────────────────────────────────

  getAllInstruments(exchange = null) {
    logger.info('[MOCK MODE] Fetching instruments');
    return exchange
      ? this.mockInstruments.filter(i => i.exchange === exchange)
      : this.mockInstruments;
  }

  searchInstruments(query, exchange = 'NSE') {
    logger.info(`[MOCK MODE] Searching instruments: ${query}`);
    const q = query.toUpperCase();
    return this.mockInstruments.filter(i =>
      i.exchange === exchange &&
      (i.tradingsymbol.includes(q) || i.name.toUpperCase().includes(q))
    );
  }

  getQuote(instruments) {
    logger.info('[MOCK MODE] Fetching quote');

    // Per-symbol fixed volumes so scanner conditions are deterministically met:
    //   ICICIBANK: 3× history avg (300k) → volumeVsAvg ~3.0 → volume_breakout
    //   RELIANCE:  1.3× history avg (400k) → volumeVsAvg ~1.3 → macd_bullish_cross
    //   INFY:      1.7× history avg (400k) → volumeVsAvg ~1.7 → momentum_burst
    const fixedVolume = {
      ICICIBANK: 950000,
      RELIANCE:  520000,
      INFY:      680000,
    };

    const result = {};
    instruments.forEach(inst => {
      const [exchange, symbol] = inst.split(':');
      const instrument = this.mockInstruments.find(
        i => i.exchange === exchange && i.tradingsymbol === symbol
      );
      if (!instrument) return;

      const price = this.prices.get(instrument.instrument_token) || instrument.last_price;
      const change = (Math.random() - 0.5) * 10;

      result[inst] = {
        instrument_token: instrument.instrument_token,
        timestamp: new Date(),
        last_price: price,
        last_quantity: Math.floor(Math.random() * 100) + 1,
        last_trade_time: new Date(),
        average_price: price,
        volume: fixedVolume[symbol] || (Math.floor(Math.random() * 500000) + 200000),
        buy_quantity: Math.floor(Math.random() * 50000),
        sell_quantity: Math.floor(Math.random() * 50000),
        ohlc: {
          open: price - Math.random() * 20,
          high: price + Math.random() * 15,
          low: price - Math.random() * 15,
          close: price,
        },
        net_change: change,
        oi: 0,
        oi_day_high: 0,
        oi_day_low: 0,
        depth: this.generateDepth(price, symbol),
      };
    });

    return result;
  }

  generateTick(instrumentToken) {
    const instrument = this.mockInstruments.find(i => i.instrument_token === instrumentToken);
    if (!instrument) return null;

    const currentPrice = this.prices.get(instrumentToken) || instrument.last_price;
    const newPrice = currentPrice * (1 + (Math.random() - 0.5) * 0.01);
    this.prices.set(instrumentToken, newPrice);

    const depth = this.generateDepth(newPrice, instrument.tradingsymbol);

    return {
      instrument_token: instrumentToken,
      mode: 'full',
      tradable: true,
      last_price: newPrice,
      last_quantity: Math.floor(Math.random() * 100) + 1,
      average_price: newPrice,
      volume_traded: Math.floor(Math.random() * 1000000) + 100000,
      total_buy_quantity: depth.buy.reduce((s, b) => s + b.quantity, 0),
      total_sell_quantity: depth.sell.reduce((s, s2) => s + s2.quantity, 0),
      ohlc: {
        open: newPrice * (1 - Math.random() * 0.02),
        high: newPrice * (1 + Math.random() * 0.015),
        low: newPrice * (1 - Math.random() * 0.015),
        close: newPrice,
      },
      change: (Math.random() - 0.5) * 2,
      last_trade_time: new Date(),
      exchange_timestamp: new Date(),
      oi: 0, oi_day_high: 0, oi_day_low: 0,
      depth,
    };
  }

  getPositions() {
    logger.info('[MOCK MODE] Fetching positions');
    return {
      net: [
        {
          tradingsymbol: 'SBIN', exchange: 'NSE', instrument_token: 738561,
          product: 'CNC', quantity: 15, overnight_quantity: 15, multiplier: 1,
          average_price: 621.00, close_price: 625.50, last_price: 625.50,
          value: 9322.50, pnl: 67.50, m2m: 67.50, unrealised: 67.50, realised: 0,
          buy_quantity: 15, buy_price: 621.00, buy_value: 9315.00, buy_m2m: 9315.00,
          sell_quantity: 0, sell_price: 0, sell_value: 0, sell_m2m: 0,
          day_buy_quantity: 0, day_buy_price: 0, day_buy_value: 0,
          day_sell_quantity: 0, day_sell_price: 0, day_sell_value: 0,
        },
        {
          tradingsymbol: 'TCS', exchange: 'NSE', instrument_token: 2953217,
          product: 'CNC', quantity: 2, overnight_quantity: 2, multiplier: 1,
          average_price: 3752.00, close_price: 3780.30, last_price: 3780.30,
          value: 7560.60, pnl: 56.60, m2m: 56.60, unrealised: 56.60, realised: 0,
          buy_quantity: 2, buy_price: 3752.00, buy_value: 7504.00, buy_m2m: 7504.00,
          sell_quantity: 0, sell_price: 0, sell_value: 0, sell_m2m: 0,
          day_buy_quantity: 0, day_buy_price: 0, day_buy_value: 0,
          day_sell_quantity: 0, day_sell_price: 0, day_sell_value: 0,
        },
      ],
      day: [],
    };
  }

  getHoldings() {
    logger.info('[MOCK MODE] Fetching holdings');
    return [
      {
        tradingsymbol: 'INFY', exchange: 'NSE', instrument_token: 408065,
        isin: 'INE009A01021', product: 'CNC', price: 0, quantity: 5, t1_quantity: 0,
        realised_quantity: 5, authorised_quantity: 0, authorised_date: new Date(),
        opening_quantity: 5, collateral_quantity: 0, collateral_type: '',
        discrepancy: false, average_price: 1420.00, last_price: 1456.75,
        close_price: 1450.00, pnl: 183.75, day_change: 6.75, day_change_percentage: 0.47,
      },
    ];
  }

  placeOrder(variety, params) {
    logger.info('[MOCK MODE] Placing order:', params);
    return { order_id: `MOCK${Date.now()}${Math.floor(Math.random() * 1000)}` };
  }

  getOrderHistory() {
    logger.info('[MOCK MODE] Fetching order history');
    return [
      {
        order_id: 'MOCK170873145001', exchange_order_id: 'DEMO-12345',
        parent_order_id: null, status: 'COMPLETE', status_message: null,
        order_timestamp: new Date(Date.now() - 3600000),
        exchange_update_timestamp: new Date(Date.now() - 3600000),
        exchange_timestamp: new Date(Date.now() - 3600000),
        variety: 'regular', exchange: 'NSE', tradingsymbol: 'SBIN',
        instrument_token: 738561, order_type: 'MARKET', transaction_type: 'BUY',
        validity: 'DAY', product: 'CNC', quantity: 15, disclosed_quantity: 0,
        price: 0, trigger_price: 0, average_price: 621.00,
        filled_quantity: 15, pending_quantity: 0, cancelled_quantity: 0,
      },
    ];
  }

  getProfile() {
    logger.info('[MOCK MODE] Fetching profile');
    return {
      user_id: 'DEMO123', user_type: 'individual', email: 'demo@example.com',
      user_name: 'Demo User', user_shortname: 'Demo', broker: 'ZERODHA',
      exchanges: ['NSE', 'BSE', 'NFO', 'CDS', 'BFO', 'MCX'],
      products: ['CNC', 'NRML', 'MIS'],
      order_types: ['MARKET', 'LIMIT', 'SL', 'SL-M'],
      avatar_url: null,
    };
  }

  getMargins(segment = null) {
    logger.info('[MOCK MODE] Fetching margins');
    const margins = {
      equity: {
        enabled: true,
        net: 100000.00,
        available: {
          adhoc_margin: 0, cash: 100000.00, opening_balance: 100000.00,
          live_balance: 100000.00, collateral: 0, intraday_payin: 0,
        },
        utilised: {
          debits: 0, exposure: 0, m2m_realised: 0, m2m_unrealised: 0,
          option_premium: 0, payout: 0, span: 0, holding_sales: 0,
          turnover: 0, liquid_collateral: 0, stock_collateral: 0,
        },
      },
    };
    return segment ? margins[segment] : margins;
  }
  getMorningBrief() {
    const now = new Date();
    return {
      generatedAt: now.toISOString(),
      date: now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
      dataSource: 'demo',
      regime: {
        vix: 16.4,
        condition: 'NORMAL',
        description: 'Normal volatility — Typical market',
        recommendation: 'Standard risk management. Momentum setups have a reasonable edge.',
        trend: 'STABLE',
      },
      marketSentiment: 'BULLISH',
      breadth: { advancing: 7, declining: 4, total: 11 },
      sectorLeaders: [
        { sector: 'Realty',  changePct: 2.30 },
        { sector: 'Metals',  changePct: 1.75 },
        { sector: 'IT',      changePct: 1.42 },
      ],
      sectorLaggers: [
        { sector: 'Pharma',  changePct: -1.05 },
        { sector: 'Banking', changePct: -0.63 },
      ],
      topOpportunities: [
        { symbol: 'INFY',      templates: ['Momentum Burst', 'VWAP Reclaim'],    rsi: 63.2, volumeVsAvg: 1.9, radarScore: 72 },
        { symbol: 'RELIANCE',  templates: ['MACD Bullish Cross'],                rsi: 55.8, volumeVsAvg: 1.4, radarScore: 61 },
        { symbol: 'HDFCBANK',  templates: ['VWAP Reclaim'],                      rsi: 51.2, volumeVsAvg: 1.2, radarScore: 58 },
        { symbol: 'TCS',       templates: ['StochRSI Oversold'],                 rsi: 42.1, volumeVsAvg: 1.1, radarScore: 49 },
        { symbol: 'SBIN',      templates: ['Oversold Reversal Candidate'],       rsi: 31.4, volumeVsAvg: 1.6, radarScore: 65 },
      ],
      scanSummary: [
        { templateId: 'momentum_burst',           templateName: 'Momentum Burst',            count: 1, topSymbols: ['INFY'] },
        { templateId: 'oversold_reversal',         templateName: 'Oversold Reversal',         count: 1, topSymbols: ['SBIN'] },
        { templateId: 'volume_breakout',           templateName: 'Volume Breakout',           count: 1, topSymbols: ['ICICIBANK'] },
        { templateId: 'vwap_reclaim',              templateName: 'VWAP Reclaim',              count: 2, topSymbols: ['INFY', 'HDFCBANK'] },
        { templateId: 'macd_bullish_cross',        templateName: 'MACD Bullish Cross',        count: 1, topSymbols: ['RELIANCE'] },
        { templateId: 'stochrsi_oversold',         templateName: 'StochRSI Oversold',        count: 1, topSymbols: ['TCS'] },
        { templateId: 'weak_hands_exit',           templateName: 'Weak Hands Exit',           count: 1, topSymbols: ['WIPRO'] },
      ],
      noSetup: false,
    };
  }
}

module.exports = new MockService();
