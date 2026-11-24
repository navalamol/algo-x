const { runBacktest, computeMetrics, splitCandles } = require('../services/backtest.service');
const profileService = require('../services/profile.service');
const { isDemoMode } = require('../config/kite.config');
const mockService = require('../services/mock.service');

exports.run = async (req, res) => {
  try {
    const {
      strategyId,
      symbol = 'RELIANCE',
      days = 180,
      capital = 100000,
      slippage = 0.1,
      brokerage = 20,
      outOfSamplePct = 20,
      customConditions,
      customTradeConfig,
    } = req.body;

    // Load strategy from default library or profile
    let strategy = null;
    if (strategyId) {
      const { DEFAULT_STRATEGIES } = require('../config/default-strategies');
      strategy = DEFAULT_STRATEGIES.find(s => s.id === strategyId);
      if (!strategy) {
        const profiles = await profileService.listProfiles();
        for (const name of profiles) {
          const p = await profileService.loadProfile(name);
          const s = (p.strategies || []).find(s => s.id === strategyId || s._id === strategyId);
          if (s) { strategy = s; break; }
        }
      }
    }
    if (!strategy && (customConditions || customTradeConfig)) {
      strategy = {
        id: 'custom', name: 'Custom',
        conditions: customConditions || {},
        tradeConfig: customTradeConfig || { transactionType: 'BUY', stopLoss: 2, takeProfit: 5 },
      };
    }
    if (!strategy) return res.status(400).json({ success: false, message: 'Strategy not found' });

    // ── Fetch candles ──────────────────────────────────────────────────────
    let candles;
    let dataSource;

    if (isDemoMode()) {
      candles = mockService.getHistoricalOHLCV(symbol, parseInt(days));
      dataSource = 'SYNTHETIC_DEMO';
    } else {
      const kiteService = require('../services/kite.service');
      try {
        const instruments = await kiteService.getAllInstruments('NSE');
        const instr = instruments.find(i => i.tradingsymbol === symbol.toUpperCase());
        if (!instr) {
          return res.status(404).json({ success: false, message: `Symbol ${symbol} not found on NSE` });
        }
        const to   = new Date();
        const from = new Date(Date.now() - parseInt(days) * 86400000);
        const raw  = await kiteService.getHistoricalData(instr.instrument_token, 'day', from, to);
        candles = raw.map(c => ({
          date:   c.date instanceof Date ? c.date.toISOString().slice(0, 10) : String(c.date).slice(0, 10),
          open:   c.open,
          high:   c.high,
          low:    c.low,
          close:  c.close,
          volume: c.volume,
        }));
        dataSource = 'HISTORICAL_KITE';
      } catch (err) {
        // Kite unavailable — fall back to synthetic and label clearly
        candles = mockService.getHistoricalOHLCV(symbol, parseInt(days));
        dataSource = 'SYNTHETIC_FALLBACK';
      }
    }

    if (candles.length < 60) {
      return res.status(400).json({ success: false, message: 'Not enough historical data (need 60+ bars)' });
    }

    const strategyOpts = {
      conditions: strategy.conditions || {},
      tradeConfig: strategy.tradeConfig || { transactionType: 'BUY', stopLoss: 2, takeProfit: 5 },
    };
    const backtestParams = {
      strategy: strategyOpts,
      capital: parseInt(capital),
      slippage: parseFloat(slippage),
      brokerage: parseFloat(brokerage),
    };

    // ── Split in-sample / out-of-sample ───────────────────────────────────
    const pct = Math.max(0, Math.min(40, parseInt(outOfSamplePct) || 0));
    const { inSample: inSampleCandles, outOfSample: outOfSampleCandles } = splitCandles(candles, pct);

    if (inSampleCandles.length < 60) {
      return res.status(400).json({
        success: false,
        message: 'In-sample window too short (< 60 bars). Reduce out-of-sample % or increase days.',
      });
    }

    const isResult = runBacktest({ candles: inSampleCandles, ...backtestParams });
    const inSampleMetrics = computeMetrics(isResult.trades, parseInt(capital), isResult.equity);

    let oosSummary = null;
    let oosResult  = null;
    if (outOfSampleCandles.length >= 30) {
      oosResult = runBacktest({ candles: outOfSampleCandles, ...backtestParams });
      const oosMetrics = computeMetrics(oosResult.trades, parseInt(capital), oosResult.equity);
      oosSummary = {
        fromDate: outOfSampleCandles[0]?.date,
        toDate:   outOfSampleCandles[outOfSampleCandles.length - 1]?.date,
        bars:     outOfSampleCandles.length,
        metrics:  oosMetrics,
        trades:   oosResult.trades.slice(0, 100),
      };
    }

    // ── Build combined equity for chart ───────────────────────────────────
    const combined = [
      ...isResult.equity.map(p => ({ ...p, period: 'in-sample' })),
      ...(oosResult?.equity || []).map(p => ({ ...p, period: 'out-of-sample' })),
    ];
    const step = Math.max(1, Math.floor(combined.length / 300));
    const equity = combined.filter((_, i) => i % step === 0);

    res.json({
      success: true,
      data: {
        strategyName: strategy.name,
        symbol,
        dataSource,
        capital: parseInt(capital),
        totalBars: candles.length,
        splitDate: outOfSampleCandles.length ? outOfSampleCandles[0].date : null,
        inSample: {
          fromDate: inSampleCandles[0]?.date,
          toDate:   inSampleCandles[inSampleCandles.length - 1]?.date,
          bars:     inSampleCandles.length,
          metrics:  inSampleMetrics,
          trades:   isResult.trades.slice(0, 100),
        },
        outOfSample: oosSummary,
        equity,
      },
    });
  } catch (err) {
    console.error('Backtest error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getStrategies = async (req, res) => {
  try {
    const { DEFAULT_STRATEGIES } = require('../config/default-strategies');
    res.json({
      success: true,
      data: DEFAULT_STRATEGIES.map(s => ({ id: s.id, name: s.name, description: s.description, category: s.category })),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
