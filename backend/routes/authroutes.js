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

router.post("/signup", signup);
router.post("/signin", signin);
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

const checkGoogleConfigured = (req, res, next) => {
  if (!passport._strategies || !passport._strategies.google) {
    return res.status(501).json({
      message: "Google Authentication is not configured or disabled on this server."
    });
  }
  next();
};

router.get(
  "/google",
  checkGoogleConfigured,
  passport.authenticate(
    "google",
    { scope: ["profile", "email"] }
  )
);

router.get(
  "/google/callback",
  checkGoogleConfigured,
  passport.authenticate(
    "google",
    {
      failureRedirect: "/login"
    }
  ),

  (req, res) => {
    const clientUrl = process.env.CLIENT_URL || (process.env.RENDER ? "" : "https://localhost:5173");
    res.redirect(`${clientUrl}/dashboard`);
  }
);

module.exports = router;