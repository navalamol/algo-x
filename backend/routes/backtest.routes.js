const express = require('express');
const router = express.Router();
const backtestController = require('../controllers/backtest.controller');

router.post('/run', backtestController.run);
router.get('/strategies', backtestController.getStrategies);

module.exports = router;
