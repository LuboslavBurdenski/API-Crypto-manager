const {
    userModel,
    tokenBlacklistModel
} = require('../models');

const utils = require('../utils');
const { authCookieName } = require('../app-config');

const bsonToJson = (data) => { return JSON.parse(JSON.stringify(data)) };
const removePassword = (data) => {
    const { password, __v, ...userData } = data;
    return userData
}



function register(req, res, next) {
    const { username, email, password, repeatPassword, balance } = req.body;

    console.log(username, email, password, balance);
    return userModel.create({ username, email, password, balance })
        .then((createdUser) => {
            createdUser = bsonToJson(createdUser);
            createdUser = removePassword(createdUser);

            const token = utils.jwt.createToken({ id: createdUser._id });
            if (process.env.NODE_ENV === 'production') {
                res.cookie(authCookieName, token, { httpOnly: true, sameSite: 'none', secure: true })
            } else {
                res.cookie(authCookieName, token, { httpOnly: true })
            }
            res.status(200).send({ message: 'Successfully registered account in USD.\nNow you are logged in!', user: createdUser });
        })
        .catch(err => {
            if (err.name === 'MongoError' && err.code === 11000) {
                let field = err.message.split("index: ")[1];
                field = field.split(" dup key")[0];
                field = field.substring(0, field.lastIndexOf("_"));

                res.status(409).send({ message: `This ${field} is already registered!` });
                return;
            }
            next(err);
        });
}

function login(req, res, next) {
    const { username, password } = req.body;

    userModel.findOne({ username })
        .then(user => {
            return Promise.all([user, user ? user.matchPassword(password) : false]);
        })
        .then(([user, match]) => {
            if (!match) {
                res.status(401)
                    .send({ message: 'Wrong username or password' });
                return
            }
            user = bsonToJson(user);
            user = removePassword(user);

            const token = utils.jwt.createToken({ id: user._id });

            if (process.env.NODE_ENV === 'production') {
                res.cookie(authCookieName, token, { httpOnly: true, sameSite: 'none', secure: true })
            } else {
                res.cookie(authCookieName, token, { httpOnly: true })
                console.log(token);
                console.log(authCookieName);

            }

            res.status(200)
                .send({ message: 'Successfully logged in!', user: user });
        })
        .catch(next);
}

function logout(req, res) {
    const token = req.cookies[authCookieName];
    console.log(token);

    tokenBlacklistModel.create({ token })
        .then(() => {

            res.clearCookie(authCookieName)
                .status(200)
                .json({ message: 'Successfully logged out!' });
        })
        .catch(err => res.send(err));
}

function getProfileInfo(req, res, next) {
    console.log('profile');
    const { _id: userId } = req.user;

    userModel.findById(userId)
        .then((user) => {
            req.user = user;
            let userData = {
                userId: user._id,
                email: user.email,
                username: user.username,
                balance: user.balance
            };
            res.status(200).json(userData);
        })
        .catch(e => console.log(e));
}

function editProfileInfo(req, res, next) {
    const { _id: userId } = req.user;
    const { tel, username, email } = req.body;
    userModel.findOneAndUpdate({ _id: userId }, { tel, username, email }, { runValidators: true, new: true })
        .then(x => { res.status(200).json(x) })
        .catch(next);
}
function getUserProfile() {
    return userProfile;
}
module.exports = {
    login,
    register,
    logout,
    getProfileInfo,
    editProfileInfo,

}
