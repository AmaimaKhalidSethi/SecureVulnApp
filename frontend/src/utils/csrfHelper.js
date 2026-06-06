import API from '../api/axiosConfig';

let cachedToken    = null;
let tokenFetchedAt = null;
let interceptorId  = null;

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

export const setupCsrfInterceptor = () => {
  if (interceptorId !== null) return;  // already registered — don't register twice
  interceptorId = API.interceptors.request.use(async (config) => {
    const mutating = ['post', 'put', 'delete', 'patch'];
    if (!mutating.includes(config.method?.toLowerCase())) return config;
    try {
      const token = await getCsrfToken();
      if (token) config.headers['X-CSRF-Token'] = token;
    } catch (err) {
      console.warn('[CSRF] Attaching token failed — proceeding without it:', err.message);
    }
    return config;
  });
};

// Auto-register when this module is imported
setupCsrfInterceptor();