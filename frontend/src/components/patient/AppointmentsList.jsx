import { useState, useEffect } from 'react';
import { getAppointments } from '../../services/appointmentService';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import EmptyState from '../common/EmptyState';
import StatusBadge from '../common/StatusBadge';

const AppointmentsList = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const data = await getAppointments();
      setAppointments(data.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load appointments');
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

  if (loading) return <LoadingSpinner message="Loading appointments..." />;
  if (error) return <ErrorMessage message={error} onRetry={fetchAppointments} />;

  if (appointments.length === 0) {
    return (
      <EmptyState 
        icon="📅" 
        title="No Appointments" 
        message="You haven't booked any appointments yet. Use AI Symptom Checker to get started!" 
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">My Appointments</h2>
          <p className="text-gray-600 mt-1">{appointments.length} appointment{appointments.length > 1 ? 's' : ''} scheduled</p>
        </div>
        <div className="bg-gradient-to-r from-blue-100 to-purple-100 px-6 py-3 rounded-full">
          <span className="text-2xl">📅</span>
        </div>
      </div>

      {appointments.map((apt) => (
        <div 
          key={apt._id} 
          className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 hover:border-blue-300 hover:shadow-2xl transition-all overflow-hidden"
        >
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4 border-b border-blue-100">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center space-x-2">
                  <span>👨‍⚕️</span>
                  <span>Dr. {apt.doctor?.name}</span>
                </h3>
                <p className="text-gray-600 font-medium">{apt.doctor?.specialization}</p>
              </div>
              <StatusBadge status={apt.status} type="appointment" />
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500 mb-1 flex items-center space-x-1">
                  <span>📅</span>
                  <span>Date</span>
                </p>
                <p className="text-sm font-bold text-gray-900">{formatDate(apt.appointmentDate)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1 flex items-center space-x-1">
                  <span>⏰</span>
                  <span>Time</span>
                </p>
                <p className="text-sm font-bold text-gray-900">{apt.appointmentTime}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1 flex items-center space-x-1">
                  <span>🩺</span>
                  <span>Symptoms</span>
                </p>
                <p className="text-sm font-bold text-gray-900">{apt.symptoms?.length || 0} reported</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1 flex items-center space-x-1">
                  <span>🤖</span>
                  <span>AI Prediction</span>
                </p>
                <p className="text-sm font-bold text-gray-900">
                  {apt.aiPrediction?.diseases?.[0] || 'N/A'}
                </p>
              </div>
            </div>

            {apt.diagnosis && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-5 border-2 border-green-200">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-xl">✅</span>
                  <p className="font-bold text-green-900">Doctor's Diagnosis</p>
                </div>
                <p className="text-green-800">{apt.diagnosis}</p>
              </div>
            )}

            {apt.rejectionReason && (
              <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-5 border-2 border-red-200">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-xl">❌</span>
                  <p className="font-bold text-red-900">Rejection Reason</p>
                </div>
                <p className="text-red-800">{apt.rejectionReason}</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default AppointmentsList;