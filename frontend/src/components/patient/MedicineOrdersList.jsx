import { useState, useEffect } from 'react';
import { getMedicineOrders } from '../../services/pharmacyService';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import EmptyState from '../common/EmptyState';
import StatusBadge from '../common/StatusBadge';

const MedicineOrdersList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const data = await getMedicineOrders();
      setOrders(data.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load medicine orders');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) return <LoadingSpinner message="Loading medicine orders..." />;
  if (error) return <ErrorMessage message={error} onRetry={fetchOrders} />;

  if (orders.length === 0) {
    return (
      <EmptyState 
        icon="🛒" 
        title="No Medicine Orders" 
        message="You haven't ordered any medicines yet. Order from your prescriptions!" 
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">My Medicine Orders</h2>
          <p className="text-gray-600 mt-1">{orders.length} order{orders.length > 1 ? 's' : ''} in total</p>
        </div>
        <div className="bg-gradient-to-r from-green-100 to-emerald-100 px-6 py-3 rounded-full">
          <span className="text-2xl">🚚</span>
        </div>
      </div>

      {orders.map((order) => (
        <div 
          key={order._id} 
          className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 hover:border-green-300 hover:shadow-2xl transition-all overflow-hidden"
        >
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-green-100">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center space-x-2">
                  <span>📦</span>
                  <span>Order #{order._id.slice(-8).toUpperCase()}</span>
                </h3>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <span>🏥</span>
                    <span>{order.pharmacy?.pharmacyName}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span>📅</span>
                    <span>{formatDate(order.createdAt)}</span>
                  </div>
                </div>
              </div>
              <StatusBadge status={order.status} type="medicine" />
            </div>
          </div>

          <div className="p-6 space-y-4">
            {/* Medicines */}
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-3">Ordered Medicines:</p>
              <div className="flex flex-wrap gap-2">
                {order.medicines?.map((med, idx) => (
                  <span 
                    key={idx} 
                    className="px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 rounded-xl text-sm font-semibold border border-green-200"
                  >
                    💊 {med.medicineName} <span className="ml-2 bg-green-200 px-2 py-0.5 rounded-full">×{med.quantity}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Delivery Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
              <div>
                <p className="text-sm text-gray-500 mb-1 flex items-center space-x-1">
                  <span>🏠</span>
                  <span>Delivery Address</span>
                </p>
                <p className="text-sm font-semibold text-gray-900">{order.deliveryAddress}</p>
              </div>
              {order.estimatedDelivery && (
                <div>
                  <p className="text-sm text-gray-500 mb-1 flex items-center space-x-1">
                    <span>⏰</span>
                    <span>Estimated Delivery</span>
                  </p>
                  <p className="text-sm font-semibold text-gray-900">{formatDate(order.estimatedDelivery)}</p>
                </div>
              )}
            </div>

            {/* Status Timeline */}
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${
                    order.status === 'pending' ? 'bg-yellow-500 animate-pulse' :
                    order.status === 'processing' ? 'bg-blue-500 animate-pulse' :
                    order.status === 'delivered' ? 'bg-green-500' :
                    'bg-red-500'
                  }`}></div>
                  <span className="text-sm font-semibold text-gray-700">
                    {order.status === 'pending' && '⏳ Order Received'}
                    {order.status === 'processing' && '📦 Preparing Your Order'}
                    {order.status === 'delivered' && '✅ Delivered Successfully'}
                    {order.status === 'cancelled' && '❌ Order Cancelled'}
                  </span>
                </div>
                <span className="text-xs text-gray-500">Track your order</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MedicineOrdersList;