const opportunityService = require('../services/opportunity.service');
const evidenceService = require('../services/evidence.service');
const logger = require('../utils/logger');

exports.getOpportunities = async (req, res) => {
  try {
    const data = await opportunityService.getRankedOpportunities();
    res.json({ success: true, data });
  } catch (err) {
    logger.error('Opportunities controller error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getEvidence = async (req, res) => {
  try {
    const { symbol } = req.params;
    if (!symbol || typeof symbol !== 'string' || !/^[A-Z0-9&_-]{1,20}$/.test(symbol.toUpperCase())) {
      return res.status(400).json({ success: false, message: 'Invalid symbol' });
    }
    const data = await evidenceService.getEvidence(symbol.toUpperCase());
    res.json({ success: true, data });
  } catch (err) {
    logger.error('Evidence controller error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};
