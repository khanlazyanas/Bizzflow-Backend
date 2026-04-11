import express from 'express';
import { createTenant, getMyTenants } from '../controllers/tenantController.js';
import { isAuthenticated } from '../middlewares/auth.js'; 

const router = express.Router();

// YAHAN FIX KIYA HAI: '/tenants' ko wapas '/' kar diya
router.route('/')
  .post(isAuthenticated, createTenant)
  .get(isAuthenticated, getMyTenants);

export default router;