import express from 'express';
import multer from 'multer';
import { scanInvoiceImage } from '../controllers/aiController.js';
import { isAuthenticated } from '../middlewares/auth.js';

const router = express.Router();

// Multer setup - image ko direct memory me hold karne ke liye
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Route: POST /api/ai/scan-invoice
router.post('/scan-invoice', isAuthenticated, upload.single('invoiceImage'), scanInvoiceImage);

export default router;