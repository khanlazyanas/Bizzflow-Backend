import User from '../models/User.js';
import { sendCookie } from '../utils/sendCookie.js';
// FIX: Ye dono nayi lines add ki hain Forgot/Reset password ke liye
import { sendEmail } from '../utils/sendEmail.js'; 
import crypto from 'crypto'; 

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
    // Database se poora user fetch karo taaki 'fullName' aa jaye
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
    const { fullName, email, avatar } = req.body;

    // Check if new email is already taken
    const existingUser = await User.findOne({ email, _id: { $ne: req.user._id } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email is already taken by another user.' });
    }

    // Database me update karne wala data
    const updateData = { fullName, email };
    if (avatar) {
      updateData.avatar = avatar; 
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

    // Database se user nikalenge aur .select('+password') lagayenge kyunki normally password hidden hota hai
    const user = await User.findById(req.user._id).select('+password');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // 1. Check if current password is correct
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect current password.' });
    }

    // 2. Check if new password is same as old
    if (currentPassword === newPassword) {
      return res.status(400).json({ success: false, message: 'New password cannot be the same as the old password.' });
    }

    // 3. Update to new password aur .save() lagayenge taaki bcrypt hash kaam kare
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

// =======================================================
// 🔥 NAYE FEATURES: FORGOT & RESET PASSWORD
// =======================================================

// --- FORGOT PASSWORD (SEND EMAIL) ---
export const forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found with this email' });
    }

    // 1. Token Generate karo (ye model me banaya tha)
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    // 2. Email ka URL banao (Frontend ka path, jahan user click karke jayega)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    // 3. Email ka design (Professional HTML look)
    const message = `
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
      await sendEmail({
        email: user.email,
        subject: 'BizFlow - Secure Password Recovery',
        message,
      });

      res.status(200).json({ success: true, message: `Recovery email sent to ${user.email}` });
    } catch (error) {
      // Agar email bhejte waqt server crash ho/net na chale, toh token hata do
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(500).json({ success: false, message: 'Email could not be sent. Please check settings.' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- RESET PASSWORD (UPDATE DB FROM EMAIL LINK) ---
export const resetPassword = async (req, res) => {
  try {
    // 1. URL se aane wale token ko wapas hash karo, kyunki DB mein hashed version save hua tha
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    // 2. User dhundho jiska hashed token match kare aur uski expiry limit (15 mins) abhi bachi ho
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }, // $gt matlab Greater Than current time
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Reset Token is invalid or has expired.' });
    }

    // 3. User mil gaya toh naya password set karo
    user.password = req.body.password;
    
    // 4. Token ka kaam khatam, unko wapas undefined (khali) kardo
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    
    await user.save();

    // 5. Password badalte hi automatically user ko login karwa do (Cookie send karke)
    sendCookie(user, 200, res, 'Password reset successful! Welcome back.');
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};