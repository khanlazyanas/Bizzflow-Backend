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
      // 🚀 TASK 1: SEND OVERDUE REMINDERS & UPDATE STATUS
      // =========================================================
      const overdueInvoices = await Invoice.find({
        status: 'Unpaid',
        dueDate: { $lt: today },
        isDeleted: false 
      }).populate('tenant user'); 

      if (overdueInvoices.length > 0) {
        console.log(`⚠️ Alert: ${overdueInvoices.length} invoices are overdue. Processing...`);

        for (let inv of overdueInvoices) {
          if (!inv.tenant || !inv.tenant.email) continue;

          // 1. Status badal kar 'Overdue' kar do
          inv.status = 'Overdue';
          await inv.save();

          // 2. Public Link Generate karo
          const frontendUrl = "https://bizzflow-frontend.vercel.app"; // 🔥 Apna Vercel link verify kar lena
          const publicLink = `${frontendUrl}/invoice/public/${inv._id}`;

          // 3. Premium Warning HTML Email
          const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #fee2e2; border-radius: 10px; background-color: #fef2f2;">
                <h2 style="color: #dc2626;">Action Required: Overdue Invoice</h2>
                <p style="color: #4b5563; font-size: 16px;">Hello <strong>${inv.tenant.businessName}</strong>,</p>
                <p style="color: #4b5563; font-size: 16px;">This is an automated reminder that your payment for the following invoice is now <strong>OVERDUE</strong>.</p>
                
                <div style="background-color: #ffffff; padding: 15px; border-radius: 8px; border-left: 4px solid #ef4444; margin: 20px 0;">
                    <p style="margin: 0; color: #6b7280;">Invoice Number</p>
                    <h3 style="margin: 5px 0 0 0; color: #111827;">${inv.invoiceNumber}</h3>
                </div>
                
                <div style="background-color: #ffffff; padding: 15px; border-radius: 8px; border-left: 4px solid #ef4444;">
                    <p style="margin: 0; color: #6b7280;">Total Amount Overdue</p>
                    <h2 style="margin: 5px 0 0 0; color: #dc2626;">$${Number(inv.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</h2>
                </div>
                
                <div style="text-align: center; margin: 35px 0;">
                   <a href="${publicLink}" style="background-color: #dc2626; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">Pay Now Securely</a>
                </div>
                
                <p style="color: #4b5563; font-size: 14px; margin-top: 20px;">Please process this payment immediately to avoid any service interruptions.</p>
                <br/>
                <p style="color: #111827; font-weight: bold;">Regards,<br/>${inv.user.businessName} (via BizFlow)</p>
            </div>
          `;

          // 4. Send Email via Brevo
          await sendEmail({
            email: inv.tenant.email, 
            subject: `URGENT: Overdue Payment Reminder - ${inv.invoiceNumber}`,
            html: emailHtml // message ki jagah html bhejna hai
          });

          console.log(`📧 Reminder sent to: ${inv.tenant.email}`);
        }
      } else {
        console.log("✅ No overdue invoices found today.");
      }

      // =========================================================
      // 🗑️ TASK 2: AUTO-EMPTY RECYCLE BIN (30 Days Old)
      // =========================================================
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

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