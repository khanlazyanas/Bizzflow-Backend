import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required']
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required']
  },
  status: {
    type: String,
    enum: ['Paid', 'Unpaid', 'Overdue'],
    default: 'Unpaid'
  },
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // ==========================================
  // 🔥 NAYA FEATURE: Razorpay Payment Tracking
  // ==========================================
  razorpayOrderId: {
    type: String,
  },
  razorpayPaymentId: {
    type: String,
  },
  paymentMethod: {
    type: String,
    default: 'Offline' // Online pay hone par 'Razorpay' ho jayega
  },

  // ==========================================
  // Soft Delete (Recycle Bin)
  // ==========================================
  isDeleted: {
    type: Boolean,
    default: false 
  },
  deletedAt: {
    type: Date,
    default: null 
  }

}, { timestamps: true });

export default mongoose.model('Invoice', invoiceSchema);