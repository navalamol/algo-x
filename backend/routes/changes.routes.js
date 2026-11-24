const express = require('express');
const router = express.Router();
const controller = require('../controllers/changes.controller');

router.get('/', controller.getChanges);
router.post('/snapshot', controller.takeSnapshot);

module.exports = router;
