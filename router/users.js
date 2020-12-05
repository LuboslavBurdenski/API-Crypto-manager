const express = require('express');
const router = express.Router();
const { authController } = require('../controllers');
const { auth } = require('../utils');

// middleware that is specific to this router

// define the home page route
// router.get('/login', function (req, res) {
//   res.send('login page')
// })

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

router.get('/profile', auth(),authController.getProfileInfo);
router.put('/profile', auth(),authController.editProfileInfo);

// router.get('/confirm-user', auth(false), authController.confirmUser);
// router.get('/user/:id', authController.getUserInfo);

module.exports = router