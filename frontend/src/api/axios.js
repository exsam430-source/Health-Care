import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const aiURL = import.meta.env.VITE_AI_API_URL || 'http://localhost:5001/api';
const assistantURL = import.meta.env.VITE_ASSISTANT_API_URL || 'http://localhost:5002/api';

console.log('🔗 API Base URL:', baseURL);
console.log('🤖 AI API URL:', aiURL);
console.log('🤖 Assistant API URL:', assistantURL);

// Main API (Node.js Backend)
const api = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// AI API (Flask Backend)
export const aiApi = axios.create({
  baseURL: aiURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// AI Assistant API (Flask Backend - Port 5002)
export const assistantApi = axios.create({
  baseURL: assistantURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Main API Interceptors
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// AI API Interceptors
aiApi.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

// AI Assistant Interceptors
assistantApi.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

export default api;