const express = require('express');
const router = express.Router();
const demoController = require('../controllers/demo.controller');

router.get('/mode', demoController.getMode);
router.post('/mode', demoController.setMode);

module.exports = router;
