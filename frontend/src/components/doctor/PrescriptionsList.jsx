import { useState, useEffect } from 'react';
import { getPrescriptions } from '../../services/prescriptionService';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import EmptyState from '../common/EmptyState';
import Modal from '../common/Modal';

const DoctorPrescriptionsList = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      const data = await getPrescriptions();
      setPrescriptions(data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isValid = (validUntil) => {
    return new Date(validUntil) > new Date();
  };

  const filteredPrescriptions = prescriptions.filter(p => {
    if (filter === 'valid') return isValid(p.validUntil);
    if (filter === 'expired') return !isValid(p.validUntil);
    return true;
  });

  if (loading) return <LoadingSpinner message="Loading prescriptions..." />;
  if (error) return <ErrorMessage message={error} onRetry={fetchPrescriptions} />;

  if (prescriptions.length === 0) {
    return (
      <EmptyState
        icon="💊"
        title="No Prescriptions Created"
        message="You haven't created any prescriptions yet."
      />
    );
  }

  const validCount = prescriptions.filter(p => isValid(p.validUntil)).length;
  const expiredCount = prescriptions.filter(p => !isValid(p.validUntil)).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => setFilter('all')}
          className={`rounded-2xl p-6 text-left transition-all ${
            filter === 'all' 
              ? 'bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-lg' 
              : 'bg-white border border-gray-100 hover:shadow-md'
          }`}
        >
          <p className={`text-sm font-medium mb-2 ${filter === 'all' ? 'text-blue-100' : 'text-gray-600'}`}>
            Total Prescriptions
          </p>
          <p className={`text-4xl font-bold ${filter === 'all' ? 'text-white' : 'text-gray-900'}`}>
            {prescriptions.length}
          </p>
        </button>
        <button
          onClick={() => setFilter('valid')}
          className={`rounded-2xl p-6 text-left transition-all ${
            filter === 'valid' 
              ? 'bg-gradient-to-br from-green-500 to-emerald-500 text-white shadow-lg' 
              : 'bg-white border border-gray-100 hover:shadow-md'
          }`}
        >
          <p className={`text-sm font-medium mb-2 ${filter === 'valid' ? 'text-green-100' : 'text-gray-600'}`}>
            Valid Prescriptions
          </p>
          <p className={`text-4xl font-bold ${filter === 'valid' ? 'text-white' : 'text-gray-900'}`}>
            {validCount}
          </p>
        </button>
        <button
          onClick={() => setFilter('expired')}
          className={`rounded-2xl p-6 text-left transition-all ${
            filter === 'expired' 
              ? 'bg-gradient-to-br from-red-500 to-pink-500 text-white shadow-lg' 
              : 'bg-white border border-gray-100 hover:shadow-md'
          }`}
        >
          <p className={`text-sm font-medium mb-2 ${filter === 'expired' ? 'text-red-100' : 'text-gray-600'}`}>
            Expired
          </p>
          <p className={`text-4xl font-bold ${filter === 'expired' ? 'text-white' : 'text-gray-900'}`}>
            {expiredCount}
          </p>
        </button>
      </div>

      {/* Prescriptions List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-pink-50">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <span className="mr-2">💊</span>
            {filter === 'all' ? 'All Prescriptions' : 
             filter === 'valid' ? 'Valid Prescriptions' : 
             'Expired Prescriptions'}
            <span className="ml-3 text-sm font-normal text-gray-600">({filteredPrescriptions.length})</span>
          </h2>
        </div>

        <div className="divide-y divide-gray-100">
          {filteredPrescriptions.map((pres) => (
            <div key={pres._id} className="p-6 hover:bg-gray-50/50 transition-all group">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-lg ${
                    isValid(pres.validUntil) 
                      ? 'bg-gradient-to-br from-green-500 to-emerald-500' 
                      : 'bg-gradient-to-br from-gray-400 to-gray-500'
                  }`}>
                    💊
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-1">
                        {pres.patient?.name}
                      </h3>
                      <p className="text-sm text-gray-600">{pres.diagnosis}</p>
                    </div>
                    {isValid(pres.validUntil) ? (
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                        ✓ Valid
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">
                        ✗ Expired
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-6 text-sm text-gray-600 mb-4">
                    <span className="flex items-center">
                      <span className="mr-1">📅</span>
                      Created: {formatDate(pres.createdAt)}
                    </span>
                    <span className="flex items-center">
                      <span className="mr-1">⏰</span>
                      Valid until: {formatDate(pres.validUntil)}
                    </span>
                    <span className="flex items-center">
                      <span className="mr-1">💊</span>
                      {pres.medicines?.length || 0} medicines
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {pres.medicines?.slice(0, 4).map((med, idx) => (
                      <span key={idx} className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium border border-purple-100">
                        {med.medicineName}
                      </span>
                    ))}
                    {pres.medicines?.length > 4 && (
                      <span className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium">
                        +{pres.medicines.length - 4} more
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => setSelectedPrescription(pres)}
                    className="text-blue-600 hover:text-blue-700 font-bold text-sm bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition-all"
                  >
                    View Full Prescription →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Details Modal */}
      <Modal
        isOpen={!!selectedPrescription}
        onClose={() => setSelectedPrescription(null)}
        title={
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white text-lg">
              💊
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Prescription Details</h3>
              <p className="text-sm text-gray-500">{selectedPrescription?.patient?.name}</p>
            </div>
          </div>
        }
        size="lg"
      >
        {selectedPrescription && (
          <div className="space-y-6">
            {/* Patient & Date Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-xl p-4">
                <p className="text-xs text-blue-600 font-bold mb-1">Patient</p>
                <p className="font-bold text-blue-900">{selectedPrescription.patient?.name}</p>
              </div>
              <div className="bg-purple-50 rounded-xl p-4">
                <p className="text-xs text-purple-600 font-bold mb-1">Date Issued</p>
                <p className="font-bold text-purple-900">{formatDate(selectedPrescription.createdAt)}</p>
              </div>
              <div className="bg-green-50 rounded-xl p-4 col-span-2">
                <p className="text-xs text-green-600 font-bold mb-1">Diagnosis</p>
                <p className="font-bold text-green-900">{selectedPrescription.diagnosis}</p>
              </div>
            </div>

            {/* Medicines */}
            <div>
              <h4 className="font-bold text-gray-900 mb-4 text-lg flex items-center">
                <span className="mr-2">💊</span>
                Prescribed Medicines ({selectedPrescription.medicines?.length || 0})
              </h4>
              <div className="space-y-3">
                {selectedPrescription.medicines?.map((med, idx) => (
                  <div key={idx} className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-100">
                    <div className="flex items-start justify-between mb-3">
                      <h5 className="font-bold text-purple-900 text-lg">{med.medicineName}</h5>
                      <span className="px-3 py-1 bg-purple-200 text-purple-900 rounded-full text-xs font-bold">
                        #{idx + 1}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      <div className="bg-white rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1">Dosage</p>
                        <p className="font-bold text-gray-900">{med.dosage}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1">Frequency</p>
                        <p className="font-bold text-gray-900">{med.frequency}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1">Duration</p>
                        <p className="font-bold text-gray-900">{med.duration}</p>
                      </div>
                    </div>
                    {med.instructions && (
                      <div className="bg-white rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1">Instructions</p>
                        <p className="text-sm text-gray-700">{med.instructions}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Notes */}
            {selectedPrescription.additionalNotes && (
              <div className="bg-yellow-50 rounded-xl p-5 border border-yellow-200">
                <h4 className="font-bold text-yellow-900 mb-2 flex items-center">
                  <span className="mr-2">📝</span>
                  Additional Notes
                </h4>
                <p className="text-yellow-800">{selectedPrescription.additionalNotes}</p>
              </div>
            )}

            {/* Validity */}
            <div className={`rounded-xl p-5 border-2 ${
              isValid(selectedPrescription.validUntil)
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}>
              <p className={`font-bold mb-2 flex items-center ${
                isValid(selectedPrescription.validUntil) ? 'text-green-900' : 'text-red-900'
              }`}>
                <span className="mr-2">{isValid(selectedPrescription.validUntil) ? '✓' : '✗'}</span>
                {isValid(selectedPrescription.validUntil) ? 'Valid Until' : 'Expired On'}
              </p>
              <p className={`font-bold text-lg ${
                isValid(selectedPrescription.validUntil) ? 'text-green-900' : 'text-red-900'
              }`}>
                {formatDate(selectedPrescription.validUntil)}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DoctorPrescriptionsList;