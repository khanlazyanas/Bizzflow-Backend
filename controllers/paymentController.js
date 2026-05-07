import Razorpay from 'razorpay';
import crypto from 'crypto';
import User from '../models/User.js';
import Invoice from '../models/Invoice.js'; // 🔥 Invoice model import karna padega

// ==========================================
// 1. PRO SUBSCRIPTION PAYMENTS
// ==========================================
export const checkout = async (req, res) => {
  try {
    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const options = {
      amount: 999 * 100, 
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await instance.orders.create(options);
    res.status(200).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: "Order creation failed!" });
  }
};

export const paymentVerification = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      const user = await User.findByIdAndUpdate(
        req.user._id, 
        { isPro: true }, 
        { new: true }
      ).select('-password');

      res.status(200).json({ 
        success: true, 
        message: "Welcome to BizFlow Pro! 🎉",
        user 
      });
    } else {
      res.status(400).json({ success: false, message: "Payment Verification Failed!" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 2. 🔥 NAYA: INVOICE ONLINE PAYMENTS (CLIENT KE LIYE)
// ==========================================
export const createInvoicePayment = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, message: "Invoice not found" });

    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const options = {
      amount: Math.round(invoice.amount * 100), // Convert to paise
      currency: "INR", // Change to USD if required
      receipt: `inv_${invoice._id}`,
    };

    const order = await instance.orders.create(options);
    
    // Save order ID in invoice
    invoice.razorpayOrderId = order.id;
    await invoice.save();

    res.status(200).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: "Could not create payment order" });
  }
};

export const verifyInvoicePayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, invoice_id } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      // Payment Successful - Update Invoice Status
      const invoice = await Invoice.findById(invoice_id);
      invoice.status = 'Paid';
      invoice.paymentMethod = 'Online (Razorpay)';
      invoice.razorpayPaymentId = razorpay_payment_id;
      await invoice.save();

      res.status(200).json({ success: true, message: "Payment Successful! Invoice marked as Paid." });
    } else {
      res.status(400).json({ success: false, message: "Payment Verification Failed!" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Frontend ko sirf Key ID dene ke liye
export const getApiKey = (req, res) => {
  res.status(200).json({ key: process.env.RAZORPAY_KEY_ID });
};