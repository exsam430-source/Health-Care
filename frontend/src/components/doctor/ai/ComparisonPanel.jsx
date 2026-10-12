// src/components/doctor/ai/ComparisonPanel.jsx
// Enables the doctor to enter their clinical diagnosis and compare with the AI prediction result.

import { useState } from 'react';
import { compareWithDoctor } from '../../../services/aiAssistantService';
import AILoader from './AILoader';

const ComparisonPanel = ({ patientId, appointmentId, symptoms, aiPrediction, aiConfidence, onCompared }) => {
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async () => {
    if (!diagnosis.trim()) return;
    setLoading(true);
    try {
      const res = await compareWithDoctor(
        patientId, appointmentId, symptoms,
        diagnosis, notes, aiPrediction, aiConfidence
      );
      if (res.success) {
        setResult(res.data);
        onCompared?.(res.data);
      }
    } catch (e) { console.error('Failed to compare diagnosis:', e); }
    setLoading(false);
  };

  if (loading) return <AILoader text="Comparing diagnoses..." />;

  if (result) {
    const isMatch = result.match_status === 'MATCH';
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <h3 className="font-bold text-gray-900 text-lg mb-4">📊 Comparison Result</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="bg-blue-50 rounded-xl p-4 text-center border border-blue-200">
            <p className="text-3xl mb-2">🤖</p>
            <p className="text-xs text-blue-500 font-semibold uppercase mb-1">AI Prediction</p>
            <p className="font-bold text-blue-900">{result.ai_prediction}</p>
            <p className="text-xs text-blue-400 mt-1">{result.ai_confidence}% confident</p>
          </div>
          <div className="bg-purple-50 rounded-xl p-4 text-center border border-purple-200">
            <p className="text-3xl mb-2">👨‍⚕️</p>
            <p className="text-xs text-purple-500 font-semibold uppercase mb-1">Your Diagnosis</p>
            <p className="font-bold text-purple-900">{result.doctor_diagnosis}</p>
            <p className="text-xs text-purple-400 mt-1">Clinical judgment</p>
          </div>
        </div>

        <div className={`rounded-xl p-4 text-center text-lg font-bold ${isMatch ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
          {isMatch ? '✅ MATCH — Both agree!' : '⚠️ MISMATCH — Lab results will decide'}
        </div>

        <p className="text-sm text-gray-500 text-center mt-3">
          ⏳ Awaiting lab report for final validation...
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-xl">👨‍⚕️</div>
        <div>
          <h3 className="font-bold text-gray-900">Your Diagnosis</h3>
          <p className="text-xs text-gray-400">Enter your clinical diagnosis to compare with AI</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-4 flex items-center gap-2">
        <span>🤖</span>
        <span className="text-sm text-blue-700">AI predicted: <strong>{aiPrediction}</strong> ({aiConfidence}%)</span>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Your Diagnosis</label>
          <input
            type="text"
            placeholder="e.g. Malaria, Dengue, Typhoid..."
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all duration-200 text-gray-800"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Clinical Notes (Optional)</label>
          <textarea
            placeholder="Add observations, patient history, etc..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all duration-200 text-gray-800 min-h-[80px] resize-none"
          />
        </div>
        <button
          onClick={handleSubmit}
          disabled={!diagnosis.trim()}
          className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25"
        >
          Submit & Compare with AI
        </button>
      </div>
    </div>
  );
};

export default ComparisonPanel;
