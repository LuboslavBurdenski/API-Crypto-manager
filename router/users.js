const express = require('express');
const router = express.Router();
const { authController } = require('../controllers');
const { auth } = require('../utils');
const { statisticsController } = require('../controllers');


router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

router.get('/profile', auth(),authController.getProfileInfo);
router.put('/profile', auth(),authController.editProfileInfo)

router.get('/statistics/month', auth(), statisticsController.getStatsByMonth);
router.get('/statistics/segment', auth(), statisticsController.getStatsBySegment);
router.get('/statistics/averages', auth(), statisticsController.getAverages);
// router.get('/confirm-user', auth(false), authController.confirmUser);
// router.get('/user/:id', authController.getUserInfo);

module.exports = router