const express  = require('express');
const router   = express.Router();
const { protect }  = require('../middleware/authMiddleware');
const { globalLimiter, sensitiveActLimiter } = require('../middleware/rateLimitMiddleware');
const { getUserById, updateUser, deleteUser, listUsers } = require('../controllers/profileController');

router.get('/',     protect, globalLimiter,       listUsers);
router.get('/:id',  protect, globalLimiter,       getUserById);
router.put('/:id',  protect, sensitiveActLimiter, updateUser);
router.delete('/:id', protect, sensitiveActLimiter, deleteUser);

module.exports = router;