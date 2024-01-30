import mongoose  from "mongoose";

const order_schema = mongoose.Schema({
    botId:{
        type: String,
    },
    symbol:{
        type: String,
        required: true,
    },
    toDisplaySymbol:{
        type: String,
        required: true,
    },
    side:{
        type: String,
        required: true,
    },
    type:{
        type: String,
        required: true    
    },
    price:{
        type: Number,
        required: true
    },
    quantity:{
        type: Number,
        required: true
    },
    status:{
        type: String,
        required: true
    },
    orderId:{
        type: String,
        required: true,
    },
    pprice:{
        type: Number,
        required: true,
    },
    tradeId: {
        type: String,
        required: true
    }
},{
    timestamps:true,
});

export default mongoose.model("orders", order_schema);
