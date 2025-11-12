const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    transaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
      required: false,  // Changed from true to false to allow wallet payments
    },
    razorpay_order_id: {
      type: String,
      required: true,
    },
    razorpay_payment_id: {
      type: String,
    },
    razorpay_signature: {
      type: String,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    status: {
      type: String,
      enum: ['created', 'attempted', 'captured', 'failed', 'refunded'],
      default: 'created',
    },
    paymentMethod: {
      type: String,
    },
    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    releasedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    releasedAt: Date,
    refundId: String,
    refundedAt: Date,
    // Add field to identify wallet recharge payments
    paymentType: {
      type: String,
      enum: ['transaction', 'wallet_recharge'],
      default: 'transaction',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Payment', paymentSchema);
