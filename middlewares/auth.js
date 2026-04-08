import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Yeh function har us route par lagega jise hum secure karna chahte hain
export const isAuthenticated = async (req, res, next) => {
  try {
    // 1. User ke browser (cookie) se token nikalo
    const { token } = req.cookies;

    // 2. Agar token nahi hai, toh bhaga do
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Please login to access this resource' 
      });
    }

    // 3. Agar token hai, toh check karo ki asli hai ya nakli
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Token asli hai toh us user ka data database se nikal kar request mein daal do
    req.user = await User.findById(decoded.id);
    
    // 5. Aage jaane do
    next();
  } catch (error) {
    res.status(401).json({ 
      success: false, 
      message: 'Invalid or expired token. Please login again.' 
    });
  }
};