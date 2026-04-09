import express from 'express';
// YAHAN DEKHO: Maine 'getTenants' ko import list se hata diya hai 👇
import { createTenant, getMyTenants } from '../controllers/tenantController.js';
import { isAuthenticated } from '../middlewares/auth.js'; // Tumhara 'middlewares' folder ka naam sahi hai

const router = express.Router();

// Apply authentication middleware to all routes
// YAHAN DHYAN DO: '/' ki jagah '/tenants' kar diya taaki frontend se match ho
router.route('/tenants')
  .post(isAuthenticated, createTenant)
  .get(isAuthenticated, getMyTenants);

export default router;