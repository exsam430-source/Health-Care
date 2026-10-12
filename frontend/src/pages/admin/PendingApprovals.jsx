// src/pages/admin/PendingApprovals.jsx
import { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Stethoscope, 
  FlaskConical, 
  Pill, 
  User,
  Phone,
  Mail,
  Building,
  Award,
  Clock
} from 'lucide-react';
import api from '../../services/api';

const PendingApprovals = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [rejectModal, setRejectModal] = useState({ open: false, userId: null });
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchPendingApprovals();
  }, [filter]);

  const fetchPendingApprovals = async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? { role: filter } : {};
      const response = await api.get('/admin/pending-approvals', { params });
      setPendingUsers(response.data.data);
    } catch (err) {
      setError('Failed to load pending approvals');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId) => {
    try {
      setActionLoading(true);
      await api.put(`/admin/approve/${userId}`);
      setPendingUsers(pendingUsers.filter(user => user._id !== userId));
      alert('User approved successfully!');
    } catch (err) {
      alert('Failed to approve user');
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    try {
      setActionLoading(true);
      await api.put(`/admin/reject/${rejectModal.userId}`, { reason: rejectReason });
      setPendingUsers(pendingUsers.filter(user => user._id !== rejectModal.userId));
      setRejectModal({ open: false, userId: null });
      setRejectReason('');
      alert('User rejected');
    } catch (err) {
      alert('Failed to reject user');
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'doctor': return <Stethoscope className="w-5 h-5" />;
      case 'laboratory': return <FlaskConical className="w-5 h-5" />;
      case 'pharmacy': return <Pill className="w-5 h-5" />;
      default: return <User className="w-5 h-5" />;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'doctor': return 'bg-purple-100 text-purple-700';
      case 'laboratory': return 'bg-blue-100 text-blue-700';
      case 'pharmacy': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Pending Approvals</h1>
        <p className="text-gray-500 mt-1">Review and approve service provider registrations</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'all', label: 'All' },
          { key: 'doctor', label: 'Doctors' },
          { key: 'laboratory', label: 'Laboratories' },
          { key: 'pharmacy', label: 'Pharmacies' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === tab.key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {pendingUsers.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900">All caught up!</h3>
          <p className="text-gray-500 mt-2">No pending approvals at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {pendingUsers.map(user => (
            <div key={user._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Header */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-full ${getRoleColor(user.role)}`}>
                      {getRoleIcon(user.role)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">{user.name}</h3>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    {formatDate(user.createdAt)}
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="p-6 space-y-3">
                <div className="flex items-center gap-3 text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span>{user.phone}</span>
                </div>

                {/* Role-specific details */}
                {user.role === 'doctor' && (
                  <>
                    <div className="flex items-center gap-3 text-gray-600">
                      <Award className="w-4 h-4" />
                      <span>{user.specialization}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-600">
                      <Building className="w-4 h-4" />
                      <span>{user.qualification} • {user.experience} years exp.</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      License: {user.licenseNumber}
                    </div>
                  </>
                )}

                {user.role === 'laboratory' && (
                  <>
                    <div className="flex items-center gap-3 text-gray-600">
                      <Building className="w-4 h-4" />
                      <span>{user.labName}</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      License: {user.labLicense}
                    </div>
                  </>
                )}

                {user.role === 'pharmacy' && (
                  <>
                    <div className="flex items-center gap-3 text-gray-600">
                      <Building className="w-4 h-4" />
                      <span>{user.pharmacyName}</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      License: {user.pharmacyLicense}
                    </div>
                  </>
                )}
              </div>

              {/* Actions */}
              <div className="p-6 bg-gray-50 flex gap-3">
                <button
                  onClick={() => handleApprove(user._id)}
                  disabled={actionLoading}
                  className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  <CheckCircle className="w-5 h-5" />
                  Approve
                </button>
                <button
                  onClick={() => setRejectModal({ open: true, userId: user._id })}
                  disabled={actionLoading}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  <XCircle className="w-5 h-5" />
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Reject Application</h3>
            <p className="text-gray-600 mb-4">Please provide a reason for rejection:</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 h-32 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter rejection reason..."
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setRejectModal({ open: false, userId: null });
                  setRejectReason('');
                }}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading}
                className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingApprovals;