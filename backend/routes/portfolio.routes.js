const express = require('express');
const router = express.Router();
const controller = require('../controllers/portfolio.controller');

router.get('/intelligence', controller.analyze);

module.exports = router;
