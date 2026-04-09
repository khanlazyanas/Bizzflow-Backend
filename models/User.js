import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

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
  }
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

export default mongoose.model('User', userSchema);