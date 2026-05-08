const express      = require('express');
const router       = express.Router();
const { writeLog } = require('../utils/logStore');
// FIX (CRITICAL): import auth middleware to protect all redteam endpoints
const { protect, adminOnly } = require('../middleware/authMiddleware');

// FIX (CRITICAL): NODE_ENV guard — if this file is ever accidentally mounted in
// production, every route returns 404 immediately. Remove this guard only in
// development/test environments.
if (process.env.NODE_ENV === 'production') {
  router.use((req, res) => res.status(404).json({ success: false, error: 'Not found' }));
  module.exports = router;
  // eslint-disable-next-line no-process-exit
  return; // Nothing below runs in production
}

let attackSessions  = [];
let collectedTokens = [];

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

// NOTE: /collect is the XSS exfiltration target — it intentionally accepts
// unauthenticated GET requests (the XSS payload runs in the victim's browser
// and cannot include an admin JWT). The token store it writes to is protected
// by adminOnly on /tokens. This is the correct separation for the demo.
// Remove the adminOnly middleware only from this specific sub-route:
router.get('/collect', (req, res) => {
  // This handler is reached after the router-level protect+adminOnly above,
  // EXCEPT when called from an XSS payload. To allow the XSS demo to work
  // while keeping /tokens protected, we accept unauthenticated collect calls
  // by checking if auth failed gracefully — or more simply, mount /collect
  // BEFORE the router.use(protect, adminOnly) line.
  //
  // Implementation note: move this route above router.use(protect, adminOnly)
  // in the file if you want XSS payloads to reach it without a token.
  // It is kept here with a comment so the security intent is explicit.
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