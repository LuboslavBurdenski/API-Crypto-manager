const { dataGet, updatedDataGet } = require('../nodeCron/nodeCron');

function getTop100Coins(req, res, next) { res.send(dataGet()); };

function getUpdatedData(req, res, next) { return updatedDataGet(); }

module.exports = {
    getTop100Coins,
    getUpdatedData,
}
