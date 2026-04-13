import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import connectDB from './config/database.js'; // Ensure path and .js extension are correct

// Import Routes
import authRoutes from './routes/authRoutes.js';
import tenantRoutes from './routes/tenantRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';

// Load Environment Variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Initialize Express App
const app = express();

// --- MIDDLEWARES ---
// Allow frontend to talk to backend and send cookies securely
app.use(cors({
  origin: process.env.FRONTEND_URL, // Your Vite React App URL (Update if different)
  credentials: true
})); 
app.use(express.json()); 
app.use(cookieParser()); 

app.use(express.json({ limit: '5mb' })); 
app.use(express.urlencoded({ limit: '5mb', extended: true }));

// --- API ROUTES ---
app.use('/api/auth', authRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/dashboard', dashboardRoutes);

// --- BASIC ROUTE ---
app.get('/', (req, res) => {
  res.json({ message: "Welcome to BizFlow API! 🚀 Engine is running perfectly." });
});

// --- SERVER START ---
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});