import User from '../models/User.js';
import { sendCookie } from '../utils/sendCookie.js';

// --- REGISTER USER ---
export const registerUser = async (req, res) => {
  try {
    const { fullName, businessName, email, password } = req.body;

    // Check karo if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // Naya user create karo
    const user = await User.create({
      fullName,
      businessName,
      email,
      password
    });

    // Send Token via Cookie
    sendCookie(user, 201, res, 'Workspace created successfully!');
    
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- LOGIN USER ---
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if email and password are provided
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    // Find user (kyunki select: false tha, toh +password karke specially lana padega)
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid Email or Password' });
    }

    // Match password
    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      return res.status(401).json({ success: false, message: 'Invalid Email or Password' });
    }

    // Send Token via Cookie
    sendCookie(user, 200, res, `Welcome back, ${user.fullName}!`);

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- LOGOUT USER ---
export const logoutUser = async (req, res) => {
  res.status(200).cookie('token', null, {
    expires: new Date(Date.now()),
    httpOnly: true,
    secure: true,        // <-- Yahan bhi add karna zaroori hai
    sameSite: "none",    // <-- Yahan bhi add karna zaroori hai
  }).json({
    success: true,
    message: 'Logged out successfully'
  });
};



// --- GET LOGGED IN USER PROFILE ---
export const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};