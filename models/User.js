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
    default: "My Workspace" 
  },
  // 🔥 NAYA FEATURE: GST Number field for Setup Profile
  gstNumber: {
    type: String,
    default: ""
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: [
      function() { return !this.googleId; }, 
      'Password is required'
    ],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false 
  },
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
  
  // Forgot Password fields
  resetPasswordToken: String,
  resetPasswordExpire: Date,

}, { timestamps: true });

userSchema.pre('save', async function() {
  if (!this.isModified('password') || !this.password) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = async function(enteredPassword) {
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