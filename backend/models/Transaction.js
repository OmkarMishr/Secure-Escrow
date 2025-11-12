const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Transaction title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [1, 'Amount must be greater than 0'],
    },
    currency: {
      type: String,
      default: 'INR',
      enum: ['INR', 'USD', 'EUR'],
    },
    status: {
      type: String,
      enum: [
        'initiated',
        'accepted',
        'payment_made',
        'in_progress',
        'delivered',
        'completed',
        'disputed',
        'cancelled',
      ],
      default: 'initiated',
    },
    terms: {
      type: String,
      required: [true, 'Terms and conditions are required'],
    },
    deliveryDeadline: {
      type: Date,
      required: [true, 'Delivery deadline is required'],
    },
    escrowFee: {
      type: Number,
      default: 0,
    },
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
    },
    dispute: {
      isDisputed: {
        type: Boolean,
        default: false,
      },
      reason: String,
      raisedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      raisedAt: Date,
      resolution: String,
      resolvedAt: Date,
    },
    statusHistory: [
      {
        status: String,
        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        changedAt: {
          type: Date,
          default: Date.now,
        },
        comment: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Add status to history on save
transactionSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    this.statusHistory.push({
      status: this.status,
      changedAt: Date.now(),
    });
  }
  next();
});

module.exports = mongoose.model('Transaction', transactionSchema);
