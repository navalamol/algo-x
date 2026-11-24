const portfolioIntelligenceService = require('../services/portfolio-intelligence.service');

exports.analyze = async (req, res) => {
  try {
    const { profile = 'amol' } = req.query;
    const data = await portfolioIntelligenceService.analyze(profile);
    res.json({ success: true, data });
  } catch (err) {
    console.error('Portfolio intelligence error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
