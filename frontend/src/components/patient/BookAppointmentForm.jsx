import { useState, useEffect } from 'react';
import { getDoctors } from '../../services/userService';
import { createAppointment } from '../../services/appointmentService';
import LoadingSpinner from '../common/LoadingSpinner';

const BookAppointmentForm = ({ prediction, symptoms, onSuccess, onCancel }) => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    doctor: '',
    appointmentDate: '',
    appointmentTime: '',
    notes: ''
  });

  useEffect(() => {
    fetchDoctors();
  }, [prediction]);

  const fetchDoctors = async () => {
    try {
      const specialization = prediction?.specialization || '';
      const data = await getDoctors(specialization);
      setDoctors(data.data || []);
    } catch (err) {
      setError('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.doctor || !formData.appointmentDate || !formData.appointmentTime) {
      setError('Please fill all required fields');
      return;
    }

    try {
      setSubmitting(true);
      await createAppointment({
        doctor: formData.doctor,
        symptoms: symptoms,
        aiPrediction: prediction ? {
          diseases: [prediction.disease],
          confidence: prediction.confidence,
          suggestedSpecialization: prediction.specialization
        } : null,
        appointmentDate: formData.appointmentDate,
        appointmentTime: formData.appointmentTime,
        notes: formData.notes
      });
      alert('✅ Appointment booked successfully!');
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to book appointment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading doctors..." />;

  // Get tomorrow's date for min date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* AI Prediction Summary */}
      {prediction && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">AI Prediction</h4>
          <p className="text-sm text-blue-800">
            <strong>{prediction.disease}</strong> - {prediction.confidence.toFixed(1)}% confidence
          </p>
          <p className="text-sm text-blue-700 mt-1">
            Recommended: {prediction.specialization}
          </p>
        </div>
      )}

      {/* Symptoms */}
      {symptoms && symptoms.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Your Symptoms</label>
          <div className="flex flex-wrap gap-2">
            {symptoms.map(s => (
              <span key={s} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                {s.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Doctor Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Doctor *
        </label>
        {doctors.length > 0 ? (
          <select
            name="doctor"
            value={formData.doctor}
            onChange={handleChange}
            className="input-field"
            required
          >
            <option value="">Choose a doctor...</option>
            {doctors.map(doc => (
              <option key={doc._id} value={doc._id}>
                Dr. {doc.name} - {doc.specialization} ({doc.experience} yrs exp)
              </option>
            ))}
          </select>
        ) : (
          <p className="text-sm text-red-600">No doctors available for this specialization</p>
        )}
      </div>

      {/* Date & Time */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Appointment Date *
          </label>
          <input
            type="date"
            name="appointmentDate"
            value={formData.appointmentDate}
            onChange={handleChange}
            min={minDate}
            className="input-field"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Appointment Time *
          </label>
          <select
            name="appointmentTime"
            value={formData.appointmentTime}
            onChange={handleChange}
            className="input-field"
            required
          >
            <option value="">Select time...</option>
            <option value="09:00">09:00 AM</option>
            <option value="10:00">10:00 AM</option>
            <option value="11:00">11:00 AM</option>
            <option value="12:00">12:00 PM</option>
            <option value="14:00">02:00 PM</option>
            <option value="15:00">03:00 PM</option>
            <option value="16:00">04:00 PM</option>
            <option value="17:00">05:00 PM</option>
          </select>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Additional Notes
        </label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows={3}
          className="input-field"
          placeholder="Any additional information for the doctor..."
        />
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={submitting || doctors.length === 0}
          className="flex-1 btn-primary py-3 disabled:opacity-50"
        >
          {submitting ? '⏳ Booking...' : '📅 Book Appointment'}
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary py-3 px-6">
          Cancel
        </button>
      </div>
    </form>
  );
};

export default BookAppointmentForm;