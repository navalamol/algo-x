const { runBacktest, generateOHLCV, computeMetrics } = require('../services/backtest.service');
const profileService = require('../services/profile.service');
const { isDemoMode } = require('../config/kite.config');

exports.run = async (req, res) => {
  try {
    const {
      strategyId,
      symbol = 'RELIANCE',
      days = 180,
      capital = 100000,
      slippage = 0.1,
      brokerage = 20,
      customConditions,     // optional override for strategy conditions
      customTradeConfig,    // optional override for SL/TP
    } = req.body;

    // Load strategy from default library or profile
    let strategy = null;
    if (strategyId) {
      const { DEFAULT_STRATEGIES } = require('../config/default-strategies');
      strategy = DEFAULT_STRATEGIES.find(s => s.id === strategyId);
      if (!strategy) {
        // try profile strategies
        const profiles = await profileService.listProfiles();
        for (const name of profiles) {
          const p = await profileService.loadProfile(name);
          const s = (p.strategies || []).find(s => s.id === strategyId || s._id === strategyId);
          if (s) { strategy = s; break; }
        }
      }
    }

    // Allow fully custom strategy (no library lookup)
    if (!strategy && (customConditions || customTradeConfig)) {
      strategy = {
        id: 'custom',
        name: 'Custom',
        conditions: customConditions || {},
        tradeConfig: customTradeConfig || { transactionType: 'BUY', stopLoss: 2, takeProfit: 5 },
      };
    }

    if (!strategy) return res.status(400).json({ success: false, message: 'Strategy not found' });

    // Get candle data — in demo/no-Kite mode, generate synthetic history
    let candles;
    if (isDemoMode()) {
      candles = generateOHLCV(symbol, parseInt(days));
    } else {
      // With real Kite, fetch historical data
      const kiteService = require('../services/kite.service');
      const kite = kiteService.getKite();
      if (!kite) {
        candles = generateOHLCV(symbol, parseInt(days));
      } else {
        const to   = new Date();
        const from = new Date(Date.now() - days * 86400000);
        const instruments = await kite.getInstruments('NSE');
        const instr = instruments.find(i => i.tradingsymbol === symbol.toUpperCase());
        if (!instr) return res.status(404).json({ success: false, message: `Symbol ${symbol} not found on NSE` });

        const raw = await kite.getHistoricalData(instr.instrument_token, 'day', from, to);
        candles = raw.map(c => ({
          date:   c.date.toISOString().slice(0, 10),
          open:   c.open,
          high:   c.high,
          low:    c.low,
          close:  c.close,
          volume: c.volume,
        }));
      }
    }

    if (candles.length < 60) {
      return res.status(400).json({ success: false, message: 'Not enough historical data (need 60+ bars)' });
    }

    const { trades, equity } = runBacktest({
      candles,
      strategy: { conditions: strategy.conditions || {}, tradeConfig: strategy.tradeConfig || {} },
      capital: parseInt(capital),
      slippage: parseFloat(slippage),
      brokerage: parseFloat(brokerage),
    });

    const metrics = computeMetrics(trades, parseInt(capital), equity);

    res.json({
      success: true,
      data: {
        strategyName: strategy.name,
        symbol,
        days: candles.length,
        capital: parseInt(capital),
        metrics,
        trades: trades.slice(0, 100),   // cap at 100 for payload size
        equity: equity.filter((_, i) => i % Math.max(1, Math.floor(equity.length / 200)) === 0), // downsample to ~200 pts
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
    res.json({ success: true, data: DEFAULT_STRATEGIES.map(s => ({ id: s.id, name: s.name, description: s.description, category: s.category })) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
