let positionModel = require('../models/postModel');
let userModel = require('../models/userModel');
let coinData = require('../nodeCron/nodeCron');
let updatedCoins = require('../controllers/coinsController');


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

                allSum = isExists.sum + sum;
                allShares = isExists.shares + shares;
                avgEntry = allSum / allShares;

                console.log('pos update in');
                positionModel
                    .findOneAndUpdate({ _id: isExists._id }, { entry: avgEntry, sum: allSum, shares: allShares })
                    .then(result => {
                        res.status(200).json({ message: 'Successfully added to the older position!' })
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

    userModel.findById(_id)
        .populate({
            path: 'positions',
            match: { isOpen: true },
        })
        .then((result) => { userPositions = result }
        )
        .catch(next)

    res.set('Content-Type', 'text/event-stream');
    res.set('Cache-Control', 'no - cache');
    res.set('Connection', 'keep-alive');

    let interval = setInterval(function () {
        let date = new Date(); //to capture the timestamp of the request
        console.log('executing request');
        res.write('event:' + 'timestamp\n');
        res.write('data:' + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds() + '\n\n');
        res.write('data:' + JSON.stringify(userPositions.positions) + '\n\n');

    }, 1000);
    req.on('close', () => {
        console.log('connection closed');
        clearInterval(interval);
        res.end();
    });
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

    let { sum, balance, prfLoss } = req.body;

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
            positionModel.findById(posId)
                .then(result => {
                    if (result.sum === sum) {

                        let newBalance = Number(balance) + Number(result.prfLoss) + Number(sum);
                        
                        console.log(newBalance);
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
                        result.isOpen = false;
                        result.sum = sum;
                        let newSum = result.sum - sum;
                        let newBalance = Number(balance) + ((sum / result.sum) * prfLoss);
                        // console.log(result.sum);
                        // console.log(sum);
                        // console.log(newSum);
                        // console.log(newBalance);
                        // positionModel.create(result)
                        //     .then(newPositionForHistory => {
                        //         userModel.updateOne({ _id: userId }, { $push: { positions: newPositionForHistory._id }, balance: newBalance })
                        //             .then((result) => {
                        //                 console.log(result);
                        //                 res.status(200).json({ message: 'Successfully partially closed position!' });
                        //             })
                        //             .catch(next);
                        //     })
                        //     .catch(next)

                        // positionModel.findByIdAndUpdate({ _id: posId }, { sum: newSum });
                    }

                })
                .catch(next)
        })
        .catch(next)

}
function getHistory(req, res, next) {
    const { _id: userId } = req.user;
    let offset = Number(req.query.offset) || 0;
    let size = Number(req.query.limit) || Users.length;
    let total;
    Promise.all([
        userModel.findById(userId).populate({ path: 'positions', match: { isOpen: false } }),
        userModel.findById(userId).populate({ path: 'positions', match: { isOpen: false }, skip: offset, limit: size })
    ])
        .then(result => {
            res.json({
                total: result[0].positions.length,
                positions: result[1].positions
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