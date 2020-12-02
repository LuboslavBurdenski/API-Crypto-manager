const express = require('express');
const router = express.Router();
const { auth } = require('../utils');
const { positionController } = require('../controllers');

//router.get('/',);
router.get('/list', auth(), positionController.getAllPositions);
router.post('/create', auth(), positionController.createPosition);

module.exports = router;