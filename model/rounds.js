import mongoose from "mongoose";

const rounds_Schema = mongoose.Schema({
    botId: String,
    rounds:{
        type: Number,
        default: 0
    }
});

export default mongoose.model("rounds", rounds_Schema);
