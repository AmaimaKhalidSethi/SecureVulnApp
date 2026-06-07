// ✅ FIX (SECURITY): Updated to use HttpOnly cookies instead of localStorage
// Cookies are sent automatically by the browser, so token management is simplified

import { createContext, useState, useContext, useCallback, useEffect } from 'react';
import API from '../api/axiosConfig';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  // Sync axios headers whenever needed
  useEffect(() => {
    API.defaults.headers.common['Accept'] = 'application/json';
  }, []);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.post('/auth/login', { email, password });
      // Token is now in HttpOnly cookie, not in response
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
      // Token is now in HttpOnly cookie, not in response
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
    setUser(null);
    setError(null);
    // Cookie is cleared by server on next 401 response or by backend logout endpoint
  }, []);

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};


export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an <AuthProvider>');
  return ctx;
};

export default AuthContext;