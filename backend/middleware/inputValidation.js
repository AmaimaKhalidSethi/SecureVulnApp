// middleware/inputValidation.js
// ============================================================
// CENTRALIZED INPUT VALIDATION RULES
//
// All express-validator rules live here.
// Routes import what they need — no duplication.
//
// Why centralized?
// If you define the same email validation in 3 routes and
// a bypass is found, you must fix it in 3 places.
// Centralized = fix once, fixed everywhere.
// ============================================================

const { body, param, query } = require('express-validator');

// ── Auth validations ─────────────────────────────────────────
const auth = {
  register: [
    body('username')
      .trim()
      .isLength({ min: 3, max: 20 })
      .withMessage('Username: 3–20 characters')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username: letters, numbers, underscores only')
      .escape(),
    body('email')
      .isEmail()
      .withMessage('Valid email required')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password: minimum 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password: must contain uppercase, lowercase, and number'),
    body('role')
      .optional()
      .custom((value) => {
        // Role from client is always ignored server-side
        // but we validate it here to prevent prototype pollution
        if (value && !['user', 'admin'].includes(value)) {
          throw new Error('Invalid role value');
        }
        return true;
      }),
  ],

  login: [
    body('email')
      .isEmail()
      .withMessage('Valid email required')
      .normalizeEmail(),
    body('password')
      .notEmpty()
      .withMessage('Password required')
      .isString()
      .withMessage('Password must be a string'),  // blocks object injection
  ],
};

// ── Comment validations ───────────────────────────────────────
const comments = {
  create: [
    body('content')
      .notEmpty()
      .withMessage('Comment content required')
      .isLength({ max: 2000 })
      .withMessage('Comment too long — max 2000 characters'),
    body('author')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Author name too long')
      .escape(),
  ],

  search: [
    query('q')
      .optional()
      .isLength({ max: 200 })
      .withMessage('Search query too long'),
  ],
};

// ── Profile validations ───────────────────────────────────────
const profile = {
  update: [
    param('id')
      .isMongoId()
      .withMessage('Invalid user ID format'),
    body('username')
      .optional()
      .trim()
      .isLength({ min: 3, max: 20 })
      .withMessage('Username: 3–20 characters')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username: letters, numbers, underscores only'),
    body('email')
      .optional()
      .isEmail()
      .withMessage('Valid email required')
      .normalizeEmail(),
    // Explicitly block sensitive fields in validation layer
    body('password').not().exists().withMessage('Cannot update password via this endpoint'),
    body('role').not().exists().withMessage('Cannot update role via this endpoint'),
  ],

  idParam: [
    param('id')
      .isMongoId()
      .withMessage('Invalid ID format'),
  ],
};

// ── Generic validation runner ─────────────────────────────────
// Use this when you need to conditionally apply validation
const runIfEnabled = (rules) => async (req, res, next) => {
  if (req.appConfig?.input?.validateInputs) {
    await Promise.all(rules.map(rule => rule.run(req)));
  }
  return next();
};

module.exports = { auth, comments, profile, runIfEnabled };