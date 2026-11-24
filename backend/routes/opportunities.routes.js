const express = require('express');
const router = express.Router();
const controller = require('../controllers/opportunities.controller');

router.get('/', controller.getOpportunities);

module.exports = router;
