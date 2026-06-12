// ✅ FIX (SECURITY): Updated to use HttpOnly cookies instead of localStorage tokens
// HttpOnly cookies cannot be accessed by JavaScript, protecting against XSS attacks.
// - Server sets: res.cookie('token', jwt, { httpOnly: true, sameSite: 'strict' })
// - Cookies are sent automatically with requests when withCredentials: true
// - AuthContext.js no longer needs localStorage token management
// - No Authorization header injection needed — cookies handle it

import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  withCredentials: true,  // Enable cookie forwarding for all requests
});

API.interceptors.request.use(
  (config) => {
    // Token is now in HttpOnly cookie, sent automatically by browser
    // No need to manually inject Authorization header
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
        console.warn('Session expired — cookie cleared by server');
      }
      if (code === 'TOKEN_INVALID') {
        console.warn('Invalid token detected');
      }
    }

    if (status === 429) {
      console.warn('Rate limit hit — retry after:', error.response?.data?.retryAfter);
    }

    return Promise.reject(error);
  }
);

export default API;