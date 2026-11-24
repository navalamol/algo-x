const path = require('path');
const fs   = require('fs');
const logger = require('../utils/logger');

const SAMPLE_LABEL = (n) => {
  if (n >= 100) return 'Strong personal dataset';
  if (n >= 50)  return 'Meaningful personal evidence';
  if (n >= 20)  return 'Useful directional evidence';
  if (n >= 10)  return 'Early evidence';
  if (n >= 1)   return 'Very low sample — directional only';
  return 'No data yet';
};

function computeMetrics(trades) {
  const completed = trades.filter(t => t.status === 'COMPLETE' && t.pnl != null);
  const count = completed.length;
  if (count === 0) {
    return { count: 0, winRate: null, avgPnl: null, totalPnl: null, profitFactor: null, avgRR: null, sampleLabel: SAMPLE_LABEL(0) };
  }

  const winners = completed.filter(t => t.pnl > 0);
  const losers  = completed.filter(t => t.pnl <= 0);
  const winRate = Math.round((winners.length / count) * 100);
  const totalPnl = completed.reduce((s, t) => s + t.pnl, 0);
  const avgPnl = totalPnl / count;

  const sumWin  = winners.reduce((s, t) => s + t.pnl, 0);
  const sumLoss = Math.abs(losers.reduce((s, t) => s + t.pnl, 0));
  const profitFactor = sumLoss > 0 ? parseFloat((sumWin / sumLoss).toFixed(2)) : null;

  const rrTrades = completed.filter(t => t.stopLoss && t.target && t.entryPrice);
  const avgRR = rrTrades.length > 0
    ? parseFloat((rrTrades.reduce((s, t) => {
        const reward = t.target - t.entryPrice;
        const risk   = t.entryPrice - t.stopLoss;
        return risk > 0 ? s + reward / risk : s;
      }, 0) / rrTrades.length).toFixed(2))
    : null;

  return {
    count,
    winRate,
    avgPnl: parseFloat(avgPnl.toFixed(2)),
    totalPnl: parseFloat(totalPnl.toFixed(2)),
    profitFactor,
    avgRR,
    sampleLabel: SAMPLE_LABEL(count),
  };
}

class AttributionService {
  getAttribution(profile = 'amol') {
    try {
      const tradesPath = path.join(__dirname, '../../profiles', profile, 'trades.json');
      if (!fs.existsSync(tradesPath)) {
        return { success: false, message: 'No trades file found for profile' };
      }
      const trades = JSON.parse(fs.readFileSync(tradesPath, 'utf8'));

      const intelTrades  = trades.filter(t => t.intelligence?.sourceFlow === 'opportunity');
      const manualTrades = trades.filter(t => !t.intelligence?.sourceFlow);

      const bands = [
        { band: '75+',   label: '75–100',   min: 75, max: 100 },
        { band: '60-74', label: '60–74',    min: 60, max: 74  },
        { band: '45-59', label: '45–59',    min: 45, max: 59  },
        { band: '<45',   label: 'Below 45', min: 0,  max: 44  },
      ];

      const scoreBands = bands.map(b => {
        const bandTrades = intelTrades.filter(t => {
          const s = t.intelligence?.opportunityScore;
          return s != null && s >= b.min && s <= b.max;
        });
        return { ...b, ...computeMetrics(bandTrades) };
      });

      return {
        success: true,
        data: {
          generatedAt: new Date().toISOString(),
          dataSource: 'LIVE',
          totalTrades: trades.length,
          intelTrades: {
            ...computeMetrics(intelTrades),
            openCount: intelTrades.filter(t => t.status === 'OPEN').length,
          },
          manualTrades: {
            ...computeMetrics(manualTrades),
            openCount: manualTrades.filter(t => t.status === 'OPEN').length,
          },
          scoreBands,
        },
      };
    } catch (err) {
      logger.error('[attribution] getAttribution error:', err.message);
      return { success: false, message: err.message };
    }
  }
}

module.exports = new AttributionService();
