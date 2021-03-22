# crypto-manager-API
API built with Express JS and MongoDB for Crypto manager project. 

Crypto manager is a simple app in which you can access top one hundred crypto currency coins from CoinGecko REST API, at the home page.
You can open position, only if you are logged in, if you fill the required parameters in the dialog form which pops up. Then you are redirected to the portfolio page automatically and you will be shown your current portfolio. 
If you've opened position with target profit and stop loss, respectively with current price of that coin higher or equal, or lower or equal, your position wil be added to history section.
In history section you can see your closed positions with full description of them. Also at history you can sort, filter and download the data in MS Excel format. In portfolio, where your open trades are stored, you can access TradingView integrated charts. Also, last, but not least, at portfolio page, you can open details page where you can find full description of your trade. At details page you can also make changes on target and stop loss, or close the position fully
or partially. 
Then you can see on profile page, providing the most important analytics, such as income by month in bar chart, currently own crypto in pie chart, also current balance, average win rate, highest win and highest loss in the history of your account.


## API provides:
- Node-cron (cron job for Node.js), which is used for the main data extraction from CoinGecko;
- Real-time data on portfolio ;
- Server sent events (Server stream) for real-time data, presented on the portfolio page;
- Mongoose (ODM for MongoDb) usage for the database models;
- Aggregations in MongoDb which provide the statistics;
- Authentication with JWT stored in cookies;
- Error handling;


## Quick start
1. npm install
2. npm index / nodemon index


