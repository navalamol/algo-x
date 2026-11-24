const express = require('express');
const router = express.Router();
const controller = require('../controllers/opportunities.controller');

router.get('/', controller.getOpportunities);
router.get('/:symbol/evidence', controller.getEvidence);

module.exports = router;
