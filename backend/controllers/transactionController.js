const Transaction = require('../models/Transaction');
const User = require('../models/User');

// @desc    Create new transaction
// @route   POST /api/transactions
// @access  Private
exports.createTransaction = async (req, res, next) => {
  try {
    const { sellerId, title, description, amount, currency, terms, deliveryDeadline } = req.body;

    // Validate seller exists
    const seller = await User.findById(sellerId);
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found',
      });
    }

    // Cannot create transaction with yourself
    if (sellerId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot create transaction with yourself',
      });
    }

    // Calculate escrow fee (2% of transaction amount)
    const escrowFee = amount * 0.02;

    const transaction = await Transaction.create({
      buyer: req.user._id,
      seller: sellerId,
      title,
      description,
      amount,
      currency: currency || 'INR',
      terms,
      deliveryDeadline,
      escrowFee,
      statusHistory: [
        {
          status: 'initiated',
          changedBy: req.user._id,
          comment: 'Transaction created',
        },
      ],
    });

    const populatedTransaction = await Transaction.findById(transaction._id)
      .populate('buyer', 'name email username')
      .populate('seller', 'name email username');

    res.status(201).json({
      success: true,
      data: populatedTransaction,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all transactions
// @route   GET /api/transactions
// @access  Private
exports.getTransactions = async (req, res, next) => {
  try {
    const { status, role } = req.query;

    let query = {
      $or: [{ buyer: req.user._id }, { seller: req.user._id }],
    };

    if (status) {
      query.status = status;
    }

    if (role === 'buyer') {
      query = { buyer: req.user._id };
      if (status) query.status = status;
    } else if (role === 'seller') {
      query = { seller: req.user._id };
      if (status) query.status = status;
    }

    const transactions = await Transaction.find(query)
      .populate('buyer', 'name email username')
      .populate('seller', 'name email username')
      .populate('payment')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: transactions.length,
      data: transactions,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single transaction
// @route   GET /api/transactions/:id
// @access  Private
exports.getTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('buyer', 'name email username phone')
      .populate('seller', 'name email username phone')
      .populate('payment')
      .populate('statusHistory.changedBy', 'name');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    // Check authorization
    const isBuyer = transaction.buyer._id.toString() === req.user._id.toString();
    const isSeller = transaction.seller._id.toString() === req.user._id.toString();
    const isAgent = req.user.role === 'escrow_agent';

    if (!isBuyer && !isSeller && !isAgent) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this transaction',
      });
    }

    res.json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Accept transaction (seller)
// @route   PUT /api/transactions/:id/accept
// @access  Private
exports.acceptTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    // Only seller can accept
    if (transaction.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only seller can accept this transaction',
      });
    }

    if (transaction.status !== 'initiated') {
      return res.status(400).json({
        success: false,
        message: 'Transaction cannot be accepted in current state',
      });
    }

    transaction.status = 'accepted';
    transaction.statusHistory.push({
      status: 'accepted',
      changedBy: req.user._id,
      comment: 'Seller accepted the transaction',
    });

    await transaction.save();

    res.json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark transaction as delivered (seller)
// @route   PUT /api/transactions/:id/deliver
// @access  Private
exports.markAsDelivered = async (req, res, next) => {
  try {
    const { deliveryNote } = req.body;
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    // Only seller can mark as delivered
    if (transaction.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only seller can mark this as delivered',
      });
    }

    if (transaction.status !== 'payment_made' && transaction.status !== 'in_progress') {
      return res.status(400).json({
        success: false,
        message: 'Transaction cannot be marked as delivered in current state',
      });
    }

    transaction.status = 'delivered';
    transaction.statusHistory.push({
      status: 'delivered',
      changedBy: req.user._id,
      comment: deliveryNote || 'Seller marked as delivered',
    });

    await transaction.save();

    res.json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve delivery and release payment (buyer)
// @route   PUT /api/transactions/:id/approve
// @access  Private
exports.approveDelivery = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id).populate('payment');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    // Only buyer can approve
    if (transaction.buyer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only buyer can approve delivery',
      });
    }

    if (transaction.status !== 'delivered') {
      return res.status(400).json({
        success: false,
        message: 'Transaction must be in delivered state',
      });
    }

    // Update payment status
    if (transaction.payment) {
      const Payment = require('../models/Payment');
      await Payment.findByIdAndUpdate(transaction.payment._id, {
        releasedTo: transaction.seller,
        releasedAt: Date.now(),
      });
    }

    // Update seller balance
    await User.findByIdAndUpdate(transaction.seller, {
      $inc: { balance: transaction.amount },
    });

    transaction.status = 'completed';
    transaction.statusHistory.push({
      status: 'completed',
      changedBy: req.user._id,
      comment: 'Buyer approved delivery, payment released',
    });

    await transaction.save();

    res.json({
      success: true,
      message: 'Payment released to seller',
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Raise dispute
// @route   PUT /api/transactions/:id/dispute
// @access  Private
exports.raiseDispute = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    // Check if user is buyer or seller
    const isBuyer = transaction.buyer.toString() === req.user._id.toString();
    const isSeller = transaction.seller.toString() === req.user._id.toString();

    if (!isBuyer && !isSeller) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    if (transaction.status === 'completed' || transaction.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot dispute completed or cancelled transactions',
      });
    }

    transaction.status = 'disputed';
    transaction.dispute = {
      isDisputed: true,
      reason,
      raisedBy: req.user._id,
      raisedAt: Date.now(),
    };
    transaction.statusHistory.push({
      status: 'disputed',
      changedBy: req.user._id,
      comment: `Dispute raised: ${reason}`,
    });

    await transaction.save();

    res.json({
      success: true,
      message: 'Dispute raised successfully',
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel transaction
// @route   PUT /api/transactions/:id/cancel
// @access  Private
exports.cancelTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    // Only buyer can cancel before payment
    if (transaction.buyer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    if (transaction.status !== 'initiated' && transaction.status !== 'accepted') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel transaction after payment',
      });
    }

    transaction.status = 'cancelled';
    transaction.statusHistory.push({
      status: 'cancelled',
      changedBy: req.user._id,
      comment: 'Transaction cancelled by buyer',
    });

    await transaction.save();

    res.json({
      success: true,
      message: 'Transaction cancelled',
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};
