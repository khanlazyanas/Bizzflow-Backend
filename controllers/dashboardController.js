import Tenant from '../models/Tenant.js';
import Invoice from '../models/Invoice.js';

// --- GET DASHBOARD ANALYTICS ---
export const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const range = req.query.range || '7D';

    // 1. Get Total Active Tenants
    const activeTenants = await Tenant.countDocuments({ adminId: userId });

    // 2. Get All Invoices & Populate Tenant Details
    const allInvoices = await Invoice.find({ user: userId }).populate('tenant', 'businessName');

    // 3. Calculate Accurate Stats
    let totalRevenue = 0;
    let unpaidInvoicesCount = 0;

    allInvoices.forEach(inv => {
      if (inv.status === 'Paid') {
        totalRevenue += inv.amount;
      } else if (inv.status === 'Unpaid' || inv.status === 'Overdue') {
        unpaidInvoicesCount += 1;
      }
    });

    // Calculate MRR (Currently assuming active tenants * 99 logic)
    const mrr = activeTenants * 99; 

    // 4. Get Recent Activity
    const recentActivity = allInvoices
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 6); // Fetching top 6 for a fuller activity feed

    // 5. 🔥 DYNAMIC CHART DATA LOGIC 🔥
    let chartDataMap = {};
    const now = new Date();

    allInvoices.forEach(inv => {
      if (inv.status !== 'Paid') return;

      const date = new Date(inv.createdAt);
      const diffTime = Math.abs(now - date);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (range === '7D' && diffDays <= 7) {
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        chartDataMap[dayName] = (chartDataMap[dayName] || 0) + inv.amount;
      } else if (range === '30D' && diffDays <= 30) {
        const weekNum = Math.ceil(diffDays / 7);
        const weekKey = `W${5 - (weekNum > 4 ? 4 : weekNum)}`; 
        chartDataMap[weekKey] = (chartDataMap[weekKey] || 0) + inv.amount;
      } else if (range === '6M' && diffDays <= 180) {
        const monthName = date.toLocaleDateString('en-US', { month: 'short' });
        chartDataMap[monthName] = (chartDataMap[monthName] || 0) + inv.amount;
      }
    });

    // Format chart data based on the selected range
    let chartData = [];
    if (range === '7D') {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      // Rotate array so today is at the end
      const todayIdx = now.getDay();
      const sortedDays = [...days.slice(todayIdx + 1), ...days.slice(0, todayIdx + 1)];
      chartData = sortedDays.map(d => ({ name: d, rev: chartDataMap[d] || 0 }));
    } else if (range === '30D') {
      chartData = ['W1', 'W2', 'W3', 'W4'].map(w => ({ name: w, rev: chartDataMap[w] || 0 }));
    } else if (range === '6M') {
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        months.push(d.toLocaleDateString('en-US', { month: 'short' }));
      }
      chartData = months.map(m => ({ name: m, rev: chartDataMap[m] || 0 }));
    }

    // 6. Send Response
    res.status(200).json({
      success: true,
      stats: {
        totalRevenue,
        activeTenants,
        unpaidInvoices: unpaidInvoicesCount,
        mrr,
        revenueTrend: 0, 
        tenantTrend: 0,
        invoiceTrend: 0,
        mrrTrend: 0
      },
      recentActivity,
      chartData
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};