import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import StatsCard from '../../components/common/StatsCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import MedicineOrders from '../../components/pharmacy/MedicineOrders';
import OrderProcessing from '../../components/pharmacy/OrderProcessing';
import DeliveryManagement from '../../components/pharmacy/DeliveryManagement';
import OrderHistory from '../../components/pharmacy/OrderHistory';
import { getMedicineOrders } from '../../services/pharmacyService';

const PharmacyDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    pending: 0,
    preparing: 0,
    ready: 0,
    delivered: 0,
    total: 0
  });
  const [loading, setLoading] = useState(true);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '🏠', color: 'violet' },
    { id: 'orders', label: 'All Orders', icon: '📦', color: 'orange' },
    { id: 'processing', label: 'Processing', icon: '⚙️', color: 'blue' },
    { id: 'delivery', label: 'Delivery', icon: '🚚', color: 'purple' },
    { id: 'history', label: 'History', icon: '📋', color: 'green' }
  ];

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await getMedicineOrders();
      const orders = data.data || [];
      setStats({
        pending: orders.filter(o => o.status === 'pending').length,
        preparing: orders.filter(o => o.status === 'preparing').length,
        ready: orders.filter(o => o.status === 'ready').length,
        delivered: orders.filter(o => o.status === 'delivered').length,
        total: orders.length
      });
    } catch (err) {
      console.error('Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab stats={stats} user={user} setActiveTab={setActiveTab} />;
      case 'orders':
        return <MedicineOrders onUpdate={fetchStats} />;
      case 'processing':
        return <OrderProcessing />;
      case 'delivery':
        return <DeliveryManagement />;
      case 'history':
        return <OrderHistory />;
      default:
        return null;
    }
  };

  if (loading) return <LoadingSpinner message="Loading dashboard..." fullScreen />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-violet-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center space-x-4 mb-3">
            <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-500 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg">
              💊
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome, {user.pharmacyName}! 🏪
              </h1>
              <p className="text-gray-600 mt-1">Pharmacy Management Dashboard</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 mb-8 overflow-hidden animate-slide-in">
          <nav className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group relative flex items-center space-x-3 px-6 py-4 text-sm font-bold whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'text-violet-600 bg-violet-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <span className="text-xl group-hover:scale-110 transition-transform">{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.id === 'orders' && stats.pending > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">
                    {stats.pending}
                  </span>
                )}
                {tab.id === 'delivery' && stats.ready > 0 && (
                  <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {stats.ready}
                  </span>
                )}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 to-purple-500"></div>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="animate-fade-in">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

const OverviewTab = ({ stats, user, setActiveTab }) => (
  <div className="space-y-6">
    {/* Stats Grid */}
    <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
      <StatsCard title="New Orders" value={stats.pending} icon="📦" color="orange" />
      <StatsCard title="Preparing" value={stats.preparing} icon="⚙️" color="blue" />
      <StatsCard title="Ready" value={stats.ready} icon="✅" color="green" />
      <StatsCard title="Delivered" value={stats.delivered} icon="🚚" color="purple" />
      <StatsCard title="Total" value={stats.total} icon="📊" color="red" />
    </div>

    {/* Profile & Quick Actions */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Pharmacy Profile Card */}
      <div className="bg-gradient-to-br from-violet-600 via-purple-600 to-pink-600 rounded-2xl p-8 text-white shadow-xl">
        <h3 className="text-lg font-bold mb-6 flex items-center">
          <span className="mr-2">🏪</span>
          Pharmacy Profile
        </h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-3xl font-bold shadow-lg">
              💊
            </div>
            <div>
              <p className="font-bold text-xl">{user.pharmacyName}</p>
              <p className="text-violet-100">{user.email}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/20">
            <div>
              <p className="text-violet-200 text-xs mb-1">License No.</p>
              <p className="font-bold">{user.pharmacyLicense}</p>
            </div>
            <div>
              <p className="text-violet-200 text-xs mb-1">Phone</p>
              <p className="font-bold">{user.phone}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
          <span className="mr-2">⚡</span>
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <QuickActionCard
            icon="📦"
            title="View Orders"
            description={`${stats.pending} new order${stats.pending !== 1 ? 's' : ''}`}
            gradient="from-orange-500 to-red-500"
            onClick={() => setActiveTab('orders')}
            badge={stats.pending > 0}
          />
          <QuickActionCard
            icon="⚙️"
            title="Process Orders"
            description={`${stats.preparing} being prepared`}
            gradient="from-blue-500 to-cyan-500"
            onClick={() => setActiveTab('processing')}
          />
          <QuickActionCard
            icon="🚚"
            title="Manage Delivery"
            description={`${stats.ready} ready to deliver`}
            gradient="from-purple-500 to-pink-500"
            onClick={() => setActiveTab('delivery')}
            badge={stats.ready > 0}
          />
          <QuickActionCard
            icon="📋"
            title="Order History"
            description={`${stats.delivered} delivered`}
            gradient="from-green-500 to-emerald-500"
            onClick={() => setActiveTab('history')}
          />
        </div>
      </div>
    </div>

    {/* Performance */}
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
        <span className="mr-2">📈</span>
        Pharmacy Performance
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-3xl">✅</span>
            <span className="text-2xl font-bold text-green-600">
              {stats.total > 0 ? Math.round((stats.delivered / stats.total) * 100) : 0}%
            </span>
          </div>
          <p className="font-bold text-green-900">Delivery Rate</p>
          <p className="text-sm text-green-600">Orders delivered</p>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-6 border border-orange-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-3xl">📦</span>
            <span className="text-2xl font-bold text-orange-600">{stats.pending}</span>
          </div>
          <p className="font-bold text-orange-900">Pending</p>
          <p className="text-sm text-orange-600">Awaiting processing</p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-3xl">⚙️</span>
            <span className="text-2xl font-bold text-blue-600">{stats.preparing}</span>
          </div>
          <p className="font-bold text-blue-900">In Progress</p>
          <p className="text-sm text-blue-600">Being prepared</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-3xl">🚚</span>
            <span className="text-2xl font-bold text-purple-600">{stats.ready}</span>
          </div>
          <p className="font-bold text-purple-900">Ready</p>
          <p className="text-sm text-purple-600">For delivery</p>
        </div>
      </div>
    </div>
  </div>
);

const QuickActionCard = ({ icon, title, description, gradient, onClick, badge }) => (
  <button
    onClick={onClick}
    className="group relative overflow-hidden bg-white hover:shadow-xl border-2 border-gray-100 hover:border-transparent rounded-2xl p-6 text-left transition-all duration-300"
  >
    {badge && (
      <div className="absolute top-3 right-3 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
    )}
    <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity`}></div>
    <div className="relative z-10">
      <div className={`w-14 h-14 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center text-2xl mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <h4 className="font-bold text-gray-900 group-hover:text-white mb-1 transition-colors">{title}</h4>
      <p className="text-sm text-gray-600 group-hover:text-white/90 transition-colors">{description}</p>
    </div>
  </button>
);

export default PharmacyDashboard;