import dotenv from "dotenv";
dotenv.config();

import express from "express";
import jwt from "jsonwebtoken";
import session from "express-session";
import cookieParser from "cookie-parser";
import cors from "cors";
import MongoStore from "connect-mongo";
import Redis from "ioredis";

import connectToDb from "./Database/connect.js";
import userRoutes from "./routes/user.routes.js";
import projectRoutes from "./routes/project.routes.js";
import expenseRoutes from "./routes/expense.routes.js";
import incomeRoutes from "./routes/income.routes.js";

// Ensure required environment variables are set
const requiredEnvVars = [
    "MONGODB_CONNECTION",
    "PORT",
    "JWT_SECRET_KEY",
    "SESSION_SECRET",
    "REDIS_HOST",
    "REDIS_PORT",
    "REDIS_PASSWORD"
];

const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
    console.error(`Missing required environment variables: ${missingEnvVars.join(", ")}`);
    process.exit(1);
}

// Connect to MongoDB
connectToDb().catch((err) => {
    console.error("Database Connection Error:", err.message);
    process.exit(1);
});

const app = express();

// Redis Connection
const redis = new Redis({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
    retryStrategy: (times) => Math.min(times * 50, 2000) // Exponential backoff for reconnecting
});

redis.ping()
    .then(() => console.log("Connected to Redis"))
    .catch(err => {
        console.error("Redis connection error:", err);
        process.exit(1);
    });

// CORS Configuration
const allowedOrigins = [
    "https://fintrack-bwr9.onrender.com",
    "http://localhost:5173"
];

app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                console.error(`CORS policy violation from: ${origin}`);
                callback(new Error("CORS policy violation"));
            }
        },
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true,
    })
);

// Secure Session Configuration
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({ 
            mongoUrl: process.env.MONGODB_CONNECTION,
            collectionName: "sessions",
            ttl: 14 * 24 * 60 * 60 // 14 days
        }),
        cookie: {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 24 * 60 * 60 * 1000, // 1 day
        },
    })
);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health Check Route
app.get("/health", (req, res) => {
    res.status(200).json({ message: "Server is running!" });
});

// API Routes
app.use("/api/users", userRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/incomes", incomeRoutes);

// JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
    try {
        const token = req.cookies?.token || req.header("Authorization")?.replace("Bearer ", "");
        if (!token) {
            return res.status(401).json({ error: "Access denied, token missing" });
        }

        jwt.verify(token, process.env.JWT_SECRET_KEY, (err, user) => {
            if (err) {
                return res.status(403).json({ error: "Invalid token" });
            }
            req.user = user;
            next();
        });
    } catch (error) {
        console.error("Authentication Error:", error.message);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

// Root Route
app.get("/", (req, res) => {
    res.send("Welcome to TrackItAll Backend!");
});

// Global Error Handling Middleware
app.use((err, req, res, next) => {
    console.error("Server Error:", err.message);
    res.status(err.status || 500).json({ error: err.message || "Internal Server Error" });
});

// Graceful Shutdown
process.on("uncaughtException", (err) => {
    console.error("Uncaught Exception:", err);
    process.exit(1);
});

process.on("unhandledRejection", (err) => {
    console.error("Unhandled Promise Rejection:", err);
    process.exit(1);
});

export default app;
