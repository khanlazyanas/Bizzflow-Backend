import express from 'express';
import { 
  createInvoice, 
  deleteInvoice, 
  getInvoices, 
  updateInvoiceStatus,
  // 🔥 NAYE IMPORTS
  getTrashedInvoices,
  restoreInvoice,
  hardDeleteInvoice,
  emailInvoiceToClient
} from '../controllers/invoiceController.js';
import { isAuthenticated } from '../middlewares/auth.js';

const router = express.Router();

// ==========================================
// 🔥 RECYCLE BIN (TRASH) ROUTES
// Note: Inko hamesha '/:id' se upar rakhna zaroori hai!
// ==========================================
router.route('/trash')
  .get(isAuthenticated, getTrashedInvoices);

router.route('/:id/restore')
  .put(isAuthenticated, restoreInvoice);

router.route('/:id/permanent')
  .delete(isAuthenticated, hardDeleteInvoice);

// ==========================================
// REGULAR ROUTES
// ==========================================
router.route('/')
  .post(isAuthenticated, createInvoice)
  .get(isAuthenticated, getInvoices);

router.route('/:id')
  .delete(isAuthenticated, deleteInvoice) // Ye ab soft-delete (Trash me bhejne) ka kaam karega
  .put(isAuthenticated, updateInvoiceStatus);

router.route('/:id/send-email')
  .post(isAuthenticated, emailInvoiceToClient);  

export default router;