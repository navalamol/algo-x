/**
 * Demo seed — populates MemoryStore at startup so the dashboard shows real data
 * immediately without needing a live Kite connection or database.
 *
 * Runs only when isDemoModeDb() is true (no KITE_API_KEY set).
 */
const path = require('path');
const fs = require('fs');
const memoryStore = require('./memory-store.service');
const logger = require('../utils/logger');

function seedDemo() {
  // ── Trades ───────────────────────────────────────────────────────────────
  try {
    const tradesPath = path.join(__dirname, '../../profiles/amol/trades.json');
    if (fs.existsSync(tradesPath)) {
      const trades = JSON.parse(fs.readFileSync(tradesPath, 'utf8'));
      memoryStore.seed('trades', trades.map(t => ({ ...t, userId: 'default' })));
    }
  } catch (err) {
    logger.warn('[demo-seed] Could not load trades:', err.message);
  }

  // ── Strategies ───────────────────────────────────────────────────────────
  const strategies = [
    {
      _id: 'strat_001', userId: 'default',
      name: 'RSI Oversold Reversal',
      description: 'Buys when RSI < 30 (oversold) with volume confirmation',
      type: 'REVERSAL', isActive: true,
      conditions: { rsiMin: 0, rsiMax: 30, volumeChangeMin: 50, priceMin: 50, priceMax: 5000 },
      tradeConfig: { transactionType: 'BUY', orderType: 'MARKET', product: 'CNC', stopLoss: 2, takeProfit: 5 },
      expectedWinRate: '60-65%',
      createdAt: new Date('2026-11-02'),
    },
    {
      _id: 'strat_002', userId: 'default',
      name: 'VWAP Breakout',
      description: 'Buys when price breaks above VWAP with volume surge',
      type: 'BREAKOUT', isActive: true,
      conditions: { priceAboveVWAP: true, volumeChangeMin: 30, priceMin: 100 },
      tradeConfig: { transactionType: 'BUY', orderType: 'MARKET', product: 'CNC', stopLoss: 1.5, takeProfit: 3 },
      expectedWinRate: '58-62%',
      createdAt: new Date('2026-11-05'),
    },
    {
      _id: 'strat_003', userId: 'default',
      name: 'Support Bounce',
      description: 'Enters at support levels with buyer order-book confirmation',
      type: 'REVERSAL', isActive: true,
      conditions: { rsiMin: 30, rsiMax: 50, buyerSellerRatioMin: 1.2, priceMin: 100 },
      tradeConfig: { transactionType: 'BUY', orderType: 'LIMIT', product: 'CNC', stopLoss: 1.5, takeProfit: 4 },
      expectedWinRate: '65-70%',
      createdAt: new Date('2026-11-09'),
    },
    {
      _id: 'strat_004', userId: 'default',
      name: 'Volume Spike Catcher',
      description: 'Enters on unusual volume (> 2× average)',
      type: 'MOMENTUM', isActive: false,
      conditions: { volumeChangeMin: 100, priceMin: 50 },
      tradeConfig: { transactionType: 'BUY', orderType: 'MARKET', product: 'CNC', stopLoss: 2, takeProfit: 4 },
      expectedWinRate: '50-55%',
      createdAt: new Date('2026-11-12'),
    },
    {
      _id: 'strat_005', userId: 'default',
      name: 'Intraday Scalper',
      description: 'Quick 0.5–1% intraday profits above VWAP',
      type: 'CUSTOM', isActive: false,
      conditions: { priceAboveVWAP: true, volumeChangeMin: 20 },
      tradeConfig: { transactionType: 'BUY', orderType: 'MARKET', product: 'MIS', stopLoss: 0.5, takeProfit: 1 },
      expectedWinRate: '60-65%',
      createdAt: new Date('2026-11-15'),
    },
  ];
  memoryStore.seed('strategies', strategies);

  logger.info('🌱 Demo seed complete — trades and strategies loaded into memory store');
}

module.exports = seedDemo;
