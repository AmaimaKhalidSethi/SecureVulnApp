const express  = require('express');
const router   = express.Router();
const { body } = require('express-validator');
const { register, login, getProfile } = require('../controllers/authController');
const { protect }    = require('../middleware/authMiddleware');
const sanitize       = require('../middleware/sanitizeMiddleware');
const { authLimiter } = require('../middleware/rateLimitMiddleware');

const registerValidation = [
  body('username').trim().isLength({ min: 3, max: 20 })
    .withMessage('Username: 3–20 characters')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Letters, numbers, underscores only')
    .escape(),
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Min 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Must contain uppercase, lowercase, and number'),
];

const loginValidation = [
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password required')
    .isString().withMessage('Password must be a string'),
];

const conditionalValidation = (rules) => (req, res, next) => {
  if (req.appConfig?.input?.validateInputs) {
    return Promise.all(rules.map(rule => rule.run(req))).then(() => next());
  }
  return next();
};

router.post('/register', authLimiter, sanitize, conditionalValidation(registerValidation), register);
router.post('/login',    authLimiter, sanitize, conditionalValidation(loginValidation),    login);
router.get('/profile',   protect, getProfile);

module.exports = router;