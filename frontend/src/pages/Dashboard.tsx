import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

interface User {
  _id: string;
  name: string;
  email: string;
  username: string;
  role: string;
  balance: number;
}

interface Transaction {
  _id: string;
  title: string;
  amount: number;
  status: string;
  buyer: {
    _id: string;
    name: string;
    username: string;
  };
  seller: {
    _id: string;
    name: string;
    username: string;
  };
  createdAt: string;
}

interface DashboardStats {
  balance: number;
  activeTransactions: number;
  completedTransactions: number;
  totalVolume: number;
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    balance: 0,
    activeTransactions: 0,
    completedTransactions: 0,
    totalVolume: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Get user from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    // Fetch dashboard data
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
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

      // Fetch user profile
      const userResponse = await axios.get(`${API_URL}/auth/me`, config);
      const userData = userResponse.data.data;
      
      // Update user in state and localStorage
      setUser(userData);
      localStorage.setItem('user', JSON.stringify({
        _id: userData._id,
        name: userData.name,
        email: userData.email,
        username: userData.username,
        role: userData.role,
        balance: userData.balance,
      }));

      // Fetch all transactions
      const transactionsResponse = await axios.get(`${API_URL}/transactions`, config);
      const allTransactions = transactionsResponse.data.data;

      // Calculate statistics
      const activeCount = allTransactions.filter((t: Transaction) => 
        ['initiated', 'accepted', 'payment_made', 'in_progress', 'delivered'].includes(t.status)
      ).length;

      const completedCount = allTransactions.filter((t: Transaction) => 
        t.status === 'completed'
      ).length;

      const totalVolume = allTransactions
        .filter((t: Transaction) => t.status === 'completed')
        .reduce((sum: number, t: Transaction) => sum + t.amount, 0);

      setStats({
        balance: userData.balance || 0,
        activeTransactions: activeCount,
        completedTransactions: completedCount,
        totalVolume: totalVolume,
      });

      // Get recent transactions (last 5)
      setRecentTransactions(allTransactions.slice(0, 5));

      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard data');
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
      cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200 dark:border-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
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
      cancelled: 'Cancelled',
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

  const getOtherParty = (transaction: Transaction) => {
    if (!user) return '';
    return transaction.buyer._id === user._id 
      ? transaction.seller.name 
      : transaction.buyer.name;
  };

  if (loading) {
    return (
      <div className="min-h-screen min-w-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-indigo-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-slate-600 dark:text-gray-400 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen min-w-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-800 rounded-2xl p-8 max-w-md shadow-xl">
          <div className="text-center mb-4">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-red-800 dark:text-red-300 mb-2">Error Loading Dashboard</h3>
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          </div>
          <button
            onClick={fetchDashboardData}
            className="w-full bg-red-600 hover:bg-red-700 active:bg-red-800 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-red-500/30"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen min-w-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-3">Dashboard</h1>
          <p className="text-lg text-slate-600 dark:text-gray-400">
            Welcome back, <span className="font-semibold text-slate-900 dark:text-white">{user?.name || 'User'}</span>
            <span className="ml-3 inline-block px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-sm font-semibold rounded-full capitalize">
              {user?.role}
            </span>
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Account Balance Card - Linked to Add Money */}
          <Link 
            to="/add-money"
            className="bg-white dark:bg-slate-800 rounded-2xl p-6 border-2 border-slate-200 dark:border-slate-700 hover:shadow-2xl hover:border-indigo-500 dark:hover:border-indigo-500 transition-all duration-300 cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-3xl shadow-lg shadow-green-500/30">
                💰
              </div>
              <span className="text-indigo-600 dark:text-indigo-400 text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                Add Money 
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </div>
            <div className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              ₹{stats.balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-sm font-medium text-slate-600 dark:text-gray-400">
              Account Balance
            </div>
          </Link>

          {/* Active Transactions Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border-2 border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-3xl shadow-lg shadow-blue-500/30">
                📊
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              {stats.activeTransactions}
            </div>
            <div className="text-sm font-medium text-slate-600 dark:text-gray-400">
              Active Transactions
            </div>
          </div>

          {/* Completed Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border-2 border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-3xl shadow-lg shadow-purple-500/30">
                ✅
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              {stats.completedTransactions}
            </div>
            <div className="text-sm font-medium text-slate-600 dark:text-gray-400">
              Completed
            </div>
          </div>

          {/* Total Volume Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border-2 border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-3xl shadow-lg shadow-orange-500/30">
                📈
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              ₹{stats.totalVolume.toLocaleString('en-IN')}
            </div>
            <div className="text-sm font-medium text-slate-600 dark:text-gray-400">
              Total Volume
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border-2 border-slate-200 dark:border-slate-700 mb-8 shadow-lg">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-5">Quick Actions</h2>
          <div className="flex flex-wrap gap-4">
            <Link 
              to="/create-transaction" 
              className="bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white px-8 py-3.5 rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Transaction
            </Link>
            <Link 
              to="/transactions" 
              className="bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 active:bg-slate-300 dark:active:bg-slate-500 text-slate-900 dark:text-white px-8 py-3.5 rounded-xl font-semibold border-2 border-slate-200 dark:border-slate-600 transition-all duration-200"
            >
              View All Transactions
            </Link>
            <button
              onClick={fetchDashboardData}
              className="bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 active:bg-slate-300 dark:active:bg-slate-500 text-slate-900 dark:text-white px-8 py-3.5 rounded-xl font-semibold border-2 border-slate-200 dark:border-slate-600 transition-all duration-200 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-200 dark:border-slate-700 overflow-hidden shadow-lg">
          <div className="p-6 border-b-2 border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Recent Transactions</h2>
          </div>
          
          {recentTransactions.length === 0 ? (
            <div className="p-16 text-center">
              <div className="text-7xl mb-6">📋</div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                No transactions yet
              </h3>
              <p className="text-slate-600 dark:text-gray-400 mb-8 text-lg">
                Create your first transaction to get started
              </p>
              <Link 
                to="/create-transaction"
                className="inline-block bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-indigo-500/30"
              >
                Create Transaction
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {recentTransactions.map((transaction) => (
                <div key={transaction._id} className="p-6 hover:bg-indigo-50 dark:hover:bg-slate-700/50 transition-all duration-200">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">
                        {transaction.title}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-gray-400 flex items-center gap-2">
                        <span className="font-medium">{getOtherParty(transaction)}</span>
                        <span className="text-slate-400 dark:text-gray-600">•</span>
                        <span>{formatDate(transaction.createdAt)}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                          ₹{transaction.amount.toLocaleString('en-IN')}
                        </div>
                        <span className={`inline-block px-3 py-1.5 rounded-lg text-xs font-bold border-2 ${getStatusColor(transaction.status)}`}>
                          {getStatusLabel(transaction.status)}
                        </span>
                      </div>
                      <Link 
                        to={`/transaction/${transaction._id}`}
                        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-bold text-sm flex items-center gap-1 transition-colors"
                      >
                        View
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
