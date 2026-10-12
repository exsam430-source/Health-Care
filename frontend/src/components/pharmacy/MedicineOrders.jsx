import { useState, useEffect } from 'react';
import { getMedicineOrders, updateMedicineOrder } from '../../services/pharmacyService';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import EmptyState from '../common/EmptyState';
import StatusBadge from '../common/StatusBadge';
import Modal from '../common/Modal';

const MedicineOrders = ({ onUpdate }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await getMedicineOrders();
      setOrders(data.data || []);
      if (onUpdate) onUpdate();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, status, additionalData = {}) => {
    try {
      setActionLoading(true);
      await updateMedicineOrder(orderId, { status, ...additionalData });
      showNotification(`✅ Order ${status} successfully!`, 'success');
      fetchOrders();
      setShowModal(false);
      setSelectedOrder(null);
    } catch (err) {
      showNotification('❌ Failed to update order', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const showNotification = (message, type) => {
    const color = type === 'success' ? 'bg-green-500' : 'bg-red-500';
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 ${color} text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-in`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  };

  const viewDetails = (order) => {
    setSelectedOrder(order);
    setShowModal(true);
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

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const preparingOrders = orders.filter(o => o.status === 'preparing');
  const readyOrders = orders.filter(o => o.status === 'ready');
  const deliveredOrders = orders.filter(o => o.status === 'delivered');

  const getFilteredOrders = () => {
    switch(filter) {
      case 'pending': return pendingOrders;
      case 'preparing': return preparingOrders;
      case 'ready': return readyOrders;
      case 'delivered': return deliveredOrders;
      default: return orders;
    }
  };

  const filteredOrders = getFilteredOrders();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <StatCard
          label="New Orders"
          value={pendingOrders.length}
          icon="📦"
          gradient="from-orange-500 to-red-500"
          onClick={() => setFilter('pending')}
          active={filter === 'pending'}
          pulse={pendingOrders.length > 0}
        />
        <StatCard
          label="Preparing"
          value={preparingOrders.length}
          icon="⚙️"
          gradient="from-blue-500 to-cyan-500"
          onClick={() => setFilter('preparing')}
          active={filter === 'preparing'}
        />
        <StatCard
          label="Ready"
          value={readyOrders.length}
          icon="✅"
          gradient="from-green-500 to-emerald-500"
          onClick={() => setFilter('ready')}
          active={filter === 'ready'}
        />
        <StatCard
          label="Delivered"
          value={deliveredOrders.length}
          icon="🚚"
          gradient="from-purple-500 to-pink-500"
          onClick={() => setFilter('delivered')}
          active={filter === 'delivered'}
        />
        <StatCard
          label="Total"
          value={orders.length}
          icon="📊"
          gradient="from-gray-600 to-gray-800"
          onClick={() => setFilter('all')}
          active={filter === 'all'}
        />
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-violet-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <span className="mr-2">
                  {filter === 'pending' ? '📦' : 
                   filter === 'preparing' ? '⚙️' : 
                   filter === 'ready' ? '✅' : 
                   filter === 'delivered' ? '🚚' : '📋'}
                </span>
                {filter === 'all' ? 'All Orders' : 
                 filter === 'pending' ? 'New Orders' :
                 filter === 'preparing' ? 'Preparing Orders' :
                 filter === 'ready' ? 'Ready for Delivery' :
                 'Delivered Orders'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">{filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}</p>
            </div>
            {filter !== 'all' && (
              <button
                onClick={() => setFilter('all')}
                className="text-sm text-violet-600 hover:text-violet-700 font-bold bg-violet-50 hover:bg-violet-100 px-4 py-2 rounded-lg transition-all"
              >
                View All →
              </button>
            )}
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {filteredOrders.length === 0 ? (
            <EmptyState
              icon={filter === 'pending' ? '✨' : '📭'}
              title={filter === 'pending' ? 'No Pending Orders' : 'No Orders Found'}
              message={filter === 'pending' ? 'All orders have been processed' : 'No orders found in this category'}
            />
          ) : (
            filteredOrders.map((order) => (
              <OrderCard
                key={order._id}
                order={order}
                onView={() => viewDetails(order)}
                onUpdateStatus={handleUpdateStatus}
                formatDate={formatDate}
                actionLoading={actionLoading}
              />
            ))
          )}
        </div>
      </div>

      {/* Details Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedOrder(null);
        }}
        title={
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-500 rounded-xl flex items-center justify-center text-white text-lg">
              💊
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
          <OrderDetails
            order={selectedOrder}
            formatDate={formatDate}
            onUpdateStatus={handleUpdateStatus}
            actionLoading={actionLoading}
          />
        )}
      </Modal>
    </div>
  );
};

const StatCard = ({ label, value, icon, gradient, onClick, active, pulse }) => (
  <button
    onClick={onClick}
    className={`group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 ${
      active 
        ? `bg-gradient-to-br ${gradient} shadow-lg scale-105` 
        : 'bg-white hover:shadow-lg hover:scale-102 border border-gray-100'
    }`}
  >
    {pulse && !active && (
      <div className="absolute top-3 right-3 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
    )}
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-3">
        <span className={`text-3xl ${active ? 'animate-bounce' : ''}`}>{icon}</span>
        <div className={`text-3xl font-bold ${active ? 'text-white' : 'text-gray-900'}`}>
          {value}
        </div>
      </div>
      <p className={`text-sm font-medium ${active ? 'text-white/90' : 'text-gray-600'}`}>
        {label}
      </p>
    </div>
    {!active && (
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity`}></div>
    )}
  </button>
);

