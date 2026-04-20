import express from 'express';
import { checkout, paymentVerification, getApiKey } from '../controllers/paymentController.js';
import { isAuthenticated } from '../middlewares/auth.js';

const router = express.Router();

router.post('/checkout', isAuthenticated, checkout);
router.post('/verify', isAuthenticated, paymentVerification);
router.get('/getkey', isAuthenticated, getApiKey);

export default router;