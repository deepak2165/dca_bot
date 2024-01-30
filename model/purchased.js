import mongoose from 'mongoose';

const purchased_schema = mongoose.Schema({
    botId: {
        type: String,
    },
    asset: {
        type: String,
        required: true,
    },
    qty: {
        type: Number,
        required: true,
    },
    baseOrderPrice: {
        type: Number,
        required: true,
    }
},{
    timestamps:true
});

export default mongoose.model("purchases", purchased_schema);