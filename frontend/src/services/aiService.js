import { aiApi } from '../api/axios';

export const getSymptoms = async () => {
  const response = await aiApi.get('/symptoms');
  return response.data;
};

export const predictDisease = async (symptoms) => {
  const response = await aiApi.post('/predict', { symptoms });
  return response.data;
};