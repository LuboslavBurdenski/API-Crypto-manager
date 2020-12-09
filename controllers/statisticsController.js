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
                "avgValue": { "$avg": "$prfLoss" },
                "monthValue": { "$first": "$DueDateMonth" }
            }
        }
    ])
        .then((result) => {
            console.log(result);
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
                $match: { 'creator': userId }
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
                if (segment[key]) {
                    segment[key] += (Number(p.sum) / Number(sumAll[0].sum)) * 100;
                } else {
                    segment[key] = (Number(p.sum) / Number(sumAll[0].sum)) * 100;
                }
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
    positionModel.aggregate([
        { $match: { 'creator': userId, isOpen: false }},{
            "$group": {
                "_id": 'max',
                "max": { "$max": "$prfLoss" },
                "min": { "$min": "$prfLoss" },
            }
        }
    ]).then(result => console.log(result))
}

module.exports = {
    getStatsByMonth,
    getStatsBySegment,
    getAverages
}