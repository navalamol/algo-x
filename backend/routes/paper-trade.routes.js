const express = require('express');
const router = express.Router();
const paperTradeController = require('../controllers/paper-trade.controller');

// POST /api/paper-trade/quick — place a paper trade from an opportunity
router.post('/quick', paperTradeController.quickTrade);

module.exports = router;
