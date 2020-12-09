const router = require('express').Router();
const users = require('./users');
const coins = require('./coins')
const position = require('./position');

router.use('/coins', coins);
router.use('/position', position);
router.use('/users', users);

module.exports = router;
