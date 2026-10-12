import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getHealth, getPerformance, getModelInfo } from '../api/aiService';
import { FiArrowRight, FiActivity, FiCpu, FiDatabase } from 'react-icons/fi';

const Dashboard = () => {
  const [health, setHealth] = useState(null);
  const [stats, setStats] = useState(null);
  const [model, setModel] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [h, s, m] = await Promise.all([getHealth(), getPerformance(), getModelInfo()]);
        setHealth(h);
        if (s.success) setStats(s.data);
        if (m.success) setModel(m.data?.model_info);
      } catch (e) { console.error(e); }
    };
    load();
  }, []);

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="gradient-bg rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute right-20 bottom-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2" />
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold mb-2">Welcome, Doctor 👋</h1>
          <p className="text-blue-100 text-lg mb-6">Your AI Medical Assistant is ready to help</p>
          <Link to="/consultation" className="inline-flex items-center gap-2 bg-white text-primary-700 font-bold px-6 py-3 rounded-xl hover:bg-blue-50 transition-all shadow-lg">
            Start New Consultation <FiArrowRight />
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <FiCpu className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-400">Model</p>
            <p className="font-bold text-gray-900">{model?.model_type || 'Loading...'}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
            <FiActivity className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm text-gray-400">Accuracy</p>
            <p className="font-bold text-gray-900">{model?.accuracy || 0}%</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-xl">🦠</div>
          <div>
            <p className="text-sm text-gray-400">Diseases</p>
            <p className="font-bold text-gray-900">{model?.n_diseases || 0}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
            <FiDatabase className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <p className="text-sm text-gray-400">Predictions</p>
            <p className="font-bold text-gray-900">{stats?.total_predictions || 0}</p>
          </div>
        </div>
      </div>

      {/* System Health */}
      {health && (
        <div className="card">
          <h2 className="font-bold text-gray-900 text-lg mb-4">🏥 System Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {Object.entries(health.components || {}).map(([name, info]) => (
              <div key={name} className={`rounded-xl p-4 border-2 ${info.status === 'ok' ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-700 capitalize">{name.replace(/_/g, ' ')}</span>
                  <span className="text-lg">{info.status === 'ok' ? '✅' : '⚠️'}</span>
                </div>
                {info.type && <p className="text-xs text-gray-400 mt-1">Type: {info.type}</p>}
                {info.accuracy && <p className="text-xs text-gray-400 mt-1">Accuracy: {info.accuracy}%</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/consultation" className="card hover:shadow-xl hover:border-primary-300 transition-all group cursor-pointer">
          <div className="text-3xl mb-3">🩺</div>
          <h3 className="font-bold text-gray-900 group-hover:text-primary-600 transition-colors">New Consultation</h3>
          <p className="text-sm text-gray-400 mt-1">Start AI-assisted patient consultation</p>
        </Link>
        <Link to="/history" className="card hover:shadow-xl hover:border-purple-300 transition-all group cursor-pointer">
          <div className="text-3xl mb-3">📋</div>
          <h3 className="font-bold text-gray-900 group-hover:text-purple-600 transition-colors">View History</h3>
          <p className="text-sm text-gray-400 mt-1">Check past consultations and comparisons</p>
        </Link>
        <Link to="/performance" className="card hover:shadow-xl hover:border-emerald-300 transition-all group cursor-pointer">
          <div className="text-3xl mb-3">📊</div>
          <h3 className="font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">AI Performance</h3>
          <p className="text-sm text-gray-400 mt-1">Monitor AI accuracy and retraining</p>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;