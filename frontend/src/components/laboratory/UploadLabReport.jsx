import { useState, useEffect } from 'react';
import { getLabReports, updateLabReport } from '../../services/labService';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';

const UploadLabReport = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    reportId: '',
    results: '',
    remarks: ''
  });

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const data = await getLabReports();
      // Only show in-progress reports
      const inProgress = (data.data || []).filter(r => r.status === 'in_progress');
      setReports(inProgress);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.reportId || !formData.results) {
      setError('Please select a test and enter results');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await updateLabReport(formData.reportId, {
        status: 'completed',
        results: formData.results,
        remarks: formData.remarks
      });
      
      setSuccess(true);
      setTimeout(() => {
        setFormData({ reportId: '', results: '', remarks: '' });
        setSuccess(false);
        fetchReports();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedReport = reports.find(r => r._id === formData.reportId);

  if (loading) return <LoadingSpinner message="Loading tests..." />;

  const commonResults = [
    { label: 'All parameters within normal range', value: 'All parameters are within normal reference ranges. No abnormalities detected.' },
    { label: 'Slightly elevated values', value: 'Some parameters show slightly elevated values. Please consult with your doctor for interpretation.' },
    { label: 'Abnormal values detected', value: 'Abnormal values detected. Further investigation recommended. Please consult with your doctor immediately.' }
  ];

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      {/* Success Message */}
      {success && (
        <div className="mb-6 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-2xl p-6 shadow-lg animate-slide-in">
          <div className="flex items-center">
            <span className="text-3xl mr-4">✅</span>
            <div>
              <h3 className="font-bold text-lg">Lab Report Uploaded Successfully!</h3>
              <p className="text-green-100">The patient and doctor have been notified about the results.</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-8 text-white">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-3xl shadow-lg">
              📤
            </div>
            <div>
              <h2 className="text-3xl font-bold">Upload Lab Results</h2>
              <p className="text-emerald-100 mt-1">Complete test processing and upload results</p>
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

          {reports.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">✨</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Pending Tests</h3>
              <p className="text-gray-600">All in-progress tests have been completed. Great work!</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Select Test */}
              <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-2xl p-6 border border-teal-100">
                <label className="block text-sm font-bold text-teal-900 mb-3">
                  <span className="mr-2">🧪</span>
                  Select In-Progress Test *
                </label>
                <select
                  name="reportId"
                  value={formData.reportId}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white border-2 border-teal-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent font-medium"
                  required
                >
                  <option value="">Choose test to complete...</option>
                  {reports.map(report => (
                    <option key={report._id} value={report._id}>
                      {report.patient?.name} - {report.testsRequested?.map(t => t.testName).join(', ')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selected Test Details */}
              {selectedReport && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100 animate-fade-in">
                  <h4 className="font-bold text-blue-900 mb-4 flex items-center">
                    <span className="mr-2">📋</span>
                    Test Details
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-blue-600 font-semibold mb-1">Patient</p>
                      <p className="text-sm font-bold text-blue-900">{selectedReport.patient?.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-blue-600 font-semibold mb-1">Age/Gender</p>
                      <p className="text-sm font-bold text-blue-900">{selectedReport.patient?.age} yrs, {selectedReport.patient?.gender}</p>
                    </div>
                    <div>
                      <p className="text-xs text-blue-600 font-semibold mb-1">Doctor</p>
                      <p className="text-sm font-bold text-blue-900">Dr. {selectedReport.doctor?.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-blue-600 font-semibold mb-1">Blood Group</p>
                      <p className="text-sm font-bold text-blue-900">{selectedReport.patient?.bloodGroup}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-blue-600 font-semibold mb-2">Tests Requested</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedReport.testsRequested?.map((test, idx) => (
                        <span key={idx} className="px-3 py-1.5 bg-white text-blue-700 rounded-lg text-sm font-medium border border-blue-200">
                          🧪 {test.testName}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Result Templates */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
                <p className="text-sm font-bold text-green-900 mb-4 flex items-center">
                  <span className="mr-2">⚡</span>
                  Quick Result Templates
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {commonResults.map((result, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFormData({ ...formData, results: result.value })}
                      className="bg-white hover:bg-green-50 border-2 border-green-200 hover:border-green-400 rounded-xl p-4 text-left transition-all group"
                    >
                      <p className="font-bold text-gray-900 text-sm group-hover:text-green-700 mb-1">{result.label}</p>
                      <p className="text-xs text-gray-500 line-clamp-2">{result.value}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Results */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  <span className="mr-2">📝</span>
                  Test Results *
                </label>
                <textarea
                  name="results"
                  value={formData.results}
                  onChange={handleChange}
                  className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none font-mono text-sm"
                  rows={10}
                  required
                  placeholder="Enter detailed test results here...

Example format:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TEST NAME: Complete Blood Count (CBC)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Parameter          | Result    | Reference Range
-------------------|-----------|------------------
Hemoglobin         | 14.5 g/dL | 12.0-16.0 g/dL
RBC Count          | 4.8 M/µL  | 4.0-5.5 M/µL
WBC Count          | 7500/µL   | 4000-11000/µL
Platelet Count     | 250000/µL | 150000-400000/µL

INTERPRETATION: All values within normal range."
                />
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  <span className="mr-2">💬</span>
                  Lab Technician Remarks
                </label>
                <textarea
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                  rows={3}
                  placeholder="Any additional observations or notes..."
                />
              </div>

              {/* Info Box */}
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-2xl p-6 border border-amber-200">
                <div className="flex items-start space-x-3">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <h4 className="font-bold text-amber-900 mb-2">Before Uploading</h4>
                    <ul className="text-sm text-amber-800 space-y-1">
                      <li>• Double-check all test results for accuracy</li>
                      <li>• Ensure patient details match the test samples</li>
                      <li>• Results will be immediately visible to patient and doctor</li>
                      <li>• This action cannot be undone</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4 pt-6">
                <button
                  type="submit"
                  disabled={submitting || !formData.reportId}
                  className="flex-1 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:via-teal-700 hover:to-cyan-700 text-white font-bold py-4 px-8 rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin h-6 w-6 mr-3" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Uploading Results...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <span className="mr-3 text-2xl">📤</span>
                      Upload & Complete Test
                    </span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadLabReport;