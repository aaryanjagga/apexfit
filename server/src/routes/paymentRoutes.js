const express = require('express');
const router = express.Router();
const {
  createOrder,
  verifyPayment,
  getPayments,
  getPaymentById,
  simulateCheckoutSuccess,
} = require('../controllers/paymentController');
const { protectAdmin } = require('../middleware/auth');
const { paymentLimiter } = require('../middleware/rateLimiter');

// Public / Member / Admin payment initiation & verification
router.post('/create-order', paymentLimiter, createOrder);
router.post('/verify', paymentLimiter, verifyPayment);

// Local simulation endpoint for dev testing when live keys are not set
router.post('/simulate-checkout-success', simulateCheckoutSuccess);

// Admin protected endpoints
router.get('/', protectAdmin, getPayments);
router.get('/:id', protectAdmin, getPaymentById);

module.exports = router;
