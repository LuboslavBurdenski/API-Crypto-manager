const { userModel } = require('../models');

function addBalance(req, res, next) {
    if (req.user != undefined) {
        const { _id: userId } = req.user;
        let balance;
        userModel.findById(userId)
            .then(user => {
                balance = user.balance;
                res.set('User-Balance', balance);
                res.set('Access-Control-Expose-Headers', 'User-Balance');
            }).catch(next);
       return next();
    } else {
       return next();
    }
};

module.exports = { addBalance };
