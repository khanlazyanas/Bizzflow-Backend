import express from 'express';
import rateLimit from 'express-rate-limit'; // 🔥 NAYA IMPORT: Rate Limiter
import passport from 'passport'; // 🔥 NAYA IMPORT: Google Auth ke liye
import jwt from 'jsonwebtoken'; // 🔥 NAYA IMPORT: Token banane ke liye
import { 
  registerUser, 
  loginUser, 
  logoutUser, 
  getMyProfile, 
  updateProfile, 
  changePassword, 
  forgotPassword, 
  resetPassword, 
  isProUser,
  sendLoginOtp, 
  verifyOtpLogin 
} from "../controllers/authControllers.js"

import { isAuthenticated } from '../middlewares/auth.js';
import { singleUpload } from '../middlewares/multer.js';
import { createInvoice } from '../controllers/invoiceController.js';

const router = express.Router();

// 🔥 SECURITY RULE: 5 Minute mein sirf 3 login/otp requests allow karega
const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // Limit each IP to 3 requests
  message: { 
    success: false, 
    message: "Too many attempts from this IP. Please try again after 5 minutes! 🚨" 
  }
});

// Normal Email/Password Auth (Limiter Laga Diya)
router.post('/register', authLimiter, registerUser);
router.post('/login', authLimiter, loginUser);

// 🔥 Naya Feature: OTP Auth Routes (Yahan bhi Limiter Laga Diya taaki email spam na ho)
router.post('/send-otp', authLimiter, sendLoginOtp);
router.post('/verify-otp', authLimiter, verifyOtpLogin);

// =========================================================
// 🔥 NAYA FEATURE: GOOGLE OAUTH ROUTES
// =========================================================
// 1. Ye route frontend par button click hone pe chalega
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// 2. Google se verification ke baad user yahan wapas aayega
router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: `${process.env.FRONTEND_URL}/login` }),
  (req, res) => {
    // Agar login successful hai, toh JWT token banao aur cookie me bhej do
    const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE || '7d'
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    });

    // Frontend ke dashboard par redirect kar do
    res.redirect(`${process.env.FRONTEND_URL}/`); 
  }
);
// =========================================================

// Session & Profile
router.get('/logout', logoutUser); 
router.get('/me', isAuthenticated, getMyProfile);
router.put('/update', isAuthenticated, singleUpload, updateProfile);

// Password Management
router.put('/change-password', isAuthenticated, changePassword);
router.post('/password/forgot', authLimiter, forgotPassword); // Forgot password pe bhi limiter zaroori hai
router.put('/password/reset/:token', resetPassword);

// Features
router.post('/invoice/new', isAuthenticated, isProUser, createInvoice);

export default router;