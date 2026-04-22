import express from 'express';
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
  sendLoginOtp, // 🔥 Naya import
  verifyOtpLogin // 🔥 Naya import
} from "../controllers/authControllers.js"

import { isAuthenticated } from '../middlewares/auth.js';
import { singleUpload } from '../middlewares/multer.js';
import { createInvoice } from '../controllers/invoiceController.js';

const router = express.Router();

// Normal Email/Password Auth
router.post('/register', registerUser);
router.post('/login', loginUser);

// 🔥 Naya Feature: OTP Auth Routes
router.post('/send-otp', sendLoginOtp);
router.post('/verify-otp', verifyOtpLogin);

// Session & Profile
router.get('/logout', logoutUser); 
router.get('/me', isAuthenticated, getMyProfile);
router.put('/update', isAuthenticated, singleUpload, updateProfile);

// Password Management
router.put('/change-password', isAuthenticated, changePassword);
router.post('/password/forgot', forgotPassword); 
router.put('/password/reset/:token', resetPassword);

// Features
router.post('/invoice/new', isAuthenticated, isProUser, createInvoice);

export default router;