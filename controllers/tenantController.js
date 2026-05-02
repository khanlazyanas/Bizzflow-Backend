import Tenant from '../models/Tenant.js';

export const createTenant = async (req, res) => {
  try {
    const { businessName, ownerName, email, plan } = req.body;

    if (!businessName || !ownerName || !email) {
      return res.status(400).json({ success: false, message: "Please fill all details including client email" });
    }

    const tenantCount = await Tenant.countDocuments({ adminId: req.user._id });
    if (!req.user.isPro && tenantCount >= 5) {
      return res.status(400).json({ success: false, message: "Free plan limit reached! Upgrade to add unlimited tenants." });
    }

    const tenant = await Tenant.create({
      businessName,
      ownerName,
      email, 
      plan,
      adminId: req.user._id 
    });

    res.status(201).json({ success: true, tenant });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyTenants = async (req, res) => {
  try {
    const tenants = await Tenant.find({ adminId: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, tenants });
  } catch (error) {
    // 🔥 FIX: Asli error bhej rahe hain ab
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteTenant = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) return res.status(404).json({ success: false, message: 'Tenant not found' });
    
    if (tenant.adminId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    await tenant.deleteOne();
    res.status(200).json({ success: true, message: 'Tenant deleted successfully' });
  } catch (error) {
    // 🔥 FIX: Asli error bhej rahe hain ab
    res.status(500).json({ success: false, message: error.message });
  }
};