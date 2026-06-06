import { createContext, useState, useEffect, useCallback, useRef } from 'react';
import API from '../api/axiosConfig';

export const SecurityContext = createContext({
  mode:         'unknown',
  config:       null,
  isVulnerable: false,
  isSecure:     false,
  loading:      true,
  lastChecked:  null,
  error:        null,
  refresh:      () => {},
});

// FIX (INFO): Added exponential back-off on repeated fetch failures.
// Previously the 30-second setInterval kept hammering the server even when it
// was offline (e.g. restarting after a mode switch), generating noise and
// unnecessary network load. Back-off caps at 5 minutes.
const BASE_POLL_MS  = 30_000;   // 30 s when healthy
const MAX_POLL_MS   = 300_000;  // 5 min max back-off
const BACKOFF_FACTOR = 2;

export const SecurityProvider = ({ children }) => {
  const [mode,        setMode]        = useState('unknown');
  const [config,      setConfig]      = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [lastChecked, setLastChecked] = useState(null);
  const [error,       setError]       = useState(null);

  // Track consecutive failures for back-off calculation
  const failCount = useRef(0);
  const timerRef  = useRef(null);

  const scheduleNext = useCallback((failed) => {
    if (timerRef.current) clearTimeout(timerRef.current);

    const delay = failed
      ? Math.min(BASE_POLL_MS * Math.pow(BACKOFF_FACTOR, failCount.current), MAX_POLL_MS)
      : BASE_POLL_MS;

    timerRef.current = setTimeout(fetchMode, delay); // eslint-disable-line no-use-before-define
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchMode = useCallback(async () => {
    try {
      const res = await API.get('/mode');
      setMode(res.data.currentMode);
      // settings is only returned to admin-authenticated callers (verified server-side).
      // The null-guard here handles unauthenticated access gracefully — config stays null,
      // and SecurityDashboard will show a "login as admin to see settings" message.
      if (res.data.settings) setConfig(res.data.settings);
      setLastChecked(new Date());
      setError(null);
      failCount.current = 0;
      scheduleNext(false);
    } catch (err) {
      failCount.current += 1;
      setError('Cannot reach backend — is the server running?');
      scheduleNext(true);
    } finally {
      setLoading(false);
    }
  }, [scheduleNext]);

  // Initial fetch on mount
  useEffect(() => {
    fetchMode();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
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