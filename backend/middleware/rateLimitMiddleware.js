const rateLimit      = require('express-rate-limit');
const { logRateLimit } = require('../utils/logStore');
const appConfig      = require('../config/appConfig');

const createLimiter = (options) => {
  const realLimiter = rateLimit({
    windowMs:        options.windowMs,
    max:             options.max,
    standardHeaders: true,
    legacyHeaders:   false,
    handler: (req, res) => {
      logRateLimit(req);
      res.status(429).json({
        success:    false,
        error:      'Too many requests — slow down',
        retryAfter: Math.ceil(options.windowMs / 1000 / 60) + ' minutes',
        limit:      options.max,
        mode:       appConfig.modeName,
      });
    },
  });

  const wrapper = (req, res, next) => {
    if (!appConfig.rateLimit.enabled) return next();
    return realLimiter(req, res, next);
  };

  return wrapper;
};

const globalLimiter       = createLimiter({ windowMs: 15 * 60 * 1000, max: 200 });
const authLimiter         = createLimiter({ windowMs: 15 * 60 * 1000, max: 10  });
const sensitiveActLimiter = createLimiter({ windowMs: 60 * 60 * 1000, max: 5   });
const csrfTokenLimiter    = createLimiter({ windowMs: 15 * 60 * 1000, max: 30  });

module.exports = { globalLimiter, authLimiter, sensitiveActLimiter, csrfTokenLimiter };