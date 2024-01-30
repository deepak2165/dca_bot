import mongoose from "mongoose";
import config from "../config.js";
try {
    await mongoose.connect(config.DATABASE);
    console.log("CONNECTION TO THE DATABASE ESTABLISHED SUCCESSFULLY")
} catch (error) {
    console.log("CONNECTION TO THE DATABASE COULDN'T ESTABLISHED", error);
}