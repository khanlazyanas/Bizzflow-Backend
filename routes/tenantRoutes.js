import express from 'express';
import { createTenant, deleteTenant, getMyTenants } from '../controllers/tenantController.js';
import { isAuthenticated } from '../middlewares/auth.js'; 

const router = express.Router();

// YAHAN FIX KIYA HAI: '/tenants' ko wapas '/' kar diya
router.route('/')
  .post(isAuthenticated, createTenant)
  .get(isAuthenticated, getMyTenants);
  router.route('/:id')
  .delete(isAuthenticated, deleteTenant);
  

export default router;