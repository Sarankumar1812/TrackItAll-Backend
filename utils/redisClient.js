import dotenv from 'dotenv';
dotenv.config();
import { Redis } from 'ioredis';

const redisClient = new Redis({
    host: process.env.REDIS_HOST || "localhost",
    port: Number(process.env.REDIS_PORT) || 6379, // Default to 6379 if not provided
    password: process.env.REDIS_PASSWORD || undefined,
    tls: process.env.REDIS_TLS === "true" ? { rejectUnauthorized: false } : undefined,
});

redisClient.on("connect", () => {
    console.log("✅ Redis connected successfully!");
});

redisClient.on("error", (err) => {
    console.error("❌ Redis connection error:", err.message || err);
});

// Async function to verify connection
const connectRedis = async () => {
    try {
        await redisClient.ping();
        console.log("🚀 Redis is ready to use!");
    } catch (err) {
        console.error("❌ Redis connection failed:", err.message || err);
    }
};

connectRedis();

export default redisClient;
