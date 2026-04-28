// 🔥 YAHAN FIX KIYA HAI: Ye line sabse pehle chalegi
import 'dotenv/config'; 

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet'; 
import session from 'express-session'; 
import passport from 'passport'; 
import './utils/passport.js'; 

import connectDB from './config/database.js'; 
import startAutomation from './utils/automation.js'; 

import authRoutes from './routes/authRoutes.js';
import tenantRoutes from './routes/tenantRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';

// Ab dotenv pehle hi load ho chuka hai, toh Redis ko URL mil jayega
connectDB();

const app = express();

// 🔥 100% FIX 1: Render proxy ko trust karne ke liye (Vercel se connect hone ke liye zaroori)
app.set("trust proxy", 1);

// App ki security ON
app.use(helmet()); 

app.use(cors({
  origin: process.env.FRONTEND_URL, 
  credentials: true
})); 

// 10MB limit for Images
app.use(express.json({ limit: '10mb' })); 
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser()); 

// 🔥 100% FIX 2: Session Cookie Settings Update (Taki browser Render ki cookie Vercel par block na kare)
app.use(session({
  secret: process.env.SESSION_SECRET || "bizflow_secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,        // Hamesha HTTPS/Live ke liye
    sameSite: 'none',    // Alag-alag domain (Render -> Vercel) ke liye MUST hai
    maxAge: 24 * 60 * 60 * 1000 // 1 Day
  }
}));

app.use(passport.initialize());
app.use(passport.session());

// 🔥 NAYI LINE: Automation Background Engine Start kar diya
startAutomation();

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
  console.log(`🚀 Server running on port ${PORT} and Automation is Active! 🤖`);
});