const OrderCard = ({ order, onView, onUpdateStatus, formatDate, actionLoading }) => {
  const getNextStatus = () => {
    switch(order.status) {
      case 'pending': return { status: 'preparing', label: 'Start Preparing', icon: '⚙️' };
      case 'preparing': return { status: 'ready', label: 'Mark as Ready', icon: '✅' };
      case 'ready': return { status: 'delivered', label: 'Mark Delivered', icon: '🚚' };
      default: return null;
    }
  };

  const nextStatus = getNextStatus();

  return (
    <div className="p-6 hover:bg-gradient-to-r hover:from-gray-50 hover:to-violet-50/30 transition-all duration-200 group">
      <div className="flex items-start gap-4">
        {/* Order Icon */}
        <div className="flex-shrink-0">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-lg ${
            order.status === 'pending' ? 'bg-gradient-to-br from-orange-500 to-red-500' :
            order.status === 'preparing' ? 'bg-gradient-to-br from-blue-500 to-cyan-500' :
            order.status === 'ready' ? 'bg-gradient-to-br from-green-500 to-emerald-500' :
            'bg-gradient-to-br from-purple-500 to-pink-500'
          } group-hover:scale-110 transition-transform`}>
            {order.status === 'pending' ? '📦' :
             order.status === 'preparing' ? '⚙️' :
             order.status === 'ready' ? '✅' : '🚚'}
          </div>
        </div>

        {/* Order Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                Order #{order._id?.slice(-8).toUpperCase()}
              </h3>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span className="flex items-center">
                  <span className="mr-1">👤</span>
                  {order.patient?.name}
                </span>
                <span className="flex items-center">
                  <span className="mr-1">💊</span>
                  {order.medicines?.length || 0} medicine{order.medicines?.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
            <StatusBadge status={order.status} type="medicine" />
          </div>

          {/* Medicines Preview */}
          <div className="flex flex-wrap gap-2 mb-4">
            {order.medicines?.slice(0, 3).map((med, idx) => (
              <span key={idx} className="px-3 py-1.5 bg-violet-50 text-violet-700 rounded-lg text-sm font-medium border border-violet-100">
                💊 {med.medicineName} × {med.quantity || 1}
              </span>
            ))}
            {order.medicines?.length > 3 && (
              <span className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium">
                +{order.medicines.length - 3} more
              </span>
            )}
          </div>

          {/* Delivery Address */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">📍 Delivery Address</p>
            <p className="text-sm font-medium text-gray-900">{order.deliveryAddress}</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onView}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 px-4 rounded-xl transition-all"
            >
              <span className="mr-2">👁️</span>
              View Details
            </button>
            {nextStatus && (
              <button
                onClick={() => onUpdateStatus(order._id, nextStatus.status)}
                disabled={actionLoading}
                className={`flex-1 text-white font-medium py-2.5 px-4 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 ${
                  order.status === 'pending' ? 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600' :
                  order.status === 'preparing' ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600' :
                  'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
                }`}
              >
                <span className="mr-2">{nextStatus.icon}</span>
                {nextStatus.label}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const OrderDetails = ({ order, formatDate, onUpdateStatus, actionLoading }) => {
  const [pharmacyNotes, setPharmacyNotes] = useState('');
  const [estimatedDelivery, setEstimatedDelivery] = useState('');

  const getNextStatus = () => {
    switch(order.status) {
      case 'pending': return { status: 'preparing', label: 'Start Preparing', icon: '⚙️', color: 'blue' };
      case 'preparing': return { status: 'ready', label: 'Mark as Ready', icon: '✅', color: 'green' };
      case 'ready': return { status: 'delivered', label: 'Mark Delivered', icon: '🚚', color: 'purple' };
      default: return null;
    }
  };

  const nextStatus = getNextStatus();

  const handleUpdateWithNotes = () => {
    const additionalData = {};
    if (pharmacyNotes) additionalData.pharmacyNotes = pharmacyNotes;
    if (estimatedDelivery) additionalData.estimatedDelivery = estimatedDelivery;
    if (nextStatus.status === 'delivered') additionalData.actualDelivery = new Date();
    onUpdateStatus(order._id, nextStatus.status, additionalData);
  };

  return (
    <div className="space-y-6">
      {/* Order Status Timeline */}
      <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-2xl p-6 border border-violet-100">
        <h4 className="font-bold text-violet-900 mb-4 flex items-center text-lg">
          <span className="mr-2">📦</span>
          Order Status
        </h4>
        <div className="flex items-center justify-between">
          {['pending', 'preparing', 'ready', 'delivered'].map((status, idx) => {
            const isActive = order.status === status;
            const isPast = ['pending', 'preparing', 'ready', 'delivered'].indexOf(order.status) > idx;
            
            return (
              <div key={status} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${
                  isActive ? 'bg-violet-500 text-white ring-4 ring-violet-200' :
                  isPast ? 'bg-green-500 text-white' :
                  'bg-gray-200 text-gray-500'
                }`}>
                  {isPast && !isActive ? '✓' : 
                   status === 'pending' ? '📦' :
                   status === 'preparing' ? '⚙️' :
                   status === 'ready' ? '✅' : '🚚'}
                </div>
                {idx < 3 && (
                  <div className={`w-16 h-1 mx-2 ${
                    isPast ? 'bg-green-500' : 'bg-gray-200'
                  }`}></div>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-3 text-xs font-medium">
          <span className="text-gray-600">Pending</span>
          <span className="text-gray-600">Preparing</span>
          <span className="text-gray-600">Ready</span>
          <span className="text-gray-600">Delivered</span>
        </div>
      </div>

      {/* Patient Info */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
        <h4 className="font-bold text-blue-900 mb-4 flex items-center text-lg">
          <span className="mr-2">👤</span>
          Patient Information
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <InfoRow label="Name" value={order.patient?.name} />
          <InfoRow label="Phone" value={order.patient?.phone} />
          <InfoRow label="Email" value={order.patient?.email} className="col-span-2" />
        </div>
      </div>

      {/* Delivery Address */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
        <h4 className="font-bold text-green-900 mb-4 flex items-center text-lg">
          <span className="mr-2">📍</span>
          Delivery Address
        </h4>
        <p className="text-green-800 font-medium">{order.deliveryAddress}</p>
      </div>

      {/* Medicines */}
      <div>
        <h4 className="font-bold text-gray-900 mb-4 text-lg flex items-center">
          <span className="mr-2">💊</span>
          Medicines ({order.medicines?.length || 0})
        </h4>
        <div className="space-y-3">
          {order.medicines?.map((med, idx) => (
            <div key={idx} className="bg-gradient-to-r from-gray-50 to-violet-50/30 rounded-xl p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-500 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                    {idx + 1}
                  </div>
                  <div>
                    <h5 className="font-bold text-gray-900">{med.medicineName}</h5>
                    <p className="text-sm text-gray-600">{med.dosage}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-violet-600">×{med.quantity || 1}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Notes & Estimated Delivery (for certain statuses) */}
      {order.status !== 'delivered' && (
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-2xl p-6 border border-amber-100">
          <h4 className="font-bold text-amber-900 mb-4 flex items-center text-lg">
            <span className="mr-2">📝</span>
            Order Processing
          </h4>
          
          {order.status === 'pending' && (
            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Estimated Delivery Date
              </label>
              <input
                type="date"
                value={estimatedDelivery}
                onChange={(e) => setEstimatedDelivery(e.target.value)}
                className="w-full px-4 py-3 border-2 border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Pharmacy Notes
            </label>
            <textarea
              value={pharmacyNotes}
              onChange={(e) => setPharmacyNotes(e.target.value)}
              className="w-full px-4 py-3 border-2 border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
              rows={3}
              placeholder="Add any notes about this order..."
            />
          </div>
        </div>
      )}

      {/* Existing Notes */}
      {order.pharmacyNotes && (
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
          <p className="text-xs text-gray-500 mb-1">Pharmacy Notes</p>
          <p className="text-gray-800 font-medium">{order.pharmacyNotes}</p>
        </div>
      )}

      {/* Timestamps */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
        <div>
          <p className="text-xs text-gray-500">Order Date</p>
          <p className="font-medium text-gray-900">{formatDate(order.createdAt)}</p>
        </div>
        {order.estimatedDelivery && (
          <div>
            <p className="text-xs text-gray-500">Est. Delivery</p>
            <p className="font-medium text-gray-900">{formatDate(order.estimatedDelivery)}</p>
          </div>
        )}
        {order.actualDelivery && (
          <div>
            <p className="text-xs text-gray-500">Delivered On</p>
            <p className="font-medium text-green-600">{formatDate(order.actualDelivery)}</p>
          </div>
        )}
      </div>

      {/* Action Button */}
      {nextStatus && (
        <button
          onClick={handleUpdateWithNotes}
          disabled={actionLoading}
          className={`w-full text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 text-lg ${
            nextStatus.color === 'blue' ? 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600' :
            nextStatus.color === 'green' ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600' :
            'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
          }`}
        >
          {actionLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin h-6 w-6 mr-3" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Updating...
            </span>
          ) : (
            <span className="flex items-center justify-center">
              <span className="mr-3 text-2xl">{nextStatus.icon}</span>
              {nextStatus.label}
            </span>
          )}
        </button>
      )}

      {order.status === 'delivered' && (
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl p-6 text-center">
          <span className="text-4xl mb-2 block">✅</span>
          <h4 className="font-bold text-xl">Order Delivered Successfully!</h4>
          <p className="text-green-100 mt-1">Delivered on {formatDate(order.actualDelivery || order.updatedAt)}</p>
        </div>
      )}
    </div>
  );
};

const InfoRow = ({ label, value, className = '' }) => (
  <div className={className}>
    <p className="text-xs text-gray-500 mb-1">{label}</p>
    <p className="text-sm font-semibold text-gray-900">{value}</p>
  </div>
);

export default MedicineOrders;