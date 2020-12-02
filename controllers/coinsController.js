const positionModel = require('../models/postModel');
const cron = require('node-cron');
const https = require('https');
const { dataGet, updatedDataGet } = require('../nodeCron/nodeCron');
//data for all 100 coins
let data = '';
let parsedCoinData;
// all data for every coin, which is used in "nodeCronUpdateAllOpenPositions"
let coinsForCustomers;


function getTop100Coins(req, res, next) { res.send(dataGet()); };

function getUpdatedData(req, res, next) { return updatedDataGet(); }


module.exports = {
    getTop100Coins,
    getUpdatedData,
}
