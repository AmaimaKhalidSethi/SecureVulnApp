// middleware/modeMiddleware.js
// ============================================================
// MODE MIDDLEWARE
// Attaches current app config to req.appConfig on every request.
// Usage in any route: req.appConfig.auth.hashPasswords
// ============================================================

const appConfig = require('../config/appConfig');

const modeMiddleware = (req, res, next) => {
  req.appConfig = appConfig;
  req.appMode   = appConfig.modeName;
  next();
};

module.exports = modeMiddleware;