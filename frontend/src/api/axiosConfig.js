import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      const parts = token.split('.');
      if (parts.length === 3) {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        localStorage.removeItem('token');
        console.warn('Malformed token cleared from storage');
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

API.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const code   = error.response?.data?.code;

    if (status === 401) {
      if (code === 'TOKEN_EXPIRED') {
        localStorage.removeItem('token');
        console.warn('Session expired — token cleared');
      }
      if (code === 'TOKEN_INVALID') {
        localStorage.removeItem('token');
        console.warn('Invalid token detected and cleared');
      }
    }

    if (status === 429) {
      console.warn('Rate limit hit:', error.response?.data?.retryAfter);
    }

    return Promise.reject(error);
  }
);

export default API;