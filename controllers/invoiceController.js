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

    // Populate tenant details before sending response
    await invoice.populate('tenant', 'businessName ownerName');

    res.status(201).json({ success: true, invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- GET ALL ACTIVE INVOICES ---
export const getInvoices = async (req, res) => {
  try {
    // 🔥 FIX: Sirf wahi invoices lao jo Trash mein nahi hain (isDeleted: false)
    const invoices = await Invoice.find({ 
      user: req.user._id,
      isDeleted: false 
    })
      .populate('tenant', 'businessName')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: invoices.length, invoices });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- SOFT DELETE INVOICE (Move to Trash) ---
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

    // 🔥 FIX: Hard delete ki jagah Soft Delete kiya
    invoice.isDeleted = true;
    invoice.deletedAt = new Date(); // Aaj ki date daal di taaki 30 din baad auto-delete kar sakein
    await invoice.save();
    
    res.status(200).json({ success: true, message: 'Invoice moved to trash successfully' });
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

    if (invoice.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, message: 'Not authorized to update this invoice' });
    }

    invoice.status = status;
    await invoice.save();

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


// ==========================================
// 🔥 NAYA FEATURE: RECYCLE BIN CONTROLLERS
// ==========================================

// --- GET ALL TRASHED INVOICES ---
export const getTrashedInvoices = async (req, res) => {
  try {
    // Sirf wahi invoice lao jo delete ho chuke hain (isDeleted: true)
    const trashedInvoices = await Invoice.find({ 
      user: req.user._id,
      isDeleted: true 
    })
      .populate('tenant', 'businessName')
      .sort({ deletedAt: -1 }); // Naye delete hue pehle dikhenge

    res.status(200).json({ success: true, count: trashedInvoices.length, invoices: trashedInvoices });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- RESTORE INVOICE FROM TRASH ---
export const restoreInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    if (invoice.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, message: 'Not authorized to restore this invoice' });
    }

    // Wapas Active kar do
    invoice.isDeleted = false;
    invoice.deletedAt = null; 
    await invoice.save();
    
    res.status(200).json({ success: true, message: 'Invoice restored successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// --- HARD DELETE INVOICE (Delete Permanently) ---
export const hardDeleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    if (invoice.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, message: 'Not authorized to delete this invoice permanently' });
    }

    // Is baar database se hamesha ke liye uda diya
    await invoice.deleteOne();
    
    res.status(200).json({ success: true, message: 'Invoice permanently deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};