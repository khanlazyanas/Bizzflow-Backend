import cron from 'node-cron';
import Invoice from '../models/Invoice.js';
import { sendEmail } from './sendEmail.js'; 

const startAutomation = () => {
  // 🔥 Schedule: Har raat 12:00 AM par chalega ('0 0 * * *')
  cron.schedule('0 0 * * *', async () => {
    try {
      console.log("🤖 Running Automation: Checking for due invoices & cleaning trash...");

      const today = new Date();

      // =========================================================
      // 🚀 TASK 1: SEND OVERDUE REMINDERS
      // =========================================================
      // Database se wo invoices nikalo jo 'Unpaid' hain, Due Date nikal chuki hai, aur jo Trash mein nahi hain
      const overdueInvoices = await Invoice.find({
        status: 'Unpaid',
        dueDate: { $lt: today },
        isDeleted: false // 🔥 FIX: Deleted invoices par reminder email NAHI bhejna hai
      }).populate('tenant user'); 

      if (overdueInvoices.length > 0) {
        for (let inv of overdueInvoices) {
          const message = `
            Hello ${inv.tenant.businessName},
            This is a reminder that your payment of $${inv.amount} for Invoice #${inv.invoiceNumber} is overdue.
            Please clear it as soon as possible.
            
            Regards,
            ${inv.user.fullName} (via BizFlow) 
          `;

          await sendEmail({
            email: inv.tenant.email, 
            subject: `⚠️ Payment Reminder: Invoice #${inv.invoiceNumber}`,
            message
          });

          console.log(`📧 Reminder sent to: ${inv.tenant.email}`);
        }
      } else {
        console.log("✅ No overdue invoices found today.");
      }

      // =========================================================
      // 🗑️ TASK 2: AUTO-EMPTY RECYCLE BIN (30 Days Old)
      // =========================================================
      // Wo date nikalo jo aaj se 30 din purani hai
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Un sabhi invoices ko permanently delete maro jo 30 din pehle trash me gaye the
      const trashCleanup = await Invoice.deleteMany({
        isDeleted: true,
        deletedAt: { $lt: thirtyDaysAgo }
      });

      if (trashCleanup.deletedCount > 0) {
        console.log(`🧹 Auto-Cleanup: ${trashCleanup.deletedCount} old invoices permanently deleted from Trash.`);
      } else {
        console.log("✨ Recycle Bin is clean. No 30-day old invoices found.");
      }

    } catch (error) {
      console.error("❌ Automation Error:", error.message);
    }
  });
};

export default startAutomation;