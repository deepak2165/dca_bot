import dotenv from 'dotenv';
dotenv.config();

const config = {
    DATABASE : process.env.DATABASE_URL,
    BINANCE_API_KEY: process.env.BINANCE_API_KEY,
    BINANCE_SECRET_KEY: process.env.BINANCE_SECRET_KEY
}

export default config;

