import { useState, useRef } from 'react';
import SymptomInput from '../components/AI/SymptomInput';
import SymptomSuggester from '../components/AI/SymptomSuggester';
import PredictionCard from '../components/AI/PredictionCard';
import ComparisonPanel from '../components/AI/ComparisonPanel';
import LabValidation from '../components/AI/LabValidation';
import Loader from '../components/Common/Loader';
import { finalizeSymptoms } from '../api/aiService';

const STEPS = ['symptoms', 'suggesting', 'prediction', 'diagnosis', 'lab'];

const ConsultationPage = () => {
  const [step, setStep] = useState('symptoms');
  const [patientId] = useState(`P_${Date.now()}`);
  const [appointmentId] = useState(`A_${Date.now()}`);
  const [originalSymptoms, setOriginalSymptoms] = useState([]);
  const [confirmedExtra, setConfirmedExtra] = useState([]);
  const [deniedSymptoms, setDeniedSymptoms] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const resultRef = useRef(null);

  const scrollToResult = () => {
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth' }), 200);
  };

  // Step 1: Initial symptoms entered
  const handleSymptomsSubmit = (symptoms) => {
    setOriginalSymptoms(symptoms);
    setStep('suggesting');
    scrollToResult();
  };

  // Step 2: Suggestions complete
  const handleSuggestionsComplete = async (confirmed, denied) => {
    setConfirmedExtra(confirmed);
    setDeniedSymptoms(denied);
    setLoading(true);

    try {
      const res = await finalizeSymptoms(
        patientId, appointmentId,
        originalSymptoms, confirmed, denied
      );
      if (res.success) {
        setPrediction(res.data?.final_prediction || res.data);
        setStep('prediction');
      }
    } catch (e) { console.error(e); }
    setLoading(false);
    scrollToResult();
  };

  // Step 3: Doctor wants to enter diagnosis
  const handleContinueToDiagnosis = () => {
    setStep('diagnosis');
    scrollToResult();
  };

  // Step 4: Comparison done
  const handleCompared = () => {
    setStep('lab');
    scrollToResult();
  };

  const currentStepIndex = STEPS.indexOf(step);

  const allSymptoms = [...originalSymptoms, ...confirmedExtra];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Patient Consultation</h1>
          <p className="text-sm text-gray-400 mt-1">AI-assisted diagnosis workflow</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">ID: {patientId.slice(-6)}</span>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="card p-4">
        <div className="flex items-center justify-between">
          {['Symptoms', 'AI Questions', 'Prediction', 'Diagnosis', 'Lab Result'].map((label, i) => (
            <div key={i} className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                i < currentStepIndex
                  ? 'bg-emerald-500 text-white'
                  : i === currentStepIndex
                    ? 'bg-primary-600 text-white ring-4 ring-primary-100'
                    : 'bg-gray-200 text-gray-400'
              }`}>
                {i < currentStepIndex ? '✓' : i + 1}
              </div>
              <span className={`text-xs font-medium hidden md:block ${
                i <= currentStepIndex ? 'text-gray-900' : 'text-gray-400'
              }`}>{label}</span>
              {i < 4 && <div className={`flex-1 h-0.5 mx-2 ${i < currentStepIndex ? 'bg-emerald-400' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Symptom Input */}
      <SymptomInput
        onSubmit={handleSymptomsSubmit}
        disabled={step !== 'symptoms'}
      />

      <div ref={resultRef} />

      {/* Step 2: AI Suggestions */}
      {step === 'suggesting' && (
        <SymptomSuggester
          originalSymptoms={originalSymptoms}
          onComplete={handleSuggestionsComplete}
          disabled={false}
        />
      )}

      {/* Loading */}
      {loading && <Loader text="Getting final AI prediction..." />}

      {/* Symptom Summary (after suggestions) */}
      {step !== 'symptoms' && step !== 'suggesting' && allSymptoms.length > 0 && (
        <div className="card bg-gray-50">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Complete Symptom Profile ({allSymptoms.length} symptoms)
          </p>
          <div className="flex flex-wrap gap-1.5">
            {originalSymptoms.map(s => (
              <span key={s} className="tag tag-blue text-xs">{s.replace(/_/g, ' ')}</span>
            ))}
            {confirmedExtra.map(s => (
              <span key={s} className="tag tag-green text-xs">+ {s.replace(/_/g, ' ')}</span>
            ))}
          </div>
          {deniedSymptoms.length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <span className="text-xs text-gray-400">Denied: </span>
              {deniedSymptoms.map(s => (
                <span key={s} className="tag tag-red text-xs mr-1">{s.replace(/_/g, ' ')}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 3: AI Prediction */}
      {step === 'prediction' && prediction && (
        <PredictionCard
          prediction={prediction}
          onContinue={handleContinueToDiagnosis}
        />
      )}

      {/* Step 4: Doctor Diagnosis */}
      {step === 'diagnosis' && prediction && (
        <ComparisonPanel
          patientId={patientId}
          appointmentId={appointmentId}
          symptoms={allSymptoms}
          aiPrediction={prediction.predicted_disease || prediction.data?.predicted_disease}
          aiConfidence={prediction.confidence || prediction.data?.confidence}
          onCompared={handleCompared}
        />
      )}

      {/* Step 5: Lab Validation */}
      {step === 'lab' && (
        <LabValidation
          patientId={patientId}
          appointmentId={appointmentId}
        />
      )}
    </div>
  );
};

export default ConsultationPage;