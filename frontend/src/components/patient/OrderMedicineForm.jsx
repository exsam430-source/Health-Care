import { useState, useEffect } from 'react';
import { getPharmacies } from '../../services/userService';  // ✅ Correct import
import { createMedicineOrder } from '../../services/pharmacyService';
import LoadingSpinner from '../common/LoadingSpinner';

const OrderMedicineForm = ({ prescription, onSuccess, onCancel }) => {
  const [pharmacies, setPharmacies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    pharmacy: '',
    deliveryAddress: '',
    contactNumber: '',
    notes: ''
  });

  useEffect(() => {
    fetchPharmacies();
  }, []);

  const fetchPharmacies = async () => {
    try {
      const data = await getPharmacies();
      console.log('Pharmacies loaded:', data);  // Debug log
      setPharmacies(data.data || []);
    } catch (err) {
      console.error('Failed to load pharmacies:', err);
      setError('Failed to load pharmacies');
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

  if (!formData.pharmacy || !formData.deliveryAddress || !formData.contactNumber) {
    setError('Please fill all required fields');
    return;
  }

  try {
    setSubmitting(true);
    
    // ✅ Use correct field names that backend expects
    const orderData = {
      prescriptionId: prescription._id,    // ← Changed from 'prescription'
      pharmacyId: formData.pharmacy,       // ← Changed from 'pharmacy'
      medicines: prescription.medicines.map(m => ({
        medicineName: m.medicineName,
        quantity: parseInt(m.duration) || 1,
        dosage: m.dosage
      })),
      deliveryAddress: formData.deliveryAddress
    };

    console.log('Submitting order:', orderData);

    await createMedicineOrder(orderData);
    alert('✅ Medicine order placed successfully!');
    onSuccess();
  } catch (err) {
    console.error('Order error:', err);
    setError(err.response?.data?.message || 'Failed to place order');
  } finally {
    setSubmitting(false);
  }
};

  if (loading) return <LoadingSpinner message="Loading pharmacies..." />;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Prescription Summary */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl p-6">
        <h4 className="font-bold text-purple-900 mb-4 text-lg flex items-center space-x-2">
          <span>📋</span>
          <span>Prescription Summary</span>
        </h4>
        <div className="space-y-2">
          <p className="text-sm text-purple-800">
            <strong>Diagnosis:</strong> {prescription?.diagnosis}
          </p>
          <p className="text-sm text-purple-800">
            <strong>Doctor:</strong> Dr. {prescription?.doctor?.name}
          </p>
          <div>
            <p className="text-sm text-purple-800 font-semibold mb-2">Medicines:</p>
            <div className="flex flex-wrap gap-2">
              {prescription?.medicines?.map((med, idx) => (
                <span 
                  key={idx} 
                  className="px-3 py-1 bg-purple-200 text-purple-900 rounded-lg text-sm font-semibold"
                >
                  💊 {med.medicineName}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Select Pharmacy */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center space-x-2">
          <span>🏥</span>
          <span>Select Pharmacy *</span>
        </label>
        {pharmacies.length > 0 ? (
          <select
            name="pharmacy"
            value={formData.pharmacy}
            onChange={handleChange}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 outline-none transition-all"
            required
          >
            <option value="">Choose a pharmacy...</option>
            {pharmacies.map(pharm => (
              <option key={pharm._id} value={pharm._id}>
                {pharm.pharmacyName} - {pharm.phone}
              </option>
            ))}
          </select>
        ) : (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
            <p className="text-yellow-700 font-semibold">⚠️ No pharmacies available. Please register a pharmacy first.</p>
          </div>
        )}
      </div>

      {/* Delivery Address */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center space-x-2">
          <span>🏠</span>
          <span>Delivery Address *</span>
        </label>
        <textarea
          name="deliveryAddress"
          value={formData.deliveryAddress}
          onChange={handleChange}
          rows={3}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 outline-none transition-all"
          placeholder="Enter your complete delivery address..."
          required
        />
      </div>

      {/* Contact Number */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center space-x-2">
          <span>📱</span>
          <span>Contact Number *</span>
        </label>
        <input
          type="tel"
          name="contactNumber"
          value={formData.contactNumber}
          onChange={handleChange}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 outline-none transition-all"
          placeholder="Enter your contact number..."
          required
        />
      </div>

      {/* Additional Notes */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center space-x-2">
          <span>📝</span>
          <span>Additional Notes</span>
        </label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows={2}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 outline-none transition-all"
          placeholder="Any special delivery instructions..."
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
          <p className="text-red-700 font-semibold flex items-center space-x-2">
            <span>⚠️</span>
            <span>{error}</span>
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4 pt-4">
        <button
          type="submit"
          disabled={submitting || pharmacies.length === 0}
          className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
        >
          {submitting ? (
            <>
              <span className="animate-spin">⏳</span>
              <span>Placing Order...</span>
            </>
          ) : (
            <>
              <span>🛒</span>
              <span>Place Order</span>
            </>
          )}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default OrderMedicineForm;