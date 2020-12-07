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
}

function getStatsBySegment(req, res, next) {
    const { _id: userId } = req.user;
    let segment = {};
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
            .populate('positions')])

        .then(([sumAll, allPos]) => {
            
            allPos.positions.forEach(p => {
                console.log(p);
                let key = p.symbol;
                
                if (segment[key]) {
                    segment[key] += (Number(p.sum) / Number(sumAll[0].sum)) * 100;
                } else {
                    segment[key] = (Number(p.sum) / Number(sumAll[0].sum)) * 100;
                }
            });
            console.log(segment);
            res.status(200).json(segment);
        })
        .catch(next)
}

module.exports = {
    getStatsByMonth,
    getStatsBySegment
}