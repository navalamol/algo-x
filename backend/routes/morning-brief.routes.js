const express = require('express');
const router = express.Router();
const controller = require('../controllers/morning-brief.controller');

router.get('/', controller.getBrief);

module.exports = router;
