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

    // Populate tenant details before sending response ('name' ki jagah 'businessName')
    await invoice.populate('tenant', 'businessName ownerName');

    res.status(201).json({ success: true, invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- GET ALL INVOICES ---
export const getInvoices = async (req, res) => {
  try {
    // Fetch invoices and populate tenant details ('name' ki jagah 'businessName')
    const invoices = await Invoice.find({ user: req.user._id })
      .populate('tenant', 'businessName')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: invoices.length, invoices });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- DELETE INVOICE ---
export const deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    // Security Check: Ensure the logged-in user owns this invoice
    if (invoice.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, message: 'Not authorized to delete this invoice' });
    }

    await invoice.deleteOne();
    
    res.status(200).json({ success: true, message: 'Invoice deleted successfully' });
  } catch (error) {
    console.log("Error in deleteInvoice:", error.message);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// --- UPDATE INVOICE STATUS (MARK AS PAID) ---
export const updateInvoiceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const invoice = await Invoice.findById(id);

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    // Security Check: Ensure the logged-in user owns this invoice before updating
    if (invoice.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, message: 'Not authorized to update this invoice' });
    }

    // Status update karo aur save karo
    invoice.status = status;
    await invoice.save();

    // Frontend ko naya tenant data bhi chahiye hota hai UI update ke liye
    await invoice.populate('tenant', 'businessName ownerName');

    res.status(200).json({
      success: true,
      message: 'Invoice status updated successfully',
      invoice
    });
  } catch (error) {
    console.log("Error in updateInvoiceStatus:", error.message);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};