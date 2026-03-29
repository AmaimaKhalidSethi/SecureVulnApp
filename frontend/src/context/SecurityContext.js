import { createContext, useState, useEffect, useCallback } from 'react';
import API from '../api/axiosConfig';

export const SecurityContext = createContext({
  mode:         'unknown',
  config:       null,
  isVulnerable: false,
  isSecure:     false,
  loading:      true,
  lastChecked:  null,
  refresh:      () => {},
});

export const SecurityProvider = ({ children }) => {
  const [mode,        setMode]        = useState('unknown');
  const [config,      setConfig]      = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [lastChecked, setLastChecked] = useState(null);
  const [error,       setError]       = useState(null);

  const fetchMode = useCallback(async () => {
    try {
      const res = await API.get('/mode');
      setMode(res.data.currentMode);
      setConfig(res.data.settings);
      setLastChecked(new Date());
      setError(null);
    } catch (err) {
      setError('Cannot reach backend — is the server running?');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMode(); }, [fetchMode]);

  useEffect(() => {
    const interval = setInterval(fetchMode, 30000);
    return () => clearInterval(interval);
  }, [fetchMode]);

  const value = {
    mode,
    config,
    isVulnerable: mode === 'vulnerable',
    isSecure:     mode === 'secure',
    loading,
    lastChecked,
    error,
    refresh: fetchMode,
  };

  return (
    <SecurityContext.Provider value={value}>
      {children}
    </SecurityContext.Provider>
  );
};