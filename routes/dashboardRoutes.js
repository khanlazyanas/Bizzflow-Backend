import express from 'express';
import { getDashboardStats } from '../controllers/dashboardController.js';
import { isAuthenticated } from '../middlewares/auth.js';

const router = express.Router();

router.get('/', isAuthenticated, getDashboardStats);

export default router;