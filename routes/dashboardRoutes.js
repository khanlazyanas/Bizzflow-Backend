import express from 'express';
import { getDashboardStats, exportDashboardData } from '../controllers/dashboardController.js';
import { isAuthenticated } from '../middlewares/auth.js';

const router = express.Router();

// Dashboard stats route
router.get('/stats', isAuthenticated, getDashboardStats);

// 🔥 NAYA ROUTE: Excel/CSV Export ke liye
router.get('/export', isAuthenticated, exportDashboardData);

export default router;