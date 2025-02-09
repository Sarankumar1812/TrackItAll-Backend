import UserModel from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import jwt from 'jsonwebtoken';
import redisClient from '../utils/redisClient.js';

export const verifyUser = asyncHandler(async (req, res, next) => {
    try {
        // ✅ Extract token from cookies or Authorization header
        const token = req.cookies?.token || req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            return next(new ApiError(401, 'Unauthorized request with no token'));
        }

        // ✅ Check if token is blacklisted in Redis
        const isBlackListed = await redisClient.get(token);
        if (isBlackListed) {
            res.clearCookie("token");
            return next(new ApiError(401, 'Unauthorized request - token is blacklisted'));
        }

        // ✅ Verify JWT Token
        const secretKey = process.env.JWT_SECRET_KEY;
        if (!secretKey) {
            console.error("❌ JWT_SECRET_KEY is missing in environment variables");
            return next(new ApiError(500, 'Internal Server Error - missing JWT secret'));
        }

        let decoded;
        try {
            decoded = jwt.verify(token, secretKey);
        } catch (error) {
            console.error("❌ JWT Verification Error:", error.message);
            return next(new ApiError(401, 'Invalid token'));
        }

        // ✅ Fetch User from DB
        const user = await UserModel.findById(decoded._id);
        if (!user) {
            return next(new ApiError(401, 'Invalid token - user not found'));
        }

        req.user = user;
        next();
    } catch (error) {
        console.error("❌ Middleware Error:", error.message);
        return next(new ApiError(500, 'Internal Server Error'));
    }
});
