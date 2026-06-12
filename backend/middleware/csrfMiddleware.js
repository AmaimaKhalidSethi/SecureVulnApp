const { v4: uuidv4 } = require('uuid');
const config          = require('../config/appConfig');

const tokenStore = new Map();

const TOKEN_MAX_AGE_MS = 60 * 60 * 1000;
const TOKEN_EXPIRY_MS  = 60 * 60 * 1000;

setInterval(() => {
  const now     = Date.now();
  let   cleaned = 0;
  for (const [key, value] of tokenStore.entries()) {
    const tokenAge = now - new Date(value.createdAt).getTime();
    if (tokenAge > TOKEN_MAX_AGE_MS) {
      tokenStore.delete(key);
      cleaned++;
    }
  }
  if (cleaned > 0) {
    console.log(`🧹 CSRF token cleanup: removed ${cleaned} expired tokens`);
  }
}, 10 * 60 * 1000);

const generateCsrfToken = (sessionId) => {
  const token = uuidv4();
  tokenStore.set(sessionId, {
    token,
    createdAt: new Date().toISOString(),
    expiresAt: Date.now() + TOKEN_EXPIRY_MS,
  });
  return token;
};

const validateCsrfToken = (sessionId, submittedToken) => {
  const stored = tokenStore.get(sessionId);
  if (!stored)                         return { valid: false, reason: 'No token found for session' };
  if (Date.now() > stored.expiresAt)   return { valid: false, reason: 'Token expired' };
  if (stored.token !== submittedToken) return { valid: false, reason: 'Token mismatch' };
  return { valid: true };
};

const issueCsrfToken = (req, res) => {
  const authHeader = req.headers.authorization || '';
  const sessionId  = authHeader || req.ip;
  const token      = generateCsrfToken(sessionId);
  res.json({
    csrfToken:    token,
    expiresIn:    '1 hour',
    instructions: 'Include this token in X-CSRF-Token header for all POST/PUT/DELETE requests',
  });
};

const verifyCsrfToken = (req, res, next) => {

  if (!config.input.sanitizeInputs) {
    console.log('⚠️  [VULNERABLE] CSRF check skipped');
    return next();
  }

  const origin        = req.headers.origin  || '';
  const referer       = req.headers.referer || '';
  const allowedOrigin = 'http://localhost:3000';
  const originOk      = origin === allowedOrigin || referer.startsWith(allowedOrigin);

  if (!originOk && origin !== '') {
     return res.status(403).json({ message: 'Forbidden: invalid origin' });
  }

  const submittedToken = req.headers['x-csrf-token'];
  const authHeader     = req.headers.authorization || '';
  const sessionId      = authHeader || req.ip;

  if (!submittedToken) {
    return res.status(403).json({
      message: 'CSRF validation failed: no X-CSRF-Token header',
    });
  }

  const { valid, reason } = validateCsrfToken(sessionId, submittedToken);

  if (!valid) {
    const { logCsrfFailure } = require('../utils/logStore');
    logCsrfFailure(req, reason);
    return res.status(403).json({
      success: false,
      error:   `CSRF validation failed: ${reason}`,
    });
  }

  console.log('🔒 CSRF token verified successfully');
  next();
};

module.exports = { issueCsrfToken, verifyCsrfToken, generateCsrfToken };