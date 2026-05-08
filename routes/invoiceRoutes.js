import express from 'express';
import { 
  createInvoice, 
  deleteInvoice, 
  getInvoices, 
  updateInvoiceStatus,
  getTrashedInvoices,
  restoreInvoice,
  hardDeleteInvoice,
  emailInvoiceToClient,
  getPublicInvoice 
} from '../controllers/invoiceController.js';

import { createInvoicePayment, verifyInvoicePayment } from '../controllers/paymentController.js'; 
import { isAuthenticated } from '../middlewares/auth.js';

const router = express.Router();

// ==========================================
// 🔓 PUBLIC ROUTES (BINA LOGIN KE CHALENGE)
// Inko hamesha top par rakhna hai!
// ==========================================
router.route('/verify-payment').post(verifyInvoicePayment);
router.route('/public/:id').get(getPublicInvoice);
router.route('/:id/pay').post(createInvoicePayment);

// ==========================================
// 🔥 RECYCLE BIN (TRASH) ROUTES
// ==========================================
router.route('/trash')
  .get(isAuthenticated, getTrashedInvoices);

router.route('/:id/restore')
  .put(isAuthenticated, restoreInvoice);

router.route('/:id/permanent')
  .delete(isAuthenticated, hardDeleteInvoice);

// ==========================================
// 🔒 REGULAR ROUTES (LOGIN CHAHIYE)
// ==========================================
router.route('/')
  .post(isAuthenticated, createInvoice)
  .get(isAuthenticated, getInvoices);

// 🔥 SEND EMAIL ROUTE
router.route('/:id/send-email')
  .post(isAuthenticated, emailInvoiceToClient);  

router.route('/:id')
  .delete(isAuthenticated, deleteInvoice) 
  .put(isAuthenticated, updateInvoiceStatus);

export default router;