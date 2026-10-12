import { useState, useEffect } from 'react';
import { getSuggestions, updateSuggestions } from '../../api/aiService';
import Loader from '../Common/Loader';

const SymptomSuggester = ({ originalSymptoms, onComplete, disabled }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [confirmed, setConfirmed] = useState([]);
  const [denied, setDenied] = useState([]);
  const [earlyPrediction, setEarlyPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [round, setRound] = useState(1);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (originalSymptoms.length > 0) fetchInitialSuggestions();
  }, [originalSymptoms]);

  const fetchInitialSuggestions = async () => {
    setLoading(true);
    try {
      const res = await getSuggestions(originalSymptoms, [], [], 6);
      if (res.success && res.data) {
        setSuggestions(res.data.suggestions || []);
        setEarlyPrediction(res.data.early_prediction);
        setCurrentIndex(0);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleConfirm = async () => {
    const sym = suggestions[currentIndex];
    const newConfirmed = [...confirmed, sym.symptom_key];
    setConfirmed(newConfirmed);
    await moveNext(newConfirmed, denied);
  };

  const handleDeny = async () => {
    const sym = suggestions[currentIndex];
    const newDenied = [...denied, sym.symptom_key];
    setDenied(newDenied);
    await moveNext(confirmed, newDenied);
  };

  const moveNext = async (conf, den) => {
    const next = currentIndex + 1;
    if (next < suggestions.length) {
      setCurrentIndex(next);
    } else if (round < 2) {
      setLoading(true);
      try {
        const res = await updateSuggestions(originalSymptoms, conf, den, 4);
        if (res.success && res.data?.suggestions?.length > 0) {
          setSuggestions(res.data.suggestions);
          setEarlyPrediction(res.data.early_prediction);
          setCurrentIndex(0);
          setRound(2);
        } else {
          setDone(true);
          onComplete?.(conf, den);
        }
      } catch { setDone(true); onComplete?.(conf, den); }
      setLoading(false);
    } else {
      setDone(true);
      onComplete?.(conf, den);
    }
  };

  const handleSkip = () => {
    setDone(true);
    onComplete?.(confirmed, denied);
  };

  if (loading) return <Loader text="AI analyzing related symptoms..." />;
  if (done || suggestions.length === 0) return null;

  const current = suggestions[currentIndex];
  if (!current) return null;

  const relevanceColors = {
    HIGH: 'border-red-300 bg-red-50',
    MEDIUM: 'border-amber-300 bg-amber-50',
    LOW: 'border-emerald-300 bg-emerald-50'
  };

  const relevanceIcons = { HIGH: '🔴', MEDIUM: '🟡', LOW: '🟢' };

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-xl">🤖</div>
          <div>
            <h3 className="font-bold text-gray-900">AI Symptom Assistant</h3>
            <p className="text-xs text-gray-400">Ask the patient about these symptoms</p>
          </div>
        </div>
        <span className="text-xs font-medium text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
          {currentIndex + 1} / {suggestions.length}
        </span>
      </div>

      {/* Confirmed So Far */}
      {(originalSymptoms.length > 0 || confirmed.length > 0) && (
        <div className="mb-4 pb-4 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            ✅ Confirmed Symptoms
          </p>
          <div className="flex flex-wrap gap-1.5">
            {originalSymptoms.map(s => (
              <span key={s} className="tag tag-blue text-xs">{s.replace(/_/g, ' ')}</span>
            ))}
            {confirmed.map(s => (
              <span key={s} className="tag tag-green text-xs">{s.replace(/_/g, ' ')}</span>
            ))}
          </div>
        </div>
      )}

      {/* Early Prediction */}
      {earlyPrediction && (
        <div className="mb-4 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-2 text-sm">
          <span>🔮</span>
          <span className="text-blue-700 font-medium">AI Early Prediction:</span>
          <strong className="text-blue-900">{earlyPrediction.disease}</strong>
          <span className="text-blue-500">({earlyPrediction.confidence}%)</span>
          <span className="text-blue-400 text-xs ml-auto">asking more to confirm...</span>
        </div>
      )}

      {/* Suggestion Card */}
      <div className={`border-2 rounded-2xl p-5 ${relevanceColors[current.relevance_level] || relevanceColors.MEDIUM}`}>
        <div className="flex items-center justify-between mb-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600">
            {relevanceIcons[current.relevance_level]} {current.relevance_level} Relevance
          </span>
          <span className="text-xs text-gray-400">Score: {current.relevance_score}</span>
        </div>

        <h4 className="text-xl font-bold text-gray-900 mb-3">
          🩺 {current.symptom_name}
        </h4>

        <div className="bg-white/70 rounded-xl p-4 mb-4 border-l-4 border-primary-500">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Ask Patient:</p>
          <p className="text-gray-800 font-medium italic">"{current.doctor_question}"</p>
        </div>

        <div className="flex gap-3">
          <button onClick={handleConfirm} disabled={disabled} className="btn-success flex-1 flex items-center justify-center gap-2">
            ✅ Yes, Confirmed
          </button>
          <button onClick={handleDeny} disabled={disabled} className="btn-danger flex-1 flex items-center justify-center gap-2">
            ❌ No, Denied
          </button>
        </div>
      </div>

      {/* Skip */}
      <button onClick={handleSkip} className="w-full mt-3 py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors">
        Skip remaining → Finalize now
      </button>

      {/* Denied */}
      {denied.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-400 mb-1">❌ Denied:</p>
          <div className="flex flex-wrap gap-1">
            {denied.map(s => (
              <span key={s} className="tag tag-red text-xs">{s.replace(/_/g, ' ')}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SymptomSuggester;