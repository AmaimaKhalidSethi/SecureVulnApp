// NOTE (MEDIUM): Tokens are stored in localStorage, which is accessible to any
// JavaScript on the page. The XSS payloads in this app specifically target this
// via localStorage.getItem('token'). In production, use HttpOnly cookies instead:
//   - Server sets: res.cookie('token', jwt, { httpOnly: true, sameSite: 'strict' })
//   - Remove all localStorage.getItem/setItem('token') calls
//   - Remove the Authorization header injection below (cookie is sent automatically)
//   - The axiosConfig withCredentials: true flag handles cookie forwarding
// The AuthContext.js now centralises token management — prefer useAuth() over
// direct localStorage calls in components.

import axios from 'axios';

const API = axios.create({
  baseURL:         'http://localhost:5000/api',
  // withCredentials: true,  // Uncomment when switching to HttpOnly cookies
});

API.interceptors.request.use(
  (config) => {
    // Token is also injected by AuthContext via API.defaults.headers.common.
    // This interceptor handles the case where the token exists in localStorage
    // from a previous session before AuthContext has mounted.
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
      console.warn('Rate limit hit — retry after:', error.response?.data?.retryAfter);
    }

    return Promise.reject(error);
  }
);

export default API;