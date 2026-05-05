import User from '../models/User.js';
import { sendCookie } from '../utils/sendCookie.js';
import { sendEmail } from '../utils/mailer.js'; 
import crypto from 'crypto'; 
import { v2 as cloudinary } from 'cloudinary';
import DataURIParser from 'datauri/parser.js';
import path from 'path';

// --- CLOUDINARY CONFIGURATION ---
cloudinary.config({
  cloud_name: 'dfobd7fvw',
  api_key: '664186533374346', 
  api_secret: 'QtGeDxlazzgIJBubYQ18gUr2cO8'
});

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

// --- UPDATE USER PROFILE (WITH CLOUDINARY UPLOAD) ---
export const updateProfile = async (req, res) => {
  try {
    const { fullName, email } = req.body;

    const existingUser = await User.findOne({ email, _id: { $ne: req.user._id } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email is already taken by another user.' });
    }

    const updateData = { fullName, email };

    if (req.file) {
      const parser = new DataURIParser();
      const extName = path.extname(req.file.originalname).toString();
      const file64 = parser.format(extName, req.file.buffer);

      const cloudinaryResponse = await cloudinary.uploader.upload(file64.content, {
        folder: 'bizflow_avatars', 
        crop: "fill",
        gravity: "face"
      });

      updateData.avatar = cloudinaryResponse.secure_url; 
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true } 
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

// --- PRO FEATURE: CHANGE PASSWORD ---
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide both current and new passwords.' });
    }

    const user = await User.findById(req.user._id).select('+password');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect current password.' });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({ success: false, message: 'New password cannot be the same as the old password.' });
    }

    user.password = newPassword;
    await user.save(); 

    res.status(200).json({
      success: true,
      message: 'Password changed successfully! Keep it safe. 🔒'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- FORGOT PASSWORD ---
export const forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found with this email' });
    }

    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #27272a; border-radius: 16px; overflow: hidden; background-color: #000;">
        <div style="background-color: #09090b; padding: 30px; text-align: center; border-bottom: 1px solid #27272a;">
          <h1 style="color: #fff; margin: 0; font-size: 28px; letter-spacing: -1px;">BizFlow<span style="color: #4f46e5;">.</span></h1>
        </div>
        <div style="padding: 40px 30px; background-color: #000;">
          <h2 style="color: #fff; margin-top: 0;">Password Reset Request</h2>
          <p style="color: #a1a1aa; line-height: 1.6; font-size: 15px;">You recently requested to reset your password for your BizFlow workspace. Click the button below to set a new password securely.</p>
          <div style="text-align: center; margin: 40px 0;">
            <a href="${resetUrl}" style="display: inline-block; padding: 14px 32px; background-color: #fff; color: #000; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 15px;">Reset Password</a>
          </div>
          <p style="color: #52525b; font-size: 13px; line-height: 1.5; margin-bottom: 0;">If you did not request a password reset, please ignore this email or contact support if you have concerns. This link is only valid for 15 minutes.</p>
        </div>
      </div>
    `;

    try {
      // Adjusted to use 'html' inside your new sendEmail function
      await sendEmail({
        email: user.email,
        subject: 'BizFlow - Secure Password Recovery',
        html,
      });

      res.status(200).json({ success: true, message: `Recovery email sent to ${user.email}` });
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(500).json({ success: false, message: 'Email could not be sent. Please check settings.' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- RESET PASSWORD ---
export const resetPassword = async (req, res) => {
  try {
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }, 
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Reset Token is invalid or has expired.' });
    }

    user.password = req.body.password;
    
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    
    await user.save();

    sendCookie(user, 200, res, 'Password reset successful! Welcome back.');
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const isProUser = (req, res, next) => {
  if (!req.user.isPro) {
    return res.status(403).json({ 
      success: false, 
      message: "Please upgrade to Pro to access this feature!" 
    });
  }
  next();
};

// =======================================================
// 🔥 NAYA FEATURE: MAGIC LINK / OTP LOGIN LOGIC
// =======================================================

// --- SEND LOGIN OTP ---
export const sendLoginOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email is required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: "User not found. Please register first." });

    // 6-digit random OTP generate karo
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // OTP ko database me save karo (10 mins expiry ke sath)
    user.loginOtp = otp;
    user.loginOtpExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save({ validateBeforeSave: false }); // Validate check skip kiya taaki baaki validation error na de

    // Premium HTML Email Template
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; text-align: center; padding: 40px 20px; background-color: #050505; color: #ffffff; border-radius: 10px;">
        <h2 style="color: #ffffff; font-weight: 800; margin-bottom: 5px;">Log in to BizFlow</h2>
        <p style="color: #a1a1aa; font-size: 16px;">Here is your secure login code:</p>
        <div style="background-color: #18181b; padding: 20px; border-radius: 10px; margin: 30px auto; width: fit-content; border: 1px solid #3f3f46;">
          <h1 style="font-size: 40px; letter-spacing: 12px; margin: 0; color: #4f46e5;">${otp}</h1>
        </div>
        <p style="color: #71717a; font-size: 12px;">This code will expire in 10 minutes. If you didn't request this, safely ignore this email.</p>
      </div>
    `;

    await sendEmail({
      email: user.email,
      subject: "BizFlow - Your Secure Login Code",
      html: emailHtml
    });

    res.status(200).json({ success: true, message: "OTP sent to your email successfully!" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- VERIFY OTP & LOGIN ---
export const verifyOtpLogin = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) return res.status(400).json({ success: false, message: "Email and OTP are required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // OTP aur Expiry Check karo
    if (user.loginOtp !== otp || user.loginOtpExpire < Date.now()) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP code" });
    }

    // OTP Sahi hai -> Purana OTP delete kar do
    user.loginOtp = undefined;
    user.loginOtpExpire = undefined;
    await user.save({ validateBeforeSave: false });

    // Cookie generate karke login kara do
    sendCookie(user, 200, res, `Welcome back via Magic Code, ${user.fullName}!`);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};