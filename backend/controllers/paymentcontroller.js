const Razorpay = require("razorpay");
const crypto = require("crypto");
const User = require("../models/user");

const hasKeys = Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

let razorpay = null;
if (hasKeys) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
} else {
  console.log("[PAYMENT INFO] Razorpay keys not detected in .env. Running in Mock Payment Sandbox mode.");
}

exports.createOrder = async (req, res) => {
  try {
    const { amount, planId } = req.body;

    if (!amount) {
      return res.status(400).json({ message: "Amount is required" });
    }

    // For testing/sandbox purposes, override the payment amount to exactly ₹1.00 (100 paise)
    // to allow live API testing without charging full amounts.
    const amountInPaise = 100; // Overridden to 100 paise = 1 INR

    if (!hasKeys) {
      // Mock Sandbox Mode
      return res.json({
        id: `order_mock_${crypto.randomBytes(8).toString("hex")}`,
        amount: amountInPaise,
        currency: "INR",
        key: "rzp_test_mock_key",
        isMock: true,
        message: "Sandbox payment order generated successfully"
      });
    }

    // Production/Staging Razorpay Checkout creation
    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt: `receipt_plan_${planId}_${Date.now()}`
    };

    const order = await razorpay.orders.create(options);
    
    return res.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
      isMock: false
    });

  } catch (err) {
    return res.status(500).json({ message: "Failed to create payment order", error: err.message });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      planId,
      isMock
    } = req.body;

    if (!isMock && (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature)) {
      return res.status(400).json({ message: "Missing required Razorpay parameters" });
    }

    if (isMock || !hasKeys) {
      // Sandbox Success
      console.log(`[PAYMENT SUCCESS] Mock Verification for Order: ${razorpay_order_id}, Plan: ${planId}`);
      
      // Upgrade user tier in database
      if (req.user) {
        const user = await User.findById(req.user.id);
        if (user) {
          user.isVerified = true;
          // Set user custom attributes if required
          await user.save();
        }
      }

      return res.json({
        success: true,
        message: "Mock subscription verified and activated successfully"
      });
    }

    // Official Razorpay Cryptographic Verification
    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Payment signature mismatch" });
    }

    // Verification Success, update user
    if (req.user) {
      const user = await User.findById(req.user.id);
      if (user) {
        user.isVerified = true;
        await user.save();
      }
    }

    return res.json({
      success: true,
      message: "Subscription payment verified and activated successfully"
    });

  } catch (err) {
    return res.status(500).json({ message: "Failed to verify transaction", error: err.message });
  }
};
