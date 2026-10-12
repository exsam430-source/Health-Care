import api from '../api/axios';

export const createAppointment = async (data) => {
  const response = await api.post('/appointments', data);
  return response.data;
};

export const getAppointments = async () => {
  const response = await api.get('/appointments');
  return response.data;
};

export const getAppointment = async (id) => {
  const response = await api.get(`/appointments/${id}`);
  return response.data;
};

export const updateAppointmentStatus = async (id, data) => {
  const response = await api.put(`/appointments/${id}/status`, data);
  return response.data;
};