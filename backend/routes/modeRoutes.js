const express = require('express');
const router  = express.Router();
const fs      = require('fs');
const path    = require('path');
const { logModeChange } = require('../utils/logStore');

const ENV_PATH = path.join(__dirname, '../.env');

const readCurrentMode = () => {
  const env = fs.readFileSync(ENV_PATH, 'utf8');
  const match = env.match(/APP_MODE=(\w+)/);
  return match ? match[1] : 'unknown';
};

const writeMode = (newMode) => {
  let env = fs.readFileSync(ENV_PATH, 'utf8');
  env = env.replace(/APP_MODE=\w+/, `APP_MODE=${newMode}`);
  fs.writeFileSync(ENV_PATH, env);
};

router.get('/', (req, res) => {
  res.json({
    success:     true,
    currentMode: req.appMode,
    settings:    req.appConfig,
  });
});

router.post('/toggle', (req, res) => {
  const currentMode = readCurrentMode();
  const newMode     = currentMode === 'vulnerable' ? 'secure' : 'vulnerable';
  writeMode(newMode);
  logModeChange(currentMode, newMode, req);
  res.json({ success: true, message: `Switching to ${newMode} mode — server restarting` });
});

router.post('/set', (req, res) => {
  const { mode } = req.body;
  if (!['vulnerable', 'secure'].includes(mode)) {
    return res.status(400).json({ success: false, error: 'Mode must be "vulnerable" or "secure"' });
  }
  const currentMode = readCurrentMode();
  writeMode(mode);
  logModeChange(currentMode, mode, req);
  res.json({ success: true, message: `Switching to ${mode} mode — server restarting` });
});

module.exports = router;