// backend/routes/adminRoutes.js
const express = require('express');
const passport = require('passport');

const {
  signup,
  signin,
  currentUser,
  adminOverview,
  logout,
} = require('../controllers/authcontroller');
const { createOrder, verifyPayment } = require('../controllers/paymentcontroller');
const { authenticate, requireAdmin } = require('../middlewares/auth');

const router = express.Router();

// Middleware to enforce admin role and verify admin signup key
const adminKeyCheck = (req, res, next) => {
  console.log('Admin signup request body:', req.body);
  const { adminKey } = req.body;
  const providedKey = (adminKey || '').trim();
  const expectedKey = (process.env.ADMIN_SIGNUP_KEY || '').trim();
  console.log('Received adminKey:', providedKey);
  console.log('Expected ADMIN_SIGNUP_KEY:', expectedKey);
  if (!providedKey || providedKey !== expectedKey) {
    return res.status(403).json({ message: 'Invalid admin key' });
  }
  // Force role to admin for the rest of the pipeline
  req.body.role = 'admin';
  next();
};

// Admin signup – requires adminKey
router.post('/signup', adminKeyCheck, signup);

// Admin signin – role forced to admin and checks adminKey
router.post('/signin', adminKeyCheck, signin);

router.post('/logout', logout);
router.get('/me', authenticate, currentUser);
router.get('/overview', requireAdmin, adminOverview);
router.post('/payments/order', authenticate, createOrder);
router.post('/payments/verify', authenticate, verifyPayment);

module.exports = router;
