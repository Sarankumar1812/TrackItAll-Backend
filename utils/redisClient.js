import dotenv from 'dotenv';
dotenv.config();
import { Redis } from 'ioredis';

const redisClient = new Redis({
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT), // Ensure port is a number
    password: process.env.REDIS_PASSWORD,
    tls: {
        rejectUnauthorized: false, // Required for Redis Cloud
    }
});

redisClient.on("connect", () => {
    console.log("✅ Redis connected successfully!");
});

redisClient.on("error", (err) => {
    console.error("❌ Redis connection error:", err);
});

export default redisClient;
