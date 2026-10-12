import api from '../api/axios';

export const createLabRequest = async (data) => {
  const response = await api.post('/lab/request', data);
  return response.data;
};

export const getLabReports = async () => {
  const response = await api.get('/lab/reports');
  return response.data;
};

export const updateLabReport = async (id, data) => {
  const response = await api.put(`/lab/reports/${id}`, data);
  return response.data;
};