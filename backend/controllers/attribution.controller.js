const attributionService = require('../services/attribution.service');
const { isDemoMode } = require('../config/kite.config');
const mockService = require('../services/mock.service');

exports.getAttribution = (req, res) => {
  const profile = req.query.profile || 'amol';

  if (isDemoMode()) {
    const demo = mockService.getAttributionData();
    return res.json(demo);
  }

  const result = attributionService.getAttribution(profile);
  if (!result.success) return res.status(400).json(result);
  res.json(result);
};
