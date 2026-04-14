import express from 'express';
import { createInvoice, deleteInvoice, getInvoices, updateInvoiceStatus } from '../controllers/invoiceController.js';
import { isAuthenticated } from '../middlewares/auth.js';

const router = express.Router();

router.route('/')
  .post(isAuthenticated, createInvoice)
  .get(isAuthenticated, getInvoices);
  router.route('/:id')
  .delete(isAuthenticated, deleteInvoice);
  router.put('/:id', isAuthenticated,updateInvoiceStatus);

export default router;