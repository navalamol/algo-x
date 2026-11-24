const express = require('express');
const router = express.Router();
const scannerController = require('../controllers/scanner.controller');

router.get('/templates', scannerController.getTemplates);
router.post('/run', scannerController.runScan);
router.get('/results', scannerController.getResults);
router.post('/symbols', scannerController.setSymbols);

// Watch mode
router.get('/watching', scannerController.getWatching);
router.post('/watch/:templateId', scannerController.startWatch);
router.delete('/watch/:templateId', scannerController.stopWatch);

module.exports = router;
