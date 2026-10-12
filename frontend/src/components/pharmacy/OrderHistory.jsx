import { useState, useEffect } from 'react';
import { getMedicineOrders } from '../../services/pharmacyService';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import EmptyState from '../common/EmptyState';
import StatusBadge from '../common/StatusBadge';
import Modal from '../common/Modal';

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const data = await getMedicineOrders();
      setOrders(data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (date) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredOrders = orders
    .filter(o => {
      if (filter === 'delivered') return o.status === 'delivered';
      if (filter === 'ready') return o.status === 'ready';
      if (filter === 'processing') return o.status === 'pending' || o.status === 'preparing';
      return true;
    })
    .filter(o => {
      if (!search) return true;
      const searchLower = search.toLowerCase();
      return (
        o.patient?.name?.toLowerCase().includes(searchLower) ||
        o._id?.toLowerCase().includes(searchLower) ||
        o.medicines?.some(m => m.medicineName?.toLowerCase().includes(searchLower))
      );
    });

  if (loading) return <LoadingSpinner message="Loading order history..." />;
  if (error) return <ErrorMessage message={error} onRetry={fetchOrders} />;

  const deliveredCount = orders.filter(o => o.status === 'delivered').length;
  const readyCount = orders.filter(o => o.status === 'ready').length;
  const processingCount = orders.filter(o => o.status === 'pending' || o.status === 'preparing').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <button
          onClick={() => setFilter('all')}
          className={`rounded-2xl p-6 text-left transition-all ${
            filter === 'all' 
              ? 'bg-gradient-to-br from-violet-500 to-purple-500 text-white shadow-lg' 
              : 'bg-white border border-gray-100 hover:shadow-md'
          }`}
        >
          <p className={`text-sm font-medium mb-2 ${filter === 'all' ? 'text-violet-100' : 'text-gray-600'}`}>
            All Orders
          </p>
          <p className={`text-4xl font-bold ${filter === 'all' ? 'text-white' : 'text-gray-900'}`}>
            {orders.length}
          </p>
        </button>
        <button
          onClick={() => setFilter('delivered')}
          className={`rounded-2xl p-6 text-left transition-all ${
            filter === 'delivered' 
              ? 'bg-gradient-to-br from-green-500 to-emerald-500 text-white shadow-lg' 
              : 'bg-white border border-gray-100 hover:shadow-md'
          }`}
        >
          <p className={`text-sm font-medium mb-2 ${filter === 'delivered' ? 'text-green-100' : 'text-gray-600'}`}>
            Delivered
          </p>
          <p className={`text-4xl font-bold ${filter === 'delivered' ? 'text-white' : 'text-gray-900'}`}>
            {deliveredCount}
          </p>
        </button>
        <button
          onClick={() => setFilter('ready')}
          className={`rounded-2xl p-6 text-left transition-all ${
            filter === 'ready' 
              ? 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-lg' 
              : 'bg-white border border-gray-100 hover:shadow-md'
          }`}
        >
          <p className={`text-sm font-medium mb-2 ${filter === 'ready' ? 'text-blue-100' : 'text-gray-600'}`}>
            Ready
          </p>
          <p className={`text-4xl font-bold ${filter === 'ready' ? 'text-white' : 'text-gray-900'}`}>
            {readyCount}
          </p>
        </button>
        <button
          onClick={() => setFilter('processing')}
          className={`rounded-2xl p-6 text-left transition-all ${
            filter === 'processing' 
              ? 'bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-lg' 
              : 'bg-white border border-gray-100 hover:shadow-md'
          }`}
        >
          <p className={`text-sm font-medium mb-2 ${filter === 'processing' ? 'text-orange-100' : 'text-gray-600'}`}>
            Processing
          </p>
          <p className={`text-4xl font-bold ${filter === 'processing' ? 'text-white' : 'text-gray-900'}`}>
            {processingCount}
          </p>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="relative">
          <input
            type="text"
            placeholder="🔍 Search by order ID, patient name, or medicine..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-3 pl-12 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent font-medium"
          />
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-violet-50 to-purple-50">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <span className="mr-2">📋</span>
            Order History
            <span className="ml-3 text-sm font-normal text-gray-600">({filteredOrders.length})</span>
          </h2>
        </div>

        <div className="divide-y divide-gray-100">
          {filteredOrders.length === 0 ? (
            <EmptyState
              icon="📭"
              title="No Orders Found"
              message={search ? "Try different search terms" : "No orders in this category"}
            />
          ) : (
            filteredOrders.map((order) => (
              <div key={order._id} className="p-6 hover:bg-gradient-to-r hover:from-gray-50 hover:to-violet-50/30 transition-all">
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-lg ${
                    order.status === 'delivered' ? 'bg-gradient-to-br from-green-500 to-emerald-500' :
                    order.status === 'ready' ? 'bg-gradient-to-br from-blue-500 to-cyan-500' :
                    order.status === 'preparing' ? 'bg-gradient-to-br from-orange-500 to-amber-500' :
                    'bg-gradient-to-br from-gray-400 to-gray-500'
                  }`}>
                    {order.status === 'delivered' ? '✅' :
                     order.status === 'ready' ? '📦' :
                     order.status === 'preparing' ? '⚙️' : '📥'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">#{order._id?.slice(-8).toUpperCase()}</h3>
                        <p className="text-sm text-gray-600">{order.patient?.name} • {formatDate(order.createdAt)}</p>
                      </div>
                      <StatusBadge status={order.status} type="medicine" />
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                      {order.medicines?.map((med, idx) => (
                        <span key={idx} className="px-3 py-1 bg-violet-50 text-violet-700 rounded-lg text-sm font-medium">
                          {med.medicineName} ×{med.quantity || 1}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600">
                        📍 {order.deliveryAddress?.substring(0, 40)}...
                      </p>
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="text-violet-600 hover:text-violet-700 font-bold text-sm bg-violet-50 hover:bg-violet-100 px-4 py-2 rounded-lg transition-all"
                      >
                        View Details →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Details Modal */}
      <Modal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-500 rounded-xl flex items-center justify-center text-white text-lg">
              📦
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Order Details</h3>
              <p className="text-sm text-gray-500">#{selectedOrder?._id?.slice(-8).toUpperCase()}</p>
            </div>
          </div>
        }
        size="lg"
      >
        {selectedOrder && (
          <div className="space-y-6">
            {/* Status */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <span className="font-bold text-gray-900">Status</span>
              <StatusBadge status={selectedOrder.status} type="medicine" />
            </div>

            {/* Patient */}
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
              <p className="text-xs text-blue-600 font-bold mb-2">Patient</p>
              <p className="font-bold text-blue-900">{selectedOrder.patient?.name}</p>
              <p className="text-sm text-blue-700">{selectedOrder.patient?.phone}</p>
            </div>

            {/* Delivery Address */}
            <div className="bg-green-50 rounded-xl p-4 border border-green-100">
              <p className="text-xs text-green-600 font-bold mb-2">Delivery Address</p>
              <p className="font-bold text-green-900">{selectedOrder.deliveryAddress}</p>
            </div>

            {/* Medicines */}
            <div>
              <h4 className="font-bold text-gray-900 mb-3">Medicines</h4>
              <div className="space-y-2">
                {selectedOrder.medicines?.map((med, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-violet-50 rounded-lg">
                    <span className="font-medium text-violet-900">{med.medicineName}</span>
                    <span className="font-bold text-violet-600">×{med.quantity || 1}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Timestamps */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
              <div>
                <p className="text-xs text-gray-500">Order Date</p>
                <p className="font-medium text-gray-900">{formatDateTime(selectedOrder.createdAt)}</p>
              </div>
              {selectedOrder.actualDelivery && (
                <div>
                  <p className="text-xs text-gray-500">Delivered On</p>
                  <p className="font-medium text-green-600">{formatDateTime(selectedOrder.actualDelivery)}</p>
                </div>
              )}
            </div>

            {selectedOrder.pharmacyNotes && (
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                <p className="text-xs text-amber-600 font-bold mb-1">Pharmacy Notes</p>
                <p className="text-amber-800">{selectedOrder.pharmacyNotes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default OrderHistory;