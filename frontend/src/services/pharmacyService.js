// src/services/pharmacyService.js
import api from '../api/axios';  // ← Check this path matches other services

export const createMedicineOrder = async (data) => {
  console.log('API baseURL:', api.defaults.baseURL);  // ← Add this debug line
  const response = await api.post('/pharmacy/orders', data);
  return response.data;
};

export const getMedicineOrders = async () => {
  const response = await api.get('/pharmacy/orders');
  return response.data;
};

export const getMedicineOrder = async (id) => {
  const response = await api.get(`/pharmacy/orders/${id}`);
  return response.data;
};

export const updateMedicineOrder = async (id, data) => {
  const response = await api.put(`/pharmacy/orders/${id}`, data);
  return response.data;
};