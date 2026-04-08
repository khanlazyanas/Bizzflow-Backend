import mongoose from 'mongoose';

const tenantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Business name is required']
  },
  ownerName: {
    type: String,
    required: [true, 'Owner name is required']
  },
  plan: {
    type: String,
    enum: ['Starter Plan', 'Pro Plan', 'Enterprise'],
    default: 'Starter Plan'
  },
  status: {
    type: String,
    enum: ['Active', 'Pending', 'Suspended'],
    default: 'Active'
  },
  // Link this tenant to the Admin who created it
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

export default mongoose.model('Tenant', tenantSchema);