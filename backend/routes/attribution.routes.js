const express = require('express');
const router  = express.Router();
const { getAttribution } = require('../controllers/attribution.controller');

router.get('/', getAttribution);

module.exports = router;
