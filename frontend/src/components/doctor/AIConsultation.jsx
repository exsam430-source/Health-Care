// src/components/doctor/AIConsultation.jsx
// Interactive multi-step AI doctor assistant consultation workspace

import { useState, useRef } from 'react';
import SymptomInput from './ai/SymptomInput';
import SymptomSuggester from './ai/SymptomSuggester';
import PredictionCard from './ai/PredictionCard';
import ComparisonPanel from './ai/ComparisonPanel';
import LabValidation from './ai/LabValidation';
import AILoader from './ai/AILoader';
import { finalizeSymptoms } from '../../services/aiAssistantService';

const STEPS = ['symptoms', 'suggesting', 'prediction', 'diagnosis', 'lab'];

const AIConsultation = () => {
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
    } catch (e) {
      console.error('Failed to finalize symptoms:', e);
    }
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

  const stepLabels = ['Symptoms', 'AI Questions', 'Prediction', 'Diagnosis', 'Lab Result'];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Patient Consultation</h1>
          <p className="text-sm text-gray-400 mt-1">AI-assisted diagnosis workflow</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full font-mono">Patient ID: {patientId.slice(-6)}</span>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {stepLabels.map((label, i) => (
            <div key={i} className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shrink-0 ${
                i < currentStepIndex
                  ? 'bg-emerald-500 text-white'
                  : i === currentStepIndex
                    ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                    : 'bg-gray-200 text-gray-400'
              }`}>
                {i < currentStepIndex ? '✓' : i + 1}
              </div>
              <span className={`text-xs font-medium ${
                i <= currentStepIndex ? 'text-gray-900 font-bold' : 'text-gray-400'
              }`}>{label}</span>
              {i < 4 && <div className={`hidden md:block flex-1 h-0.5 mx-2 ${i < currentStepIndex ? 'bg-emerald-400' : 'bg-gray-200'}`} />}
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
      {loading && <AILoader text="Getting final AI prediction..." />}

      {/* Symptom Summary (after suggestions step starts/completes) */}
      {step !== 'symptoms' && step !== 'suggesting' && allSymptoms.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Complete Symptom Profile ({allSymptoms.length} symptoms)
          </p>
          <div className="flex flex-wrap gap-1.5">
            {originalSymptoms.map(s => (
              <span key={s} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">{s.replace(/_/g, ' ')}</span>
            ))}
            {confirmedExtra.map(s => (
              <span key={s} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">+ {s.replace(/_/g, ' ')}</span>
            ))}
          </div>
          {deniedSymptoms.length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-100">
              <span className="text-xs text-gray-400 mr-2">Denied:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {deniedSymptoms.map(s => (
                  <span key={s} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">{s.replace(/_/g, ' ')}</span>
                ))}
              </div>
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

export default AIConsultation;
