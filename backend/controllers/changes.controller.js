const changeDetectionService = require('../services/change-detection.service');
const logger = require('../utils/logger');

exports.getChanges = async (req, res) => {
  try {
    const data = await changeDetectionService.getChanges();
    res.json({ success: true, data });
  } catch (err) {
    logger.error('Changes controller error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.takeSnapshot = async (req, res) => {
  try {
    const result = await changeDetectionService.takeSnapshot();
    res.json({ success: true, data: result });
  } catch (err) {
    logger.error('Snapshot controller error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};
