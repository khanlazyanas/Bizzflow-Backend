import Tenant from '../models/Tenant.js';

// ==========================================
// 1. CREATE TENANT (With Pro Limit Logic)
// ==========================================
export const createTenant = async (req, res) => {
  try {
    // 🔥 FIX 1: 'email' ko request body se nikal liya
    const { businessName, ownerName, email, plan } = req.body;

    // 🔥 FIX 2: Validation mein 'email' bhi zaroori kar diya
    if (!businessName || !ownerName || !email) {
      return res.status(400).json({ success: false, message: "Please fill all details including client email" });
    }

    // 🔥 LIMIT CHECK LOGIC
    // Pehle check karo is admin ne kitne tenant banaye hain
    const tenantCount = await Tenant.countDocuments({ adminId: req.user._id });

    // Agar user Pro nahi hai aur limit 5 ya usse zyada hai, toh rok do
    if (!req.user.isPro && tenantCount >= 5) {
      return res.status(400).json({ 
        success: false, 
        message: "Free plan limit reached! Upgrade to add unlimited tenants." 
      });
    }

    // 🔥 FIX 3: Naya tenant banate waqt 'email' bhi database mein daal diya
    const tenant = await Tenant.create({
      businessName,
      ownerName,
      email, 
      plan,
      adminId: req.user._id 
    });

    res.status(201).json({
      success: true,
      tenant
    });
  } catch (error) {
    console.log("Error in createTenant:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};


// ==========================================
// 2. GET MY TENANTS
// ==========================================
export const getMyTenants = async (req, res) => {
  try {
    const tenants = await Tenant.find({ adminId: req.user._id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      tenants
    });
  } catch (error) {
    console.log("Error in getMyTenants:", error.message);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};


// ==========================================
// 3. DELETE TENANT
// ==========================================
export const deleteTenant = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);

    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    // Security Check: Sirf wahi admin delete kar sake jisne banaya hai
    if (tenant.adminId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    await tenant.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Tenant deleted successfully'
    });
  } catch (error) {
    console.log("Error in deleteTenant:", error.message);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};