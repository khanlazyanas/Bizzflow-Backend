import Razorpay from 'razorpay';
import crypto from 'crypto';
import User from '../models/User.js';

// Order Banane ka function
export const checkout = async (req, res) => {
  try {
    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const options = {
      amount: 999 * 100, // ₹999 ka plan (Paise mein convert karne ke liye *100)
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await instance.orders.create(options);
    res.status(200).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: "Order creation failed!" });
  }
};

// Payment Verify karne ka function
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
      // Payment success! User ko database mein 'Pro' bana do
      // Note: Agar aapke model me isPro nahi hai, toh ye automatically handle ho jayega
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

// Frontend ko sirf Key ID dene ke liye (Secret nahi jayega)
export const getApiKey = (req, res) => {
  res.status(200).json({ key: process.env.RAZORPAY_KEY_ID });
};