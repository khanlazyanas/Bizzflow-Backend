import express from 'express';
import { createInvoice, getInvoices } from '../controllers/invoiceController.js';
import { isAuthenticated } from '../middlewares/auth.js';

const router = express.Router();

router.route('/')
  .post(isAuthenticated, createInvoice)
  .get(isAuthenticated, getInvoices);

export default router;