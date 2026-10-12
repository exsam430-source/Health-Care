import axios from 'axios';

const API_BASE = 'http://localhost:5001/api/ai';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
});

// ── Prediction ────────────────────────────────────────────
export const predictDisease = async (symptoms, patientId, appointmentId) => {
  const res = await api.post('/predict', {
    symptoms,
    patient_id: patientId || `P_${Date.now()}`,
    appointment_id: appointmentId || `A_${Date.now()}`
  });
  return res.data;
};

// ── Symptom Suggestions ──────────────────────────────────
export const getSuggestions = async (currentSymptoms, confirmed = [], denied = [], max = 6) => {
  const res = await api.post('/suggest-symptoms', {
    current_symptoms: currentSymptoms,
    confirmed_symptoms: confirmed,
    denied_symptoms: denied,
    max_suggestions: max
  });
  return res.data;
};

export const updateSuggestions = async (currentSymptoms, confirmed, denied, max = 4) => {
  const res = await api.post('/update-suggestions', {
    current_symptoms: currentSymptoms,
    confirmed_symptoms: confirmed,
    denied_symptoms: denied,
    max_suggestions: max
  });
  return res.data;
};

export const finalizeSymptoms = async (patientId, appointmentId, original, confirmed, denied) => {
  const res = await api.post('/finalize-symptoms', {
    patient_id: patientId,
    appointment_id: appointmentId,
    original_symptoms: original,
    confirmed_additional: confirmed,
    denied_symptoms: denied
  });
  return res.data;
};

// ── Comparison ────────────────────────────────────────────
export const compareWithDoctor = async (patientId, appointmentId, symptoms, doctorDiagnosis, doctorNotes, aiPrediction, aiConfidence) => {
  const res = await api.post('/compare', {
    patient_id: patientId,
    appointment_id: appointmentId,
    symptoms,
    doctor_diagnosis: doctorDiagnosis,
    doctor_notes: doctorNotes,
    ai_prediction: aiPrediction,
    ai_confidence: aiConfidence
  });
  return res.data;
};

// ── Validation ────────────────────────────────────────────
export const validateWithLab = async (patientId, appointmentId, labDisease) => {
  const res = await api.post('/validate', {
    patient_id: patientId,
    appointment_id: appointmentId,
    lab_confirmed_disease: labDisease
  });
  return res.data;
};

// ── Performance ───────────────────────────────────────────
export const getPerformance = async () => {
  const res = await api.get('/performance');
  return res.data;
};

export const getHealth = async () => {
  const res = await api.get('/health');
  return res.data;
};

export const getAllSymptoms = async (search = '') => {
  const res = await api.get(`/symptoms${search ? `?search=${search}` : ''}`);
  return res.data;
};

export const getAllDiseases = async () => {
  const res = await api.get('/diseases');
  return res.data;
};

export const getModelInfo = async () => {
  const res = await api.get('/info');
  return res.data;
};

export const getComparisons = async () => {
  const res = await api.get('/comparisons');
  return res.data;
};

export const getValidationHistory = async () => {
  const res = await api.get('/validation-history');
  return res.data;
};