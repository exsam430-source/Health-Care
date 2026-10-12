import api from '../api/axios';

export const createPrescription = async (data) => {
  const response = await api.post('/prescriptions', data);
  return response.data;
};

export const getPrescriptions = async () => {
  const response = await api.get('/prescriptions');
  return response.data;
};

export const getPrescription = async (id) => {
  const response = await api.get(`/prescriptions/${id}`);
  return response.data;
};