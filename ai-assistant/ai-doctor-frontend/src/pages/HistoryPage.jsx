import { useState, useEffect } from 'react';
import { getComparisons, getValidationHistory } from '../api/aiService';
import Loader from '../components/Common/Loader';

const HistoryPage = () => {
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
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <Loader text="Loading history..." />;

  const records = tab === 'comparisons' ? comparisons : validations;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold text-gray-900">Consultation History</h1>

      <div className="flex gap-2">
        <button onClick={() => setTab('comparisons')} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === 'comparisons' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          📊 Comparisons ({comparisons.length})
        </button>
        <button onClick={() => setTab('validations')} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === 'validations' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          🧬 Lab Validations ({validations.length})
        </button>
      </div>

      {records.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-gray-500">No records yet. Start a consultation!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((r, i) => (
            <div key={i} className="card flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg ${
                r.match_status === 'MATCH' || r.ai_correct
                  ? 'bg-emerald-100' : 'bg-amber-100'
              }`}>
                {r.match_status === 'MATCH' || r.ai_correct ? '✅' : '⚠️'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold text-blue-600">🤖 {r.ai_prediction}</span>
                  <span className="text-gray-300">vs</span>
                  <span className="text-sm font-bold text-purple-600">👨‍⚕️ {r.doctor_diagnosis}</span>
                </div>
                {r.lab_confirmed_disease && (
                  <p className="text-xs text-gray-500">Lab: <strong>{r.lab_confirmed_disease}</strong></p>
                )}
                <p className="text-xs text-gray-400">{r.created_at?.slice(0, 19)}</p>
              </div>
              <div>
                <span className={`tag text-xs ${r.match_status === 'MATCH' ? 'tag-green' : 'tag-yellow'}`}>
                  {r.match_status || (r.ai_correct ? 'AI Correct' : 'AI Wrong')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryPage;