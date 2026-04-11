import Tenant from '../models/Tenant.js';
import Invoice from '../models/Invoice.js';

// --- GET DASHBOARD ANALYTICS ---
export const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const range = req.query.range || '7D';

    // Get Total Active Tenants
    const activeTenants = await Tenant.countDocuments({ adminId: userId });

    // Get Total Revenue (Sum of Paid Invoices)
    const paidInvoices = await Invoice.find({ user: userId, status: 'Paid' });
    const totalRevenue = paidInvoices.reduce((acc, inv) => acc + inv.amount, 0);

    // Get Unpaid Invoices Count
    const unpaidInvoicesCount = await Invoice.countDocuments({ user: userId, status: { $in: ['Unpaid', 'Overdue'] } });

    // Calculate MRR - Abhi ke liye 99 maan kar chal rahe hain, but later you can compute it properly
    const mrr = activeTenants * 99; 

    // Get Recent Activity
    const recentInvoices = await Invoice.find({ user: userId })
      .populate('tenant', 'businessName')
      .sort({ createdAt: -1 })
      .limit(4);

    // Chart Data mapping (Will be replaced with real aggregation logic as app scales)
    let chartData = [];
    if (range === '7D') {
      chartData = [
        { name: 'Mon', rev: 1200 }, { name: 'Tue', rev: 1900 }, 
        { name: 'Wed', rev: 1500 }, { name: 'Thu', rev: 2200 }, 
        { name: 'Fri', rev: 2800 }, { name: 'Sat', rev: 3100 }, 
        { name: 'Sun', rev: 2900 }
      ];
    } else if (range === '30D') {
      chartData = [
        { name: 'W1', rev: 8400 }, { name: 'W2', rev: 12500 }, 
        { name: 'W3', rev: 10200 }, { name: 'W4', rev: 14000 }
      ];
    } else if (range === '6M') {
      chartData = [
        { name: 'Jan', rev: 4000 }, { name: 'Feb', rev: 3500 }, 
        { name: 'Mar', rev: 5000 }, { name: 'Apr', rev: 4500 }, 
        { name: 'May', rev: 6000 }, { name: 'Jun', rev: 7000 }
      ];
    }

    res.status(200).json({
      success: true,
      stats: {
        totalRevenue,
        activeTenants,
        unpaidInvoices: unpaidInvoicesCount,
        mrr
      },
      recentActivity: recentInvoices,
      chartData
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};