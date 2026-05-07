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
  getPublicInvoice // 🔥 FIX: Ye missing tha
} from '../controllers/invoiceController.js';

// 🔥 FIX: Payment controllers import karne padenge
import { createInvoicePayment, verifyInvoicePayment } from '../controllers/paymentController.js'; 

import { isAuthenticated } from '../middlewares/auth.js';

const router = express.Router();

// ==========================================
// 🔥 PUBLIC ROUTES (BINA LOGIN KE CHALENGE)
// Inko hamesha baaki routes se upar rakhna hai
// ==========================================
router.route('/public/:id').get(getPublicInvoice);
router.route('/:id/pay').post(createInvoicePayment);
router.route('/verify-payment').post(verifyInvoicePayment);


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
// REGULAR ROUTES (LOGIN CHAHIYE)
// ==========================================
router.route('/')
  .post(isAuthenticated, createInvoice)
  .get(isAuthenticated, getInvoices);

router.route('/:id')
  .delete(isAuthenticated, deleteInvoice) 
  .put(isAuthenticated, updateInvoiceStatus);

// 🔥 SEND EMAIL ROUTE
router.route('/:id/send-email')
  .post(isAuthenticated, emailInvoiceToClient);  

export default router;