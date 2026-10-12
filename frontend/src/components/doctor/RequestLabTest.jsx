import { useState, useEffect } from 'react';
import { getAppointments } from '../../services/appointmentService';
import { createLabRequest } from '../../services/labService';
import { getLaboratories } from '../../services/userService';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';

const RequestLabTest = () => {
  const [appointments, setAppointments] = useState([]);
  const [laboratories, setLaboratories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    appointmentId: '',
    laboratoryId: '',
    testsRequested: [{ testName: '', testCode: '', description: '' }]
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [apptData, labData] = await Promise.all([
        getAppointments(),
        getLaboratories()
      ]);
      const validAppointments = (apptData.data || []).filter(a => 
        a.status === 'accepted' || a.status === 'completed'
      );
      setAppointments(validAppointments);
      setLaboratories(labData.data || []);
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleTestChange = (index, field, value) => {
    const newTests = [...formData.testsRequested];
    newTests[index][field] = value;
    setFormData({ ...formData, testsRequested: newTests });
  };

  const addTest = () => {
    setFormData({
      ...formData,
      testsRequested: [...formData.testsRequested, { testName: '', testCode: '', description: '' }]
    });
  };

  const removeTest = (index) => {
    if (formData.testsRequested.length > 1) {
      const newTests = formData.testsRequested.filter((_, i) => i !== index);
      setFormData({ ...formData, testsRequested: newTests });
    }
  };

  const quickAddTest = (testName, testCode = '') => {
    const emptyIndex = formData.testsRequested.findIndex(t => !t.testName);
    if (emptyIndex !== -1) {
      handleTestChange(emptyIndex, 'testName', testName);
      if (testCode) handleTestChange(emptyIndex, 'testCode', testCode);
    } else {
      setFormData({
        ...formData,
        testsRequested: [...formData.testsRequested, { testName, testCode, description: '' }]
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.appointmentId || !formData.laboratoryId) {
      setError('Please select patient and laboratory');
      return;
    }

    const validTests = formData.testsRequested.filter(t => t.testName);
    if (validTests.length === 0) {
      setError('Please add at least one test');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await createLabRequest({
        appointmentId: formData.appointmentId,
        laboratoryId: formData.laboratoryId,
        testsRequested: validTests
      });
      
      setSuccess(true);
      setTimeout(() => {
        setFormData({
          appointmentId: '',
          laboratoryId: '',
          testsRequested: [{ testName: '', testCode: '', description: '' }]
        });
        setSuccess(false);
        fetchData();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading data..." />;

  const commonTests = [
    { name: 'Complete Blood Count (CBC)', code: 'CBC001' },
    { name: 'Blood Sugar (Fasting)', code: 'BS001' },
    { name: 'Blood Sugar (Random)', code: 'BS002' },
    { name: 'Liver Function Test (LFT)', code: 'LFT001' },
    { name: 'Kidney Function Test (KFT)', code: 'KFT001' },
    { name: 'Thyroid Profile (T3, T4, TSH)', code: 'THY001' },
    { name: 'Lipid Profile', code: 'LIP001' },
    { name: 'Urine Routine & Microscopy', code: 'UR001' },
    { name: 'Stool Examination', code: 'ST001' },
    { name: 'X-Ray Chest', code: 'XR001' },
    { name: 'ECG (Electrocardiogram)', code: 'ECG001' },
    { name: 'Ultrasound Abdomen', code: 'US001' },
    { name: 'CT Scan', code: 'CT001' },
    { name: 'MRI Scan', code: 'MRI001' },
    { name: 'HbA1c (Glycated Hemoglobin)', code: 'HBA001' },
    { name: 'Vitamin D', code: 'VIT001' },
    { name: 'Vitamin B12', code: 'VIT002' },
    { name: 'Iron Studies', code: 'IRN001' }
  ];

  const testCategories = {
    'Blood Tests': ['Complete Blood Count (CBC)', 'Blood Sugar (Fasting)', 'Blood Sugar (Random)', 'HbA1c (Glycated Hemoglobin)', 'Lipid Profile'],
    'Organ Function': ['Liver Function Test (LFT)', 'Kidney Function Test (KFT)', 'Thyroid Profile (T3, T4, TSH)'],
    'Vitamins & Minerals': ['Vitamin D', 'Vitamin B12', 'Iron Studies'],
    'Body Fluids': ['Urine Routine & Microscopy', 'Stool Examination'],
    'Imaging': ['X-Ray Chest', 'ECG (Electrocardiogram)', 'Ultrasound Abdomen', 'CT Scan', 'MRI Scan']
  };

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      {/* Success Message */}
      {success && (
        <div className="mb-6 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-2xl p-6 shadow-lg animate-slide-in">
          <div className="flex items-center">
            <span className="text-3xl mr-4">✅</span>
            <div>
              <h3 className="font-bold text-lg">Lab Request Sent Successfully!</h3>
              <p className="text-green-100">The laboratory has been notified and will process the tests soon.</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 p-8 text-white">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-3xl shadow-lg">
              🔬
            </div>
            <div>
              <h2 className="text-3xl font-bold">Request Lab Test</h2>
              <p className="text-cyan-100 mt-1">Send diagnostic test requests to laboratory</p>
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
            {/* Select Patient & Laboratory */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                <label className="block text-sm font-bold text-blue-900 mb-3">
                  <span className="mr-2">👤</span>
                  Select Patient *
                </label>
                <select
                  name="appointmentId"
                  value={formData.appointmentId}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
                  required
                >
                  <option value="">Choose patient...</option>
                  {appointments.map(a => (
                    <option key={a._id} value={a._id}>
                      {a.patient?.name} - {new Date(a.appointmentDate).toLocaleDateString()}
                    </option>
                  ))}
                </select>
                {appointments.length === 0 && (
                  <p className="text-sm text-red-600 mt-2 flex items-center">
                    <span className="mr-2">⚠️</span>
                    No valid appointments available
                  </p>
                )}
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
                <label className="block text-sm font-bold text-purple-900 mb-3">
                  <span className="mr-2">🏥</span>
                  Select Laboratory *
                </label>
                <select
                  name="laboratoryId"
                  value={formData.laboratoryId}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white border-2 border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-medium"
                  required
                >
                  <option value="">Choose laboratory...</option>
                  {laboratories.map(l => (
                    <option key={l._id} value={l._id}>
                      {l.labName}
                    </option>
                  ))}
                </select>
                {laboratories.length === 0 && (
                  <p className="text-sm text-red-600 mt-2 flex items-center">
                    <span className="mr-2">⚠️</span>
                    No laboratories registered
                  </p>
                )}
              </div>
            </div>

            {/* Quick Add Common Tests - Categorized */}
            <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl p-6 border-2 border-cyan-100">
              <h3 className="text-lg font-bold text-cyan-900 mb-4 flex items-center">
                <span className="mr-2">⚡</span>
                Quick Add Common Tests
              </h3>
              <div className="space-y-4">
                {Object.entries(testCategories).map(([category, tests]) => (
                  <div key={category}>
                    <p className="text-xs font-bold text-cyan-800 mb-2 flex items-center">
                      <span className="w-2 h-2 bg-cyan-500 rounded-full mr-2"></span>
                      {category}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {tests.map((testName) => {
                        const testData = commonTests.find(t => t.name === testName);
                        return (
                          <button
                            key={testName}
                            type="button"
                            onClick={() => quickAddTest(testData.name, testData.code)}
                            className="group bg-white hover:bg-cyan-50 border-2 border-cyan-200 hover:border-cyan-400 rounded-xl px-4 py-2 text-sm font-medium text-gray-700 hover:text-cyan-700 transition-all shadow-sm hover:shadow-md"
                          >
                            <span className="group-hover:scale-110 inline-block transition-transform">+</span> {testName}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tests Requested */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900 flex items-center">
                  <span className="mr-2">🧪</span>
                  Tests Requested ({formData.testsRequested.filter(t => t.testName).length})
                </h3>
                <button
                  type="button"
                  onClick={addTest}
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-bold px-5 py-2.5 rounded-xl transition-all shadow-md hover:shadow-lg"
                >
                  + Add Custom Test
                </button>
              </div>

              <div className="space-y-4">
                {formData.testsRequested.map((test, index) => (
                  <div key={index} className="bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 rounded-2xl p-6 hover:border-cyan-300 transition-all">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-lg">
                          {index + 1}
                        </div>
                        <h4 className="font-bold text-gray-900">Test #{index + 1}</h4>
                      </div>
                      {formData.testsRequested.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTest(index)}
                          className="text-red-600 hover:text-red-700 font-bold text-sm bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg transition-all"
                        >
                          <span className="mr-1">🗑️</span>
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-2">
                          Test Name *
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., Complete Blood Count"
                          value={test.testName}
                          onChange={(e) => handleTestChange(index, 'testName', e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent font-medium"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-2">
                          Test Code
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., CBC001"
                          value={test.testCode}
                          onChange={(e) => handleTestChange(index, 'testCode', e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-2">
                          Description
                        </label>
                        <input
                          type="text"
                          placeholder="Additional details"
                          value={test.description}
                          onChange={(e) => handleTestChange(index, 'description', e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent font-medium"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {formData.testsRequested.filter(t => t.testName).length === 0 && (
                <div className="text-center py-8 bg-yellow-50 rounded-2xl border-2 border-yellow-200">
                  <p className="text-yellow-800 font-medium">
                    <span className="mr-2">⚠️</span>
                    No tests added yet. Use quick add buttons or add custom test.
                  </p>
                </div>
              )}
            </div>

            {/* Info Box */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-200">
              <div className="flex items-start space-x-3">
                <span className="text-2xl">💡</span>
                <div>
                  <h4 className="font-bold text-indigo-900 mb-2">Important Information</h4>
                  <ul className="text-sm text-indigo-800 space-y-1">
                    <li>• Lab will receive notification immediately after submission</li>
                    <li>• Patient will be informed about the test request</li>
                    <li>• You can track test results in the lab reports section</li>
                    <li>• Ensure patient is informed about any preparation needed</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-6">
              <button
                type="submit"
                disabled={submitting || appointments.length === 0 || laboratories.length === 0}
                className="flex-1 bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-700 hover:via-blue-700 hover:to-indigo-700 text-white font-bold py-4 px-8 rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-lg"
              >
                {submitting ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-6 w-6 mr-3" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending Request...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <span className="mr-3 text-2xl">🔬</span>
                    Send Lab Request
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

export default RequestLabTest;