const express = require("express");
const passport = require("passport");

const {
  signup,
  signin,
  verifyOtp,
  resendOtp,
  currentUser,
  adminOverview,
  logout,
  verifyEmail
} = require("../controllers/authcontroller");
const { createOrder, verifyPayment } = require("../controllers/paymentcontroller");
const { authenticate, requireAdmin } = require("../middlewares/auth");

const router = express.Router();

// Middleware to enforce admin key when role=admin
const adminKeyCheck = (req, res, next) => {
  if (req.body.role === 'admin') {
    const { adminKey } = req.body;
    console.log('Admin signup request body (authroutes):', req.body);
    const providedKey = (adminKey || '').trim();
    const expectedKey = (process.env.ADMIN_SIGNUP_KEY || '').trim();
    console.log('Received adminKey:', providedKey);
    console.log('Expected ADMIN_SIGNUP_KEY:', expectedKey);
    if (!providedKey || providedKey !== expectedKey) {
      return res.status(403).json({ message: 'Invalid admin key' });
    }
    // Force role to admin
    req.body.role = 'admin';
  }
  next();
};

router.post("/signup", adminKeyCheck, signup);
router.post("/signin", (req, res, next) => {
  if (req.body.role === 'admin') {
    req.body.role = 'admin';
  }
  signin(req, res);
});
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);
router.get("/me", authenticate, currentUser);
router.post("/logout", logout);
router.get("/admin/overview", requireAdmin, adminOverview);
router.post("/payments/order", authenticate, createOrder);
router.post("/payments/verify", authenticate, verifyPayment);

router.get(
  "/verify/:token",
  verifyEmail
);

router.get(
  "/google",
  (req, res, next) => {
    // If MOCK_OAUTH is enabled, or if real Google OAuth is not configured, run Mock Google Login Sandbox
    if (process.env.MOCK_OAUTH === "true" || !passport._strategies || !passport._strategies.google) {
      console.log("[OAUTH INFO] Running Mock Google Login Sandbox.");
      return res.redirect("/api/auth/google/mock-callback");
    }
    // Otherwise run real Google OAuth
    passport.authenticate("google", { scope: ["profile", "email"] })(req, res, next);
  }
);

router.get(
  "/google/mock-callback",
  async (req, res) => {
    console.log("[OAUTH INFO] Mock Google Login Callback triggered.");
    const User = require("../models/user");
    const { getToken } = require("../controllers/authcontroller");

    const mockEmail = "mock.google.user@example.com";
    const mockName = "Mock Google User";
    const mockGoogleId = "mock-google-id-123456789";

    try {
      let user = await User.findOne({
        role: "user",
        $or: [
          { googleId: mockGoogleId },
          { email: mockEmail }
        ]
      });

      if (user) {
        if (!user.googleId) {
          user.googleId = mockGoogleId;
          user.isEmailVerified = true;
          user.isVerified = true;
          await user.save();
        }
      } else {
        user = await User.create({
          googleId: mockGoogleId,
          name: mockName,
          email: mockEmail,
          role: "user",
          isVerified: true,
          isEmailVerified: true
        });
      }

      const token = getToken(user);
      const clientUrl = process.env.CLIENT_URL || (process.env.RENDER ? "" : "http://localhost:5173");
      res.redirect(`${clientUrl}/dashboard?token=${token}`);
    } catch (error) {
      console.error("[OAUTH ERROR] Mock Google Login failed:", error);
      const clientUrl = process.env.CLIENT_URL || (process.env.RENDER ? "" : "http://localhost:5173");
      res.redirect(`${clientUrl}/auth?error=mock_login_failed`);
    }
  }
);

router.get(
  "/google/callback",
  (req, res, next) => {
    const clientUrl = process.env.CLIENT_URL || (process.env.RENDER ? "" : "http://localhost:5173");

    passport.authenticate("google", { session: false }, (err, user, info) => {
      if (err || !user) {
        console.error("[OAUTH ERROR] Google authentication failed:", err || info);
        return res.redirect(`${clientUrl}/auth?error=oauth_failed`);
      }

      const { getToken } = require("../controllers/authcontroller");
      const token = getToken(user);
      res.redirect(`${clientUrl}/dashboard?token=${token}`);
    })(req, res, next);
  }
);

module.exports = router;