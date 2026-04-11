import Tenant from '../models/Tenant.js';

export const createTenant = async (req, res) => {
  try {
    // Yahan frontend se businessName nikal rahe hain
    const { businessName, ownerName, plan } = req.body;

    // Validation check taaki khali data na jaye
    if (!businessName || !ownerName) {
      return res.status(400).json({ success: false, message: "Please fill all details" });
    }

    const tenant = await Tenant.create({
      businessName,
      ownerName,
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