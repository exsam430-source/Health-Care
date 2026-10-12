import { useState, useEffect } from 'react';
import { getLabReports } from '../../services/labService';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import EmptyState from '../common/EmptyState';
import StatusBadge from '../common/StatusBadge';

const LabReportsList = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const data = await getLabReports();
      setReports(data.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load lab reports');
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

  if (loading) return <LoadingSpinner message="Loading lab reports..." />;
  if (error) return <ErrorMessage message={error} onRetry={fetchReports} />;

  if (reports.length === 0) {
    return (
      <EmptyState 
        icon="🔬" 
        title="No Lab Reports" 
        message="You don't have any lab reports yet. Your doctor will order tests when needed." 
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">My Lab Reports</h2>
          <p className="text-gray-600 mt-1">{reports.length} report{reports.length > 1 ? 's' : ''} available</p>
        </div>
        <div className="bg-gradient-to-r from-blue-100 to-indigo-100 px-6 py-3 rounded-full">
          <span className="text-2xl">🔬</span>
        </div>
      </div>

      {reports.map((report) => (
        <div 
          key={report._id} 
          className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 hover:border-blue-300 hover:shadow-2xl transition-all overflow-hidden"
        >
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-blue-100">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center space-x-2">
                  <span>🧪</span>
                  <span>{report.testsRequested?.map(t => t.testName).join(', ')}</span>
                </h3>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <span>🏥</span>
                    <span>{report.laboratory?.labName}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span>📅</span>
                    <span>{formatDate(report.createdAt)}</span>
                  </div>
                </div>
              </div>
              <StatusBadge status={report.status} type="lab" />
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 mb-1 flex items-center space-x-1">
                  <span>👨‍⚕️</span>
                  <span>Requested By</span>
                </p>
                <p className="font-semibold text-gray-900">Dr. {report.doctor?.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1 flex items-center space-x-1">
                  <span>🧪</span>
                  <span>Number of Tests</span>
                </p>
                <p className="font-semibold text-gray-900">{report.testsRequested?.length || 0} tests</p>
              </div>
            </div>

            {report.status === 'completed' && report.results && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-5 border-2 border-green-200">
                <div className="flex items-center space-x-2 mb-3">
                  <span className="text-2xl">✅</span>
                  <p className="font-bold text-green-900 text-lg">Results Available</p>
                </div>
                <p className="text-green-800 leading-relaxed">{report.results}</p>
              </div>
            )}

            {report.status === 'pending' && (
              <div className="bg-yellow-50 rounded-xl p-4 border-2 border-yellow-200">
                <p className="text-yellow-800 flex items-center space-x-2">
                  <span className="text-xl animate-pulse">⏳</span>
                  <span>Tests are being processed. Results will be available soon.</span>
                </p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default LabReportsList;