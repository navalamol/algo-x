const indicatorsService = require('./indicators.service');

// Generate synthetic OHLCV history for a symbol over N days
function generateOHLCV(symbol, days, startPrice) {
  const data = [];
  let price = startPrice || 500 + Math.random() * 1000;
  const now = Date.now();
  for (let i = days; i >= 0; i--) {
    const d = new Date(now - i * 86400000);
    if (d.getDay() === 0 || d.getDay() === 6) continue; // skip weekends
    const change = (Math.random() - 0.48) * price * 0.025;
    const open = price;
    const close = Math.max(10, price + change);
    const high = Math.max(open, close) * (1 + Math.random() * 0.01);
    const low  = Math.min(open, close) * (1 - Math.random() * 0.01);
    const volume = Math.floor(50000 + Math.random() * 200000);
    data.push({ date: d.toISOString().slice(0, 10), open, high, low, close, volume });
    price = close;
  }
  return data;
}

// Evaluate one candle against strategy conditions
function evaluateConditions(conditions, indicators, bar) {
  const { rsi, sma20, sma50, vwap, macd, bb, volume, avgVolume } = indicators;

  if (conditions.rsiMin !== undefined && rsi !== null && rsi < conditions.rsiMin) return false;
  if (conditions.rsiMax !== undefined && rsi !== null && rsi > conditions.rsiMax) return false;
  if (conditions.sma20Above50 && sma20 !== null && sma50 !== null && sma20 <= sma50) return false;
  if (conditions.priceAboveVWAP && vwap !== null && bar.close <= vwap) return false;
  if (conditions.priceBelowVWAP && vwap !== null && bar.close >= vwap) return false;
  if (conditions.macdBullish && (!macd || macd.histogram <= 0)) return false;
  if (conditions.bbBreakoutUpper && bb !== null && bar.close <= bb.upper) return false;
  if (conditions.bbBreakoutLower && bb !== null && bar.close >= bb.lower) return false;
  if (conditions.volumeChangeMin !== undefined && avgVolume > 0) {
    const pct = ((volume - avgVolume) / avgVolume) * 100;
    if (pct < conditions.volumeChangeMin) return false;
  }
  if (conditions.priceMin !== undefined && bar.close < conditions.priceMin) return false;
  if (conditions.priceMax !== undefined && bar.close > conditions.priceMax) return false;
  return true;
}

function computeIndicators(candles, idx) {
  const closes = candles.slice(0, idx + 1).map(c => c.close);
  const rsi    = indicatorsService.calculateRSI(closes, 14);
  const sma20  = indicatorsService.calculateSMA(closes, 20);
  const sma50  = indicatorsService.calculateSMA(closes, 50);
  const macd   = indicatorsService.calculateMACD(closes);
  const bb     = indicatorsService.calculateBollingerBands(closes, 20);

  const volumeWindow = candles.slice(Math.max(0, idx - 20), idx).map(c => c.volume);
  const avgVolume = volumeWindow.length > 0
    ? volumeWindow.reduce((s, v) => s + v, 0) / volumeWindow.length : 0;

  // Simple VWAP over trailing 20 bars
  const vwapWindow = candles.slice(Math.max(0, idx - 20), idx + 1);
  const vwap = indicatorsService.calculateVWAP(vwapWindow.map(c => ({ price: c.close, volume: c.volume })));

  return { rsi, sma20, sma50, macd, bb, vwap, volume: candles[idx].volume, avgVolume };
}

