const { isDemoMode, setDemoModeOverride, getDemoModeOverride } = require('../config/kite.config');
const memoryStore = require('../services/memory-store.service');
const logger = require('../utils/logger');

exports.getMode = (req, res) => {
  res.json({ success: true, enabled: isDemoMode() });
};

exports.setMode = (req, res) => {
  const { enabled } = req.body;
  if (typeof enabled !== 'boolean') {
    return res.status(400).json({ success: false, error: '`enabled` must be a boolean' });
  }

  setDemoModeOverride(enabled);

  // If enabling demo mode and MemoryStore is empty, re-seed now
  if (enabled) {
    const tradeCount = memoryStore.trades.size;
    if (tradeCount === 0) {
      try {
        const seedDemo = require('../services/demo-seed.service');
        seedDemo();
        logger.info('🌱 Re-seeded demo data via runtime toggle');
      } catch (err) {
        logger.warn('Could not re-seed demo data:', err.message);
      }
    }
  }

  res.json({ success: true, enabled });
};
