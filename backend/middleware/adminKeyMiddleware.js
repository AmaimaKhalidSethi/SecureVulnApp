module.exports = function requireAdminKey(req, res, next) {
  const provided = req.headers['x-admin-key'];
  const required = process.env.ADMIN_KEY;

  if (!required) {
    console.warn('⚠️  ADMIN_KEY not set — mode switching is unprotected');
    return next();  // allow if unconfigured (dev convenience)
  }

  if (!provided || provided !== required) {
    return res.status(403).json({
      success: false,
      error:   'Admin key required. Set X-Admin-Key header.',
      hint:    'Check ADMIN_KEY in backend/.env',
    });
  }

  next();
};
