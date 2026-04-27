import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required']
  },
  businessName: {
    type: String,
    // 🔥 FIX: Google users ke liye default "My Workspace" set kar diya
    default: "My Workspace" 
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    // 🔥 FIX: Password sirf tab required hoga agar user Google se login NAHI kar raha hai
    required: [
      function() { return !this.googleId; }, 
      'Password is required'
    ],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false 
  },
  
  // 🔥 NAYA FEATURE: Google Auth Field
  googleId: {
    type: String,
  },

  avatar: {
    type: String,
    default: ""
  },
  
  isPro: {
    type: Boolean,
    default: false 
  },
  
  // OTP Login fields
  loginOtp: String,
  loginOtpExpire: Date,
  
  // Forgot Password fields
  resetPasswordToken: String,
  resetPasswordExpire: Date,

}, { timestamps: true });

userSchema.pre('save', async function() {
  // 🔥 FIX: Agar password modify nahi hua hai, YA user Google wala hai (password nahi hai), toh skip karo
  if (!this.isModified('password') || !this.password) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = async function(enteredPassword) {
  // Agar Google user bina password ke login karne ki koshish kare
  if (!this.password) return false; 
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(20).toString('hex');

  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
  return resetToken;
};

export default mongoose.model('User', userSchema);