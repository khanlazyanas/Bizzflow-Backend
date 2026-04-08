import Tenant from '../models/Tenant.js';
import Invoice from '../models/Invoice.js';

// --- GET DASHBOARD ANALYTICS ---
export const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. Get Total Active Tenants
    const activeTenants = await Tenant.countDocuments({ user: userId, status: 'Active' });

    // 2. Get Total Revenue (Sum of Paid Invoices)
    const paidInvoices = await Invoice.find({ user: userId, status: 'Paid' });
    const totalRevenue = paidInvoices.reduce((acc, inv) => acc + inv.amount, 0);

    // 3. Get Unpaid Invoices Count
    const unpaidInvoicesCount = await Invoice.countDocuments({ user: userId, status: { $in: ['Unpaid', 'Overdue'] } });

    // 4. Calculate MRR (Monthly Recurring Revenue - simple mock calculation)
    const mrr = activeTenants * 99; // Assuming average $99 per tenant

    // 5. Get Recent Activity (Last 4 invoices/tenants)
    const recentInvoices = await Invoice.find({ user: userId })
      .populate('tenant', 'name')
      .sort({ createdAt: -1 })
      .limit(4);

    res.status(200).json({
      success: true,
      stats: {
        totalRevenue,
        activeTenants,
        unpaidInvoices: unpaidInvoicesCount,
        mrr
      },
      recentActivity: recentInvoices
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};