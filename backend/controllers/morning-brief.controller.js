const morningBriefService = require('../services/morning-brief.service');
const logger = require('../utils/logger');

exports.getBrief = async (req, res) => {
  try {
    const brief = await morningBriefService.assembleBrief();
    res.json({ success: true, data: brief });
  } catch (err) {
    logger.error('Morning brief controller error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};
