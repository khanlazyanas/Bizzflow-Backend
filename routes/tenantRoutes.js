import express from 'express';
import { createTenant, getTenants } from '../controllers/tenantController.js';
import { isAuthenticated } from '../middlewares/auth.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.route('/')
  .post(isAuthenticated, createTenant)
  .get(isAuthenticated, getTenants);

export default router;