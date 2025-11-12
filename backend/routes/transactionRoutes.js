const express = require('express');
const router = express.Router();
const {
  createTransaction,
  getTransactions,
  getTransaction,
  acceptTransaction,
  markAsDelivered,
  approveDelivery,
  raiseDispute,
  cancelTransaction,
} = require('../controllers/transactionController');
const { protect } = require('../middleware/auth');

router.route('/')
  .get(protect, getTransactions)
  .post(protect, createTransaction);

router.get('/:id', protect, getTransaction);
router.put('/:id/accept', protect, acceptTransaction);
router.put('/:id/deliver', protect, markAsDelivered);
router.put('/:id/approve', protect, approveDelivery);
router.put('/:id/dispute', protect, raiseDispute);
router.put('/:id/cancel', protect, cancelTransaction);

module.exports = router;
