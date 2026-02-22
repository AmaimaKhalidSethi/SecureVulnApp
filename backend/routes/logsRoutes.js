const express  = require('express');
const router   = express.Router();
const { getLogs, getStats, clearLogs } = require('../utils/logStore');

router.get('/', (req, res) => {
  const logs = getLogs({
    severity: req.query.severity,
    event:    req.query.event,
    outcome:  req.query.outcome,
    limit:    req.query.limit || 100,
  });
  res.json({ success: true, count: logs.length, filters: req.query, logs });
});

router.get('/stats',   (req, res) => res.json({ success: true, stats: getStats() }));
router.get('/attacks', (req, res) => {
  const logs = getLogs({ severity: 'HIGH', limit: 50 });
  res.json({ success: true, count: logs.length, logs });
});
router.delete('/', (req, res) => res.json({ success: true, ...clearLogs() }));

module.exports = router;