// 🔥 YAHAN FIX KIYA HAI: Ye line sabse pehle chalegi
import 'dotenv/config'; 

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet'; // 🔥 NAYA IMPORT: Security shield
import connectDB from './config/database.js'; 

import authRoutes from './routes/authRoutes.js';
import tenantRoutes from './routes/tenantRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';

// Ab dotenv pehle hi load ho chuka hai, toh Redis ko URL mil jayega
connectDB();

const app = express();

// 🔥 NAYI LINE: App ki security ON
app.use(helmet()); 

app.use(cors({
  origin: process.env.FRONTEND_URL, 
  credentials: true
})); 

// 10MB limit for Images
app.use(express.json({ limit: '10mb' })); 
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser()); 

app.use('/api/auth', authRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/payment', paymentRoutes);

app.get('/', (req, res) => {
  res.json({ message: "Welcome to BizFlow API! 🚀 Engine is running perfectly." });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});