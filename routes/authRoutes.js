import express from 'express';
import rateLimit from 'express-rate-limit'; 
import passport from 'passport'; 
import jwt from 'jsonwebtoken'; 
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

// Normal Email/Password Auth 
router.post('/register', authLimiter, registerUser);
router.post('/login', authLimiter, loginUser);

// OTP Auth Routes
// router.post('/send-otp', authLimiter, sendLoginOtp);
// router.post('/verify-otp', authLimiter, verifyOtpLogin);

// =========================================================
// 🔥 GOOGLE OAUTH ROUTES (100% FIXED)
// =========================================================
// 1. Ye route frontend par button click hone pe chalega
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// 2. Google se verification ke baad user yahan wapas aayega
router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: `${process.env.FRONTEND_URL}/login` }),
  (req, res) => {
    // JWT token banao
    const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE || '7d'
    });

    // 🔥 100% FIX: Hardcoded SameSite 'none' & secure 'true' 
    // Isse browser kabhi bhi Vercel par cookie block nahi karega!
    res.cookie('token', token, {
      httpOnly: true,
      secure: true,      // Hamesha True (Render/Vercel ke liye)
      sameSite: 'none'   // Hamesha None (Cross-domain ke liye)
    });

    // Frontend ke dashboard par redirect kar do
    res.redirect(`${process.env.FRONTEND_URL}/dashboard`); // 🔥 Yahan /dashboard explicitly lagaya hai taaki seedha andar jaye
  }
);
// =========================================================

// Session & Profile
router.get('/logout', logoutUser); 
router.get('/me', isAuthenticated, getMyProfile);
router.put('/update', isAuthenticated, singleUpload, updateProfile);

// Password Management
router.put('/change-password', isAuthenticated, changePassword);
router.post('/password/forgot', authLimiter, forgotPassword); 
router.put('/password/reset/:token', resetPassword);

// Features
router.post('/invoice/new', isAuthenticated, isProUser, createInvoice);

export default router;