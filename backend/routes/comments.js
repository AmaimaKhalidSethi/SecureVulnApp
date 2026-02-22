const express  = require('express');
const router   = express.Router();
const { protect }  = require('../middleware/authMiddleware');
const { globalLimiter, sensitiveActLimiter } = require('../middleware/rateLimitMiddleware');
const { createComment, getComments, search } = require('../controllers/commentController');

router.post('/',       protect, sensitiveActLimiter, createComment);
router.get('/',        globalLimiter, getComments);
router.get('/search',  globalLimiter, search);

module.exports = router;