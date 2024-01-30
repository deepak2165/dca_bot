import Binance from 'node-binance-api';
import order from './model/orders.js';
import purchased from './model/purchased.js';
import cron from 'node-cron';
import config from './config.js';
import './core/connection.js';
import fetch from 'node-fetch';
import axios from 'axios';
import rounds from './model/rounds.js';
import './helper/scheduler.js';

const binance = new Binance().options({
    APIKEY: config.BINANCE_API_KEY,
    APISECRET: config.BINANCE_SECRET_KEY,
    urls: {
        base: "https://testnet.binance.vision/api/"   // testnet endpoint
    },
    family: 4
});

let orders = [
    {
        id: 1,
        name: "Demo Test Bot",
        baseAsset: "BTC",
        quoteAsset: "USDT",
        pair: "BTC/USDT",
        symbol: "BTCUSDT",
        priceDeviation: 1,
        takeProfit: 2,
        baseOrderSize: 10,
        dcaOrderSize: 10,
        maxDcaOrders: 5,
        filledOrders: 0,
        lastPrice: 0,
        triggerPrice: 0
    }
];

const createOrderEntry = async (ID, TX) => {
    try {
        await order.create({
            botId: ID,
            symbol: TX.symbol,
            toDisplaySymbol: TX.symbol,
            side: TX.side,
            type: TX.type,
            price: TX.price,
            quantity: TX.origQty,
            status: TX.status,
            orderId: TX.orderId,
            pprice: 0,
            tradeId: 0,
            triggerPrice: 0
        });
    } catch (error) {
        console.log(error)
    }
}

const createPurchaseEntry = async (ID, purchasedAsset, Quantity, purchasedPrice) => {
    try {
        await purchased.create({
            botId: ID,
            asset: purchasedAsset,
            qty: Quantity,
            baseOrderPrice: purchasedPrice,
        });
        await rounds.create({
            botId: ID,
            rounds: 0,
        })
    } catch (error) {
        console.log(error)
    }
}

/* const updatePurchasedQuantity = async (ID, dcaTx) => {
    try {
        const botPurchasedData = await purchased.findOne({ botId: ID });
        await purchased.updateOne({ _id: botPurchasedData._id }, {
            quantity: botPurchasedData + parseFloat(dcaTx.executedQty)
        })
    } catch (error) {
        console.log(error)
    }
} */
const dcaBotExecution = async () => {
    try {
        const botId = Math.floor(100000 + Math.random() * 900000);
        const ticker = await binance.prices();
        const BTCUSDTPrice = parseInt(ticker.BTCUSDT);
        let orderPrice = 0, orderTx;
        orders[0].lastPrice = BTCUSDTPrice;
        console.log(BTCUSDTPrice);
        // calculate the quantity to be purchased 
        const calculateQuantity = (1 / BTCUSDTPrice) * 20;
        const quantity = calculateQuantity.toPrecision(2);
        console.log(quantity);
        // place the order
        if (orders[0].triggerPrice > 0) {
            orderTx = await binance.buy("BTCUSDT", quantity, orders[0].triggerPrice);
        } else {
            orderTx = await binance.marketBuy("BTCUSDT", quantity);
            console.log(orderTx);
            // as it is possible that the order is filled in multiple parts so we need to calculate the average price
            if (orderTx.fills.length > 0) {
                orderTx.fills.forEach(element => {
                    orderPrice += parseFloat(element.price);
                });
            }
        }
        // creating the order entry and entry for orders that has been executed
        await createOrderEntry(botId, orderTx);

        const avgOrderPrice = orderPrice / orderTx.fills.length;
        await createPurchaseEntry(botId, "BTC", quantity, avgOrderPrice);
        //creating the safety orders
        while (orders[0].filledOrders < orders[0].maxDcaOrders) {
            // change in price in the previous order to place next safety order
            let priceWithPriceDeviation = orders[0].lastPrice - (orders[0].lastPrice * 0.01);
            orders[0].lastPrice = priceWithPriceDeviation.toPrecision(5);
            // recalculate the quantity 
            const reCalculateQuantity = (1 / priceWithPriceDeviation) * 20;
            const updatedQuantity = reCalculateQuantity.toPrecision(2);
            console.log("price:==> ", priceWithPriceDeviation, "quantity ===> ", updatedQuantity);
            // change the filledOrders i.e. number of safety orders that has been placed and place the order
            orders[0].filledOrders += 1;
            const dcaTx = await binance.buy("BTCUSDT", updatedQuantity, priceWithPriceDeviation);
            console.log(dcaTx);
            // create the entry for the recently executed bot
            await createOrderEntry(botId, dcaTx);
        }
    } catch (error) {
        console.log(error);
    }
}

//dcaBotExecution();

const getBalance = async () => {
    try {
        const getBalance = await binance.balance();
        console.log("BTC ==> ", getBalance.BTC, "USDT ===> ", getBalance.USDT);
        const openedOrdersData = await binance.openOrders("BTCUSDT");
        console.log(openedOrdersData.length);
        // const cancelOpenOrdersData = await binance.cancelAll("BTCUSDT");
        // console.log(cancelOpenOrdersData);
        // const getOrders = await binance.allOrders("BTCUSDT");
        // console.log(getOrders.length);
    } catch (error) {
        console.log(error.message)
    }
}

getBalance();


// BTC ==>  { available: '1.05571000', onOrder: '0.00000000' } USDT ===>  { available: '8464.82859190', onOrder: '0.00000000' }
