import API from '../api/axiosConfig';

let cachedToken    = null;
let tokenFetchedAt = null;

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
    console.error('Failed to fetch CSRF token:', err);
    cachedToken    = null;
    tokenFetchedAt = null;
    return null;
  }
};

export const clearCsrfToken = () => {
  cachedToken    = null;
  tokenFetchedAt = null;
};

API.interceptors.request.use(async (config) => {
  const mutating = ['post', 'put', 'delete', 'patch'];
  if (mutating.includes(config.method?.toLowerCase())) {
    const token = await getCsrfToken();
    if (token) config.headers['X-CSRF-Token'] = token;
  }
  return config;
});