const fs   = require('fs');
const path = require('path');

const LOG_DIR      = path.join(__dirname, '../logs');
const SECURITY_LOG = path.join(LOG_DIR, 'security.log');
const ATTACKS_LOG  = path.join(LOG_DIR, 'attacks.log');

if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

const MAX_MEMORY_LOGS = 500;
let memoryLogs = [];

const SEVERITY = {
  INFO:     { level: 0, color: 'ℹ️ ' },
  LOW:      { level: 1, color: '🟡' },
  MEDIUM:   { level: 2, color: '🟠' },
  HIGH:     { level: 3, color: '🔴' },
  CRITICAL: { level: 4, color: '💀' },
};

const writeLog = (entry) => {
  const logEntry = {
    id:        `${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    timestamp: new Date().toISOString(),
    ...entry,
  };

  const severityInfo = SEVERITY[logEntry.severity] || SEVERITY.INFO;
  const logLine      = JSON.stringify(logEntry) + '\n';

  fs.appendFile(SECURITY_LOG, logLine, (err) => {
    if (err) console.error('Failed to write security log:', err);
  });

  if (severityInfo.level >= SEVERITY.HIGH.level) {
    fs.appendFile(ATTACKS_LOG, logLine, (err) => {
      if (err) console.error('Failed to write attack log:', err);
    });
  }

  memoryLogs.unshift(logEntry);
  if (memoryLogs.length > MAX_MEMORY_LOGS) {
    memoryLogs = memoryLogs.slice(0, MAX_MEMORY_LOGS);
  }

  console.log(
    `${severityInfo.color} [SECURITY] ${logEntry.severity} | ` +
    `${logEntry.event} | ${logEntry.ip || 'unknown'} | ${logEntry.route || ''}`
  );

  return logEntry;
};

const logInjectionAttempt = (req, payload, blocked) => writeLog({
  event:    'NOSQL_INJECTION_ATTEMPT',
  severity: 'CRITICAL',
  outcome:  blocked ? 'BLOCKED' : 'ALLOWED',
  ip:       req.ip,
  route:    `${req.method} ${req.path}`,
  userId:   req.user?.id || 'unauthenticated',
  payload:  JSON.stringify(payload),
  mode:     process.env.APP_MODE,
});

const logXssAttempt = (req, content, sanitized) => writeLog({
  event:      'XSS_ATTEMPT',
  severity:   'HIGH',
  outcome:    sanitized ? 'SANITIZED' : 'STORED_RAW',
  ip:         req.ip,
  route:      `${req.method} ${req.path}`,
  userId:     req.user?.id || 'unauthenticated',
  rawPayload: content.substring(0, 200),
  mode:       process.env.APP_MODE,
});

const logCsrfFailure = (req, reason) => writeLog({
  event:    'CSRF_VALIDATION_FAILED',
  severity: 'HIGH',
  outcome:  'BLOCKED',
  ip:       req.ip,
  route:    `${req.method} ${req.path}`,
  origin:   req.headers.origin || 'none',
  referer:  req.headers.referer || 'none',
  reason,
  mode:     process.env.APP_MODE,
});

const logIdorAttempt = (req, targetId, blocked) => writeLog({
  event:       'IDOR_ATTEMPT',
  severity:    'HIGH',
  outcome:     blocked ? 'BLOCKED' : 'ALLOWED',
  ip:          req.ip,
  route:       `${req.method} ${req.path}`,
  requesterId: req.user?.id || 'unauthenticated',
  targetId,
  mode:        process.env.APP_MODE,
});

const logAuthEvent = (req, eventType, details = {}) => writeLog({
  event:    eventType,
  severity: details.severity || 'MEDIUM',
  outcome:  details.outcome  || 'UNKNOWN',
  ip:       req.ip,
  route:    `${req.method} ${req.path}`,
  email:    details.email    || 'unknown',
  userId:   details.userId   || 'unknown',
  reason:   details.reason   || undefined,
  mode:     process.env.APP_MODE,
});

const logRateLimit = (req) => writeLog({
  event:    'RATE_LIMIT_EXCEEDED',
  severity: 'MEDIUM',
  outcome:  'BLOCKED',
  ip:       req.ip,
  route:    `${req.method} ${req.path}`,
  mode:     process.env.APP_MODE,
});

const logModeChange = (oldMode, newMode, req) => writeLog({
  event:    'MODE_CHANGED',
  severity: 'INFO',
  outcome:  'APPLIED',
  ip:       req?.ip || 'system',
  oldMode,
  newMode,
});

const logGeneric = (event, severity, req, details = {}) => writeLog({
  event,
  severity,
  ip:    req?.ip || 'system',
  route: req ? `${req.method} ${req.path}` : 'system',
  ...details,
});

const getLogs = (filters = {}) => {
  let logs = [...memoryLogs];
  if (filters.severity) {
    const minLevel = SEVERITY[filters.severity]?.level || 0;
    logs = logs.filter(l => (SEVERITY[l.severity]?.level || 0) >= minLevel);
  }
  if (filters.event)   logs = logs.filter(l => l.event.includes(filters.event.toUpperCase()));
  if (filters.outcome) logs = logs.filter(l => l.outcome === filters.outcome.toUpperCase());
  if (filters.limit)   logs = logs.slice(0, parseInt(filters.limit));
  return logs;
};

const getStats = () => {
  const total   = memoryLogs.length;
  const attacks = memoryLogs.filter(l => ['HIGH','CRITICAL'].includes(l.severity)).length;
  const blocked = memoryLogs.filter(l => l.outcome === 'BLOCKED').length;
  const allowed = memoryLogs.filter(l => l.outcome === 'ALLOWED').length;
  const byEvent    = memoryLogs.reduce((a, l) => { a[l.event]    = (a[l.event]    || 0) + 1; return a; }, {});
  const bySeverity = memoryLogs.reduce((a, l) => { a[l.severity] = (a[l.severity] || 0) + 1; return a; }, {});
  return { total, attacks, blocked, allowed, byEvent, bySeverity };
};

const clearLogs = () => {
  memoryLogs = [];
  return { cleared: true, timestamp: new Date().toISOString() };
};

module.exports = {
  logInjectionAttempt, logXssAttempt, logCsrfFailure,
  logIdorAttempt, logAuthEvent, logRateLimit,
  logModeChange, logGeneric, getLogs, getStats, clearLogs, writeLog,
};