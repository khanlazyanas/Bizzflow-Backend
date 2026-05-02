import mongoose from 'mongoose';

const tenantSchema = new mongoose.Schema({
  // YAHAN DHYAN DO: 'businessName' hona chahiye, 'name' nahi
  businessName: {
    type: String,
    required: [true, 'Business name is required']
  },
  ownerName: {
    type: String,
    required: [true, 'Owner name is required']
  },
  // 🔥 NAYA FIELD: Ab Client ka email bhi save hoga database mein
  email: {
    type: String,
    required: [true, 'Client email is required for sending invoices']
  },
  plan: {
    type: String,
    enum: ['Starter Plan', 'Pro Plan', 'Enterprise'],
    default: 'Starter Plan'
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

export default mongoose.model('Tenant', tenantSchema);