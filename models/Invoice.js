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
  // Link to the specific Tenant
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  // Link to the Admin User
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // ==========================================
  // 🔥 NAYA FEATURE: Soft Delete (Recycle Bin)
  // ==========================================
  isDeleted: {
    type: Boolean,
    default: false // By default koi bhi invoice deleted nahi hoga
  },
  deletedAt: {
    type: Date,
    default: null // Jab delete hoga, tab yahan date aayegi
  }

}, { timestamps: true });

export default mongoose.model('Invoice', invoiceSchema);