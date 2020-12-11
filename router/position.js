const express = require('express');
const router = express.Router();
const { auth } = require('../utils');
const { addBalance } = require('../utils/addBalance');
const { positionController } = require('../controllers');


router.get('/list', auth(), addBalance, positionController.getAllPositions);
router.get('/details/:id', auth(), addBalance, positionController.getDetailsForPosition);
router.get('/history', auth(), addBalance, positionController.getHistory);
router.post('/create', auth(), positionController.createPosition);
router.put('/edit/:id', auth(), positionController.editPosition);
router.put('/close/:id', auth(), positionController.closePosition);


module.exports = router;