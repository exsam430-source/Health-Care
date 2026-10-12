import { useState } from 'react';
import { validateWithLab } from '../../api/aiService';
import Loader from '../Common/Loader';

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
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  if (loading) return <Loader text="Validating with lab results..." />;

  if (result) {
    return (
      <div className="card border-2 border-emerald-200">
        <h3 className="font-bold text-gray-900 text-lg mb-4">🧬 Lab Validation Complete</h3>

        <div className="grid grid-cols-3 gap-3 mb-4">
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
    <div className="card">
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
          className="input-field"
        />
        <button onClick={handleValidate} disabled={!labDisease.trim()} className="btn-success w-full">
          🧬 Validate with Lab Result
        </button>
      </div>
    </div>
  );
};

export default LabValidation;