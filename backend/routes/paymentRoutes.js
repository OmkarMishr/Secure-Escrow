const express = require('express');
const router = express.Router();
const {
  createOrder,
  verifyPayment,
  getPayment,
  createAddMoneyOrder,
  verifyAddMoney,
} = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

// Transaction payment routes
router.post('/create-order', protect, createOrder);
router.post('/verify', protect, verifyPayment);
router.get('/:id', protect, getPayment);

// Add Money to wallet routes
router.post('/add-money/create-order', protect, createAddMoneyOrder);
router.post('/add-money/verify', protect, verifyAddMoney);

module.exports = router;
