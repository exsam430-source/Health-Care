import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import StatsCard from '../../components/common/StatsCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import LabTestRequests from '../../components/laboratory/LabTestRequests';
import UploadLabReport from '../../components/laboratory/UploadLabReport';
import LabReportsList from '../../components/laboratory/LabReportsList';
import { getLabReports } from '../../services/labService';

const LaboratoryDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    requested: 0,
    inProgress: 0,
    completed: 0,
    total: 0
  });
  const [loading, setLoading] = useState(true);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '🏠', color: 'teal' },
    { id: 'requests', label: 'Test Requests', icon: '📥', color: 'orange' },
    { id: 'upload', label: 'Upload Results', icon: '📤', color: 'green' },
    { id: 'reports', label: 'All Reports', icon: '📊', color: 'purple' }
  ];

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await getLabReports();
      const reports = data.data || [];
      setStats({
        requested: reports.filter(r => r.status === 'requested').length,
        inProgress: reports.filter(r => r.status === 'in_progress').length,
        completed: reports.filter(r => r.status === 'completed').length,
        total: reports.length
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
      case 'requests':
        return <LabTestRequests onUpdate={fetchStats} />;
      case 'upload':
        return <UploadLabReport />;
      case 'reports':
        return <LabReportsList />;
      default:
        return null;
    }
  };

  if (loading) return <LoadingSpinner message="Loading dashboard..." fullScreen />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-teal-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center space-x-4 mb-3">
            <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg">
              🔬
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome, {user.labName}! 🏥
              </h1>
              <p className="text-gray-600 mt-1">Laboratory Management Dashboard</p>
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
                    ? 'text-teal-600 bg-teal-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <span className="text-xl group-hover:scale-110 transition-transform">{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.id === 'requests' && stats.requested > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">
                    {stats.requested}
                  </span>
                )}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 to-cyan-500"></div>
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
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <StatsCard title="New Requests" value={stats.requested} icon="📥" color="orange" />
      <StatsCard title="In Progress" value={stats.inProgress} icon="🔬" color="blue" />
      <StatsCard title="Completed" value={stats.completed} icon="✅" color="green" />
      <StatsCard title="Total Tests" value={stats.total} icon="📊" color="purple" />
    </div>

    {/* Profile & Quick Actions */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Lab Profile Card */}
      <div className="bg-gradient-to-br from-teal-600 via-cyan-600 to-blue-600 rounded-2xl p-8 text-white shadow-xl">
        <h3 className="text-lg font-bold mb-6 flex items-center">
          <span className="mr-2">🏥</span>
          Laboratory Profile
        </h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-3xl font-bold shadow-lg">
              🔬
            </div>
            <div>
              <p className="font-bold text-xl">{user.labName}</p>
              <p className="text-teal-100">{user.email}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/20">
            <div>
              <p className="text-teal-200 text-xs mb-1">License No.</p>
              <p className="font-bold">{user.labLicense}</p>
            </div>
            <div>
              <p className="text-teal-200 text-xs mb-1">Phone</p>
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
            icon="📥"
            title="View Test Requests"
            description={`${stats.requested} new request${stats.requested !== 1 ? 's' : ''}`}
            gradient="from-orange-500 to-red-500"
            onClick={() => setActiveTab('requests')}
            badge={stats.requested > 0}
          />
          <QuickActionCard
            icon="📤"
            title="Upload Results"
            description={`${stats.inProgress} test${stats.inProgress !== 1 ? 's' : ''} in progress`}
            gradient="from-green-500 to-emerald-500"
            onClick={() => setActiveTab('upload')}
          />
          <QuickActionCard
            icon="🔬"
            title="In Progress Tests"
            description="View ongoing tests"
            gradient="from-blue-500 to-cyan-500"
            onClick={() => setActiveTab('requests')}
          />
          <QuickActionCard
            icon="📊"
            title="All Reports"
            description={`${stats.completed} completed`}
            gradient="from-purple-500 to-pink-500"
            onClick={() => setActiveTab('reports')}
          />
        </div>
      </div>
    </div>

    {/* Recent Activity Placeholder */}
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
        <span className="mr-2">📈</span>
        Laboratory Performance
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-3xl">✅</span>
            <span className="text-2xl font-bold text-green-600">
              {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
            </span>
          </div>
          <p className="font-bold text-green-900">Completion Rate</p>
          <p className="text-sm text-green-600">Tests completed successfully</p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-3xl">🔬</span>
            <span className="text-2xl font-bold text-blue-600">{stats.inProgress}</span>
          </div>
          <p className="font-bold text-blue-900">Active Tests</p>
          <p className="text-sm text-blue-600">Currently processing</p>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-6 border border-orange-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-3xl">⏳</span>
            <span className="text-2xl font-bold text-orange-600">{stats.requested}</span>
          </div>
          <p className="font-bold text-orange-900">Pending</p>
          <p className="text-sm text-orange-600">Awaiting processing</p>
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

export default LaboratoryDashboard;