import { Router } from 'express';
import {
    registerUser, 
    loginUser, 
    getCurrentUser, 
    logoutUser,
    getAllGeneralTransactions,
    updateUser,
    getAllTransactions
} from '../controllers/user.controller.js'
import { verifyUser } from '../middlewares/auth.middleware.js'

const router = Router();

// ✅ Check if Register Request is Reaching Backend
router.post('/register', (req, res, next) => {
    console.log("🚀 Incoming request to /api/users/register");
    console.log("Headers:", req.headers);
    console.log("Body:", req.body);
    next(); // Pass control to the actual `registerUser` controller
}, registerUser);

// ✅ Check if Login Request is Reaching Backend
router.post('/login', (req, res, next) => {
    console.log("🚀 Incoming request to /api/users/login");
    console.log("Headers:", req.headers);
    console.log("Body:", req.body);
    next();
}, loginUser);

// ✅ Check if Session is Working for Protected Routes
router.get('/current-user', verifyUser, (req, res, next) => {
    console.log("🔐 Protected route accessed: /api/users/current-user");
    console.log("Session:", req.session);
    console.log("Cookies:", req.cookies);
    next();
}, getCurrentUser);

router.get('/logout', verifyUser, (req, res, next) => {
    console.log("🔐 Logging out user...");
    next();
}, logoutUser);

router.get('/transactions/general', verifyUser, (req, res, next) => {
    console.log("🔐 Transactions Accessed");
    next();
}, getAllGeneralTransactions);

router.get('/transactions/all', verifyUser, (req, res, next) => {
    console.log("🔐 All Transactions Accessed");
    next();
}, getAllTransactions);

router.post('/update-profile', verifyUser, (req, res, next) => {
    console.log("🔄 Updating Profile");
    console.log("Body:", req.body);
    next();
}, updateUser);

export default router;
