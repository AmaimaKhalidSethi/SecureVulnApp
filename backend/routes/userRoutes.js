const express  = require('express');
const router   = express.Router();
const { protect }  = require('../middleware/authMiddleware');
const { verifyCsrfToken, issueCsrfToken } = require('../middleware/csrfMiddleware');
const { sensitiveActLimiter, csrfTokenLimiter } = require('../middleware/rateLimitMiddleware');
const { changePassword, changeEmail, deleteAccount, transfer } = require('../controllers/userController');

router.get('/csrf-token',      protect, csrfTokenLimiter, issueCsrfToken);
router.post('/change-password', protect, sensitiveActLimiter, verifyCsrfToken, changePassword);
router.post('/change-email',    protect, sensitiveActLimiter, verifyCsrfToken, changeEmail);
router.post('/delete-account',  protect, sensitiveActLimiter, verifyCsrfToken, deleteAccount);
router.post('/transfer',        protect, sensitiveActLimiter, verifyCsrfToken, transfer);

module.exports = router;