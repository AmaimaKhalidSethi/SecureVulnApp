import API from '../api/axiosConfig';

let cachedToken    = null;
let tokenFetchedAt = null;
let _interceptorId = null;

const TOKEN_CACHE_MS = 50 * 60 * 1000;

export const getCsrfToken = async () => {
  const now     = Date.now();
  const isStale = !tokenFetchedAt || (now - tokenFetchedAt) > TOKEN_CACHE_MS;
  if (cachedToken && !isStale) return cachedToken;
  try {
    const res      = await API.get('/user/csrf-token');
    cachedToken    = res.data.csrfToken;
    tokenFetchedAt = now;
    return cachedToken;
  } catch (err) {
    console.error('[CSRF] Token fetch failed:', err.message);
    cachedToken    = null;
    tokenFetchedAt = null;
    return null;
  }
};

export const clearCsrfToken = () => {
  cachedToken    = null;
  tokenFetchedAt = null;
};

const setupCsrfInterceptor = () => {
  if (_interceptorId !== null) {
    console.warn('[CSRF] Interceptor already registered — skipping duplicate registration');
    return;
  }

  _interceptorId = API.interceptors.request.use(
    async (config) => {
      const mutating = ['post', 'put', 'delete', 'patch'];
      if (!mutating.includes(config.method?.toLowerCase())) return config;

      try {
        const token = await getCsrfToken();
        if (token) {
          config.headers['X-CSRF-Token'] = token;
        }
      } catch (err) {
        // Degrade gracefully — server will respond with 403 and a clear error message
        console.warn('[CSRF] Could not fetch token, proceeding without it:', err?.message);
      }

      return config;
    },
    (error) => Promise.reject(error)  // pass request errors through unchanged
  );

  console.log('[CSRF] Request interceptor registered (id:', _interceptorId, ')');
};

export const teardownCsrfInterceptor = () => {
  if (_interceptorId !== null) {
    API.interceptors.request.eject(_interceptorId);
    _interceptorId = null;
  }
};

export { setupCsrfInterceptor };

// Auto-register when the module is first imported
setupCsrfInterceptor();