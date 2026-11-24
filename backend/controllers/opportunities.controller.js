const opportunityService = require('../services/opportunity.service');
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
