const router = require('express').Router();
const users = require('./users');
const themes = require('./themes');
const posts = require('./posts');
const likes = require('./likes');
const test = require('./test');
const coins = require('./coins')
const position = require('./position');

router.use('/coins', coins);
router.use('/position', position);
router.use('/users', users);

router.use('/themes', themes);
router.use('/posts', posts);
router.use('/likes', likes);
router.use('/test', test);

module.exports = router;
