import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  balance: number;
}

export default function AddMoney() {
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    // Get user data
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const predefinedAmounts = [500, 1000, 2000, 5000, 10000];

  const handlePredefinedAmount = (amt: number) => {
    setAmount(amt.toString());
    setError('');
  };

  const validateAmount = () => {
    const amt = parseFloat(amount);
    if (!amount || amt <= 0) {
      setError('Please enter a valid amount');
      return false;
    }
    if (amt < 100) {
      setError('Minimum amount is ₹100');
      return false;
    }
    if (amt > 100000) {
      setError('Maximum amount is ₹1,00,000');
      return false;
    }
    return true;
  };

  const handlePayment = async () => {
    setError('');

    if (!validateAmount()) {
      return;
    }

    if (!user) {
      setError('User not found. Please login again.');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      // Step 1: Create Razorpay order
      const orderResponse = await axios.post(
        `${API_URL}/payments/add-money/create-order`,
        {
          amount: parseFloat(amount),
        },
        config
      );

      if (!orderResponse.data.success) {
        setError('Failed to create payment order');
        setLoading(false);
        return;
      }

      const { orderId, amount: orderAmount, currency, key } = orderResponse.data.data;

      // Step 2: Open Razorpay Checkout
      const options = {
        key: key,
        amount: orderAmount,
        currency: currency,
        name: 'SecureEscrow',
        description: 'Add Money to Wallet',
        order_id: orderId,
        handler: async function (response: any) {
          try {
            // Step 3: Verify payment
            const verifyResponse = await axios.post(
              `${API_URL}/payments/add-money/verify`,
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              },
              config
            );

            if (verifyResponse.data.success) {
              // Update user balance in localStorage
              const updatedUser = verifyResponse.data.data.user;
              localStorage.setItem('user', JSON.stringify(updatedUser));
              
              alert(`Payment successful! ₹${amount} added to your wallet.`);
              navigate('/dashboard');
            } else {
              setError('Payment verification failed');
            }
          } catch (err: any) {
            console.error('Verification error:', err);
            setError(err.response?.data?.message || 'Payment verification failed');
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
          contact: user.phone || '',
        },
        theme: {
          color: '#4F46E5',
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
            setError('Payment cancelled');
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.response?.data?.message || 'Failed to initiate payment');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen min-w-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-12 px-4">
      <div className="container mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold mb-4 flex items-center gap-2 transition-colors"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">Add Money</h1>
          <p className="text-slate-600 dark:text-gray-400">Add funds to your SecureEscrow wallet</p>
        </div>

        {/* Main Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          {/* Current Balance */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-700 dark:to-purple-700 p-8 text-white">
            <div className="text-sm font-medium opacity-90 mb-2">Current Balance</div>
            <div className="text-4xl font-bold">
              ₹{user?.balance?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
            </div>
          </div>

          <div className="p-8">
            {/* Error Message */}
            {error && (
              <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm font-medium text-red-800 dark:text-red-300">{error}</p>
                </div>
              </div>
            )}

            {/* Amount Input */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-3">
                Enter Amount
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-400 dark:text-gray-500">
                  ₹
                </span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setError('');
                  }}
                  className="w-full pl-12 pr-4 py-4 text-2xl font-bold border-2 border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white transition-colors"
                  placeholder="1000"
                  min="100"
                  max="100000"
                  step="100"
                  disabled={loading}
                />
              </div>
              <p className="text-sm text-slate-500 dark:text-gray-500 mt-2">
                Minimum: ₹100 • Maximum: ₹1,00,000
              </p>
            </div>

            {/* Quick Amount Buttons */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-3">
                Quick Select
              </label>
              <div className="grid grid-cols-3 gap-3">
                {predefinedAmounts.map((amt) => (
                  <button
                    key={amt}
                    onClick={() => handlePredefinedAmount(amt)}
                    disabled={loading}
                    className={`py-3 px-4 rounded-xl font-semibold transition-all duration-200 ${
                      amount === amt.toString()
                        ? 'bg-indigo-600 text-white border-2 border-indigo-600 shadow-lg shadow-indigo-500/30'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-gray-300 border-2 border-slate-200 dark:border-slate-600 hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    ₹{amt.toLocaleString('en-IN')}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Info */}
            {amount && parseFloat(amount) >= 100 && (
              <div className="mb-8 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4">
                <div className="flex justify-between items-center text-sm mb-2">
                  <span className="text-slate-600 dark:text-gray-400">Amount to Add:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    ₹{parseFloat(amount).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm mb-2">
                  <span className="text-slate-600 dark:text-gray-400">Gateway Fee (2%):</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    ₹{(parseFloat(amount) * 0.02).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="pt-2 border-t border-indigo-200 dark:border-indigo-800 flex justify-between items-center">
                  <span className="font-semibold text-slate-900 dark:text-white">Total to Pay:</span>
                  <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                    ₹{(parseFloat(amount) * 1.02).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            )}

            {/* Payment Button */}
            <button
              onClick={handlePayment}
              disabled={loading || !amount || parseFloat(amount) < 100}
              className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold text-lg transition-all duration-200 flex items-center justify-center gap-3 shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Money Securely
                </>
              )}
            </button>

            {/* Security Info */}
            <div className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-gray-500">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Secured by Razorpay • SSL Encrypted</span>
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-3 gap-4 mt-8">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 text-center">
            <div className="text-3xl mb-2">🔒</div>
            <div className="text-sm font-semibold text-slate-900 dark:text-white">Secure</div>
            <div className="text-xs text-slate-600 dark:text-gray-400 mt-1">256-bit encryption</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 text-center">
            <div className="text-3xl mb-2">⚡</div>
            <div className="text-sm font-semibold text-slate-900 dark:text-white">Instant</div>
            <div className="text-xs text-slate-600 dark:text-gray-400 mt-1">Immediate credit</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 text-center">
            <div className="text-3xl mb-2">💳</div>
            <div className="text-sm font-semibold text-slate-900 dark:text-white">Multiple Options</div>
            <div className="text-xs text-slate-600 dark:text-gray-400 mt-1">Card, UPI, Netbanking</div>
          </div>
        </div>
      </div>
    </div>
  );
}
