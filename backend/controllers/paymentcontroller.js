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
    const { amount, planId, currency, receipt } = req.body;

    if (amount === undefined || amount === null) {
      return res.status(400).json({ message: "Amount is required" });
    }

    let amountInPaise = parseInt(amount, 10);
    if (isNaN(amountInPaise)) {
      return res.status(400).json({ message: "Invalid amount format" });
    }

    // Keep the testing override to ₹1.00 (100 paise) if the frontend passes planId and it's less than 100 paise
    if (planId && amountInPaise < 100) {
      amountInPaise = 100;
    }

    if (amountInPaise < 100) {
      return res.status(400).json({ message: "Amount must be at least 100 paise" });
    }

    if (!hasKeys) {
      // Mock Sandbox Mode
      const mockOrderId = `order_mock_${crypto.randomBytes(8).toString("hex")}`;
      return res.json({
        id: mockOrderId,
        order_id: mockOrderId,
        amount: amountInPaise,
        currency: currency || "INR",
        key: "rzp_test_mock_key",
        isMock: true,
        message: "Sandbox payment order generated successfully"
      });
    }

    // Production/Staging Razorpay Checkout creation
    const options = {
      amount: amountInPaise,
      currency: currency || "INR",
      receipt: receipt || `receipt_plan_${planId || 'custom'}_${Date.now()}`
    };

    try {
      const order = await razorpay.orders.create(options);
      
      return res.json({
        id: order.id,
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        key: process.env.RAZORPAY_KEY_ID,
        isMock: false
      });
    } catch (apiErr) {
      console.error("[RAZORPAY API ERROR]", apiErr);
      if (apiErr.statusCode === 401 || (apiErr.message && apiErr.message.includes("401"))) {
        return res.status(401).json({ message: "Razorpay authorization failed", error: apiErr.message });
      }
      return res.status(500).json({ message: "Razorpay API error", error: apiErr.message });
    }

  } catch (err) {
    console.error("[CREATE ORDER ERROR]", err);
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

    // Missing fields: return 400
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: "Missing required Razorpay parameters: razorpay_order_id, razorpay_payment_id, and razorpay_signature are required" });
    }

    if (!hasKeys) {
      if (isMock) {
        // Sandbox Success
        console.log(`[PAYMENT SUCCESS] Mock Verification for Order: ${razorpay_order_id}, Plan: ${planId}`);
        
        // Upgrade user tier in database
        if (req.user) {
          const user = await User.findById(req.user.id);
          if (user) {
            user.isVerified = true;
            await user.save();
          }
        }

        return res.json({
          success: true,
          message: "Mock subscription verified and activated successfully"
        });
      } else {
        return res.status(400).json({ message: "Razorpay keys not configured and isMock not specified" });
      }
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
    console.error("[VERIFY PAYMENT ERROR]", err);
    return res.status(500).json({ message: "Failed to verify transaction", error: err.message });
  }
};
