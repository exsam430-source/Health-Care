// src/components/doctor/ai/LabValidation.jsx
// Doctor enters lab-confirmed disease results to validate both AI and Doctor predictions

import { useState } from 'react';
import { validateWithLab } from '../../../services/aiAssistantService';
import AILoader from './AILoader';

const LabValidation = ({ patientId, appointmentId }) => {
  const [labDisease, setLabDisease] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleValidate = async () => {
    if (!labDisease.trim()) return;
    setLoading(true);
    try {
      const res = await validateWithLab(patientId, appointmentId, labDisease);
      if (res.success) setResult(res.data);
    } catch (e) { console.error('Failed to validate with lab:', e); }
    setLoading(false);
  };

  if (loading) return <AILoader text="Validating with lab results..." />;

  if (result) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border-2 border-emerald-200 p-6">
        <h3 className="font-bold text-gray-900 text-lg mb-4">🧬 Lab Validation Complete</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <div className={`rounded-xl p-3 text-center border-2 ${result.ai_correct ? 'bg-emerald-50 border-emerald-300' : 'bg-red-50 border-red-300'}`}>
            <p className="text-2xl mb-1">🤖</p>
            <p className="text-xs text-gray-500 mb-1">AI</p>
            <p className="font-bold text-sm">{result.ai_prediction}</p>
            <p className="text-lg mt-1">{result.ai_correct ? '✅' : '❌'}</p>
          </div>
          <div className={`rounded-xl p-3 text-center border-2 ${result.doctor_correct ? 'bg-emerald-50 border-emerald-300' : 'bg-red-50 border-red-300'}`}>
            <p className="text-2xl mb-1">👨‍⚕️</p>
            <p className="text-xs text-gray-500 mb-1">Doctor</p>
            <p className="font-bold text-sm">{result.doctor_diagnosis}</p>
            <p className="text-lg mt-1">{result.doctor_correct ? '✅' : '❌'}</p>
          </div>
          <div className="rounded-xl p-3 text-center bg-blue-50 border-2 border-blue-300">
            <p className="text-2xl mb-1">🧬</p>
            <p className="text-xs text-gray-500 mb-1">Lab Result</p>
            <p className="font-bold text-sm">{result.lab_confirmed_disease}</p>
            <p className="text-lg mt-1">📋</p>
          </div>
        </div>

        <div className={`rounded-xl p-4 text-center font-bold ${result.ai_correct && result.doctor_correct ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
          {result.result_message}
        </div>

        {result.retrain_triggered && (
          <div className="mt-3 bg-purple-50 border border-purple-200 rounded-xl px-4 py-3 text-sm text-purple-700">
            🔄 AI model has been updated with this correct outcome for better future predictions
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-xl">🧬</div>
        <div>
          <h3 className="font-bold text-gray-900">Lab Result Validation</h3>
          <p className="text-xs text-gray-400">Enter the lab-confirmed disease to validate predictions</p>
        </div>
      </div>

      <div className="space-y-3">
        <input
          type="text"
          placeholder="Lab confirmed disease name..."
          value={labDisease}
          onChange={(e) => setLabDisease(e.target.value)}
          className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all duration-200 text-gray-800"
        />
        <button
          onClick={handleValidate}
          disabled={!labDisease.trim()}
          className="w-full px-6 py-3 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/25"
        >
          🧬 Validate with Lab Result
        </button>
      </div>
    </div>
  );
};

export default LabValidation;
