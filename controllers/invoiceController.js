import Invoice from '../models/Invoice.js';

// --- CREATE A NEW INVOICE ---
export const createInvoice = async (req, res) => {
  try {
    const { tenantId, amount, dueDate } = req.body;

    // Generate a unique invoice number (e.g., INV-2026-XXXX)
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const invoiceNumber = `INV-${new Date().getFullYear()}-${randomNum}`;

    const invoice = await Invoice.create({
      invoiceNumber,
      amount,
      dueDate,
      tenant: tenantId,
      user: req.user._id // Attach the logged-in user's ID
    });

    // FIX: Populate tenant details before sending response ('name' ki jagah 'businessName')
    await invoice.populate('tenant', 'businessName ownerName');

    res.status(201).json({ success: true, invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- GET ALL INVOICES ---
export const getInvoices = async (req, res) => {
  try {
    // FIX: Fetch invoices and populate tenant details ('name' ki jagah 'businessName')
    const invoices = await Invoice.find({ user: req.user._id })
      .populate('tenant', 'businessName')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: invoices.length, invoices });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};