const jwt    = require('jsonwebtoken');
const config = require('../config/appConfig');

let bypassLogged = false;

const protect = (req, res, next) => {

  if (!config.auth.enforceJwt) {
    if (!bypassLogged) {
      const { logAuthEvent } = require('../utils/logStore');
      logAuthEvent(req, 'AUTH_BYPASS_ACTIVE', {
        severity: 'CRITICAL',
        outcome:  'ALLOWED',
        reason:   'enforceJwt disabled — all routes open',
      });
      bypassLogged = true;
    }
    req.user = { id: 'bypass', role: 'admin' };
    return next();
  }

  bypassLogged = false;

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error:   'Authentication required',
    });
  }

  const token = authHeader.split(' ')[1];

  if (!token || token.split('.').length !== 3) {
    return res.status(401).json({
      success: false,
      error:   'Invalid token format',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error:   'Session expired — please log in again',
        code:    'TOKEN_EXPIRED',
      });
    }
    return res.status(401).json({
      success: false,
      error:   'Invalid authentication token',
      code:    'TOKEN_INVALID',
    });
  }
};

const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error:   'Administrator access required',
    });
  }
  next();
};

module.exports = { protect, adminOnly };