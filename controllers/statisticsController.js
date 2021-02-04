let positionModel = require('../models/postModel');
let userModel = require('../models/userModel');

function getStatsByMonth(req, res, next) {
    const { _id: userId } = req.user;
    positionModel.aggregate([
        {
            $match: { 'creator': userId }
        },
        {
            "$project": {
                "DueDateMonth": { "$month": "$created_at" },
                "prfLoss": 1
            }
        },
        {
            "$group": {
                "_id": "$DueDateMonth",
                "sumValue": { "$sum": "$prfLoss" },
                "monthValue": { "$first": "$DueDateMonth" }
            }
        }
    ])
        .then((result) => {
            res.status(200).json(result);
        })
        .catch(next)
}

function getStatsBySegment(req, res, next) {
    const { _id: userId } = req.user;
    let segment = {};
    let dataArray = [];
    Promise.all([
        positionModel.aggregate([[
            {
                $match: { 'creator': userId, isOpen: true }
            },
            {
                "$group": {
                    "_id": 'sumAll',
                    "sum": { "$sum": "$sum" },
                }
            }
        ]]),
        userModel.findById(userId)
            .populate({
                path: 'positions',
                match: {
                    isOpen: true,
                },
            })])

        .then(([sumAll, allPos]) => {
            allPos.positions.forEach(p => {
                let key = p.symbol;
                segment[key] = (Number(p.sum) / Number(sumAll[0].sum)) * 100;
            });

            for (let key in segment) {
                let newObj = {};
                newObj[key] = segment[key];
                dataArray.push(newObj);
            }
            console.log(dataArray);

            res.status(200).json(dataArray);
        })
        .catch(next)
}
function getAverages(req, res, next) {
    const { _id: userId } = req.user;
    let winRate;
    let wins = 0;
    let losses = 0;
    Promise.all([
        positionModel.aggregate([
            { $match: { 'creator': userId } }, {
                "$group": {
                    "_id": 'max/min',
                    "max": { "$max": "$prfLoss" },
                    "min": { "$min": "$prfLoss" },
                }
            }
        ]),
        positionModel.find({ creator: userId }),


    ]).then(result => {
        let maxMin = result[0];

        if (result[1].length) {
            result[1].forEach(p => {
                if (p.prfLoss > 0) {
                    wins++;
                } else if (p.prfLoss < 0) {
                    losses++;
                }
            });
            winRate = (wins / result[1].length) * 100;
            maxMin[0]['winRate'] = winRate;
        }

        res.status(200).json(maxMin[0]);
    })
        .catch(next);
}

module.exports = {
    getStatsByMonth,
    getStatsBySegment,
    getAverages
}
