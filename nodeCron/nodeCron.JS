const positionModel = require('../models/postModel');
const cron = require('node-cron');
const https = require('https');

let data = '';

(function nodeCronTop100Coin() {
    //making first call to CoinGecko API after starting the server
    https.get('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h', (resp) => {
        resp.on('data', (chunk) => {
            data += chunk;
        });
        resp.on('end', () => {
            console.log('first end');

        });
    }).on("error", (err) => {
        console.log("Error: " + err.message);
    });
    //making call to CoinGecko API each hour to take the top 100 coins in desc order
    cron.schedule('0 0 */1 * * *', () => {
        https.get('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h', (resp) => {
            let scheduledData = '';
            resp.on('data', (chunk) => {
                scheduledData += chunk;
            });
            resp.on('end', () => {
                data = scheduledData;
            });

        }).on("error", (err) => {
            console.log("Error: " + err.message);
        });
        console.log('running the task each hour');
    });
})();


// all data for every coin, which is used in "nodeCronUpdateAllOpenPositions"
let coinsForCustomers;
//making call to CoinGecko API each 15 seconds to take the coins needed in desc order
(function nodeCronAllCoinsForCustomers() {
    cron.schedule('*/1.5 * * * * *', (req, res, next) => {
        //  console.log("running task every 1.5 seconds");
        let uniqueIdsOfCoins = [];
        positionModel.find({ isOpen: true })
            .then(((trades) => {
                trades.forEach((trade, i) => {
                    if (!uniqueIdsOfCoins.includes(trade.coinId)) {
                        if (i === trades.length - 1) {
                            let lastCoinSymbol = trade.coinId.split('%')[0];
                            uniqueIdsOfCoins.push(lastCoinSymbol);
                        } else {
                            uniqueIdsOfCoins.push(`${trade.coinId}%2C`);
                        }
                    }
                });
                uniqueIdsOfCoins = uniqueIdsOfCoins.join('');
                let apiURLCoins = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${uniqueIdsOfCoins}&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h`;

                https.get(apiURLCoins, (resp) => {
                    let coinData = '';
                    resp.on('data', (chunk) => {
                        coinData += chunk;
                    });
                    resp.on('end', () => {
                        //data ready
                        coinsForCustomers = JSON.parse(coinData);
                        // console.log(coinsForCustomers);
                    });
                }).on("error", (err) => {
                    console.log("Error: " + err.message);
                });
            })
            ).catch(next);
    });
})();

let updatedData;
(function nodeCronUpdateAllOpenPositions() {
    cron.schedule('*/1.7 * * * * *', (req, res, next) => {
        //console.log("running task every 2 seconds");
        let midUpdatedData = [];
        positionModel.find({ isOpen: true })
            .then((trades) => {
                trades.forEach((trade) => {
                    coinsForCustomers.forEach((coin, i) => {
                        let currentPrice;
                        let changeIn24h;
                        let prtLoss;
                        let prtLossPerCent;
                        let isOpen = true;
                        if (coin.id === trade.coinId) {
                            currentPrice = coin.current_price;
                            if (trade.stop) {
                                if (currentPrice <= trade.stop) { isOpen = false }
                            }
                            if (trade.stop) {
                                if (currentPrice >= trade.target) { isOpen = false }
                            }
                            changeIn24h = coin.price_change_percentage_24h_in_currency;
                            prtLoss = (currentPrice - trade.entry) * trade.shares;
                            prtLossPerCent = ((currentPrice - trade.entry) / trade.entry) * 100;

                            positionModel.findByIdAndUpdate({ _id: trade._id }, {
                                currentPrice: currentPrice,
                                changeIn24h: changeIn24h,
                                prfLoss: prtLoss,
                                prfLossPerCent: prtLossPerCent,
                                isOpen: isOpen,

                            })
                                .then((updatedTrade) => { midUpdatedData.push(updatedTrade); })
                                .catch(next)
                        }
                    })
                    //console.log(trade);
                });
            })
            .catch(next);
        updatedData = midUpdatedData;
    });
})();


function dataGet() {
    return data;
};
function updatedDataGet() {
    return updatedData;
}


module.exports = {
    dataGet,
    updatedDataGet
};