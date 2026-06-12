const express  = require('express');
const cors     = require('cors');
const cookieParser = require('cookie-parser');
const dotenv   = require('dotenv');

dotenv.config();

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error('FATAL: JWT_SECRET is missing or too short (must be 32+ chars). Refusing to start.');
  process.exit(1);
}
if (process.env.JWT_SECRET === 'supersecretkey123changeInProduction') {
  console.warn('⚠️  WARNING: Default JWT_SECRET detected. Change this before any non-local use.');
}

const connectDB              = require('./config/db');
const appConfig              = require('./config/appConfig');
const modeMiddleware         = require('./middleware/modeMiddleware');
const modeRoutes             = require('./routes/modeRoutes');
const securityLogger         = require('./middleware/securityLogger');
const { globalLimiter }      = require('./middleware/rateLimitMiddleware');
const { applySecurityHeaders,
        getExpectedHeaders } = require('./middleware/helmetConfig');

connectDB();

const app = express();

// ── Security Headers ──────────────────────────────────────
app.use(applySecurityHeaders);

// ── CORS ──────────────────────────────────────────────────
const corsOptions = {
  origin: (origin, callback) => {
    const currentMode = process.env.APP_MODE || 'vulnerable';
    if (currentMode === 'vulnerable') {
      console.log(`⚠️  [VULNERABLE] CORS: allowing origin: ${origin || 'null/file://'}`);
      callback(null, true);
    } else {
      const allowed = ['http://localhost:3000', 'http://localhost:5173'];
      if (!origin || allowed.includes(origin)) {
        callback(null, true);
      } else {
        console.log(`🔒 [SECURE] CORS blocked origin: ${origin}`);
        callback(new Error(`CORS blocked: ${origin} not allowed`));
      }
    }
  },
  methods:        ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  credentials:    true,
};

app.use(cors(corsOptions));
app.options(/(.*)/,  cors(corsOptions));

// ── Body Parser ───────────────────────────────────────────
app.use(express.json());

const sanitize       = require('../middleware/sanitizeMiddleware');
app.use(require('./middleware/sanitizeMiddleware'));  // apply globally
app.use(cookieParser());

// ── Mode Middleware ───────────────────────────────────────
app.use(modeMiddleware);

// ── Security Logger ───────────────────────────────────────
app.use(securityLogger);

// ── Rate Limiting ─────────────────────────────────────────
app.use(globalLimiter);

// ── Routes ────────────────────────────────────────────────
app.use('/api/mode',     modeRoutes);
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/user',     require('./routes/userRoutes'));
app.use('/api/users',    require('./routes/profileRoutes'));
app.use('/api/logs',     require('./routes/logsRoutes'));
app.use('/api/redteam',  require('./routes/redteamRoutes'));

// ── Headers Info Endpoint ─────────────────────────────────
app.get('/api/headers', (req, res) => {
  const mode = process.env.APP_MODE || 'vulnerable';
  res.json({
    mode,
    expectedHeaders: getExpectedHeaders(mode),
    instruction: 'Use browser DevTools F12 → Network → Response Headers to verify',
  });
});

// ── Root Health Check ─────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    message: '🛡️ SecureVulnApp API',
    mode:    appConfig.modeName,
    version: '1.0.0',
  });
});

// ── Global Error Handler ──────────────────────────────────
app.use((err, req, res, next) => {
  const currentMode = process.env.APP_MODE || 'vulnerable';
  if (currentMode === 'vulnerable') {
    res.status(500).json({ error: err.message, stack: err.stack });
  } else {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Start Server ──────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📋 Mode API:    http://localhost:${PORT}/api/mode`);
  console.log(`🔄 Toggle mode: POST http://localhost:${PORT}/api/mode/toggle\n`);
});


const { parameterLimit } = require('./config/secure');
   app.use(express.urlencoded({ extended: true, parameterLimit: parameterLimit || 1000 }));