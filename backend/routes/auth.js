const express  = require('express');
const router   = express.Router();
const { register, login, getProfile } = require('../controllers/authController');
const { protect }    = require('../middleware/authMiddleware');
const sanitize       = require('../middleware/sanitizeMiddleware');
const { authLimiter } = require('../middleware/rateLimitMiddleware');
const { auth: authValidation, runIfEnabled } = require('../middleware/inputValidation');

router.post('/register',
  authLimiter,
  sanitize,
  runIfEnabled(authValidation.register),
  register
);

router.post('/login',
  authLimiter,
  sanitize,
  runIfEnabled(authValidation.login),
  login
);

router.get('/profile',   protect, getProfile);

module.exports = router;