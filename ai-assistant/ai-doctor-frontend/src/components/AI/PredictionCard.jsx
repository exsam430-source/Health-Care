import ConfidenceBar from '../Common/ConfidenceBar';

const PredictionCard = ({ prediction, onContinue }) => {
  if (!prediction) return null;

  const data = prediction.data || prediction;
  const severityColors = {
    'Mild': 'bg-green-100 text-green-700',
    'Moderate': 'bg-amber-100 text-amber-700',
    'Severe': 'bg-red-100 text-red-700',
    'Critical': 'bg-red-200 text-red-800',
  };

  const getSeverityClass = (sev) => {
    if (!sev) return 'bg-gray-100 text-gray-600';
    for (const [key, cls] of Object.entries(severityColors)) {
      if (sev.toLowerCase().includes(key.toLowerCase())) return cls;
    }
    return 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="card border-2 border-primary-200 bg-gradient-to-br from-primary-50/50 to-white">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-12 h-12 gradient-bg rounded-xl flex items-center justify-center text-2xl shadow-lg shadow-primary-500/30">
          🔬
        </div>
        <div>
          <h3 className="font-bold text-gray-900 text-lg">AI Prediction Result</h3>
          <p className="text-xs text-gray-400">Based on {data.symptoms_analyzed || 0} symptoms analyzed</p>
        </div>
      </div>

      {/* Disease Name */}
      <div className="bg-white rounded-xl p-4 mb-4 border border-gray-100 shadow-sm">
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Predicted Disease</p>
        <h2 className="text-2xl font-extrabold text-gray-900">{data.predicted_disease}</h2>
        <div className="mt-2 flex items-center gap-3">
          <span className={`tag text-xs font-bold ${getSeverityClass(data.severity)}`}>
            {data.severity || 'Unknown'}
          </span>
          <span className="tag tag-blue text-xs">
            👨‍⚕️ {data.specialist || 'General Physician'}
          </span>
        </div>
      </div>

      {/* Confidence */}
      <div className="mb-4">
        <p className="text-sm font-semibold text-gray-600 mb-2">AI Confidence</p>
        <ConfidenceBar value={data.confidence} size="lg" />
      </div>

      {/* Top Predictions */}
      {data.top_predictions?.length > 1 && (
        <div className="mb-4">
          <p className="text-sm font-semibold text-gray-600 mb-2">Other Possibilities</p>
          <div className="space-y-2">
            {data.top_predictions.slice(1, 4).map((p, i) => (
              <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                <span className="text-sm text-gray-700">{p.disease}</span>
                <ConfidenceBar value={p.confidence} size="sm" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommended Tests */}
      {data.recommended_tests?.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-semibold text-gray-600 mb-2">🧪 Recommended Lab Tests</p>
          <div className="flex flex-wrap gap-2">
            {data.recommended_tests.map((t, i) => (
              <span key={i} className="tag tag-blue">{t}</span>
            ))}
          </div>
        </div>
      )}

      {/* Medicines */}
      {data.suggested_medicines?.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-semibold text-gray-600 mb-2">💊 Suggested Medicines</p>
          <div className="flex flex-wrap gap-2">
            {data.suggested_medicines.map((m, i) => (
              <span key={i} className="tag tag-green">{m}</span>
            ))}
          </div>
        </div>
      )}

      {/* Precautions */}
      {data.precautions?.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-semibold text-gray-600 mb-2">⚠️ Precautions</p>
          <ul className="space-y-1">
            {data.precautions.map((p, i) => (
              <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                <span className="text-amber-500 mt-0.5">•</span> {p}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Notes */}
      {data.notes && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4">
          <p className="text-sm text-amber-800">📋 <strong>Note:</strong> {data.notes}</p>
        </div>
      )}

      {onContinue && (
        <button onClick={onContinue} className="btn-primary w-full mt-2">
          Enter My Diagnosis →
        </button>
      )}
    </div>
  );
};

export default PredictionCard;