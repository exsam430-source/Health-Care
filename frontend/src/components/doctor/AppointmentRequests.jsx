import { useState, useEffect } from 'react';
import { getAppointments, updateAppointmentStatus } from '../../services/appointmentService';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import EmptyState from '../common/EmptyState';
import StatusBadge from '../common/StatusBadge';
import Modal from '../common/Modal';

const AppointmentRequests = ({ onUpdate }) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const data = await getAppointments();
      setAppointments(data.data || []);
      if (onUpdate) onUpdate();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (appointmentId, status, reason = '') => {
    try {
      setActionLoading(true);
      await updateAppointmentStatus(appointmentId, {
        status,
        rejectionReason: reason,
        diagnosis: status === 'completed' ? reason : undefined,
        doctorNotes: reason
      });
      
      // Show success notification
      const statusText = status === 'accepted' ? 'accepted' : 
                        status === 'rejected' ? 'rejected' : 'completed';
      showNotification(`✅ Appointment ${statusText} successfully!`, 'success');
      
      fetchAppointments();
      setShowDetailsModal(false);
      setSelectedAppointment(null);
    } catch (err) {
      showNotification(`❌ ${err.message}`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const showNotification = (message, type) => {
    // You can replace this with a toast library like react-hot-toast
    const color = type === 'success' ? 'bg-green-500' : 'bg-red-500';
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 ${color} text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-in`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  };

  const viewDetails = (appointment) => {
    setSelectedAppointment(appointment);
    setShowDetailsModal(true);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) return <LoadingSpinner message="Loading appointments..." />;
  if (error) return <ErrorMessage message={error} onRetry={fetchAppointments} />;

  const pendingAppointments = appointments.filter(a => a.status === 'pending');
  const upcomingAppointments = appointments.filter(a => a.status === 'accepted');
  const completedAppointments = appointments.filter(a => a.status === 'completed');
  const allAppointments = [...pendingAppointments, ...upcomingAppointments, ...completedAppointments];

  const getFilteredAppointments = () => {
    switch(filter) {
      case 'pending': return pendingAppointments;
      case 'upcoming': return upcomingAppointments;
      case 'completed': return completedAppointments;
      default: return allAppointments;
    }
  };

  const filteredAppointments = getFilteredAppointments();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard 
          label="Pending" 
          value={pendingAppointments.length} 
          icon="⏳" 
          gradient="from-orange-500 to-amber-500"
          onClick={() => setFilter('pending')}
          active={filter === 'pending'}
        />
        <StatCard 
          label="Upcoming" 
          value={upcomingAppointments.length} 
          icon="📅" 
          gradient="from-blue-500 to-cyan-500"
          onClick={() => setFilter('upcoming')}
          active={filter === 'upcoming'}
        />
        <StatCard 
          label="Completed" 
          value={completedAppointments.length} 
          icon="✅" 
          gradient="from-green-500 to-emerald-500"
          onClick={() => setFilter('completed')}
          active={filter === 'completed'}
        />
        <StatCard 
          label="Total" 
          value={allAppointments.length} 
          icon="📊" 
          gradient="from-purple-500 to-pink-500"
          onClick={() => setFilter('all')}
          active={filter === 'all'}
        />
      </div>

      {/* Appointments List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {filter === 'all' ? '📋 All Appointments' : 
                 filter === 'pending' ? '⏳ Pending Requests' :
                 filter === 'upcoming' ? '📅 Upcoming Appointments' :
                 '✅ Completed Appointments'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {filteredAppointments.length} appointment{filteredAppointments.length !== 1 ? 's' : ''}
              </p>
            </div>
            {filter !== 'all' && (
              <button
                onClick={() => setFilter('all')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View All →
              </button>
            )}
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {filteredAppointments.length === 0 ? (
            <EmptyState
              icon={filter === 'pending' ? '✅' : '📭'}
              title={filter === 'pending' ? 'All Caught Up!' : 'No Appointments'}
              message={filter === 'pending' ? 'No pending appointment requests' : 'No appointments found'}
            />
          ) : (
            filteredAppointments.map((apt) => (
              <AppointmentCard
                key={apt._id}
                appointment={apt}
                onView={() => viewDetails(apt)}
                onAccept={() => handleAction(apt._id, 'accepted')}
                onReject={() => viewDetails(apt)}
                showActions={apt.status === 'pending'}
                formatDate={formatDate}
              />
            ))
          )}
        </div>
      </div>

      {/* Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedAppointment(null);
        }}
        title={
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center text-white text-lg">
              📋
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Appointment Details</h3>
              <p className="text-sm text-gray-500">{selectedAppointment?.patient?.name}</p>
            </div>
          </div>
        }
        size="lg"
      >
        {selectedAppointment && (
          <AppointmentDetails
            appointment={selectedAppointment}
            onAccept={() => handleAction(selectedAppointment._id, 'accepted')}
            onReject={(reason) => handleAction(selectedAppointment._id, 'rejected', reason)}
            onComplete={(diagnosis) => handleAction(selectedAppointment._id, 'completed', diagnosis)}
            loading={actionLoading}
            formatDate={formatDate}
          />
        )}
      </Modal>
    </div>
  );
};

const StatCard = ({ label, value, icon, gradient, onClick, active }) => (
  <button
    onClick={onClick}
    className={`group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 ${
      active 
        ? 'bg-gradient-to-br shadow-lg scale-105' 
        : 'bg-white hover:shadow-lg hover:scale-102 border border-gray-100'
    } ${active ? gradient : ''}`}
  >
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

const AppointmentCard = ({ appointment, onView, onAccept, onReject, showActions, formatDate }) => (
  <div className="p-6 hover:bg-gray-50/50 transition-all duration-200 group">
    <div className="flex items-start gap-4">
      {/* Patient Avatar */}
      <div className="flex-shrink-0">
        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-lg group-hover:scale-110 transition-transform">
          {appointment.patient?.name?.charAt(0).toUpperCase()}
        </div>
      </div>

      {/* Appointment Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              {appointment.patient?.name}
            </h3>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span className="flex items-center">
                <span className="mr-1">👤</span>
                {appointment.patient?.age} yrs, {appointment.patient?.gender}
              </span>
              <span className="flex items-center">
                <span className="mr-1">🩸</span>
                {appointment.patient?.bloodGroup}
              </span>
            </div>
          </div>
          <StatusBadge status={appointment.status} type="appointment" />
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <DetailItem icon="📅" label="Date" value={formatDate(appointment.appointmentDate)} />
          <DetailItem icon="🕐" label="Time" value={appointment.appointmentTime} />
          <DetailItem icon="🤒" label="Symptoms" value={`${appointment.symptoms?.length || 0} reported`} />
          <DetailItem 
            icon="🤖" 
            label="AI Prediction" 
            value={appointment.aiPrediction?.diseases?.[0] || 'N/A'}
            highlight={true}
          />
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
          {showActions && (
            <>
              <button 
                onClick={onAccept} 
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-medium py-2.5 px-4 rounded-xl transition-all shadow-md hover:shadow-lg"
              >
                <span className="mr-2">✓</span>
                Accept
              </button>
              <button 
                onClick={onReject} 
                className="flex-1 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-medium py-2.5 px-4 rounded-xl transition-all shadow-md hover:shadow-lg"
              >
                <span className="mr-2">✗</span>
                Reject
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  </div>
);

const DetailItem = ({ icon, label, value, highlight }) => (
  <div>
    <p className="text-xs text-gray-500 mb-1 flex items-center">
      <span className="mr-1">{icon}</span>
      {label}
    </p>
    <p className={`text-sm font-semibold ${highlight ? 'text-blue-600' : 'text-gray-900'}`}>
      {value}
    </p>
  </div>
);

const AppointmentDetails = ({ appointment, onAccept, onReject, onComplete, loading, formatDate }) => {
  const [rejectReason, setRejectReason] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showCompleteForm, setShowCompleteForm] = useState(false);

  return (
    <div className="space-y-6">
      {/* Patient Info Card */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
        <h4 className="font-bold text-blue-900 mb-4 flex items-center text-lg">
          <span className="mr-2">👤</span>
          Patient Information
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <InfoRow label="Name" value={appointment.patient?.name} />
          <InfoRow label="Age" value={`${appointment.patient?.age} years`} />
          <InfoRow label="Gender" value={appointment.patient?.gender} />
          <InfoRow label="Blood Group" value={appointment.patient?.bloodGroup} />
          <InfoRow label="Phone" value={appointment.patient?.phone} className="col-span-2" />
          <InfoRow label="Email" value={appointment.patient?.email} className="col-span-2" />
        </div>
      </div>

      {/* Appointment Details */}
      <div className="bg-gray-50 rounded-2xl p-6">
        <h4 className="font-bold text-gray-900 mb-4 flex items-center text-lg">
          <span className="mr-2">📋</span>
          Appointment Details
        </h4>
        <div className="grid grid-cols-3 gap-4">
          <InfoRow label="Date" value={formatDate(appointment.appointmentDate)} />
          <InfoRow label="Time" value={appointment.appointmentTime} />
          <div>
            <p className="text-xs text-gray-500 mb-1">Status</p>
            <StatusBadge status={appointment.status} />
          </div>
        </div>
      </div>

      {/* Symptoms */}
      <div>
        <h4 className="font-bold text-gray-900 mb-4 flex items-center text-lg">
          <span className="mr-2">🤒</span>
          Reported Symptoms ({appointment.symptoms?.length || 0})
        </h4>
        <div className="flex flex-wrap gap-2">
          {appointment.symptoms?.map((symptom, idx) => (
            <span key={idx} className="px-4 py-2 bg-red-100 text-red-700 rounded-xl text-sm font-medium">
              {symptom.replace(/_/g, ' ')}
            </span>
          ))}
        </div>
      </div>

      {/* AI Prediction */}
      {appointment.aiPrediction && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
          <h4 className="font-bold text-purple-900 mb-4 flex items-center text-lg">
            <span className="mr-2">🤖</span>
            AI Prediction
          </h4>
          <div className="space-y-3">
            <InfoRow label="Predicted Diseases" value={appointment.aiPrediction.diseases?.join(', ')} />
            <InfoRow label="Confidence" value={`${appointment.aiPrediction.confidence}%`} />
            <InfoRow label="Suggested Specialization" value={appointment.aiPrediction.suggestedSpecialization} />
          </div>
        </div>
      )}

      {/* Actions */}
      {appointment.status === 'pending' && !showRejectForm && (
        <div className="flex gap-4 pt-4">
          <button
            onClick={onAccept}
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
          >
            {loading ? '⏳ Processing...' : '✓ Accept Appointment'}
          </button>
          <button
            onClick={() => setShowRejectForm(true)}
            className="flex-1 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-xl"
          >
            ✗ Reject
          </button>
        </div>
      )}

      {/* Reject Form */}
      {showRejectForm && (
        <div className="bg-red-50 rounded-2xl p-6 border-2 border-red-200 animate-fade-in">
          <label className="block text-sm font-bold text-red-900 mb-3">
            Rejection Reason *
          </label>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="w-full px-4 py-3 border-2 border-red-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
            rows={4}
            placeholder="Provide a clear reason for rejection..."
          />
          <div className="flex gap-4 mt-4">
            <button
              onClick={() => onReject(rejectReason)}
              disabled={!rejectReason || loading}
              className="flex-1 bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirm Rejection
            </button>
            <button onClick={() => setShowRejectForm(false)} className="btn-secondary py-3 px-6">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Complete Appointment */}
      {appointment.status === 'accepted' && !showCompleteForm && (
        <button
          onClick={() => setShowCompleteForm(true)}
          className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-xl"
        >
          ✓ Mark as Completed
        </button>
      )}

      {showCompleteForm && (
        <div className="bg-green-50 rounded-2xl p-6 border-2 border-green-200 animate-fade-in">
          <label className="block text-sm font-bold text-green-900 mb-3">
            Diagnosis & Treatment Notes *
          </label>
          <textarea
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            className="w-full px-4 py-3 border-2 border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
            rows={5}
            placeholder="Enter detailed diagnosis and treatment notes..."
          />
          <div className="flex gap-4 mt-4">
            <button
              onClick={() => onComplete(diagnosis)}
              disabled={!diagnosis || loading}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold py-3 rounded-xl disabled:opacity-50"
            >
              Complete Appointment
            </button>
            <button onClick={() => setShowCompleteForm(false)} className="btn-secondary py-3 px-6">
              Cancel
            </button>
          </div>
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

export default AppointmentRequests;