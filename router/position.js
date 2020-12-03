const express = require('express');
const router = express.Router();
const { auth } = require('../utils');
const { positionController } = require('../controllers');

router.get('/list', auth(), positionController.getAllPositions);
router.get('/history', auth(), positionController.getHistory);
router.post('/create', auth(), positionController.createPosition);

module.exports = router;