const express = require('express');
const router = express.Router();
const { auth } = require('../utils');
const coinsController = require('../controllers/coinsController');

router.get('/', coinsController.getTop100Coins);

module.exports = router;