import { useState, useEffect } from 'react';
import { getAppointments } from '../../services/appointmentService';
import { createPrescription } from '../../services/prescriptionService';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';

const CreatePrescription = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    appointmentId: '',
    diagnosis: '',
    additionalNotes: '',
    validUntil: '',
    medicines: [{ medicineName: '', dosage: '', frequency: '', duration: '', instructions: '' }]
  });

  useEffect(() => {
    fetchAppointments();
    const validDate = new Date();
    validDate.setDate(validDate.getDate() + 30);
    setFormData(prev => ({ ...prev, validUntil: validDate.toISOString().split('T')[0] }));
  }, []);

  const fetchAppointments = async () => {
    try {
      const data = await getAppointments();
      const completed = (data.data || []).filter(a => a.status === 'completed');
      setAppointments(completed);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleMedicineChange = (index, field, value) => {
    const updatedMedicines = [...formData.medicines];
    updatedMedicines[index][field] = value;
    setFormData({ ...formData, medicines: updatedMedicines });
  };

  const addMedicine = () => {
    setFormData({
      ...formData,
      medicines: [...formData.medicines, { medicineName: '', dosage: '', frequency: '', duration: '', instructions: '' }]
    });
  };

  const removeMedicine = (index) => {
    const updatedMedicines = formData.medicines.filter((_, i) => i !== index);
    setFormData({ ...formData, medicines: updatedMedicines });
  };

  const quickAddMedicine = (name, dosage, frequency, duration) => {
    const emptyIndex = formData.medicines.findIndex(m => !m.medicineName);
    if (emptyIndex !== -1) {
      const updatedMedicines = [...formData.medicines];
      updatedMedicines[emptyIndex] = { medicineName: name, dosage, frequency, duration, instructions: '' };
      setFormData({ ...formData, medicines: updatedMedicines });
    } else {
      setFormData({
        ...formData,
        medicines: [...formData.medicines, { medicineName: name, dosage, frequency, duration, instructions: '' }]
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.appointmentId || !formData.diagnosis) {
      setError('Please fill all required fields');
      return;
    }

    const validMedicines = formData.medicines.filter(m => m.medicineName && m.dosage);
    if (validMedicines.length === 0) {
      setError('Please add at least one medicine');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await createPrescription({
        appointmentId: formData.appointmentId,
        diagnosis: formData.diagnosis,
        medicines: validMedicines,
        additionalNotes: formData.additionalNotes,
        validUntil: formData.validUntil
      });
      
      setSuccess(true);
      setTimeout(() => {
        setFormData({
          appointmentId: '',
          diagnosis: '',
          additionalNotes: '',
          validUntil: '',
          medicines: [{ medicineName: '', dosage: '', frequency: '', duration: '', instructions: '' }]
        });
        setSuccess(false);
        fetchAppointments();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading appointments..." />;

  const commonMedicines = [
    { name: 'Paracetamol', dosage: '500mg', frequency: '3 times/day', duration: '5 days' },
    { name: 'Ibuprofen', dosage: '400mg', frequency: '2 times/day', duration: '3 days' },
    { name: 'Amoxicillin', dosage: '500mg', frequency: '3 times/day', duration: '7 days' },
    { name: 'Cetirizine', dosage: '10mg', frequency: '1 time/day', duration: '5 days' },
    { name: 'Omeprazole', dosage: '20mg', frequency: '1 time/day', duration: '14 days' },
    { name: 'Azithromycin', dosage: '500mg', frequency: '1 time/day', duration: '3 days' }
  ];

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      {/* Success Message */}
      {success && (
        <div className="mb-6 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-2xl p-6 shadow-lg animate-slide-in">
          <div className="flex items-center">
            <span className="text-3xl mr-4">✅</span>
            <div>
              <h3 className="font-bold text-lg">Prescription Created Successfully!</h3>
              <p className="text-green-100">The prescription has been saved and can be viewed by the patient.</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-8 text-white">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-3xl">
              💊
            </div>
            <div>
              <h2 className="text-3xl font-bold">Create Prescription</h2>
              <p className="text-purple-100 mt-1">Write digital prescription for completed appointments</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="p-8">
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
              <div className="flex items-center">
                <span className="text-2xl mr-3">❌</span>
                <p className="text-red-800 font-medium">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Select Appointment */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
              <label className="block text-sm font-bold text-blue-900 mb-3">
                <span className="mr-2">🗓️</span>
                Select Completed Appointment *
              </label>
              <select
                name="appointmentId"
                value={formData.appointmentId}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
                required
              >
                <option value="">Choose appointment...</option>
                {appointments.map(apt => (
                  <option key={apt._id} value={apt._id}>
                    {apt.patient?.name} - {new Date(apt.appointmentDate).toLocaleDateString()} - {apt.diagnosis}
                  </option>
                ))}
              </select>
              {appointments.length === 0 && (
                <p className="text-sm text-red-600 mt-2 flex items-center">
                  <span className="mr-2">⚠️</span>
                  No completed appointments available to create prescriptions
                </p>
              )}
            </div>

            {/* Diagnosis */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-3">
                <span className="mr-2">🔍</span>
                Diagnosis *
              </label>
              <textarea
                name="diagnosis"
                value={formData.diagnosis}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                rows={3}
                required
                placeholder="Enter detailed diagnosis..."
              />
            </div>

            {/* Quick Add Common Medicines */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
              <p className="text-sm font-bold text-green-900 mb-4 flex items-center">
                <span className="mr-2">⚡</span>
                Quick Add Common Medicines
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {commonMedicines.map((med, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => quickAddMedicine(med.name, med.dosage, med.frequency, med.duration)}
                    className="bg-white hover:bg-green-50 border-2 border-green-200 hover:border-green-400 rounded-xl p-3 text-left transition-all group"
                  >
                    <p className="font-bold text-gray-900 text-sm group-hover:text-green-700">{med.name}</p>
                    <p className="text-xs text-gray-600 mt-1">{med.dosage} • {med.frequency}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Medicines */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center">
                  <span className="mr-2">💊</span>
                  Medicines *
                </h3>
                <button
                  type="button"
                  onClick={addMedicine}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold px-4 py-2 rounded-xl transition-all shadow-md hover:shadow-lg"
                >
                  + Add Medicine
                </button>
              </div>

              <div className="space-y-4">
                {formData.medicines.map((medicine, index) => (
                  <div key={index} className="bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 rounded-2xl p-6 hover:border-purple-300 transition-all">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold text-gray-900 flex items-center">
                        <span className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white text-sm mr-3">
                          {index + 1}
                        </span>
                        Medicine {index + 1}
                      </h4>
                      {formData.medicines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeMedicine(index)}
                          className="text-red-600 hover:text-red-700 font-bold text-sm bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-all"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-2">Medicine Name *</label>
                        <input
                          type="text"
                          value={medicine.medicineName}
                          onChange={(e) => handleMedicineChange(index, 'medicineName', e.target.value)}
                          className="input-field"
                          placeholder="e.g., Paracetamol"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-2">Dosage *</label>
                        <input
                          type="text"
                          value={medicine.dosage}
                          onChange={(e) => handleMedicineChange(index, 'dosage', e.target.value)}
                          className="input-field"
                          placeholder="e.g., 500mg"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-2">Frequency *</label>
                        <input
                          type="text"
                          value={medicine.frequency}
                          onChange={(e) => handleMedicineChange(index, 'frequency', e.target.value)}
                          className="input-field"
                          placeholder="e.g., 3 times a day"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-2">Duration *</label>
                        <input
                          type="text"
                          value={medicine.duration}
                          onChange={(e) => handleMedicineChange(index, 'duration', e.target.value)}
                          className="input-field"
                          placeholder="e.g., 7 days"
                          required
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-gray-600 mb-2">Special Instructions</label>
                        <input
                          type="text"
                          value={medicine.instructions}
                          onChange={(e) => handleMedicineChange(index, 'instructions', e.target.value)}
                          className="input-field"
                          placeholder="e.g., Take after meals"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Notes */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-3">
                <span className="mr-2">📝</span>
                Additional Notes
              </label>
              <textarea
                name="additionalNotes"
                value={formData.additionalNotes}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                rows={3}
                placeholder="Any additional instructions, dietary advice, or follow-up information..."
              />
            </div>

            {/* Valid Until */}
            <div className="bg-yellow-50 rounded-2xl p-6 border border-yellow-200">
              <label className="block text-sm font-bold text-yellow-900 mb-3">
                <span className="mr-2">📅</span>
                Valid Until *
              </label>
              <input
                type="date"
                name="validUntil"
                value={formData.validUntil}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white border-2 border-yellow-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent font-medium"
                required
              />
              <p className="text-xs text-yellow-700 mt-2">⚠️ Prescription will be valid until this date</p>
            </div>

            {/* Submit */}
            <div className="flex gap-4 pt-6">
              <button
                type="submit"
                disabled={submitting || appointments.length === 0}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-4 px-8 rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-lg"
              >
                {submitting ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Prescription...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <span className="mr-2">💊</span>
                    Create Prescription
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreatePrescription;