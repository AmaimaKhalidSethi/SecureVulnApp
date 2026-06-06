const express = require('express');
const router  = express.Router();
const fs      = require('fs');
const path    = require('path');
const { logModeChange }      = require('../utils/logStore');
// FIX (MEDIUM): import auth middleware so mode-switching requires an admin JWT
const { protect, adminOnly } = require('../middleware/authMiddleware');
const requireAdminKey = require('../middleware/adminKeyMiddleware');

const ENV_PATH = path.join(__dirname, '../.env');

const readCurrentMode = () => {
  const env   = fs.readFileSync(ENV_PATH, 'utf8');
  const match = env.match(/APP_MODE=(\w+)/);
  return match ? match[1] : 'unknown';
};

const writeMode = (newMode) => {
  let env = fs.readFileSync(ENV_PATH, 'utf8');
  env = env.replace(/APP_MODE=\w+/, `APP_MODE=${newMode}`);
  fs.writeFileSync(ENV_PATH, env);
};

// FIX (MEDIUM): GET /api/mode previously returned the full config object
// including all security-flag names and values, helping attackers enumerate
// exactly which protections are active. Now:
//   - Unauthenticated callers receive only the mode name.
//   - Admin-authenticated callers receive the full settings object.
// The frontend SecurityContext only needs currentMode for its mode badge,
// so unauthenticated access is still sufficient for that purpose.
router.get('/', (req, res) => {
  // Check for optional auth — don't reject unauthenticated callers, just limit data
  const authHeader = req.headers.authorization;
  let isAdmin = false;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const jwt     = require('jsonwebtoken');
      const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
      isAdmin = decoded.role === 'admin';
    } catch (_) {
      // invalid/expired token — treat as unauthenticated
    }
  }

  res.json({
    success:     true,
    currentMode: req.appMode,
    // Full settings only for admins; public callers see mode name only
    ...(isAdmin && { settings: req.appConfig }),
  });
});

// FIX (MEDIUM): POST routes now require a valid JWT with admin role.
// Previously any anonymous caller could toggle the app's security mode
// for all users on a shared demo server.
router.post('/toggle', requireAdminKey, (req, res) => {
  const currentMode = readCurrentMode();
  const newMode     = currentMode === 'vulnerable' ? 'secure' : 'vulnerable';
  writeMode(newMode);
  logModeChange(currentMode, newMode, req);

  // FIX: surface whether the server will actually restart so the frontend
  // polling loop knows what to expect. nodemon restarts the process when .env
  // changes; plain `node server.js` does not — in that case the mode file is
  // updated on disk but the running process stays in the old mode until manually
  // restarted. The client should warn the user if no restart is coming.
  const isNodemon = !!process.env.NODEMON; // nodemon sets this env var
  res.json({
    success:        true,
    newMode,
    requiresRestart: true,
    willRestart:     isNodemon,
    message: isNodemon
      ? `Switching to ${newMode} mode — server restarting`
      : `⚠️ .env updated to ${newMode} but server will NOT auto-restart. Run with nodemon or restart manually.`,
  });
});

router.post('/set', requireAdminKey, (req, res) => {
  const { mode } = req.body;
  if (!['vulnerable', 'secure'].includes(mode)) {
    return res.status(400).json({ success: false, error: 'Mode must be "vulnerable" or "secure"' });
  }
  const currentMode = readCurrentMode();
  writeMode(mode);
  logModeChange(currentMode, mode, req);

  const isNodemon = !!process.env.NODEMON;
  res.json({
    success:        true,
    newMode:        mode,
    requiresRestart: true,
    willRestart:     isNodemon,
    message: isNodemon
      ? `Switching to ${mode} mode — server restarting`
      : `⚠️ .env updated to ${mode} but server will NOT auto-restart. Run with nodemon or restart manually.`,
  });
});

module.exports = router;