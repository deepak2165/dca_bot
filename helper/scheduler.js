import cron from 'node-cron';
import orders from '../model/orders.js';
import purchased from '../model/purchased.js';
import Binance from 'node-binance-api';
import config from '../config.js';
import round from '../model/rounds.js';

const binance = new Binance().options({
    APIKEY: config.BINANCE_API_KEY,
    APISECRET: config.BINANCE_SECRET_KEY,
    urls: {
        base: "https://testnet.binance.vision/api/"   // testnet endpoint
    },
    family: 4
});

cron.schedule('* * * * * *', async () => {
    try {
        const getOrders = await binance.allOrders("BTCUSDT");
        const ordersData = await orders.find({ status: "NEW" });
        for (let i = 0; i < ordersData.length; i++) {
            const purchasedData = await purchased.findOne({ botId: ordersData[i].botId });
            for (let j = 0; j < getOrders.length; j++) {
                if (ordersData[i].orderId == getOrders[j].orderId && getOrders[j].status == "FILLED") {
                    await orders.updateOne({ orderId: ordersData[i].orderId }, {
                        $set: {
                            status: "FILLED",
                        }
                    });
                    await purchased.updateOne({ botId: ordersData[i].botId }, {
                        $set: {
                            qty: purchasedData.qty + parseFloat(getOrders.executedQty)
                        }
                    })
                } else if (ordersData[i].orderId == getOrders[j].orderId) {
                    await orders.updateOne({ orderId: ordersData[i].orderId }, {
                        $set: {
                            status: getOrders[j].status,
                        }
                    });
                }
            }
        }
        const purchases = await purchased.find();
        for (let i = 0; i < purchases.length; i++) {
            const ticker = await binance.prices();
            const requiredProfit = parseFloat(ticker.BTCUSDT);
            const takeProfitPrice = purchases[i].baseOrderPrice + (purchases[i].baseOrderPrice * 0.02);
            const roundsData = await round.findOne({botId: purchases[i].botId})
            // console.log(takeProfitPrice)
            if (takeProfitPrice <= requiredProfit) {
                console.log("Target Profit Reached")
                const orderTx = await binance.sell("BTCUSDT", purchases[i].qty, takeProfitPrice);
                console.log(orderTx);
                if (orderTx.orderId) {
                    await orders.create({
                        botId: purchases[i].botId,
                        symbol: orderTx.symbol,
                        toDisplaySymbol: orderTx.symbol,
                        side: orderTx.side,
                        type: orderTx.type,
                        price: orderTx.price,
                        quantity: orderTx.origQty,
                        status: orderTx.status,
                        orderId: orderTx.orderId,
                        pprice: 0,
                        tradeId: 0
                    })
                    await purchased.updateOne({ _id: purchases[i]._id }, {
                        $set: {
                            qty: 0,
                            baseOrderPrice: 0,
                        }
                    });
                    await round.updateOne({ botId: purchases[i].botId }, {
                        $set: {
                            rounds: roundsData.rounds + 1
                        }
                    });
                }
            }
        }
    } catch (error) {
        console.log(error)
    }
})