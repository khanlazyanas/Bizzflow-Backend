import express from 'express';
import multer from 'multer';
import { scanInvoiceImage, getFinancialInsights } from '../controllers/aiController.js'; // 🔥 Naya function import kiya
import { isAuthenticated } from '../middlewares/auth.js';

const router = express.Router();

// Multer setup - image ko direct memory me hold karne ke liye
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Route 1: POST /api/ai/scan-invoice (Image upload & extract)
router.post('/scan-invoice', isAuthenticated, upload.single('invoiceImage'), scanInvoiceImage);

// Route 2: GET /api/ai/insights (🔥 NAYA: Dashboard analytics)
router.get('/insights', isAuthenticated, getFinancialInsights);

export default router;