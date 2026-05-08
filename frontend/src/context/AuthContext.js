// FIX (INFO): AuthContext.js was an empty file. This implements a proper auth
// context so token storage and user state are centralised rather than scattered
// across components (e.g. localStorage.getItem('token') in IdorDemoPage.jsx).
//
// Usage:
//   import { useAuth } from '../context/AuthContext';
//   const { user, token, login, logout, isAuthenticated } = useAuth();

import { createContext, useState, useContext, useCallback, useEffect } from 'react';
import API from '../api/axiosConfig';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [token,   setToken]   = useState(() => localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  // Sync axios Authorization header whenever token changes
  useEffect(() => {
    if (token) {
      API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('token', token);
    } else {
      delete API.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
    }
  }, [token]);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.post('/auth/login', { email, password });
      setToken(res.data.token);
      setUser(res.data.user);
      return { success: true, data: res.data };
    } catch (err) {
      const msg = err.response?.data?.error || 'Login failed';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (username, email, password) => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.post('/auth/register', { username, email, password });
      setToken(res.data.token);
      setUser(res.data.user);
      return { success: true, data: res.data };
    } catch (err) {
      const msg = err.response?.data?.error || 'Registration failed';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setError(null);
  }, []);

  const value = {
    user,
    token,
    loading,
    error,
    isAuthenticated: !!token,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an <AuthProvider>');
  return ctx;
};

export default AuthContext;