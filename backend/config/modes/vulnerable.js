module.exports = {
  modeName: 'vulnerable',
  auth: {
    hashPasswords:       false,
    // FIX (MEDIUM): was '999d' — nearly 3-year tokens compounded the token-harvesting
    // risk significantly. '1d' still demonstrates the contrast with secure mode's 15m
    // without creating multi-year credentials during teaching sessions.
    jwtExpiry:           '1d',
    enforceJwt:          false,
    allowWeakPasswords:  true,
  },
  input: {
    sanitizeInputs:  false,
    validateInputs:  false,
    mongoSanitize:   false,
  },
  rateLimit: {
    enabled: false,
  },
  errors: {
    verbose:            true,
    exposeMongoErrors:  true,
  },
  headers: {
    useHelmet:   false,
    corsOrigin:  '*',
  },
  data: {
    enforceOwnership:        false,
    allowAdminSelfPromotion: true,
  },
};