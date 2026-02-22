module.exports = {
  modeName: 'vulnerable',
  auth: {
    hashPasswords:       false,
    jwtExpiry:           '999d',
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
    enforceOwnership:       false,
    allowAdminSelfPromotion: true,
  },
};