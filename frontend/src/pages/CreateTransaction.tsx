import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

interface User {
  _id: string;
  name: string;
  username: string;
  email: string;
  role: string;
  balance: number;
}

export default function CreateTransaction() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    sellerId: '',
    title: '',
    description: '',
    amount: '',
    currency: 'INR',
    terms: '',
    deliveryDeadline: ''
  });
  const [sellers, setSellers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSellers, setLoadingSellers] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showInsufficientBalanceModal, setShowInsufficientBalanceModal] = useState(false);
  const [requiredAmount, setRequiredAmount] = useState(0);

  useEffect(() => {
    // Get current user
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }

    // Fetch sellers and user balance
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Not authenticated');
        setLoadingSellers(false);
        return;
      }

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      // Fetch fresh user data to get current balance
      const userResponse = await axios.get(`${API_URL}/auth/me`, config);
      const userData = userResponse.data.data;
      setCurrentUser(userData);
      
      // Update localStorage with latest balance
      localStorage.setItem('user', JSON.stringify({
        _id: userData._id,
        name: userData.name,
        email: userData.email,
        username: userData.username,
        role: userData.role,
        balance: userData.balance,
      }));

      // Fetch all users
      const response = await axios.get(`${API_URL}/auth/users`, config);
      
      if (response.data.success) {
        const allUsers = response.data.data;
        const availableSellers = allUsers.filter((user: User) => user._id !== userData._id);
        setSellers(availableSellers);
      }
      
      setLoadingSellers(false);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError('Failed to load data');
      setLoadingSellers(false);
    }
  };

  const validateForm = () => {
    if (!formData.sellerId) {
      setError('Please select a seller');
      return false;
    }

    if (!formData.title.trim()) {
      setError('Please enter a transaction title');
      return false;
    }

    if (!formData.description.trim()) {
      setError('Please enter a description');
      return false;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Please enter a valid amount');
      return false;
    }

    if (!formData.deliveryDeadline) {
      setError('Please select a delivery deadline');
      return false;
    }

    if (!formData.terms.trim()) {
      setError('Please enter terms and conditions');
      return false;
    }

    return true;
  };

  const checkBalance = () => {
    const amount = parseFloat(formData.amount);
    const escrowFee = amount * 0.02;
    const totalRequired = amount + escrowFee;

    if (!currentUser) {
      setError('User data not found');
      return false;
    }

    if (currentUser.balance < totalRequired) {
      setRequiredAmount(totalRequired - currentUser.balance);
      setShowInsufficientBalanceModal(true);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    // Check if user has sufficient balance
    if (!checkBalance()) {
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      // Create transaction
      const response = await axios.post(
        `${API_URL}/transactions`,
        {
          sellerId: formData.sellerId,
          title: formData.title,
          description: formData.description,
          amount: parseFloat(formData.amount),
          currency: formData.currency,
          terms: formData.terms,
          deliveryDeadline: formData.deliveryDeadline,
        },
        config
      );

      if (response.data.success) {
        alert('Transaction created successfully! The seller will be notified.');
        navigate('/transactions');
      }
    } catch (err: any) {
      console.error('Error creating transaction:', err);
      setError(err.response?.data?.message || 'Failed to create transaction');
    } finally {
      setLoading(false);
    }
  };

  // Get tomorrow's date for min date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  // Calculate escrow fee (2% of amount)
  const calculateEscrowFee = () => {
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) return 0;
    return amount * 0.02;
  };

  const calculateTotal = () => {
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) return 0;
    return amount + calculateEscrowFee();
  };

  const getBalanceStatus = () => {
    const total = calculateTotal();
    if (!currentUser || total === 0) return null;

    const hasEnough = currentUser.balance >= total;
    const difference = currentUser.balance - total;

    return {
      hasEnough,
      difference,
      color: hasEnough ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400',
      bgColor: hasEnough ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20',
      borderColor: hasEnough ? 'border-green-200 dark:border-green-800' : 'border-red-200 dark:border-red-800',
    };
  };

  if (loadingSellers) {
    return (
      <div className="min-h-screen min-w-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-indigo-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-slate-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  const balanceStatus = getBalanceStatus();

  return (
    <div className="min-h-screen min-w-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="mb-8">
          <button
            onClick={() => navigate('/transactions')}
            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold mb-4 flex items-center gap-2 transition-colors"
          >
            ← Back to Transactions
          </button>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">Create New Transaction</h1>
          <p className="text-slate-600 dark:text-gray-400 mt-2">Set up a secure escrow transaction</p>
        </div>

        {/* Current Balance Display */}
        {currentUser && (
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-700 dark:to-purple-700 rounded-2xl p-6 mb-8 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm opacity-90 mb-1">Your Wallet Balance</div>
                <div className="text-3xl font-bold">
                  ₹{currentUser.balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <button
                onClick={() => navigate('/add-money')}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Money
              </button>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-200 dark:border-slate-700 p-8 shadow-xl">
          {error && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-800 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-sm font-medium text-red-800 dark:text-red-300">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">
                Seller / Service Provider
              </label>
              <select
                value={formData.sellerId}
                onChange={(e) => {
                  setFormData({ ...formData, sellerId: e.target.value });
                  setError('');
                }}
                className="w-full px-4 py-3 border-2 border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white transition-colors"
                required
                disabled={loading}
              >
                <option value="">Select a seller</option>
                {sellers.length === 0 ? (
                  <option value="" disabled>No sellers available</option>
                ) : (
                  sellers.map((seller) => (
                    <option key={seller._id} value={seller._id}>
                      {seller.name} (@{seller.username}) - {seller.role}
                    </option>
                  ))
                )}
              </select>
              <p className="text-sm text-slate-500 dark:text-gray-500 mt-1">
                Select the person who will provide the goods/services
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">
                Transaction Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => {
                  setFormData({ ...formData, title: e.target.value });
                  setError('');
                }}
                className="w-full px-4 py-3 border-2 border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white transition-colors"
                placeholder="e.g., Website Development Project"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => {
                  setFormData({ ...formData, description: e.target.value });
                  setError('');
                }}
                rows={4}
                className="w-full px-4 py-3 border-2 border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white transition-colors"
                placeholder="Describe what you're purchasing or the service being provided"
                required
                disabled={loading}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">
                  Amount
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => {
                    setFormData({ ...formData, amount: e.target.value });
                    setError('');
                  }}
                  className="w-full px-4 py-3 border-2 border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white transition-colors"
                  placeholder="10000"
                  min="1"
                  step="0.01"
                  required
                  disabled={loading}
                />
                {formData.amount && parseFloat(formData.amount) > 0 && (
                  <div className="mt-3 space-y-2">
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between text-slate-600 dark:text-gray-400">
                        <span>Transaction Amount:</span>
                        <span className="font-semibold">₹{parseFloat(formData.amount).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-slate-600 dark:text-gray-400">
                        <span>Escrow Fee (2%):</span>
                        <span className="font-semibold">₹{calculateEscrowFee().toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between font-bold text-slate-900 dark:text-white pt-2 border-t-2 border-slate-200 dark:border-slate-700">
                        <span>Total Required:</span>
                        <span>₹{calculateTotal().toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    </div>

                    {/* Balance Status */}
                    {balanceStatus && (
                      <div className={`${balanceStatus.bgColor} border-2 ${balanceStatus.borderColor} rounded-xl p-3 mt-3`}>
                        <div className="flex items-center gap-2">
                          {balanceStatus.hasEnough ? (
                            <>
                              <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              <div className="text-sm">
                                <span className={`font-bold ${balanceStatus.color}`}>Sufficient Balance</span>
                                <div className="text-xs text-slate-600 dark:text-gray-400 mt-0.5">
                                  Remaining: ₹{Math.abs(balanceStatus.difference).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                              </div>
                            </>
                          ) : (
                            <>
                              <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              </svg>
                              <div className="text-sm">
                                <span className={`font-bold ${balanceStatus.color}`}>Insufficient Balance</span>
                                <div className="text-xs text-slate-600 dark:text-gray-400 mt-0.5">
                                  Need: ₹{Math.abs(balanceStatus.difference).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} more
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">
                  Currency
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white transition-colors"
                  disabled={loading}
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">
                Delivery Deadline
              </label>
              <input
                type="date"
                value={formData.deliveryDeadline}
                onChange={(e) => {
                  setFormData({ ...formData, deliveryDeadline: e.target.value });
                  setError('');
                }}
                min={minDate}
                className="w-full px-4 py-3 border-2 border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white transition-colors"
                required
                disabled={loading}
              />
              <p className="text-sm text-slate-500 dark:text-gray-500 mt-1">
                Minimum: {new Date(minDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">
                Terms & Conditions
              </label>
              <textarea
                value={formData.terms}
                onChange={(e) => {
                  setFormData({ ...formData, terms: e.target.value });
                  setError('');
                }}
                rows={4}
                className="w-full px-4 py-3 border-2 border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white transition-colors"
                placeholder="Define the conditions that must be met before payment is released"
                required
                disabled={loading}
              />
              <p className="text-sm text-slate-500 dark:text-gray-500 mt-1">
                Be specific about delivery conditions and payment release criteria
              </p>
            </div>

            <div className="bg-indigo-50 dark:bg-indigo-900/20 border-2 border-indigo-200 dark:border-indigo-800 rounded-xl p-5">
              <div className="flex gap-4">
                <div className="text-3xl">ℹ️</div>
                <div className="text-sm text-slate-700 dark:text-gray-300">
                  <p className="font-semibold mb-2">How Escrow Works:</p>
                  <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-gray-400">
                    <li>You create the transaction and seller accepts</li>
                    <li>Funds deducted from your wallet and held in escrow</li>
                    <li>Seller delivers goods/services</li>
                    <li>You approve delivery - payment released to seller</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-6 border-t-2 border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => navigate('/transactions')}
                disabled={loading}
                className="flex-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 active:bg-slate-300 dark:active:bg-slate-500 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 dark:text-white py-3.5 rounded-xl font-semibold border-2 border-slate-200 dark:border-slate-600 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || sellers.length === 0 || (balanceStatus?.hasEnough === false)}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </>
                ) : (
                  'Create Transaction'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Insufficient Balance Modal */}
      {showInsufficientBalanceModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-8 shadow-2xl border-2 border-slate-200 dark:border-slate-700">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Insufficient Balance</h3>
              <p className="text-slate-600 dark:text-gray-400 mb-6">
                You need <span className="font-bold text-red-600 dark:text-red-400">₹{requiredAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span> more in your wallet to create this transaction.
              </p>

              <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 mb-6 text-sm">
                <div className="flex justify-between mb-2">
                  <span className="text-slate-600 dark:text-gray-400">Current Balance:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">₹{currentUser?.balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-slate-600 dark:text-gray-400">Required:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">₹{calculateTotal().toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-red-600 dark:text-red-400 font-semibold">Shortfall:</span>
                  <span className="font-bold text-red-600 dark:text-red-400">₹{requiredAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowInsufficientBalanceModal(false)}
                className="flex-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-900 dark:text-white px-6 py-3.5 rounded-xl font-semibold transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={() => navigate('/add-money')}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white px-6 py-3.5 rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Money
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
