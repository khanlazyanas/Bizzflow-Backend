import Tenant from '../models/Tenant.js';
import Invoice from '../models/Invoice.js';
import redisClient from '../utils/redis.js'; // 🔥 REDIS IMPORT 

// --- GET DASHBOARD ANALYTICS (WITH REDIS CACHE) ---
export const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const userIdStr = userId.toString(); // Redis key ke liye string format
    const range = req.query.range || '7D';

    // 🔥 1. REDIS CACHE KEY BANAYI
    const cacheKey = `dashboard_stats_${userIdStr}_${range}`;

    // 🔥 2. CHECK CACHE (Agar data Redis mein hai toh 0.1s mein wahi se bhej do)
    try {
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        console.log(`⚡ Serving Dashboard for Range: ${range} from Redis Cache`);
        return res.status(200).json(JSON.parse(cachedData));
      }
    } catch (cacheError) {
      console.error("Redis Get Error:", cacheError);
      // Agar Redis fail bhi ho jaye, toh app crash nahi hoga, aage MongoDB se data le aayega
    }

    console.log(`🗄️ Serving Dashboard for Range: ${range} from MongoDB`);

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

    // 🔥 6. FINAL RESPONSE DATA TAIYAR KIYA
    const responseData = {
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
    };

    // 🔥 7. SAVE TO REDIS (Agli baar ke liye save kar lo - Expiry 5 mins)
    try {
      // 300 seconds = 5 minutes tak data cache mein rahega
      await redisClient.setEx(cacheKey, 300, JSON.stringify(responseData)); 
    } catch (cacheError) {
      console.error("Redis Set Error:", cacheError);
    }

    // 8. Send Response
    res.status(200).json(responseData);

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =======================================================
// 🔥 EXPORT DATA TO CSV/EXCEL
// =======================================================
export const exportDashboardData = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Database se saari invoices fetch karo
    const allInvoices = await Invoice.find({ user: userId }).populate('tenant', 'businessName');

    // CSV File ke Headers (Columns)
    let csv = 'Invoice Number,Tenant Name,Amount ($),Status,Due Date,Created At\n';

    // Har invoice ko ek row mein convert karo
    allInvoices.forEach(inv => {
      const tenantName = inv.tenant ? inv.tenant.businessName : 'Unknown';
      const amount = inv.amount;
      const status = inv.status;
      const dueDate = new Date(inv.dueDate).toLocaleDateString('en-US');
      const createdAt = new Date(inv.createdAt).toLocaleDateString('en-US');

      // Names ke aaspas quotes ("") lagaye hain taaki comma (,) aane par column break na ho
      csv += `"${inv.invoiceNumber || 'N/A'}","${tenantName}",${amount},"${status}","${dueDate}","${createdAt}"\n`;
    });

    // Browser ko batao ki ye ek CSV file download karni hai
    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', 'attachment; filename="BizFlow_Revenue_Report.csv"');
    
    res.status(200).send(csv);

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};