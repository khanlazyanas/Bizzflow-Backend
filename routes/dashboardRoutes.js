import express from 'express';
import { getDashboardStats } from '../controllers/dashboardController.js';
import { isAuthenticated } from '../middlewares/auth.js';

const router = express.Router();

// YAHAN FIX KIYA HAI: '/' ki jagah '/stats' aayega
router.get('/stats', isAuthenticated, getDashboardStats);

export default router;