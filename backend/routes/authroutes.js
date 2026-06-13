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

router.get(
  "/google",
  passport.authenticate(
    "google",
    { scope: ["profile", "email"] }
  )
);

router.get(
  "/google/callback",

  passport.authenticate(
    "google",
    {
      failureRedirect: "/login"
    }
  ),

  (req, res) => {
    res.redirect(
      "https://localhost:5173/dashboard"
    );
  }
);

module.exports = router;