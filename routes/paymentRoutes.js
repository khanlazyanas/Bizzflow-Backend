import express from 'express';
import { checkout, paymentVerification, getApiKey } from '../controllers/paymentController.js';
import { isAuthenticated } from '../middlewares/auth.js';

const router = express.Router();

// ==========================================
// 🔓 PUBLIC ROUTE (Bina login ke chalega)
// ==========================================
// 🔥 FIX: Yahan se 'isAuthenticated' hata diya hai
router.get('/getkey', getApiKey);

// ==========================================
// 🔒 PROTECTED ROUTES (Sirf Admin/User ke liye)
// ==========================================
router.post('/checkout', isAuthenticated, checkout);
router.post('/verify', isAuthenticated, paymentVerification);

export default router;