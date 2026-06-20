// backend/routes/userRoutes.js
const express = require('express');
const passport = require('passport');

const {
  signup,
  signin,
  currentUser,
  logout,
} = require('../controllers/authcontroller');
const { createOrder, verifyPayment } = require('../controllers/paymentcontroller');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();

// User signup – regular flow (no admin key required)
router.post('/signup', signup);
router.post('/signin', signin);
router.post('/logout', logout);
router.get('/me', authenticate, currentUser);
router.post('/payments/order', authenticate, createOrder);
router.post('/payments/verify', authenticate, verifyPayment);

module.exports = router;
