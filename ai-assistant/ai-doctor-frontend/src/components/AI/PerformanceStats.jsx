import { useState, useEffect } from 'react';
import { getPerformance, getHealth, getModelInfo } from '../../api/aiService';
import ConfidenceBar from '../Common/ConfidenceBar';
import Loader from '../Common/Loader';

const StatBox = ({ icon, label, value, color }) => (
  <div className={`rounded-xl p-4 ${color}`}>
    <p className="text-2xl mb-1">{icon}</p>
    <p className="text-2xl font-extrabold">{value}</p>
    <p className="text-xs font-medium opacity-70">{label}</p>
  </div>
);

const PerformanceStats = () => {
  const [stats, setStats] = useState(null);
  const [health, setHealth] = useState(null);
  const [model, setModel] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [perfRes, healthRes, modelRes] = await Promise.all([
        getPerformance(), getHealth(), getModelInfo()
      ]);
      if (perfRes.success) setStats(perfRes.data);
      setHealth(healthRes);
      if (modelRes.success) setModel(modelRes.data?.model_info);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  if (loading) return <Loader text="Loading AI performance data..." />;

  return (
    <div className="space-y-6">
      {/* Model Info */}
      {model && (
        <div className="card">
          <h3 className="font-bold text-gray-900 text-lg mb-4">🤖 Model Information</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatBox icon="🧠" label="Model Type" value={model.model_type || 'N/A'} color="bg-blue-50 text-blue-800" />
            <StatBox icon="🎯" label="Accuracy" value={`${model.accuracy || 0}%`} color="bg-emerald-50 text-emerald-800" />
            <StatBox icon="🦠" label="Diseases" value={model.n_diseases || 0} color="bg-purple-50 text-purple-800" />
            <StatBox icon="🩺" label="Symptoms" value={model.n_symptoms || 0} color="bg-amber-50 text-amber-800" />
          </div>
        </div>
      )}

      {/* Performance Stats */}
      {stats && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 text-lg">📈 AI Performance</h3>
            <button onClick={fetchAll} className="btn-ghost text-xs py-1.5 px-3">🔄 Refresh</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatBox icon="📊" label="Total Predictions" value={stats.total_predictions || 0} color="bg-blue-50 text-blue-800" />
            <StatBox icon="✅" label="Correct" value={stats.correct_predictions || 0} color="bg-emerald-50 text-emerald-800" />
            <StatBox icon="❌" label="Wrong" value={stats.wrong_predictions || 0} color="bg-red-50 text-red-800" />
            <StatBox icon="🎯" label="Accuracy" value={`${stats.accuracy_percentage || 0}%`} color="bg-purple-50 text-purple-800" />
          </div>
          {stats.total_predictions > 0 && (
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-2">Overall Accuracy</p>
              <ConfidenceBar value={stats.accuracy_percentage || 0} size="lg" />
            </div>
          )}
        </div>
      )}

      {/* Health */}
      {health && (
        <div className="card">
          <h3 className="font-bold text-gray-900 text-lg mb-4">🏥 System Health</h3>
          <div className="space-y-2">
            {Object.entries(health.components || {}).map(([name, info]) => (
              <div key={name} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
                <span className="text-sm font-medium text-gray-700 capitalize">{name.replace(/_/g, ' ')}</span>
                <span className={`tag text-xs font-bold ${info.status === 'ok' ? 'tag-green' : 'tag-red'}`}>
                  {info.status === 'ok' ? '✅ Healthy' : '⚠️ Issue'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceStats;