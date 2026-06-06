const express  = require('express');
const router   = express.Router();
const csrf     = require('csurf');
const { protect }  = require('../middleware/authMiddleware');
const { globalLimiter, sensitiveActLimiter } = require('../middleware/rateLimitMiddleware');
const { createComment, getComments, search } = require('../controllers/commentController');

// ✅ FIX (SECURITY): Add CSRF token endpoint so frontend can get a token before submitting
router.get('/csrf-token', (req, res) => {
  try {
    // Use the csrf middleware to generate a token
    const csrfProtection = csrf({ cookie: false });
    csrfProtection(req, res, () => {
      res.json({ csrfToken: req.csrfToken() });
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to generate CSRF token' });
  }
});

router.post('/',       protect, sensitiveActLimiter, createComment);
router.get('/',        globalLimiter, getComments);
router.get('/search',  globalLimiter, search);

module.exports = router;