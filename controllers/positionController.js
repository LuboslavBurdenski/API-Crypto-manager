let positionModel = require('../models/postModel');
let userModel = require('../models/userModel');
let coinData = require('../nodeCron/nodeCron');
let updatedCoins = require('../controllers/coinsController');
const { addBalance } = require('../utils/addBalance');

function createPosition(req, res, next) {
    const { _id: userId } = req.user;
    let { symbol, coinId, entry, stop, sum, notes, target, shares } = req.body;
    entry = +entry;
    target = +target;
    stop = +stop;
    sum = +sum;

    let dataForSelectedCoin = JSON.parse(coinData.dataGet()).find(coin => coin.id === coinId);

    let changeIn24h = dataForSelectedCoin.price_change_percentage_24h_in_currency;
    let currentPrice = 0;
    let prfLoss = 0
    let prfLossPerCent = 0;

    let allShares;
    let allSum;
    let avgEntry;
    userModel.findById(userId)
        .populate({
            path: 'positions',
            match: { isOpen: true },
        })
        .then(r => {
            let isExists = r.positions.filter((trade) => trade.symbol === symbol)[0];
            if (!!isExists) {
                let user = req.user;
                allSum = isExists.sum + sum;
                allShares = isExists.shares + shares;
                avgEntry = allSum / allShares;
                let balance = Number(user.balance) - sum;
                console.log('pos update in');
                positionModel
                    .findOneAndUpdate({ _id: isExists._id }, { entry: avgEntry, sum: allSum, shares: allShares })
                    .then(result => {
                        res.status(200).json({ message: 'Successfully added to the older position!' })
                    })
                    .catch(next);
                userModel.updateOne({ _id: userId }, { balance: balance })
                    .then((result) => {
                        console.log(result);
                        res.status(200).json({ message: 'Successfully opened position!' });
                    })
                    .catch(next);
            } else {
                console.log('pos update out');
                let user = req.user;
                console.log(user);
                let balance = Number(user.balance) - sum;
                positionModel.create({
                    symbol, coinId, entry, sum, shares, target, stop, currentPrice, prfLoss, prfLossPerCent,
                    changeIn24h, notes, creator: userId
                })
                    .then(newPosition => {
                        userModel.updateOne({ _id: userId }, { $push: { positions: newPosition._id }, balance: balance })
                            .then((result) => {
                                console.log(result);
                                res.status(200).json({ message: 'Successfully opened position!' });
                            })
                            .catch(next);
                    })
                    .catch(next);
            }
        })
        .catch(e => console.log(e));
}

function getAllPositions(req, res, next) {
    const { _id } = req.user;
    let userPositions;

    res.set('Content-Type', 'text/event-stream');
    res.set('Cache-Control', 'no - cache');
    res.set('Connection', 'keep-alive');

    userModel.findById(_id)
        .populate({
            path: 'positions',
            match: { isOpen: true },
        })
        .then((result) => {
            userPositions = result
            setTimeout(function () {
                console.log('firstOne');
                let date = new Date(); //to capture the timestamp of the request
                console.log('executing request');
                res.write('event:' + 'timestamp\n');
                res.write('data:' + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds() + '\n\n');
                res.write('data:' + JSON.stringify(userPositions.positions) + '\n\n');
            }, 0);


            let interval = setInterval(function () {
                let date = new Date(); //to capture the timestamp of the request
                console.log('executing request');
                res.write('event:' + 'timestamp\n');
                res.write('data:' + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds() + '\n\n');
                res.write('data:' + JSON.stringify(userPositions.positions) + '\n\n');
        
            }, 5000);
            req.on('close', () => {
                console.log('connection closed');
                clearInterval(interval);
                res.end();
            });
        }
        )
        .catch(next)

   
};


