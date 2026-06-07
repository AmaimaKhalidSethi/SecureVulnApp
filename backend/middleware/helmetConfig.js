const helmet = require('helmet');
const appConfig = require('../config/appConfig');

const vulnerableHeaders = (req, res, next) => {
  console.log(`⚠️  [VULNERABLE] No security headers set for ${req.path}`);
  next();
};

const secureHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:  ["'self'"],
      scriptSrc:   ["'self'"],
      styleSrc:    ["'self'"],
      imgSrc:      ["'self'", "data:", "blob:"],
      fontSrc:     ["'self'"],
      connectSrc:  ["'self'", "http://localhost:5000", "ws://localhost:3000"],
      frameSrc:    ["'none'"],
      frameAncestors: ["'none'"],
      formAction:  ["'self'"],
      objectSrc:   ["'none'"],
      baseUri:     ["'self'"],
      upgradeInsecureRequests: [],
    },
  },
  xFrameOptions:              { action: 'deny' },
  strictTransportSecurity:    { maxAge: 31536000, includeSubDomains: true, preload: true },
  xContentTypeOptions:        true,
  xssProtection:              true,
  referrerPolicy:             { policy: 'strict-origin-when-cross-origin' },
  permittedCrossDomainPolicies: { permittedPolicies: 'none' },
  dnsPrefetchControl:         { allow: false },
  crossOriginEmbedderPolicy:  false,
  crossOriginOpenerPolicy:    { policy: 'same-origin' },
  crossOriginResourcePolicy:  { policy: 'same-site' },
});

const applySecurityHeaders = (req, res, next) => {
  if (!appConfig.headers.useHelmet) return vulnerableHeaders(req, res, next);
  return secureHeaders(req, res, next);
};

const getExpectedHeaders = (mode) => {
  if (mode === 'vulnerable') {
    return {
      'Content-Security-Policy':     '❌ NOT SET',
      'X-Frame-Options':             '❌ NOT SET',
      'Strict-Transport-Security':   '❌ NOT SET',
      'X-Content-Type-Options':      '❌ NOT SET',
      'X-XSS-Protection':            '❌ NOT SET',
      'Referrer-Policy':             '❌ NOT SET',
      'Permissions-Policy':          '❌ NOT SET',
    };
  }
  return {
    'Content-Security-Policy':     "✅ default-src 'self'",
    'X-Frame-Options':             '✅ DENY',
    'Strict-Transport-Security':   '✅ max-age=31536000',
    'X-Content-Type-Options':      '✅ nosniff',
    'X-XSS-Protection':            '✅ 1; mode=block',
    'Referrer-Policy':             '✅ strict-origin-when-cross-origin',
    'Permissions-Policy':          '✅ camera=(), microphone=()',
  };
};

module.exports = { applySecurityHeaders, getExpectedHeaders };