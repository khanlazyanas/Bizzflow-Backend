import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto'; // FIX: Ye nayi line add ki hai password reset token ke liye

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required']
  },
  businessName: {
    type: String,
    required: [true, 'Workspace/Business name is required']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false // Normal queries mein password leak na ho isliye
  },
  avatar: {
    type: String,
    default: ""
  },
  
  // FIX: Ye 2 nayi lines add ki gayi hain Forgot Password ke liye 👇
  resetPasswordToken: String,
  resetPasswordExpire: Date,

}, { timestamps: true });

// ========================================================
// 🛠️ YAHAN SE 'next' HATA DIYA GAYA HAI KUNKI ASYNC HAI
// ========================================================
userSchema.pre('save', async function() {
  // Agar password change nahi hua hai, toh aage badho (return)
  if (!this.isModified('password')) return;
  
  // 10 rounds of salt se hash karo (Secure)
  this.password = await bcrypt.hash(this.password, 10);
});

// Password match karne ka method (Login ke time kaam aayega)
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// ========================================================
// FIX: Naya method password reset token generate karne ke liye 👇
// ========================================================
userSchema.methods.getResetPasswordToken = function () {
  // 1. Ek random token banayein (20 bytes ka hex string)
  const resetToken = crypto.randomBytes(20).toString('hex');

  // 2. Database mein save karne ke liye usko encrypt (hash) karein taaki database hack ho to bhi token safe rahe
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // 3. Token ki expiry 15 minute set karein (Date.now() ms me hota hai)
  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

  // 4. Asli (bina hash wala) token return karein jo user ko email me jayega
  return resetToken;
};

export default mongoose.model('User', userSchema);