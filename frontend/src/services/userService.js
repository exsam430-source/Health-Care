// src/services/userServices.js
import api from '../api/axios';

export const getDoctors = async (specialization = '') => {
  const url = specialization
    ? `/auth/doctors?specialization=${specialization}`
    : '/auth/doctors';
  const response = await api.get(url);
  return response.data;
};

export const getLaboratories = async () => {
  const response = await api.get('/auth/laboratories');
  return response.data;
};

export const getPharmacies = async () => {
  const response = await api.get('/auth/pharmacies');
  return response.data;
};