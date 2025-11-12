import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

interface User {
  _id: string;
  name: string;
  email: string;
  username: string;
  phone?: string;
}

interface Payment {
  _id: string;
  razorpay_order_id: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod?: string;
}

interface Transaction {
  _id: string;
  title: string;
  description: string;
  amount: number;
  currency: string;
  status: string;
  terms: string;
  buyer: User;
  seller: User;
  createdAt: string;
  deliveryDeadline: string;
  escrowFee: number;
  payment?: Payment;
  dispute?: {
    isDisputed: boolean;
    reason?: string;
    raisedBy?: string;
    raisedAt?: string;
  };
}

export default function TransactionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');

  useEffect(() => {
    // Get current user
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }

    // Fetch transaction details
    fetchTransaction();
  }, [id]);

  const fetchTransaction = async () => {
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

      const response = await axios.get(`${API_URL}/transactions/${id}`, config);
      
      if (response.data.success) {
        setTransaction(response.data.data);
      }
      
      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching transaction:', err);
      setError(err.response?.data?.message || 'Failed to load transaction');
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!window.confirm('Are you sure you want to accept this transaction?')) return;
    
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const response = await axios.put(`${API_URL}/transactions/${id}/accept`, {}, config);
      
      if (response.data.success) {
        alert('Transaction accepted successfully!');
        fetchTransaction(); // Refresh data
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to accept transaction');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeliver = async () => {
    const deliveryNote = prompt('Enter delivery notes (optional):');
    if (deliveryNote === null) return; // User cancelled
    
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const response = await axios.put(
        `${API_URL}/transactions/${id}/deliver`,
        { deliveryNote: deliveryNote || 'Goods/Services delivered' },
        config
      );
      
      if (response.data.success) {
        alert('Transaction marked as delivered!');
        fetchTransaction();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to mark as delivered');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!window.confirm('Are you sure you want to approve and release payment? This action cannot be undone.')) return;
    
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const response = await axios.put(`${API_URL}/transactions/${id}/approve`, {}, config);
      
      if (response.data.success) {
        alert('Payment released successfully!');
        fetchTransaction();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to approve transaction');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDispute = async () => {
    setShowDisputeModal(true);
  };

  const submitDispute = async () => {
    if (!disputeReason.trim()) {
      alert('Please provide a reason for the dispute');
      return;
    }

    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const response = await axios.put(
        `${API_URL}/transactions/${id}/dispute`,
        { reason: disputeReason },
        config
      );
      
      if (response.data.success) {
        alert('Dispute raised successfully. Our team will review it.');
        setShowDisputeModal(false);
        setDisputeReason('');
        fetchTransaction();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to raise dispute');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this transaction?')) return;
    
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const response = await axios.put(`${API_URL}/transactions/${id}/cancel`, {}, config);
      
      if (response.data.success) {
        alert('Transaction cancelled successfully');
        fetchTransaction();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to cancel transaction');
    } finally {
      setActionLoading(false);
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
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      initiated: 'Transaction Initiated',
      accepted: 'Accepted by Seller',
      payment_made: 'Payment Made - Funds in Escrow',
      in_progress: 'Work in Progress',
      delivered: 'Delivered - Awaiting Approval',
      completed: 'Completed Successfully',
      disputed: 'Under Dispute',
      cancelled: 'Cancelled',
    };
    return labels[status] || status;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const isBuyer = transaction && currentUser && transaction.buyer._id === currentUser._id;
  const isSeller = transaction && currentUser && transaction.seller._id === currentUser._id;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-teal-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-slate-600 dark:text-gray-400">Loading transaction details...</p>
        </div>
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md">
          <h3 className="text-red-800 dark:text-red-400 font-semibold mb-2">Error Loading Transaction</h3>
          <p className="text-red-600 dark:text-red-400 text-sm mb-4">{error || 'Transaction not found'}</p>
          <button
            onClick={() => navigate('/transactions')}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
          >
            Back to Transactions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <button
          onClick={() => navigate('/transactions')}
          className="text-teal-600 dark:text-teal-400 hover:underline mb-6 flex items-center gap-2"
        >
          ← Back to Transactions
        </button>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-gray-100 mb-2">
                  {transaction.title}
                </h1>
                <p className="text-sm text-slate-600 dark:text-gray-400">
                  Transaction ID: #{transaction._id.slice(-8).toUpperCase()}
                </p>
                <span className={`inline-block mt-2 px-3 py-1 rounded text-xs font-medium ${
                  isBuyer 
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' 
                    : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                }`}>
                  You are the {isBuyer ? 'Buyer' : 'Seller'}
                </span>
              </div>
              <span className={`px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(transaction.status)}`}>
                {getStatusLabel(transaction.status)}
              </span>
            </div>
          </div>

          {/* Amount Section */}
          <div className="bg-gradient-to-r from-teal-50 to-blue-50 dark:from-teal-900/20 dark:to-blue-900/20 p-6 border-b border-slate-200 dark:border-slate-700">
            <div className="text-center">
              <div className="text-sm text-slate-600 dark:text-gray-400 mb-2">Transaction Amount</div>
              <div className="text-5xl font-bold text-teal-600 dark:text-teal-400">
                ₹{transaction.amount.toLocaleString('en-IN')}
              </div>
              {transaction.escrowFee > 0 && (
                <div className="text-sm text-slate-600 dark:text-gray-400 mt-2">
                  + Escrow Fee: ₹{transaction.escrowFee.toLocaleString('en-IN')}
                </div>
              )}
              <div className="text-sm text-slate-600 dark:text-gray-400 mt-2">
                {transaction.status === 'initiated' && ' Awaiting seller acceptance'}
                {transaction.status === 'accepted' && ' Ready for payment'}
                {transaction.status === 'payment_made' && ' Funds held securely in escrow'}
                {transaction.status === 'in_progress' && ' Work in progress'}
                {transaction.status === 'delivered' && ' Awaiting buyer approval'}
                {transaction.status === 'completed' && ' Payment released to seller'}
                {transaction.status === 'disputed' && ' Under dispute resolution'}
                {transaction.status === 'cancelled' && ' Transaction cancelled'}
              </div>
            </div>
          </div>

          {/* Transaction Details */}
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-sm font-medium text-slate-500 dark:text-gray-500 mb-2">Description</h3>
              <p className="text-slate-900 dark:text-gray-100">{transaction.description}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-slate-500 dark:text-gray-500 mb-2">Terms & Conditions</h3>
              <p className="text-slate-900 dark:text-gray-100">{transaction.terms}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-slate-500 dark:text-gray-500 mb-3">Buyer Information</h3>
                <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
                  <div className="font-medium text-slate-900 dark:text-gray-100">
                    {transaction.buyer.name}
                    {isBuyer && ' (You)'}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-gray-400">{transaction.buyer.email}</div>
                  {transaction.buyer.phone && (
                    <div className="text-sm text-slate-600 dark:text-gray-400">{transaction.buyer.phone}</div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-slate-500 dark:text-gray-500 mb-3">Seller Information</h3>
                <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
                  <div className="font-medium text-slate-900 dark:text-gray-100">
                    {transaction.seller.name}
                    {isSeller && ' (You)'}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-gray-400">{transaction.seller.email}</div>
                  {transaction.seller.phone && (
                    <div className="text-sm text-slate-600 dark:text-gray-400">{transaction.seller.phone}</div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-slate-500 dark:text-gray-500 mb-2">Created Date</h3>
                <p className="text-slate-900 dark:text-gray-100">{formatDate(transaction.createdAt)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-slate-500 dark:text-gray-500 mb-2">Delivery Deadline</h3>
                <p className="text-slate-900 dark:text-gray-100">{formatDate(transaction.deliveryDeadline)}</p>
              </div>
            </div>

            {transaction.payment && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <h3 className="font-medium text-green-900 dark:text-green-400 mb-2">Payment Information</h3>
                <div className="text-sm space-y-1">
                  {transaction.payment.razorpay_payment_id && (
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-gray-400">Payment ID:</span>
                      <span className="font-mono text-slate-900 dark:text-gray-100">{transaction.payment.razorpay_payment_id}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-gray-400">Amount:</span>
                    <span className="text-slate-900 dark:text-gray-100">₹{transaction.payment.amount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-gray-400">Status:</span>
                    <span className="text-green-600 dark:text-green-400 font-medium capitalize">{transaction.payment.status}</span>
                  </div>
                </div>
              </div>
            )}

            {transaction.dispute?.isDisputed && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <h3 className="font-medium text-red-900 dark:text-red-400 mb-2">Dispute Information</h3>
                <div className="text-sm space-y-2">
                  <p className="text-slate-900 dark:text-gray-100">
                    <strong>Reason:</strong> {transaction.dispute.reason}
                  </p>
                  {transaction.dispute.raisedAt && (
                    <p className="text-slate-600 dark:text-gray-400">
                      Raised on: {formatDate(transaction.dispute.raisedAt)}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="p-6 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
            <h3 className="font-medium text-slate-900 dark:text-gray-100 mb-4">Available Actions</h3>
            <div className="flex flex-wrap gap-3">
              {/* Seller can accept */}
              {transaction.status === 'initiated' && isSeller && (
                <>
                  <button
                    onClick={handleAccept}
                    disabled={actionLoading}
                    className="bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    Accept Transaction
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={actionLoading}
                    className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-gray-100 px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    Reject
                  </button>
                </>
              )}

              {/* Buyer can cancel before payment */}
              {transaction.status === 'initiated' && isBuyer && (
                <button
                  onClick={handleCancel}
                  disabled={actionLoading}
                  className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-gray-100 px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Cancel Transaction
                </button>
              )}

              {/* Seller can mark as delivered */}
              {(transaction.status === 'payment_made' || transaction.status === 'in_progress') && isSeller && (
                <>
                  <button
                    onClick={handleDeliver}
                    disabled={actionLoading}
                    className="bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    Mark as Delivered
                  </button>
                  <button
                    onClick={handleDispute}
                    disabled={actionLoading}
                    className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-gray-100 px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    Raise Dispute
                  </button>
                </>
              )}

              {/* Buyer can approve delivery */}
              {transaction.status === 'delivered' && isBuyer && (
                <>
                  <button
                    onClick={handleApprove}
                    disabled={actionLoading}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    ✓ Approve & Release Payment
                  </button>
                  <button
                    onClick={handleDispute}
                    disabled={actionLoading}
                    className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    Raise Dispute
                  </button>
                </>
              )}

              {/* Both can raise dispute after payment */}
              {transaction.status === 'payment_made' && isBuyer && (
                <button
                  onClick={handleDispute}
                  disabled={actionLoading}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Raise Dispute
                </button>
              )}

              {transaction.status === 'completed' && (
                <div className="text-green-600 dark:text-green-400 font-medium">
                  ✓ Transaction completed successfully
                </div>
              )}

              {actionLoading && (
                <div className="flex items-center gap-2 text-slate-600 dark:text-gray-400">
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Dispute Modal */}
      {showDisputeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-slate-900 dark:text-gray-100 mb-4">Raise Dispute</h3>
            <p className="text-sm text-slate-600 dark:text-gray-400 mb-4">
              Please provide a detailed reason for raising this dispute. Our team will review it and contact both parties.
            </p>
            <textarea
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-gray-100 min-h-[120px]"
              placeholder="Describe the issue in detail..."
              disabled={actionLoading}
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setShowDisputeModal(false);
                  setDisputeReason('');
                }}
                disabled={actionLoading}
                className="flex-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-gray-100 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitDispute}
                disabled={actionLoading || !disputeReason.trim()}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                {actionLoading ? 'Submitting...' : 'Submit Dispute'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
