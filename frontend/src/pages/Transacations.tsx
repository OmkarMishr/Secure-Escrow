import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

interface User {
  _id: string;
  name: string;
  username: string;
  email: string;
}

interface Transaction {
  _id: string;
  title: string;
  description: string;
  amount: number;
  status: string;
  buyer: User;
  seller: User;
  createdAt: string;
  deliveryDeadline: string;
}

export default function Transactions() {
  const [filter, setFilter] = useState('all');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    // Get current user from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }

    // Fetch transactions
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
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

      const response = await axios.get(`${API_URL}/transactions`, config);
      
      if (response.data.success) {
        setTransactions(response.data.data);
      }
      
      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching transactions:', err);
      setError(err.response?.data?.message || 'Failed to load transactions');
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      initiated: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
      accepted: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
      payment_made: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800',
      in_progress: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800',
      delivered: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800',
      disputed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
      cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200 dark:border-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      initiated: 'Initiated',
      accepted: 'Accepted',
      payment_made: 'Payment Made',
      in_progress: 'In Progress',
      delivered: 'Delivered',
      completed: 'Completed',
      disputed: 'Disputed',
      cancelled: 'Cancelled'
    };
    return labels[status] || status;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getUserRole = (transaction: Transaction) => {
    if (!currentUser) return '';
    return transaction.buyer._id === currentUser._id ? 'buyer' : 'seller';
  };

  const filteredTransactions = filter === 'all' 
    ? transactions 
    : transactions.filter(t => t.status === filter);

  // Get transaction counts for each status
  const getStatusCount = (status: string) => {
    if (status === 'all') return transactions.length;
    return transactions.filter(t => t.status === status).length;
  };

  if (loading) {
    return (
      <div className="min-h-screen min-w-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-teal-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-slate-600 dark:text-gray-400">Loading transactions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen min-w-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md">
          <h3 className="text-red-800 dark:text-red-400 font-semibold mb-2">Error Loading Transactions</h3>
          <p className="text-red-600 dark:text-red-400 text-sm mb-4">{error}</p>
          <button
            onClick={fetchTransactions}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen min-w-screen bg-slate-50 dark:bg-slate-900 py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-gray-100">My Transactions</h1>
            <p className="text-slate-600 dark:text-gray-400 mt-2">
              Manage all your escrow transactions • Total: {transactions.length}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchTransactions}
              className="bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-900 dark:text-gray-100 px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
            <Link 
              to="/create-transaction"
              className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              + New Transaction
            </Link>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-2 mb-6 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {['all', 'initiated', 'accepted', 'payment_made', 'in_progress', 'delivered', 'completed', 'disputed', 'cancelled'].map((status) => {
              const count = getStatusCount(status);
              return (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 ${
                    filter === status
                      ? 'bg-teal-600 text-white'
                      : 'text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {status === 'all' ? 'All' : getStatusLabel(status)}
                  {count > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      filter === status 
                        ? 'bg-white/20' 
                        : 'bg-slate-200 dark:bg-slate-600'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Transactions List */}
        <div className="space-y-4">
          {filteredTransactions.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-gray-100 mb-2">
                {filter === 'all' ? 'No transactions yet' : `No ${getStatusLabel(filter).toLowerCase()} transactions`}
              </h3>
              <p className="text-slate-600 dark:text-gray-400 mb-6">
                {filter === 'all' 
                  ? 'Create your first transaction to get started' 
                  : 'Try changing the filter to see other transactions'}
              </p>
              {filter === 'all' && (
                <Link 
                  to="/create-transaction"
                  className="inline-block bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Create Transaction
                </Link>
              )}
            </div>
          ) : (
            filteredTransactions.map((transaction) => {
              const role = getUserRole(transaction);
              const isbuyer = role === 'buyer';
              
              return (
                <div 
                  key={transaction._id}
                  className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex flex-col lg:flex-row gap-6">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-xl font-semibold text-slate-900 dark:text-gray-100">
                              {transaction.title}
                            </h3>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              isbuyer 
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' 
                                : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            }`}>
                              {isbuyer ? 'Buyer' : 'Seller'}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-gray-400">
                            Transaction ID: #{transaction._id.slice(-8).toUpperCase()}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(transaction.status)}`}>
                          {getStatusLabel(transaction.status)}
                        </span>
                      </div>
                      
                      <p className="text-slate-600 dark:text-gray-400 mb-4">
                        {transaction.description}
                      </p>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-slate-500 dark:text-gray-500">Buyer:</span>
                          <div className="font-medium text-slate-900 dark:text-gray-100">
                            {transaction.buyer.name}
                            {transaction.buyer._id === currentUser?._id && ' (You)'}
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-500 dark:text-gray-500">Seller:</span>
                          <div className="font-medium text-slate-900 dark:text-gray-100">
                            {transaction.seller.name}
                            {transaction.seller._id === currentUser?._id && ' (You)'}
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-500 dark:text-gray-500">Created:</span>
                          <div className="font-medium text-slate-900 dark:text-gray-100">
                            {formatDate(transaction.createdAt)}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="lg:w-64 flex flex-col justify-between items-end gap-4">
                      <div className="text-right">
                        <div className="text-sm text-slate-500 dark:text-gray-500 mb-1">Amount</div>
                        <div className="text-3xl font-bold text-teal-600 dark:text-teal-400">
                          ₹{transaction.amount.toLocaleString('en-IN')}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-gray-500 mt-1">
                          Due: {formatDate(transaction.deliveryDeadline)}
                        </div>
                      </div>
                      <Link 
                        to={`/transaction/${transaction._id}`}
                        className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg font-medium transition-colors w-full text-center"
                      >
                        View Details →
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
