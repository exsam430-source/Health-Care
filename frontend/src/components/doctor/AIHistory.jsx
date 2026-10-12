// src/components/doctor/AIHistory.jsx
// Displays history of AI vs Doctor diagnosis comparisons and validation records

import { useState, useEffect } from 'react';
import { getComparisons, getValidationHistory } from '../../services/aiAssistantService';
import AILoader from './ai/AILoader';

const AIHistory = () => {
  const [comparisons, setComparisons] = useState([]);
  const [validations, setValidations] = useState([]);
  const [tab, setTab] = useState('comparisons');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [compRes, valRes] = await Promise.all([getComparisons(), getValidationHistory()]);
        if (compRes.success) setComparisons(compRes.data || []);
        if (valRes.success) setValidations(valRes.data || []);
      } catch (e) { console.error('Failed to load history:', e); }
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <AILoader text="Loading history..." />;

  const records = tab === 'comparisons' ? comparisons : validations;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">AI Consultation History</h1>
          <p className="text-sm text-gray-400 mt-1">Review past comparisons and validated cases</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-xl max-w-md">
        <button
          onClick={() => setTab('comparisons')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
            tab === 'comparisons' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          📊 Comparisons ({comparisons.length})
        </button>
        <button
          onClick={() => setTab('validations')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
            tab === 'validations' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          🧬 Lab Validations ({validations.length})
        </button>
      </div>

      {/* List */}
      {records.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-gray-500 font-medium">No records found yet. Begin a consultation to populate history.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((r, i) => {
            const isMatch = r.match_status === 'MATCH' || r.ai_correct;
            return (
              <div key={i} className="bg-white rounded-2xl shadow-md border border-gray-100 p-5 hover:shadow-lg transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                    isMatch ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {isMatch ? '✅' : '⚠️'}
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-extrabold text-blue-600">🤖 {r.ai_prediction}</span>
                      <span className="text-xs text-gray-400">vs</span>
                      <span className="text-sm font-extrabold text-purple-600">👨‍⚕️ {r.doctor_diagnosis}</span>
                    </div>
                    {r.lab_confirmed_disease && (
                      <p className="text-xs text-gray-500">
                        Lab Result: <strong className="text-emerald-700 font-bold">{r.lab_confirmed_disease}</strong>
                      </p>
                    )}
                    <p className="text-xs text-gray-400">
                      {r.created_at ? new Date(r.created_at).toLocaleString() : 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                    r.match_status === 'MATCH'
                      ? 'bg-emerald-100 text-emerald-700'
                      : r.ai_correct
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-amber-100 text-amber-700'
                  }`}>
                    {r.match_status || (r.ai_correct ? 'AI Correct' : 'AI Incorrect')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AIHistory;
