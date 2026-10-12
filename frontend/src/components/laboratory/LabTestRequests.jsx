import { useState, useEffect } from 'react';
import { getLabReports, updateLabReport } from '../../services/labService';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import EmptyState from '../common/EmptyState';
import StatusBadge from '../common/StatusBadge';
import Modal from '../common/Modal';

const LabTestRequests = ({ onUpdate }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = await getLabReports();
      setReports(data.data || []);
      if (onUpdate) onUpdate();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStartProcessing = async (reportId) => {
    try {
      setActionLoading(true);
      await updateLabReport(reportId, { status: 'in_progress' });
      showNotification('🔬 Test processing started!', 'success');
      fetchReports();
    } catch (err) {
      showNotification('Failed to update status', 'error');
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

  const viewDetails = (report) => {
    setSelectedReport(report);
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

  if (loading) return <LoadingSpinner message="Loading test requests..." />;
  if (error) return <ErrorMessage message={error} onRetry={fetchReports} />;

  const requestedReports = reports.filter(r => r.status === 'requested');
  const inProgressReports = reports.filter(r => r.status === 'in_progress');
  const completedReports = reports.filter(r => r.status === 'completed');

  const getFilteredReports = () => {
    switch(filter) {
      case 'requested': return requestedReports;
      case 'in_progress': return inProgressReports;
      case 'completed': return completedReports;
      default: return reports;
    }
  };

  const filteredReports = getFilteredReports();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          label="New Requests"
          value={requestedReports.length}
          icon="📥"
          gradient="from-orange-500 to-amber-500"
          onClick={() => setFilter('requested')}
          active={filter === 'requested'}
          pulse={requestedReports.length > 0}
        />
        <StatCard
          label="In Progress"
          value={inProgressReports.length}
          icon="🔬"
          gradient="from-blue-500 to-cyan-500"
          onClick={() => setFilter('in_progress')}
          active={filter === 'in_progress'}
        />
        <StatCard
          label="Completed"
          value={completedReports.length}
          icon="✅"
          gradient="from-green-500 to-emerald-500"
          onClick={() => setFilter('completed')}
          active={filter === 'completed'}
        />
        <StatCard
          label="Total Tests"
          value={reports.length}
          icon="📊"
          gradient="from-purple-500 to-pink-500"
          onClick={() => setFilter('all')}
          active={filter === 'all'}
        />
      </div>

      {/* Test Requests List */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-teal-50 to-cyan-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <span className="mr-2">
                  {filter === 'requested' ? '📥' : filter === 'in_progress' ? '🔬' : filter === 'completed' ? '✅' : '📋'}
                </span>
                {filter === 'all' ? 'All Test Requests' : 
                 filter === 'requested' ? 'New Test Requests' :
                 filter === 'in_progress' ? 'Tests In Progress' :
                 'Completed Tests'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">{filteredReports.length} test request{filteredReports.length !== 1 ? 's' : ''}</p>
            </div>
            {filter !== 'all' && (
              <button
                onClick={() => setFilter('all')}
                className="text-sm text-teal-600 hover:text-teal-700 font-bold bg-teal-50 hover:bg-teal-100 px-4 py-2 rounded-lg transition-all"
              >
                View All →
              </button>
            )}
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {filteredReports.length === 0 ? (
            <EmptyState
              icon={filter === 'requested' ? '✨' : '📭'}
              title={filter === 'requested' ? 'No Pending Requests' : 'No Test Requests'}
              message={filter === 'requested' ? 'All test requests have been processed' : 'No test requests found'}
            />
          ) : (
            filteredReports.map((report) => (
              <TestRequestCard
                key={report._id}
                report={report}
                onView={() => viewDetails(report)}
                onStartProcessing={() => handleStartProcessing(report._id)}
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
          setSelectedReport(null);
        }}
        title={
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center text-white text-lg">
              🧪
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Test Request Details</h3>
              <p className="text-sm text-gray-500">{selectedReport?.patient?.name}</p>
            </div>
          </div>
        }
        size="lg"
      >
        {selectedReport && (
          <TestRequestDetails
            report={selectedReport}
            formatDate={formatDate}
            onStartProcessing={() => {
              handleStartProcessing(selectedReport._id);
              setShowModal(false);
            }}
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

const TestRequestCard = ({ report, onView, onStartProcessing, formatDate, actionLoading }) => (
  <div className="p-6 hover:bg-gradient-to-r hover:from-gray-50 hover:to-teal-50/30 transition-all duration-200 group">
    <div className="flex items-start gap-4">
      {/* Patient Avatar */}
      <div className="flex-shrink-0">
        <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-lg group-hover:scale-110 transition-transform">
          {report.patient?.name?.charAt(0).toUpperCase()}
        </div>
      </div>

      {/* Request Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              {report.patient?.name}
            </h3>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span className="flex items-center">
                <span className="mr-1">👨‍⚕️</span>
                Dr. {report.doctor?.name}
              </span>
              <span className="flex items-center">
                <span className="mr-1">🧪</span>
                {report.testsRequested?.length || 0} test{report.testsRequested?.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
          <StatusBadge status={report.status} type="lab" />
        </div>

        {/* Tests */}
        <div className="flex flex-wrap gap-2 mb-4">
          {report.testsRequested?.slice(0, 3).map((test, idx) => (
            <span key={idx} className="px-3 py-1.5 bg-teal-50 text-teal-700 rounded-lg text-sm font-medium border border-teal-100">
              🧪 {test.testName}
            </span>
          ))}
          {report.testsRequested?.length > 3 && (
            <span className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium">
              +{report.testsRequested.length - 3} more
            </span>
          )}
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
          {report.status === 'requested' && (
            <button
              onClick={onStartProcessing}
              disabled={actionLoading}
              className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-medium py-2.5 px-4 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50"
            >
              <span className="mr-2">🔬</span>
              Start Processing
            </button>
          )}
          {report.status === 'in_progress' && (
            <button
              onClick={onView}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-medium py-2.5 px-4 rounded-xl transition-all shadow-md hover:shadow-lg"
            >
              <span className="mr-2">📤</span>
              Upload Results
            </button>
          )}
        </div>
      </div>
    </div>
  </div>
);

const TestRequestDetails = ({ report, formatDate, onStartProcessing, actionLoading }) => (
  <div className="space-y-6">
    {/* Patient Info */}
    <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-2xl p-6 border border-teal-100">
      <h4 className="font-bold text-teal-900 mb-4 flex items-center text-lg">
        <span className="mr-2">👤</span>
        Patient Information
      </h4>
      <div className="grid grid-cols-2 gap-4">
        <InfoRow label="Name" value={report.patient?.name} />
        <InfoRow label="Age" value={`${report.patient?.age} years`} />
        <InfoRow label="Gender" value={report.patient?.gender} />
        <InfoRow label="Blood Group" value={report.patient?.bloodGroup} />
        <InfoRow label="Phone" value={report.patient?.phone} className="col-span-2" />
      </div>
    </div>

    {/* Doctor Info */}
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
      <h4 className="font-bold text-blue-900 mb-4 flex items-center text-lg">
        <span className="mr-2">👨‍⚕️</span>
        Requesting Doctor
      </h4>
      <div className="grid grid-cols-2 gap-4">
        <InfoRow label="Doctor Name" value={`Dr. ${report.doctor?.name}`} />
        <InfoRow label="Specialization" value={report.doctor?.specialization} />
        <InfoRow label="Request Date" value={formatDate(report.createdAt)} />
        <div>
          <p className="text-xs text-gray-500 mb-1">Status</p>
          <StatusBadge status={report.status} type="lab" />
        </div>
      </div>
    </div>

    {/* Tests Requested */}
    <div>
      <h4 className="font-bold text-gray-900 mb-4 text-lg flex items-center">
        <span className="mr-2">🧪</span>
        Tests Requested ({report.testsRequested?.length || 0})
      </h4>
      <div className="space-y-3">
        {report.testsRequested?.map((test, idx) => (
          <div key={idx} className="bg-gradient-to-r from-gray-50 to-teal-50/30 rounded-xl p-4 border border-gray-200">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                  {idx + 1}
                </div>
                <div>
                  <h5 className="font-bold text-gray-900">{test.testName}</h5>
                  {test.testCode && (
                    <p className="text-xs text-gray-500">Code: {test.testCode}</p>
                  )}
                </div>
              </div>
            </div>
            {test.description && (
              <p className="text-sm text-gray-600 mt-2 ml-13">{test.description}</p>
            )}
          </div>
        ))}
      </div>
    </div>

    {/* Actions */}
    {report.status === 'requested' && (
      <button
        onClick={onStartProcessing}
        disabled={actionLoading}
        className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
      >
        {actionLoading ? '⏳ Processing...' : '🔬 Start Processing Tests'}
      </button>
    )}
  </div>
);

const InfoRow = ({ label, value, className = '' }) => (
  <div className={className}>
    <p className="text-xs text-gray-500 mb-1">{label}</p>
    <p className="text-sm font-semibold text-gray-900">{value}</p>
  </div>
);

export default LabTestRequests;