function runBacktest({ candles, strategy, capital, slippage = 0.1, brokerage = 20 }) {
  const { conditions = {}, tradeConfig = {} } = strategy;
  const stopLossPct  = tradeConfig.stopLoss   || 2;
  const takeProfitPct = tradeConfig.takeProfit || 5;
  const isBuy = (tradeConfig.transactionType || 'BUY') === 'BUY';

  let cash = capital;
  let position = null; // { entryPrice, qty, entryDate, entryIdx }
  const trades = [];
  const equity = [{ date: candles[0]?.date || '0', value: capital }];

  for (let i = 50; i < candles.length; i++) {
    const bar = candles[i];
    const indic = computeIndicators(candles, i);

    // ── Check stop-loss / take-profit on open position ──
    if (position) {
      const { entryPrice, qty } = position;
      let exitReason = null;
      let exitPrice = bar.close;

      if (isBuy) {
        const pct = ((bar.close - entryPrice) / entryPrice) * 100;
        if (bar.low <= entryPrice * (1 - stopLossPct / 100)) {
          exitPrice = entryPrice * (1 - stopLossPct / 100);
          exitReason = 'STOP_LOSS';
        } else if (bar.high >= entryPrice * (1 + takeProfitPct / 100)) {
          exitPrice = entryPrice * (1 + takeProfitPct / 100);
          exitReason = 'TAKE_PROFIT';
        } else if (i === candles.length - 1) {
          exitReason = 'END';
        }
      }

      if (exitReason) {
        const proceeds = exitPrice * qty * (1 - slippage / 100) - brokerage;
        cash += proceeds;
        const pnl = proceeds - (entryPrice * qty + brokerage);
        trades.push({
          entryDate: position.entryDate,
          exitDate: bar.date,
          entryPrice: Math.round(entryPrice * 100) / 100,
          exitPrice: Math.round(exitPrice * 100) / 100,
          qty,
          pnl: Math.round(pnl * 100) / 100,
          exitReason,
          rsiAtEntry: position.rsiAtEntry,
        });
        position = null;
      }
    }

    // ── Check entry conditions (no open position) ──
    if (!position && evaluateConditions(conditions, indic, bar)) {
      const entryPrice = bar.close * (1 + slippage / 100);
      const tradeable = cash * 0.95; // use 95% of cash
      const qty = Math.floor(tradeable / entryPrice);
      if (qty > 0) {
        cash -= entryPrice * qty + brokerage;
        position = { entryPrice, qty, entryDate: bar.date, rsiAtEntry: indic.rsi };
      }
    }

    // Record equity each day
    const positionValue = position ? position.qty * bar.close : 0;
    equity.push({ date: bar.date, value: Math.round((cash + positionValue) * 100) / 100 });
  }

  return { trades, equity };
}

function computeMetrics(trades, initialCapital, equity) {
  if (trades.length === 0) {
    return {
      totalTrades: 0, wins: 0, losses: 0, winRate: 0,
      netPnL: 0, grossProfit: 0, grossLoss: 0,
      avgWin: 0, avgLoss: 0, profitFactor: 0,
      maxDrawdown: 0, maxDrawdownPct: 0,
      finalCapital: initialCapital, totalReturn: 0,
      sharpeApprox: 0,
    };
  }

  const wins   = trades.filter(t => t.pnl > 0);
  const losses = trades.filter(t => t.pnl <= 0);
  const grossProfit = wins.reduce((s, t) => s + t.pnl, 0);
  const grossLoss   = Math.abs(losses.reduce((s, t) => s + t.pnl, 0));
  const netPnL = trades.reduce((s, t) => s + t.pnl, 0);

  // Max drawdown from equity curve
  let peak = initialCapital, maxDD = 0, maxDDPct = 0;
  for (const p of equity) {
    if (p.value > peak) peak = p.value;
    const dd = peak - p.value;
    const ddPct = peak > 0 ? (dd / peak) * 100 : 0;
    if (dd > maxDD) { maxDD = dd; maxDDPct = ddPct; }
  }

  const finalCapital = equity[equity.length - 1]?.value ?? initialCapital;
  const totalReturn  = ((finalCapital - initialCapital) / initialCapital) * 100;

  // Simple Sharpe approximation (daily returns)
  const returns = equity.slice(1).map((p, i) => {
    const prev = equity[i].value;
    return prev > 0 ? (p.value - prev) / prev : 0;
  });
  const meanR = returns.reduce((s, r) => s + r, 0) / returns.length;
  const stdR  = Math.sqrt(returns.reduce((s, r) => s + Math.pow(r - meanR, 2), 0) / returns.length);
  const sharpeApprox = stdR > 0 ? (meanR / stdR) * Math.sqrt(252) : 0;

  return {
    totalTrades:  trades.length,
    wins:         wins.length,
    losses:       losses.length,
    winRate:      Math.round((wins.length / trades.length) * 10000) / 100,
    netPnL:       Math.round(netPnL * 100) / 100,
    grossProfit:  Math.round(grossProfit * 100) / 100,
    grossLoss:    Math.round(grossLoss * 100) / 100,
    avgWin:       wins.length   ? Math.round((grossProfit / wins.length)  * 100) / 100 : 0,
    avgLoss:      losses.length ? Math.round((grossLoss   / losses.length) * 100) / 100 : 0,
    profitFactor: grossLoss > 0 ? Math.round((grossProfit / grossLoss) * 100) / 100 : (grossProfit > 0 ? 999 : 0),
    maxDrawdown:    Math.round(maxDD    * 100) / 100,
    maxDrawdownPct: Math.round(maxDDPct * 100) / 100,
    finalCapital:   Math.round(finalCapital * 100) / 100,
    totalReturn:    Math.round(totalReturn  * 100) / 100,
    sharpeApprox:   Math.round(sharpeApprox * 100) / 100,
  };
}

module.exports = { runBacktest, generateOHLCV, computeMetrics };
