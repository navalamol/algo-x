const path = require('path');
const fs   = require('fs');
const logger = require('../utils/logger');
const { isDemoMode, isDemoModeDb } = require('../config/kite.config');
const memoryStore = require('../services/memory-store.service');
const paperTradingService = require('../services/paper-trading.service');

/**
 * POST /api/paper-trade/quick
 * Place a quick paper trade originated from an Opportunity card.
 * Body: { symbol, quantity, entryPrice, stopLoss, target, opportunityScore, matchedStrategy, signals }
 */
exports.quickTrade = async (req, res) => {
  try {
    const { symbol, quantity, entryPrice, stopLoss, target, opportunityScore, matchedStrategy, signals, scoreFactors, sector, evidenceSnapshot } = req.body;

    // Validate required fields
    if (!symbol || !quantity || !entryPrice) {
      return res.status(400).json({ success: false, message: 'symbol, quantity, entryPrice are required' });
    }
    if (!/^[A-Z0-9&_-]{1,20}$/.test(symbol.toUpperCase())) {
      return res.status(400).json({ success: false, message: 'Invalid symbol' });
    }
    const qty = parseInt(quantity, 10);
    const price = parseFloat(entryPrice);
    if (isNaN(qty) || qty <= 0 || isNaN(price) || price <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid quantity or entryPrice' });
    }

    const intelligence = {
      opportunityScore: opportunityScore || null,
      scoreFactors: scoreFactors || null,
      matchedStrategy: matchedStrategy || null,
      signals: signals || [],
      sector: sector || null,
      evidenceSnapshot: evidenceSnapshot || null,
      sourceFlow: 'opportunity',
    };

    if (isDemoMode() || isDemoModeDb()) {
      // Demo mode: create a trade record directly in memoryStore
      const tradeData = {
        tradingSymbol: symbol.toUpperCase(),
        exchange: 'NSE',
        transactionType: 'BUY',
        quantity: qty,
        entryPrice: price,
        exitPrice: null,
        status: 'OPEN',
        pnl: null,
        pnlPercentage: null,
        isPaperTrade: true,
        strategyName: matchedStrategy || 'Intelligence Quick Trade',
        stopLoss: stopLoss ? parseFloat(stopLoss) : null,
        target: target ? parseFloat(target) : null,
        intelligence,
        userId: 'default',
        timestamp: new Date().toISOString(),
      };
      const created = await memoryStore.create('trades', tradeData);

      try {
        const tradesPath = path.join(__dirname, '../../profiles/amol/trades.json');
        const existing = JSON.parse(fs.readFileSync(tradesPath, 'utf8'));
        existing.push({ ...tradeData, _id: created._id });
        fs.writeFileSync(tradesPath, JSON.stringify(existing, null, 2));
      } catch (persistErr) {
        logger.warn('[paper-trade] Could not persist to profile file:', persistErr.message);
      }

      logger.info(`[paper-trade] Quick trade placed (demo): ${qty} ${symbol} @ ₹${price}`);
      return res.status(201).json({
        success: true,
        data: {
          tradeId: created._id,
          symbol: symbol.toUpperCase(),
          quantity: qty,
          entryPrice: price,
          stopLoss: tradeData.stopLoss,
          target: tradeData.target,
          status: 'OPEN',
          intelligence,
          message: `Paper trade opened: ${qty} × ${symbol} @ ₹${price.toFixed(2)}`,
        },
      });
    }

    // Live mode: route through PaperTradingService
    const result = await paperTradingService.placeOrder({
      tradingSymbol: symbol.toUpperCase(),
      transactionType: 'BUY',
      quantity: qty,
      orderType: 'MARKET',
      price,
      product: 'CNC',
    });

    if (!result.success) {
      return res.status(400).json({ success: false, message: result.error });
    }

    // Persist intelligence metadata in memoryStore for journal rendering
    const tradeRecord = {
      tradingSymbol: symbol.toUpperCase(),
      exchange: 'NSE',
      transactionType: 'BUY',
      quantity: qty,
      entryPrice: price,
      exitPrice: null,
      status: 'OPEN',
      pnl: null,
      isPaperTrade: true,
      strategyName: matchedStrategy || 'Intelligence Quick Trade',
      stopLoss: stopLoss ? parseFloat(stopLoss) : null,
      target: target ? parseFloat(target) : null,
      intelligence,
      userId: 'default',
      timestamp: new Date().toISOString(),
    };
    const created = await memoryStore.create('trades', tradeRecord);

    try {
      const tradesPath = path.join(__dirname, '../../profiles/amol/trades.json');
      const existing = JSON.parse(fs.readFileSync(tradesPath, 'utf8'));
      existing.push({ ...tradeRecord, _id: created._id });
      fs.writeFileSync(tradesPath, JSON.stringify(existing, null, 2));
    } catch (persistErr) {
      logger.warn('[paper-trade] Could not persist to profile file:', persistErr.message);
    }

    logger.info(`[paper-trade] Quick trade placed (live): ${qty} ${symbol} @ ₹${price}`);
    res.status(201).json({
      success: true,
      data: {
        tradeId: created._id,
        symbol: symbol.toUpperCase(),
        quantity: qty,
        entryPrice: price,
        stopLoss: tradeRecord.stopLoss,
        target: tradeRecord.target,
        status: 'OPEN',
        intelligence,
        accountSummary: result.accountSummary,
        message: `Paper trade opened: ${qty} × ${symbol} @ ₹${price.toFixed(2)}`,
      },
    });
  } catch (err) {
    logger.error('[paper-trade] quickTrade error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};
