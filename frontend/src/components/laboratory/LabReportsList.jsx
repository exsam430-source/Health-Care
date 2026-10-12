import { useState, useEffect } from 'react';
import { getLabReports } from '../../services/labService';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import EmptyState from '../common/EmptyState';
import StatusBadge from '../common/StatusBadge';
import Modal from '../common/Modal';

const LabReportsList = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const data = await getLabReports();
      setReports(data.data || []);
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

  const formatDateTime = (date) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredReports = reports
    .filter(r => {
      if (filter === 'completed') return r.status === 'completed';
      if (filter === 'pending') return r.status !== 'completed';
      return true;
    })
    .filter(r => {
      if (!search) return true;
      const searchLower = search.toLowerCase();
      return (
        r.patient?.name?.toLowerCase().includes(searchLower) ||
        r.doctor?.name?.toLowerCase().includes(searchLower) ||
        r.testsRequested?.some(t => t.testName.toLowerCase().includes(searchLower))
      );
    });

  if (loading) return <LoadingSpinner message="Loading reports..." />;
  if (error) return <ErrorMessage message={error} onRetry={fetchReports} />;

  const completedCount = reports.filter(r => r.status === 'completed').length;
  const pendingCount = reports.filter(r => r.status !== 'completed').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => setFilter('all')}
          className={`rounded-2xl p-6 text-left transition-all ${
            filter === 'all' 
              ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg' 
              : 'bg-white border border-gray-100 hover:shadow-md'
          }`}
        >
          <p className={`text-sm font-medium mb-2 ${filter === 'all' ? 'text-purple-100' : 'text-gray-600'}`}>
            All Reports
          </p>
          <p className={`text-4xl font-bold ${filter === 'all' ? 'text-white' : 'text-gray-900'}`}>
            {reports.length}
          </p>
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`rounded-2xl p-6 text-left transition-all ${
            filter === 'completed' 
              ? 'bg-gradient-to-br from-green-500 to-emerald-500 text-white shadow-lg' 
              : 'bg-white border border-gray-100 hover:shadow-md'
          }`}
        >
          <p className={`text-sm font-medium mb-2 ${filter === 'completed' ? 'text-green-100' : 'text-gray-600'}`}>
            Completed
          </p>
          <p className={`text-4xl font-bold ${filter === 'completed' ? 'text-white' : 'text-gray-900'}`}>
            {completedCount}
          </p>
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`rounded-2xl p-6 text-left transition-all ${
            filter === 'pending' 
              ? 'bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-lg' 
              : 'bg-white border border-gray-100 hover:shadow-md'
          }`}
        >
          <p className={`text-sm font-medium mb-2 ${filter === 'pending' ? 'text-orange-100' : 'text-gray-600'}`}>
            Pending
          </p>
          <p className={`text-4xl font-bold ${filter === 'pending' ? 'text-white' : 'text-gray-900'}`}>
            {pendingCount}
          </p>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="relative">
          <input
            type="text"
            placeholder="🔍 Search by patient name, doctor, or test name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-3 pl-12 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent font-medium"
          />
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-teal-50">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <span className="mr-2">📊</span>
            Lab Reports History
            <span className="ml-3 text-sm font-normal text-gray-600">({filteredReports.length})</span>
          </h2>
        </div>

        <div className="divide-y divide-gray-100">
          {filteredReports.length === 0 ? (
            <EmptyState
              icon="📭"
              title="No Reports Found"
              message={search ? "Try different search terms" : "No lab reports found"}
            />
          ) : (
            filteredReports.map((report) => (
              <div key={report._id} className="p-6 hover:bg-gradient-to-r hover:from-gray-50 hover:to-teal-50/30 transition-all">
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-lg ${
                    report.status === 'completed'
                      ? 'bg-gradient-to-br from-green-500 to-emerald-500'
                      : report.status === 'in_progress'
                      ? 'bg-gradient-to-br from-blue-500 to-cyan-500'
                      : 'bg-gradient-to-br from-orange-500 to-amber-500'
                  }`}>
                    {report.status === 'completed' ? '✅' : report.status === 'in_progress' ? '🔬' : '📥'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{report.patient?.name}</h3>
                        <p className="text-sm text-gray-600">Dr. {report.doctor?.name} • {formatDate(report.createdAt)}</p>
                      </div>
                      <StatusBadge status={report.status} type="lab" />
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                      {report.testsRequested?.map((test, idx) => (
                        <span key={idx} className="px-3 py-1 bg-teal-50 text-teal-700 rounded-lg text-sm font-medium">
                          {test.testName}
                        </span>
                      ))}
                    </div>

                    {report.status === 'completed' && (
                      <button
                        onClick={() => setSelectedReport(report)}
                        className="text-teal-600 hover:text-teal-700 font-bold text-sm bg-teal-50 hover:bg-teal-100 px-4 py-2 rounded-lg transition-all"
                      >
                        View Results →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Details Modal */}
      <Modal
        isOpen={!!selectedReport}
        onClose={() => setSelectedReport(null)}
        title={
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center text-white text-lg">
              📊
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Lab Report Results</h3>
              <p className="text-sm text-gray-500">{selectedReport?.patient?.name}</p>
            </div>
          </div>
        }
        size="lg"
      >
        {selectedReport && (
          <div className="space-y-6">
            {/* Patient & Doctor Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-teal-50 rounded-xl p-4 border border-teal-100">
                <p className="text-xs text-teal-600 font-bold mb-2">Patient</p>
                <p className="font-bold text-teal-900">{selectedReport.patient?.name}</p>
                <p className="text-sm text-teal-700">{selectedReport.patient?.age} yrs, {selectedReport.patient?.gender}</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <p className="text-xs text-blue-600 font-bold mb-2">Requested By</p>
                <p className="font-bold text-blue-900">Dr. {selectedReport.doctor?.name}</p>
                <p className="text-sm text-blue-700">{selectedReport.doctor?.specialization}</p>
              </div>
            </div>

            {/* Tests */}
            <div>
              <h4 className="font-bold text-gray-900 mb-3 flex items-center">
                <span className="mr-2">🧪</span>
                Tests Performed
              </h4>
              <div className="flex flex-wrap gap-2">
                {selectedReport.testsRequested?.map((test, idx) => (
                  <span key={idx} className="px-4 py-2 bg-teal-100 text-teal-800 rounded-xl font-medium">
                    {test.testName}
                  </span>
                ))}
              </div>
            </div>

            {/* Results */}
            <div>
              <h4 className="font-bold text-gray-900 mb-3 flex items-center">
                <span className="mr-2">📝</span>
                Test Results
              </h4>
              <div className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200">
                <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800">
                  {selectedReport.results}
                </pre>
              </div>
            </div>

            {/* Remarks */}
            {selectedReport.remarks && (
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                <h4 className="font-bold text-amber-900 mb-2 flex items-center">
                  <span className="mr-2">💬</span>
                  Lab Remarks
                </h4>
                <p className="text-amber-800">{selectedReport.remarks}</p>
              </div>
            )}

            {/* Timestamps */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
              <div>
                <p className="text-xs text-gray-500">Request Date</p>
                <p className="font-medium text-gray-900">{formatDateTime(selectedReport.createdAt)}</p>
              </div>
              {selectedReport.completedAt && (
                <div>
                  <p className="text-xs text-gray-500">Completed Date</p>
                  <p className="font-medium text-gray-900">{formatDateTime(selectedReport.completedAt)}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default LabReportsList;