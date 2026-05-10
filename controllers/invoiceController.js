import Invoice from '../models/Invoice.js';
import { sendEmail } from '../utils/sendEmail.js';
import twilio from 'twilio'; // 🔥 Twilio import

// ==========================================
// 1. CREATE INVOICE
// ==========================================
export const createInvoice = async (req, res) => {
  try {
    const { tenantId, amount, dueDate } = req.body;
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const invoiceNumber = `INV-${new Date().getFullYear()}-${randomNum}`;

    const invoice = await Invoice.create({
      invoiceNumber,
      amount,
      dueDate,
      tenant: tenantId,
      user: req.user._id 
    });

    await invoice.populate('tenant', 'businessName ownerName');
    res.status(201).json({ success: true, invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 2. GET ALL INVOICES (🔥 PAGINATION ADDED)
// ==========================================
export const getInvoices = async (req, res) => {
  try {
    // URL se page number aur limit nikalna (Default: page 1, 10 items)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Total kitne Invoices hain (Page count ke liye zaroori)
    const totalInvoices = await Invoice.countDocuments({
      user: req.user._id,
      isDeleted: false
    });

    // Pura data laane ki jagah sirf required page ka data laana
    const invoices = await Invoice.find({ 
      user: req.user._id,
      isDeleted: false 
    })
      .populate('tenant', 'businessName')
      .sort({ createdAt: -1 })
      .skip(skip)   // Itne elements chhod do
      .limit(limit); // Sirf itne hi uthao

    res.status(200).json({ 
      success: true, 
      count: invoices.length,
      totalInvoices,
      totalPages: Math.ceil(totalInvoices / limit),
      currentPage: page,
      invoices 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 3. SOFT DELETE INVOICE (MOVE TO TRASH)
// ==========================================
export const deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    if (invoice.user.toString() !== req.user._id.toString()) return res.status(401).json({ success: false, message: 'Not authorized' });

    invoice.isDeleted = true;
    invoice.deletedAt = new Date(); 
    await invoice.save();
    res.status(200).json({ success: true, message: 'Invoice moved to trash successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 4. UPDATE INVOICE STATUS (MANUAL)
// ==========================================
export const updateInvoiceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const invoice = await Invoice.findById(id);

    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    if (invoice.user.toString() !== req.user._id.toString()) return res.status(401).json({ success: false, message: 'Not authorized' });

    invoice.status = status;
    await invoice.save();
    await invoice.populate('tenant', 'businessName ownerName');
    res.status(200).json({ success: true, message: 'Invoice status updated', invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 5. GET TRASHED INVOICES (RECYCLE BIN)
// ==========================================
export const getTrashedInvoices = async (req, res) => {
  try {
    const trashedInvoices = await Invoice.find({ user: req.user._id, isDeleted: true })
      .populate('tenant', 'businessName')
      .sort({ deletedAt: -1 });
    res.status(200).json({ success: true, count: trashedInvoices.length, invoices: trashedInvoices });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 6. RESTORE INVOICE FROM TRASH
// ==========================================
export const restoreInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    if (invoice.user.toString() !== req.user._id.toString()) return res.status(401).json({ success: false, message: 'Not authorized' });

    invoice.isDeleted = false;
    invoice.deletedAt = null; 
    await invoice.save();
    res.status(200).json({ success: true, message: 'Invoice restored' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 7. PERMANENTLY DELETE INVOICE
// ==========================================
export const hardDeleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    if (invoice.user.toString() !== req.user._id.toString()) return res.status(401).json({ success: false, message: 'Not authorized' });

    await invoice.deleteOne();
    res.status(200).json({ success: true, message: 'Invoice permanently deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 8. 🔥 PUBLIC INVOICE LINK (NO LOGIN REQUIRED)
// ==========================================
export const getPublicInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('tenant', 'businessName email phone address')
      .populate('user', 'businessName email avatar fullName'); 
      
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    
    res.status(200).json({ success: true, invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: "Invalid Invoice Link" });
  }
};

// ==========================================
// 9. 🔥 SEND EMAIL WITH "PAY NOW" LINK
// ==========================================
export const emailInvoiceToClient = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate('tenant');
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    if (invoice.user.toString() !== req.user._id.toString()) return res.status(401).json({ success: false, message: 'Not authorized' });

    if (!invoice.tenant) {
      return res.status(400).json({ success: false, message: 'Tenant details not found for this invoice.' });
    }

    const clientEmail = invoice.tenant.email; 
    const clientName = invoice.tenant.businessName || 'Valued Client';

    if (!clientEmail) {
      return res.status(400).json({ success: false, message: 'Client email is missing in Tenant records.' });
    }

    const frontendUrl = process.env.FRONTEND_URL || "https://bizflow-saas-web.vercel.app"; 
    
    const publicLink = `${frontendUrl}/invoice/public/${invoice._id}`;

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; background-color: #f9fafb;">
          <h2 style="color: #111827;">Hello ${clientName},</h2>
          <p style="color: #4b5563; font-size: 16px;">A new invoice has been generated for your recent services.</p>
          
          <div style="background-color: #ffffff; padding: 15px; border-radius: 8px; border-left: 4px solid #6366f1; margin: 20px 0;">
              <p style="margin: 0; color: #6b7280;">Invoice Number</p>
              <h3 style="margin: 5px 0 0 0; color: #111827;">${invoice.invoiceNumber}</h3>
          </div>
          
          <div style="background-color: #ffffff; padding: 15px; border-radius: 8px; border-left: 4px solid #10b981;">
              <p style="margin: 0; color: #6b7280;">Total Amount Due</p>
              <h2 style="margin: 5px 0 0 0; color: #111827;">$${Number(invoice.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</h2>
          </div>
          
          <div style="text-align: center; margin: 35px 0;">
             <a href="${publicLink}" style="background-color: #4f46e5; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">View & Pay Invoice</a>
          </div>
          
          <p style="color: #4b5563; font-size: 14px; margin-top: 20px;">Please arrange the payment at your earliest convenience.</p>
          <br/>
          <p style="color: #111827; font-weight: bold;">Thank You,<br/>BizFlow Team</p>
      </div>
    `;

    await sendEmail({
      email: clientEmail,
      subject: `New Invoice Generated: ${invoice.invoiceNumber}`,
      html: emailHtml
    });

    res.status(200).json({ success: true, message: 'Invoice sent to client successfully! 📩' });
  } catch (error) {
    console.error("Email Error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to send email." });
  }
};

// ==========================================
// 10. 🔥 SEND INVOICE VIA WHATSAPP
// ==========================================
export const whatsappInvoiceToClient = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate('tenant');
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    if (invoice.user.toString() !== req.user._id.toString()) return res.status(401).json({ success: false, message: 'Not authorized' });

    const clientPhone = invoice.tenant?.phone;
    
    if (!clientPhone) {
      return res.status(400).json({ success: false, message: 'Client phone number is missing in Tenant records.' });
    }

    const formattedPhone = clientPhone.startsWith('+') ? clientPhone : `+91${clientPhone}`;

    const frontendUrl = process.env.FRONTEND_URL || "https://bizflow-saas-web.vercel.app"; 
    const publicLink = `${frontendUrl}/invoice/public/${invoice._id}`;

    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

    await client.messages.create({
      body: `Hello *${invoice.tenant.businessName}*,\n\nA new invoice (*${invoice.invoiceNumber}*) has been generated for your services.\n\n💰 *Total Due:* $${Number(invoice.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}\n📅 *Due Date:* ${new Date(invoice.dueDate).toDateString()}\n\n🔗 *Click here to View & Pay securely:*\n${publicLink}\n\nThank You,\nBizFlow Team`,
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: `whatsapp:${formattedPhone}`
    });

    res.status(200).json({ success: true, message: 'WhatsApp sent successfully! 💬' });
  } catch (error) {
    console.error("WhatsApp Error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to send WhatsApp." });
  }
};