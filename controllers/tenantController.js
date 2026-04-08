import Tenant from '../models/Tenant.js';

// --- CREATE A NEW TENANT ---
export const createTenant = async (req, res) => {
  try {
    const { name, ownerName, plan } = req.body;

    const tenant = await Tenant.create({
      name,
      ownerName,
      plan,
      user: req.user._id // Attach the logged-in user's ID
    });

    res.status(201).json({ success: true, tenant });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- GET ALL TENANTS FOR LOGGED-IN USER ---
export const getTenants = async (req, res) => {
  try {
    // Only fetch tenants that belong to this specific user
    const tenants = await Tenant.find({ user: req.user._id }).sort({ createdAt: -1 });
    
    res.status(200).json({ success: true, count: tenants.length, tenants });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};