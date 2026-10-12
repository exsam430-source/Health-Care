// src/pages/admin/Dashboard.jsx
import { useState, useEffect } from 'react';
import { 
  Users, 
  UserCheck, 
  Clock, 
  Building, 
  Stethoscope, 
  FlaskConical, 
  Pill,
  Activity,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Calendar
} from 'lucide-react';
import api from '../../services/api';

const StatCard = ({ title, value, icon: Icon, color, subtext }) => (
  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900 mt-1">{value}</h3>
        {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
      </div>
      <div className={`p-3 rounded-full ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </div>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await api.get('/admin/dashboard');
      setStats(response.data.data);
    } catch (err) {
      setError('Failed to load dashboard statistics');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Pending Approvals Alert */}
      {stats?.approvals?.totalPendingApprovals > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-r-lg">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
            <p className="text-yellow-700 font-medium">
              You have {stats.approvals.totalPendingApprovals} pending approval(s) waiting for review
            </p>
          </div>
        </div>
      )}

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Users"
          value={stats?.overview?.totalUsers || 0}
          icon={Users}
          color="bg-blue-500"
          subtext={`${stats?.overview?.activeUsers || 0} active`}
        />
        <StatCard
          title="Patients"
          value={stats?.overview?.totalPatients || 0}
          icon={UserCheck}
          color="bg-green-500"
        />
        <StatCard
          title="Doctors"
          value={stats?.overview?.totalDoctors || 0}
          icon={Stethoscope}
          color="bg-purple-500"
          subtext={`${stats?.approvals?.approvedDoctors || 0} approved`}
        />
        <StatCard
          title="Pending Approvals"
          value={stats?.approvals?.totalPendingApprovals || 0}
          icon={Clock}
          color="bg-orange-500"
        />
      </div>

      {/* Service Provider Stats */}
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Service Providers</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-full bg-purple-100">
              <Stethoscope className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-2xl font-bold text-gray-900">{stats?.overview?.totalDoctors || 0}</span>
          </div>
          <h3 className="font-medium text-gray-700">Doctors</h3>
          <div className="mt-2 flex items-center gap-4 text-sm">
            <span className="flex items-center text-green-600">
              <CheckCircle className="w-4 h-4 mr-1" />
              {stats?.approvals?.approvedDoctors || 0} Approved
            </span>
            <span className="flex items-center text-yellow-600">
              <Clock className="w-4 h-4 mr-1" />
              {stats?.approvals?.pendingDoctors || 0} Pending
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-full bg-blue-100">
              <FlaskConical className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-2xl font-bold text-gray-900">{stats?.overview?.totalLaboratories || 0}</span>
          </div>
          <h3 className="font-medium text-gray-700">Laboratories</h3>
          <div className="mt-2 flex items-center gap-4 text-sm">
            <span className="flex items-center text-green-600">
              <CheckCircle className="w-4 h-4 mr-1" />
              {stats?.approvals?.approvedLaboratories || 0} Approved
            </span>
            <span className="flex items-center text-yellow-600">
              <Clock className="w-4 h-4 mr-1" />
              {stats?.approvals?.pendingLaboratories || 0} Pending
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-full bg-green-100">
              <Pill className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-2xl font-bold text-gray-900">{stats?.overview?.totalPharmacies || 0}</span>
          </div>
          <h3 className="font-medium text-gray-700">Pharmacies</h3>
          <div className="mt-2 flex items-center gap-4 text-sm">
            <span className="flex items-center text-green-600">
              <CheckCircle className="w-4 h-4 mr-1" />
              {stats?.approvals?.approvedPharmacies || 0} Approved
            </span>
            <span className="flex items-center text-yellow-600">
              <Clock className="w-4 h-4 mr-1" />
              {stats?.approvals?.pendingPharmacies || 0} Pending
            </span>
          </div>
        </div>
      </div>

      {/* Activity Stats */}
      <h2 className="text-xl font-semibold text-gray-900 mb-4">System Activity</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-gray-700">Appointments</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats?.appointments?.total || 0}</p>
          <div className="mt-2 text-sm text-gray-500">
            <span className="text-green-600">{stats?.appointments?.completed || 0} completed</span>
            {' • '}
            <span className="text-yellow-600">{stats?.appointments?.pending || 0} pending</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="w-5 h-5 text-purple-600" />
            <span className="font-medium text-gray-700">Prescriptions</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats?.prescriptions?.total || 0}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <FlaskConical className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-gray-700">Lab Reports</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats?.labReports?.total || 0}</p>
          <p className="mt-2 text-sm text-yellow-600">{stats?.labReports?.pending || 0} pending</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <Pill className="w-5 h-5 text-green-600" />
            <span className="font-medium text-gray-700">Medicine Orders</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats?.medicineOrders?.total || 0}</p>
          <p className="mt-2 text-sm text-yellow-600">{stats?.medicineOrders?.pending || 0} pending</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Stats</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-800">New Registrations (7 days)</span>
            </div>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              {stats?.recentActivity?.recentRegistrations || 0}
            </p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-800">Active Users</span>
            </div>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {stats?.overview?.activeUsers || 0}
            </p>
          </div>
          <div className="p-4 bg-red-50 rounded-lg">
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <span className="font-medium text-red-800">Inactive Users</span>
            </div>
            <p className="text-3xl font-bold text-red-600 mt-2">
              {stats?.overview?.inactiveUsers || 0}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;