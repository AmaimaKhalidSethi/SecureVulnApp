const User     = require('../models/User');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { logAuthEvent }     = require('../utils/logStore');

const generateToken = (user, expiresIn) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn });

const sendError = (res, statusCode, message, details = null, verbose = false) => {
  const body = { success: false, error: message };
  if (verbose && details) body.details = details;
  return res.status(statusCode).json(body);
};

exports.register = async (req, res) => {
  const config = req.appConfig;
  try {
    if (config.input.validateInputs) {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { username, email, password, role } = req.body;

    if (config.input.validateInputs) {
      const existing = await User.findOne({ $or: [{ email }, { username }] });
      if (existing) return sendError(res, 400, 'Username or email already in use');
    }

    let storedPassword;
    if (config.auth.hashPasswords) {
      const salt = await bcrypt.genSalt(10);
      storedPassword = await bcrypt.hash(password, salt);
    } else {
      storedPassword = password;
    }

    const assignedRole = config.data.allowAdminSelfPromotion ? (role || 'user') : 'user';

    const user = await User.create({ username, email, password: storedPassword, role: assignedRole, createdInMode: config.modeName });
    const token = generateToken(user, config.auth.jwtExpiry);

    return res.status(201).json({
      success: true, mode: config.modeName, token, user: user.toSafeObject(),
      ...(config.errors.verbose && { debug: { passwordStored: storedPassword, warning: '⚠️ VULNERABLE: password visible' } }),
    });
  } catch (err) {
    return sendError(res, 500, 'Registration failed', err.message, config.errors.verbose);
  }
};

exports.login = async (req, res) => {
  const config = req.appConfig;
  try {
    if (config.input.validateInputs) {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;
    let user;

    if (!config.input.mongoSanitize) {
      user = await User.findOne({ email: req.body.email, password: req.body.password });
      console.log('⚠️  [VULNERABLE] Raw query:', { email: req.body.email, password: req.body.password });
    } else {
      user = await User.findOne({ email });
    }

    if (!user) {
      // Timing attack prevention — always run bcrypt even for missing users
      await bcrypt.compare(password || '', '$2a$10$dummyhashfordummycomparison00000');
      logAuthEvent(req, 'LOGIN_FAILED', { severity: 'MEDIUM', outcome: 'BLOCKED', email: req.body.email, reason: 'User not found' });
      return sendError(res, 401, config.errors.verbose ? 'No account found with that email' : 'Invalid credentials');
    }

    if (config.auth.enforceJwt && user.lockedUntil && user.lockedUntil > Date.now()) {
      const minutesLeft = Math.ceil((user.lockedUntil - Date.now()) / 60000);
      return sendError(res, 423, `Account locked. Try again in ${minutesLeft} minute(s).`);
    }

    let passwordMatch;
    if (config.auth.hashPasswords) {
      passwordMatch = await bcrypt.compare(password, user.password);
    } else {
      passwordMatch = (password === user.password) || (typeof password === 'object');
    }

    if (!passwordMatch) {
      if (config.auth.enforceJwt) {
        user.failedLoginAttempts += 1;
        if (user.failedLoginAttempts >= 5) {
          user.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
          await user.save();
          return sendError(res, 423, 'Too many failed attempts. Account locked for 15 minutes.');
        }
        await user.save();
      }
      logAuthEvent(req, 'LOGIN_FAILED', { severity: 'MEDIUM', outcome: 'BLOCKED', email: req.body.email, reason: 'Wrong password' });
      return sendError(res, 401, config.errors.verbose ? 'Incorrect password' : 'Invalid credentials');
    }

    if (config.auth.enforceJwt && user.failedLoginAttempts > 0) {
      user.failedLoginAttempts = 0;
      user.lockedUntil         = null;
      await user.save();
    }

    const token = generateToken(user, config.auth.jwtExpiry);

    logAuthEvent(req, 'LOGIN_SUCCESS', { severity: 'INFO', outcome: 'ALLOWED', email: user.email, userId: user._id.toString() });

    return res.status(200).json({
      success: true, mode: config.modeName, token, user: user.toSafeObject(),
      ...(config.errors.verbose && typeof req.body.password === 'object' && {
        warning: '⚠️ VULNERABLE: Login succeeded via NoSQL injection',
      }),
    });
  } catch (err) {
    return sendError(res, 500, 'Login failed', err.message, config.errors.verbose);
  }
};

exports.getProfile = async (req, res) => {
  try {
    if (req.user.id === 'bypass') {
      return res.json({ success: true, warning: '⚠️ VULNERABLE: No token required', user: { id: 'bypass', role: 'admin', username: 'ANYONE' } });
    }
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
};