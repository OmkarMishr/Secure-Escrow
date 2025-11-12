const razorpayInstance = require('../config/razorpay');
const Transaction = require('../models/Transaction');
const Payment = require('../models/Payment');
const User = require('../models/User');
const crypto = require('crypto');

// @desc    Create Razorpay order for transaction payment
// @route   POST /api/payments/create-order
// @access  Private
exports.createOrder = async (req, res, next) => {
  try {
    const { transactionId } = req.body;

    const transaction = await Transaction.findById(transactionId);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    // Only buyer can make payment
    if (transaction.buyer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only buyer can make payment',
      });
    }

    if (transaction.status !== 'accepted') {
      return res.status(400).json({
        success: false,
        message: 'Transaction must be accepted by seller first',
      });
    }

    // Calculate total amount including escrow fee
    const totalAmount = transaction.amount + transaction.escrowFee;
    const amountInPaise = Math.round(totalAmount * 100); // Convert to paise

    // Create Razorpay order
    const options = {
      amount: amountInPaise,
      currency: transaction.currency,
      receipt: `txn_${transaction._id}`,
      payment_capture: 1,
    };

    const razorpayOrder = await razorpayInstance.orders.create(options);

    // Create payment record
    const payment = await Payment.create({
      transaction: transaction._id,
      razorpay_order_id: razorpayOrder.id,
      amount: totalAmount,
      currency: transaction.currency,
      paidBy: req.user._id,
      status: 'created',
    });

    res.json({
      success: true,
      data: {
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        payment: payment,
        key: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify transaction payment
// @route   POST /api/payments/verify
// @access  Private
exports.verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, transactionId } = req.body;

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    const isValid = expectedSignature === razorpay_signature;

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature',
      });
    }

    // Update payment record
    const payment = await Payment.findOneAndUpdate(
      { razorpay_order_id },
      {
        razorpay_payment_id,
        razorpay_signature,
        status: 'captured',
      },
      { new: true }
    );

    // Update transaction status
    const transaction = await Transaction.findByIdAndUpdate(
      transactionId,
      {
        status: 'payment_made',
        payment: payment._id,
        $push: {
          statusHistory: {
            status: 'payment_made',
            changedBy: req.user._id,
            comment: 'Payment successful, funds held in escrow',
          },
        },
      },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Payment verified successfully',
      data: {
        payment,
        transaction,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get payment details
// @route   GET /api/payments/:id
// @access  Private
exports.getPayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('transaction')
      .populate('paidBy', 'name email')
      .populate('releasedTo', 'name email');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }

    res.json({
      success: true,
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create Razorpay order for adding money to wallet
// @route   POST /api/payments/add-money/create-order
// @access  Private
exports.createAddMoneyOrder = async (req, res, next) => {
  try {
    const { amount } = req.body;

    // Validate amount
    if (!amount || amount < 100) {
      return res.status(400).json({
        success: false,
        message: 'Minimum amount is ₹100',
      });
    }

    if (amount > 100000) {
      return res.status(400).json({
        success: false,
        message: 'Maximum amount is ₹1,00,000',
      });
    }

    // Calculate total with 2% gateway fee
    const gatewayFee = parseFloat((amount * 0.02).toFixed(2));
    const totalAmount = parseFloat((amount + gatewayFee).toFixed(2));
    const amountInPaise = Math.round(totalAmount * 100);

    // Generate short unique receipt ID (max 40 chars for Razorpay)
    // Format: wlt_<timestamp>_<random>
    const timestamp = Date.now().toString(36); // Base36 for shorter string
    const randomStr = Math.random().toString(36).substring(2, 7); // 5 chars
    const receipt = `wlt_${timestamp}_${randomStr}`;

    console.log('Creating order with receipt:', receipt, 'Length:', receipt.length);

    // Create Razorpay order
    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: receipt,
      payment_capture: 1,
      notes: {
        user_id: req.user._id.toString(),
        type: 'wallet_recharge',
      },
    };

    const razorpayOrder = await razorpayInstance.orders.create(options);

    console.log('Razorpay order created:', razorpayOrder.id);

    res.json({
      success: true,
      data: {
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        key: process.env.RAZORPAY_KEY_ID,
        userAmount: amount,
        gatewayFee: gatewayFee,
        totalAmount: totalAmount,
      },
    });
  } catch (error) {
    console.error('Add Money Order Error:', error);
    
    // Send detailed error to client
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.error?.description || error.message || 'Failed to create payment order',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};



// @desc    Verify add money payment and update user balance
// @route   POST /api/payments/add-money/verify
// @access  Private
exports.verifyAddMoney = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    const isValid = expectedSignature === razorpay_signature;

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature',
      });
    }

    // Fetch payment details from Razorpay
    const payment = await razorpayInstance.payments.fetch(razorpay_payment_id);
    
    // Calculate actual amount to add (excluding 2% fee)
    const totalPaid = payment.amount / 100; // Convert from paise
    const amountToAdd = totalPaid / 1.02; // Remove 2% fee

    // Update user balance
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        $inc: { balance: amountToAdd },
      },
      { new: true }
    );

    // Create a wallet transaction record
    await Payment.create({
      transaction: null, // Not linked to any transaction
      razorpay_order_id: razorpay_order_id,
      razorpay_payment_id: razorpay_payment_id,
      razorpay_signature: razorpay_signature,
      amount: amountToAdd,
      currency: payment.currency,
      status: 'captured',
      paymentMethod: payment.method,
      paidBy: req.user._id,
    });

    res.json({
      success: true,
      message: `₹${amountToAdd.toFixed(2)} added to your wallet successfully`,
      data: {
        user: {
          _id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          username: updatedUser.username,
          role: updatedUser.role,
          balance: updatedUser.balance,
        },
        amountAdded: amountToAdd,
        newBalance: updatedUser.balance,
      },
    });
  } catch (error) {
    console.error('Add Money Verification Error:', error);
    next(error);
  }
};
