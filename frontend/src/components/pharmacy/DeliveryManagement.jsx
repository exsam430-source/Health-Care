import { useState, useEffect } from 'react';
import { getMedicineOrders, updateMedicineOrder } from '../../services/pharmacyService';
import LoadingSpinner from '../common/LoadingSpinner';
import EmptyState from '../common/EmptyState';

const DeliveryManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const data = await getMedicineOrders();
      // Only show ready orders
      const readyOrders = (data.data || []).filter(o => o.status === 'ready');
      setOrders(readyOrders);
    } catch (err) {
      console.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const handleDeliver = async (orderId) => {
    try {
      setProcessingId(orderId);
      await updateMedicineOrder(orderId, { 
        status: 'delivered',
        actualDelivery: new Date()
      });
      
      // Show notification
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-in';
      notification.textContent = '🚚 Order marked as delivered!';
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

  if (loading) return <LoadingSpinner message="Loading deliveries..." />;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-3xl shadow-lg">
            🚚
          </div>
          <div>
            <h2 className="text-3xl font-bold">Delivery Management</h2>
            <p className="text-pink-100 mt-1">Track and manage medicine deliveries</p>
          </div>
        </div>
        
        <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-pink-200 text-sm">Ready for Delivery</p>
              <p className="text-5xl font-bold mt-1">{orders.length}</p>
            </div>
            <div className="text-6xl opacity-30">📦</div>
          </div>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12">
          <EmptyState
            icon="✨"
            title="All Deliveries Complete!"
            message="No orders awaiting delivery. Great job!"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.map((order) => (
            <div key={order._id} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all">
              {/* Card Header */}
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-4 text-white">
                <div className="flex items-center justify-between">
                  <span className="text-2xl">📦</span>
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-bold">
                    Ready
                  </span>
                </div>
                <h3 className="text-lg font-bold mt-2">#{order._id?.slice(-8).toUpperCase()}</h3>
                <p className="text-green-100 text-sm">{formatDate(order.createdAt)}</p>
              </div>

              {/* Card Body */}
              <div className="p-6 space-y-4">
                {/* Patient */}
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-500 rounded-xl flex items-center justify-center text-white text-lg font-bold">
                    {order.patient?.name?.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{order.patient?.name}</p>
                    <p className="text-sm text-gray-600">{order.patient?.phone}</p>
                  </div>
                </div>

                {/* Medicines */}
                <div>
                  <p className="text-xs text-gray-500 mb-2">MEDICINES</p>
                  <div className="flex flex-wrap gap-1">
                    {order.medicines?.slice(0, 2).map((med, idx) => (
                      <span key={idx} className="px-2 py-1 bg-violet-50 text-violet-700 rounded text-xs font-medium">
                        {med.medicineName}
                      </span>
                    ))}
                    {order.medicines?.length > 2 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                        +{order.medicines.length - 2}
                      </span>
                    )}
                  </div>
                </div>

                {/* Delivery Address */}
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">📍 DELIVERY ADDRESS</p>
                  <p className="text-sm font-medium text-gray-900">{order.deliveryAddress}</p>
                </div>

                {/* Action */}
                <button
                  onClick={() => handleDeliver(order._id)}
                  disabled={processingId === order._id}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                >
                  {processingId === order._id ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Updating...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <span className="mr-2">🚚</span>
                      Mark as Delivered
                    </span>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DeliveryManagement;