function getDetailsForPosition(req, res, next) {
    const { _id: userId } = req.user;
    const coinSymbol = req.params.id.toLowerCase();
    let coinDetail;
    userModel.findById(userId)
        .populate({
            path: 'positions',
            match: { isOpen: true, symbol: coinSymbol },
        })
        .then((result) => {
            coinDetail = result.positions[0];
            res.status(200).json(coinDetail);
        }
        )
        .catch(next)
}

function editPosition(req, res, next) {
    const { _id: userId } = req.user;
    const coinSymbol = req.params.id.toLowerCase();
    let { target, stop } = req.body;
    userModel.findById(userId)
        .populate({
            path: 'positions',
            match: {
                isOpen: true,
                symbol: coinSymbol
            },
        })
        .then(({ positions }) => {
            let posId = positions[0]._id;
            positionModel.findByIdAndUpdate({ _id: posId }, { target: target, stop: stop })
                .then(result => res.status(200).json(result))
        })
        .catch(next)

}
function closePosition(req, res, next) {
    const { _id: userId } = req.user;
    const coinSymbol = req.params.id.toLowerCase();
    let { sum } = req.body;
    userModel.findById(userId)
        .populate({
            path: 'positions',
            match: {
                isOpen: true,
                symbol: coinSymbol
            },
        })
        .then(({ positions, balance }) => {
            let posId = positions[0]._id;

            positionModel.findById(posId)
                .then(result => {
                    console.log(result);
                    if (result.sum === sum) {
                        let newBalance = Number(balance) + Number(result.prfLoss) + Number(sum);

                        positionModel.findOneAndUpdate({ _id: posId }, { isOpen: false })
                            .then((result) => {
                                console.log(result);
                            })
                            .catch(next);
                        userModel.findOneAndUpdate({ _id: userId }, { balance: newBalance })
                            .then((result) => {
                                console.log(result);
                                res.status(200).json({ message: 'Successfully closed position!' });
                            })
                            .catch(next);

                    } else {
                        let newSum = result.sum - sum;
                        let closingPart = (sum / result.sum);
                        let newBalance = Number(balance) + (closingPart * result.prfLoss);
                        let newShares = closingPart * result.shares;
                        let newPrfLoss = closingPart * result.prfLoss;
                        let newPrfLossPercent = result.prfLossPerCent;


                        let newSharesForTheMainPos = result.shares - newShares;
                        positionModel.create({
                            isOpen: false, symbol: result.symbol, coinId: result.coinId, entry: result.entry, sum: sum, shares: newShares,
                            target: result.target, stop: result.stop, currentPrice: result.currentPrice,
                            prfLoss: newPrfLoss, prfLossPerCent: newPrfLossPercent, creator: userId
                        })
                            .then(newPositionForHistory => {
                                console.log(newPositionForHistory);
                                userModel.updateOne({ _id: userId }, { $push: { positions: newPositionForHistory._id }, balance: newBalance })
                                    .then((result) => {
                                        console.log(result);
                                    })
                                    .catch(next);
                            })
                            .catch(next)
                        positionModel.findByIdAndUpdate({ _id: posId }, { sum: newSum, shares: newSharesForTheMainPos })
                            .then(() => res.status(200).json({ message: 'Successfully partially closed position!' }))
                            .catch(next)
                    }
                })
                .catch(next)
        })
        .catch(next)

}
function getHistory(req, res, next) {
    const { _id: userId } = req.user;
    let positions = [];
    let size = Number(req.query.limit) || positions.length;
    let offset = Number(req.query.offset) * size || 0;
    Promise.all([
        userModel.findById(userId).populate({ path: 'positions', match: { isOpen: false } }),
        userModel.findById(userId).populate({ path: 'positions', match: { isOpen: false }, skip: offset, limit: size })
    ])
        .then(result => {
            console.log(offset, size);
            let totalOfAllPositions = result[0].positions.length;
            positions = result[1].positions;
            res.json({
                total: totalOfAllPositions,
                positions: positions
            })
        })
        .catch(next);
}


module.exports = {
    createPosition,
    getAllPositions,
    getHistory,
    getDetailsForPosition,
    editPosition,
    closePosition
}