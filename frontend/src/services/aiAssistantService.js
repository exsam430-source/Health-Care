// src/services/aiAssistantService.js
// AI Doctor Assistant — Full API Service Layer
// Uses the dedicated assistantApi (Flask backend on port 5002)

import { assistantApi } from '../api/axios';

// ── Prediction ────────────────────────────────────────────
export const predictDisease = async (symptoms, patientId, appointmentId) => {
  const response = await assistantApi.post('/ai/predict', {
    symptoms,
    patient_id: patientId || `P_${Date.now()}`,
    appointment_id: appointmentId || `A_${Date.now()}`
  });
  return response.data;
};

export const getAllSymptoms = async (search = '') => {
  const response = await assistantApi.get(`/ai/symptoms${search ? `?search=${search}` : ''}`);
  return response.data;
};

export const getAllDiseases = async () => {
  const response = await assistantApi.get('/ai/diseases');
  return response.data;
};

export const getModelInfo = async () => {
  const response = await assistantApi.get('/ai/info');
  return response.data;
};

// ── Symptom Suggestions ──────────────────────────────────
export const getSuggestions = async (currentSymptoms, confirmed = [], denied = [], max = 6) => {
  const response = await assistantApi.post('/ai/suggest-symptoms', {
    current_symptoms: currentSymptoms,
    confirmed_symptoms: confirmed,
    denied_symptoms: denied,
    max_suggestions: max
  });
  return response.data;
};

export const updateSuggestions = async (currentSymptoms, confirmed, denied, max = 4) => {
  const response = await assistantApi.post('/ai/update-suggestions', {
    current_symptoms: currentSymptoms,
    confirmed_symptoms: confirmed,
    denied_symptoms: denied,
    max_suggestions: max
  });
  return response.data;
};

export const finalizeSymptoms = async (patientId, appointmentId, original, confirmed, denied) => {
  const response = await assistantApi.post('/ai/finalize-symptoms', {
    patient_id: patientId,
    appointment_id: appointmentId,
    original_symptoms: original,
    confirmed_additional: confirmed,
    denied_symptoms: denied
  });
  return response.data;
};

// ── Comparison ────────────────────────────────────────────
export const compareWithDoctor = async (patientId, appointmentId, symptoms, doctorDiagnosis, doctorNotes, aiPrediction, aiConfidence) => {
  const response = await assistantApi.post('/ai/compare', {
    patient_id: patientId,
    appointment_id: appointmentId,
    symptoms,
    doctor_diagnosis: doctorDiagnosis,
    doctor_notes: doctorNotes,
    ai_prediction: aiPrediction,
    ai_confidence: aiConfidence
  });
  return response.data;
};

// ── Validation ────────────────────────────────────────────
export const validateWithLab = async (patientId, appointmentId, labDisease) => {
  const response = await assistantApi.post('/ai/validate', {
    patient_id: patientId,
    appointment_id: appointmentId,
    lab_confirmed_disease: labDisease
  });
  return response.data;
};

// ── Performance & Health ──────────────────────────────────
export const getPerformance = async () => {
  const response = await assistantApi.get('/ai/performance');
  return response.data;
};

export const getHealth = async () => {
  const response = await assistantApi.get('/ai/health');
  return response.data;
};

export const getComparisons = async () => {
  const response = await assistantApi.get('/ai/comparisons');
  return response.data;
};

export const getValidationHistory = async () => {
  const response = await assistantApi.get('/ai/validation-history');
  return response.data;
};
