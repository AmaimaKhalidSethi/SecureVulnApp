// config/modes/secure.js
// ============================================================
// SECURE MODE SETTINGS
// Production-grade security settings. This is what real
// applications should use.
// ============================================================

module.exports = {
  modeName: 'secure',

  // --- Authentication ---
  auth: {
    hashPasswords: true,           // bcrypt hash all passwords
    jwtExpiry: '15m',              // Short-lived tokens
    enforceJwt: true,              // All protected routes require valid JWT
    allowWeakPasswords: false,     // Enforce strong password policy
  },

  // --- Input Handling ---
  input: {
    sanitizeInputs: true,          // Sanitize all user input
    validateInputs: true,          // Validate types, lengths, formats
    mongoSanitize: true,           // Strip $ and . from input (NoSQL injection)
    parameterLimit: 20,            // Strict parameter limit
  },

  // --- Rate Limiting ---
  rateLimit: {
    enabled: true,                 // Enable rate limiting
    windowMs: 15 * 60 * 1000,     // 15-minute window
    max: 20,                       // Max 20 requests per window per IP
  },

  // --- Error Handling ---
  errors: {
    verbose: false,                // Generic error messages only
    exposeMongoErrors: false,      // Never leak DB details
  },

  // --- HTTP Headers ---
  headers: {
    useHelmet: true,               // Full Helmet.js header protection
    corsOrigin: 'http://localhost:3000', // Strict CORS origin
  },

  // --- User Data ---
  data: {
    enforceOwnership: true,        // Users can only access their own data
    allowAdminSelfPromotion: false,// Admin role requires server-side assignment
  },
};