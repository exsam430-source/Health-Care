import { useState, useEffect } from 'react';
import { getPrescriptions } from '../../services/prescriptionService';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import EmptyState from '../common/EmptyState';
import Modal from '../common/Modal';
import OrderMedicineForm from './OrderMedicineForm';

const PrescriptionsList = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [prescriptionToOrder, setPrescriptionToOrder] = useState(null);

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      const data = await getPrescriptions();
      setPrescriptions(data.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load prescriptions');
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

  const handleOrderMedicine = (prescription) => {
    setPrescriptionToOrder(prescription);
    setShowOrderModal(true);
  };

  if (loading) return <LoadingSpinner message="Loading prescriptions..." />;
  if (error) return <ErrorMessage message={error} onRetry={fetchPrescriptions} />;

  if (prescriptions.length === 0) {
    return (
      <EmptyState 
        icon="💊" 
        title="No Prescriptions" 
        message="You don't have any prescriptions yet. Visit a doctor to get prescribed medicines." 
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">My Prescriptions</h2>
          <p className="text-gray-600 mt-1">{prescriptions.length} prescription{prescriptions.length > 1 ? 's' : ''} available</p>
        </div>
        <div className="bg-gradient-to-r from-purple-100 to-pink-100 px-6 py-3 rounded-full">
          <span className="text-2xl">💊</span>
        </div>
      </div>

      {prescriptions.map((pres) => (
        <div 
          key={pres._id} 
          className="group bg-white rounded-2xl shadow-lg border-2 border-gray-100 hover:border-purple-300 hover:shadow-2xl transition-all overflow-hidden"
        >
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-purple-100">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center space-x-2">
                  <span>📋</span>
                  <span>{pres.diagnosis}</span>
                </h3>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <span>👨‍⚕️</span>
                    <span>Dr. {pres.doctor?.name}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span>📅</span>
                    <span>{formatDate(pres.createdAt)}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedPrescription(pres)}
                className="bg-white hover:bg-purple-50 text-purple-600 px-4 py-2 rounded-xl font-semibold border-2 border-purple-200 hover:border-purple-400 transition-all flex items-center space-x-2"
              >
                <span>👁️</span>
                <span>View Details</span>
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-gray-600">Prescribed Medicines:</p>
              <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-bold">
                {pres.medicines?.length || 0} Items
              </span>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {pres.medicines?.slice(0, 4).map((med, idx) => (
                <span 
                  key={idx} 
                  className="px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-xl text-sm font-semibold border border-purple-200"
                >
                  💊 {med.medicineName}
                </span>
              ))}
              {pres.medicines?.length > 4 && (
                <span className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold">
                  +{pres.medicines.length - 4} more
                </span>
              )}
            </div>

            <button
              onClick={() => handleOrderMedicine(pres)}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all flex items-center justify-center space-x-3"
            >
              <span className="text-2xl">🛒</span>
              <span className="text-lg">Order These Medicines</span>
              <span className="text-2xl">→</span>
            </button>
          </div>
        </div>
      ))}

      {/* Prescription Detail Modal */}
      <Modal
        isOpen={!!selectedPrescription}
        onClose={() => setSelectedPrescription(null)}
        title="📋 Prescription Details"
        size="lg"
      >
        {selectedPrescription && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-purple-600 font-semibold mb-1">Doctor</p>
                  <p className="font-bold text-gray-900">Dr. {selectedPrescription.doctor?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-purple-600 font-semibold mb-1">Date</p>
                  <p className="font-bold text-gray-900">{formatDate(selectedPrescription.createdAt)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-purple-600 font-semibold mb-1">Diagnosis</p>
                  <p className="font-bold text-gray-900">{selectedPrescription.diagnosis}</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 mb-4 text-xl flex items-center space-x-2">
                <span>💊</span>
                <span>Prescribed Medicines</span>
              </h4>
              <div className="space-y-4">
                {selectedPrescription.medicines?.map((med, idx) => (
                  <div 
                    key={idx} 
                    className="bg-gradient-to-r from-gray-50 to-purple-50 rounded-xl p-5 border-2 border-gray-200 hover:border-purple-300 transition-all"
                  >
                    <h5 className="font-bold text-gray-900 text-lg mb-3">{med.medicineName}</h5>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500 block mb-1">💊 Dosage</span>
                        <span className="font-semibold text-gray-900">{med.dosage}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block mb-1">⏰ Frequency</span>
                        <span className="font-semibold text-gray-900">{med.frequency}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block mb-1">📅 Duration</span>
                        <span className="font-semibold text-gray-900">{med.duration}</span>
                      </div>
                    </div>
                    {med.instructions && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-sm text-gray-600"><strong>Instructions:</strong> {med.instructions}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {selectedPrescription.additionalNotes && (
              <div className="bg-yellow-50 rounded-xl p-4 border-2 border-yellow-200">
                <h4 className="font-bold text-yellow-900 mb-2 flex items-center space-x-2">
                  <span>📝</span>
                  <span>Additional Notes</span>
                </h4>
                <p className="text-yellow-800">{selectedPrescription.additionalNotes}</p>
              </div>
            )}

            <button
              onClick={() => {
                setSelectedPrescription(null);
                handleOrderMedicine(selectedPrescription);
              }}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center space-x-3"
            >
              <span className="text-2xl">🛒</span>
              <span className="text-lg">Order These Medicines</span>
            </button>
          </div>
        )}
      </Modal>

      {/* Order Medicine Modal */}
      <Modal
        isOpen={showOrderModal}
        onClose={() => setShowOrderModal(false)}
        title="🛒 Order Medicines"
        size="lg"
      >
        <OrderMedicineForm
          prescription={prescriptionToOrder}
          onSuccess={() => {
            setShowOrderModal(false);
            setPrescriptionToOrder(null);
          }}
          onCancel={() => setShowOrderModal(false)}
        />
      </Modal>
    </div>
  );
};

export default PrescriptionsList;