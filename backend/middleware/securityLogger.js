const { logInjectionAttempt, logXssAttempt, logGeneric } = require('../utils/logStore');

const NOSQL_PATTERNS = [
  /\$where/i, /\$gt/i, /\$lt/i, /\$ne/i,
  /\$in/i, /\$nin/i, /\$or/i, /\$and/i,
  /\$regex/i, /\$exists/i,
];

const XSS_PATTERNS = [
  /<script[\s\S]*?>/i, /javascript:/i, /onerror\s*=/i,
  /onload\s*=/i, /onclick\s*=/i, /onmouseover\s*=/i,
  /<img[^>]+src[^>]*>/i, /<svg[\s\S]*?>/i,
  /eval\s*\(/i, /document\.cookie/i,
  /document\.location/i, /window\.location/i, /alert\s*\(/i,
];

const PATH_TRAVERSAL_PATTERNS = [/\.\.\//, /\.\.%2f/i, /%2e%2e/i];

const scanValue = (value, patterns) => {
  if (typeof value === 'string')  return patterns.some(p => p.test(value));
  if (typeof value === 'object' && value !== null) {
    return Object.values(value).some(v => scanValue(v, patterns));
  }
  return false;
};

const hasMongoOperators = (obj) => {
  if (typeof obj !== 'object' || obj === null) return false;
  return Object.keys(obj).some(k => k.startsWith('$') || hasMongoOperators(obj[k]));
};

const securityLogger = (req, res, next) => {
  const body     = req.body   || {};
  const query    = req.query  || {};
  const params   = req.params || {};
  const allInput = { ...body, ...query, ...params };
  const mode     = process.env.APP_MODE || 'vulnerable';

  if (hasMongoOperators(body) || scanValue(allInput, NOSQL_PATTERNS)) {
    logInjectionAttempt(req, body, mode === 'secure');
  }

  if (scanValue(allInput, XSS_PATTERNS)) {
    logXssAttempt(req, JSON.stringify(body).substring(0, 200), mode === 'secure');
  }

  if (scanValue({ url: req.url }, PATH_TRAVERSAL_PATTERNS)) {
    logGeneric('PATH_TRAVERSAL_ATTEMPT', 'HIGH', req, {
      outcome: 'DETECTED',
      url:     req.url,
    });
  }

  next();
};

module.exports = securityLogger;