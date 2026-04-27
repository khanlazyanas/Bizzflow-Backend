import cron from 'node-cron';
import Invoice from '../models/Invoice.js';
import { sendEmail } from './sendEmail.js'; // Aapka purana email utility

const startAutomation = () => {
  // 🔥 Schedule: Har raat 12:00 AM par chalega ('0 0 * * *')
  cron.schedule('0 0 * * *', async () => {
    try {
      console.log("🤖 Running Automation: Checking for due invoices...");

      const today = new Date();
      
      // 1. Database se wo invoices nikalo jo 'Unpaid' hain aur jinki Due Date nikal chuki hai
      const overdueInvoices = await Invoice.find({
        status: 'Unpaid',
        dueDate: { $lt: today }
      }).populate('tenant user'); // Tenant aur Admin details nikalne ke liye

      if (overdueInvoices.length === 0) {
        return console.log("✅ No overdue invoices found today.");
      }

      // 2. Loop chalao aur sabko reminder email bhejo
      for (let inv of overdueInvoices) {
        const message = `
          Hello ${inv.tenant.businessName},
          This is a reminder that your payment of $${inv.amount} for Invoice #${inv.invoiceNumber} is overdue.
          Please clear it as soon as possible.
          
          Regards,
          ${inv.user.name} (via BizFlow)
        `;

        await sendEmail({
          email: inv.tenant.email, // Tenant ka email
          subject: `⚠️ Payment Reminder: Invoice #${inv.invoiceNumber}`,
          message
        });

        console.log(`📧 Reminder sent to: ${inv.tenant.email}`);
      }

    } catch (error) {
      console.error("❌ Automation Error:", error.message);
    }
  });
};

export default startAutomation;