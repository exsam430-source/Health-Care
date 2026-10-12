import { useState, useEffect } from 'react';
import { getMedicineOrders, updateMedicineOrder } from '../../services/pharmacyService';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import EmptyState from '../common/EmptyState';

const OrderProcessing = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const data = await getMedicineOrders();
      // Only show orders that need processing (pending or preparing)
      const processingOrders = (data.data || []).filter(o => 
        o.status === 'pending' || o.status === 'preparing'
      );
      setOrders(processingOrders);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = async (orderId, status) => {
    try {
      setProcessingId(orderId);
      await updateMedicineOrder(orderId, { status });
      
      // Show notification
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-in';
      notification.textContent = `✅ Order updated to ${status}!`;
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 3000);
      
      fetchOrders();
    } catch (err) {
      console.error('Failed to update order');
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) return <LoadingSpinner message="Loading orders..." />;
  if (error) return <ErrorMessage message={error} onRetry={fetchOrders} />;

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const preparingOrders = orders.filter(o => o.status === 'preparing');

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-3xl shadow-lg">
            ⚙️
          </div>
          <div>
            <h2 className="text-3xl font-bold">Order Processing Center</h2>
            <p className="text-violet-100 mt-1">Manage and process medicine orders efficiently</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <p className="text-violet-200 text-sm">Pending Orders</p>
            <p className="text-4xl font-bold">{pendingOrders.length}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <p className="text-violet-200 text-sm">Being Prepared</p>
            <p className="text-4xl font-bold">{preparingOrders.length}</p>
          </div>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12">
          <EmptyState
            icon="✨"
            title="All Orders Processed!"
            message="No pending or preparing orders. Great job!"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Orders Column */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-amber-50">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900 flex items-center">
                  <span className="mr-2">📦</span>
                  Pending Orders
                </h3>
                <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                  {pendingOrders.length}
                </span>
              </div>
            </div>
            <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
              {pendingOrders.length === 0 ? (
                <div className="p-8 text-center">
                  <span className="text-4xl">✅</span>
                  <p className="text-gray-600 mt-2">No pending orders</p>
                </div>
              ) : (
                pendingOrders.map((order) => (
                  <ProcessingCard
                    key={order._id}
                    order={order}
                    onAction={() => handleQuickAction(order._id, 'preparing')}
                    actionLabel="Start Preparing"
                    actionIcon="⚙️"
                    actionColor="from-blue-500 to-cyan-500"
                    isProcessing={processingId === order._id}
                    formatDate={formatDate}
                  />
                ))
              )}
            </div>
          </div>

          {/* Preparing Orders Column */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-cyan-50">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900 flex items-center">
                  <span className="mr-2">⚙️</span>
                  Preparing
                </h3>
                <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                  {preparingOrders.length}
                </span>
              </div>
            </div>
            <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
              {preparingOrders.length === 0 ? (
                <div className="p-8 text-center">
                  <span className="text-4xl">📭</span>
                  <p className="text-gray-600 mt-2">No orders being prepared</p>
                </div>
              ) : (
                preparingOrders.map((order) => (
                  <ProcessingCard
                    key={order._id}
                    order={order}
                    onAction={() => handleQuickAction(order._id, 'ready')}
                    actionLabel="Mark Ready"
                    actionIcon="✅"
                    actionColor="from-green-500 to-emerald-500"
                    isProcessing={processingId === order._id}
                    formatDate={formatDate}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Tips */}
      <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-2xl p-6 border border-violet-100">
        <h4 className="font-bold text-violet-900 mb-4 flex items-center">
          <span className="mr-2">💡</span>
          Processing Tips
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-4 border border-violet-100">
            <span className="text-2xl">1️⃣</span>
            <p className="font-bold text-gray-900 mt-2">Review Order</p>
            <p className="text-sm text-gray-600">Check all medicines and quantities</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-violet-100">
            <span className="text-2xl">2️⃣</span>
            <p className="font-bold text-gray-900 mt-2">Prepare Medicines</p>
            <p className="text-sm text-gray-600">Pack medicines carefully</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-violet-100">
            <span className="text-2xl">3️⃣</span>
            <p className="font-bold text-gray-900 mt-2">Mark Ready</p>
            <p className="text-sm text-gray-600">Notify for delivery pickup</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProcessingCard = ({ order, onAction, actionLabel, actionIcon, actionColor, isProcessing, formatDate }) => (
  <div className="p-4 hover:bg-gray-50 transition-all">
    <div className="flex items-center justify-between mb-3">
      <div>
        <h4 className="font-bold text-gray-900">#{order._id?.slice(-8).toUpperCase()}</h4>
        <p className="text-sm text-gray-600">{order.patient?.name}</p>
      </div>
      <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
    </div>
    
    <div className="flex flex-wrap gap-1 mb-3">
      {order.medicines?.slice(0, 2).map((med, idx) => (
        <span key={idx} className="px-2 py-1 bg-violet-50 text-violet-700 rounded text-xs font-medium">
          {med.medicineName} ×{med.quantity || 1}
        </span>
      ))}
      {order.medicines?.length > 2 && (
        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">
          +{order.medicines.length - 2}
        </span>
      )}
    </div>

    <button
      onClick={onAction}
      disabled={isProcessing}
      className={`w-full bg-gradient-to-r ${actionColor} text-white font-bold py-2.5 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50`}
    >
      {isProcessing ? (
        <span className="flex items-center justify-center">
          <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Processing...
        </span>
      ) : (
        <span className="flex items-center justify-center">
          <span className="mr-2">{actionIcon}</span>
          {actionLabel}
        </span>
      )}
    </button>
  </div>
);

export default OrderProcessing;