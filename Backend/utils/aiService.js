import axios from 'axios';

const AI_API_URL = process.env.AI_API_URL || 'http://localhost:5001/api';

export const predictDisease = async (symptoms) => {
  try {
    const response = await axios.post(`${AI_API_URL}/predict`, {
      symptoms
    });
    return response.data;
  } catch (error) {
    console.error('AI Service Error:', error.message);
    throw new Error('Failed to predict disease');
  }
};

export const getSymptoms = async () => {
  try {
    const response = await axios.get(`${AI_API_URL}/symptoms`);
    return response.data;
  } catch (error) {
    console.error('AI Service Error:', error.message);
    throw new Error('Failed to fetch symptoms');
  }
};