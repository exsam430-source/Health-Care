// src/components/doctor/AIPerformance.jsx
// Displays AI model metadata, performance statistics, and background health status

import { useState, useEffect } from 'react';
import { getPerformance, getHealth, getModelInfo } from '../../services/aiAssistantService';
import ConfidenceBar from './ai/ConfidenceBar';
import AILoader from './ai/AILoader';

const StatBox = ({ icon, label, value, color }) => (
  <div className={`rounded-xl p-4 border border-gray-100 ${color} shadow-sm`}>
    <p className="text-2xl mb-1">{icon}</p>
    <p className="text-2xl font-extrabold">{value}</p>
    <p className="text-xs font-semibold opacity-70 mt-1">{label}</p>
  </div>
);

const AIPerformance = () => {
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
    } catch (e) { console.error('Failed to load performance metrics:', e); }
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  if (loading) return <AILoader text="Loading AI performance dashboard..." />;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">AI Performance Dashboard</h1>
          <p className="text-sm text-gray-400 mt-1">Monitor AI prediction metrics, system health, and model parameters</p>
        </div>
        <button
          onClick={fetchAll}
          className="px-4 py-2 border border-gray-200 text-sm font-semibold rounded-xl hover:bg-gray-50 active:scale-95 transition-all"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Model Info */}
      {model && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
            <span>🤖</span> Model Metadata
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatBox icon="🧠" label="Model Type" value={model.model_type || 'N/A'} color="bg-blue-50 text-blue-800" />
            <StatBox icon="🎯" label="Base Accuracy" value={`${model.accuracy || 0}%`} color="bg-emerald-50 text-emerald-800" />
            <StatBox icon="🦠" label="Diseases Covered" value={model.n_diseases || 0} color="bg-purple-50 text-purple-800" />
            <StatBox icon="🩺" label="Symptoms Covered" value={model.n_symptoms || 0} color="bg-amber-50 text-amber-800" />
          </div>
        </div>
      )}

      {/* Performance Stats */}
      {stats && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
            <span>📈</span> Performance Metrics
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatBox icon="📊" label="Total Evaluations" value={stats.total_predictions || 0} color="bg-blue-50/50 text-blue-900" />
            <StatBox icon="✅" label="Correct Matches" value={stats.correct_predictions || 0} color="bg-emerald-50/50 text-emerald-900" />
            <StatBox icon="❌" label="Mismatches" value={stats.wrong_predictions || 0} color="bg-red-50/50 text-red-900" />
            <StatBox icon="🎯" label="Validated Accuracy" value={`${stats.accuracy_percentage || 0}%`} color="bg-purple-50/50 text-purple-900" />
          </div>
          {stats.total_predictions > 0 && (
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
              <p className="text-sm font-semibold text-gray-600 mb-2">Live Evaluated Accuracy</p>
              <ConfidenceBar value={stats.accuracy_percentage || 0} size="lg" />
            </div>
          )}
        </div>
      )}

      {/* System Health */}
      {health && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
            <span>🏥</span> Service Dependencies
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(health.components || {}).map(([name, info]) => (
              <div key={name} className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
                <span className="text-sm font-bold text-gray-700 capitalize">{name.replace(/_/g, ' ')}</span>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                  info.status === 'ok' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                }`}>
                  {info.status === 'ok' ? '● Healthy' : '● Error'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIPerformance;
