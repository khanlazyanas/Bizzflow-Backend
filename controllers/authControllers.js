import User from '../models/User.js';
import { sendCookie } from '../utils/sendCookie.js';

// --- REGISTER USER ---
export const registerUser = async (req, res) => {
  try {
    const { fullName, businessName, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const user = await User.create({
      fullName,
      businessName,
      email,
      password
    });

    sendCookie(user, 201, res, 'Workspace created successfully!');
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- LOGIN USER ---
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid Email or Password' });
    }

    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      return res.status(401).json({ success: false, message: 'Invalid Email or Password' });
    }

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
    secure: true,
    sameSite: "none",
  }).json({
    success: true,
    message: 'Logged out successfully'
  });
};

// --- GET LOGGED IN USER PROFILE ---
export const getMyProfile = async (req, res) => {
  try {
    // FIX: Database se poora user fetch karo taaki 'fullName' aa jaye
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


// --- UPDATE USER PROFILE ---
export const updateProfile = async (req, res) => {
  try {
    const { fullName, email } = req.body;

    // Email already in use check
    const existingUser = await User.findOne({ email, _id: { $ne: req.user._id } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email is already taken by another user.' });
    }

    // Database me user update karo
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { fullName, email },
      { new: true, runValidators: true } // naya updated document return karega
    ).select('-password');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};