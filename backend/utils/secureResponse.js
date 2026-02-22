const ok = (res, data = {}, statusCode = 200) =>
  res.status(statusCode).json({ success: true, ...data });

const created = (res, data = {}) => ok(res, data, 201);

const error = (res, statusCode, message, options = {}) => {
  const { verbose = false, details = null, code = null } = options;
  const body = { success: false, error: message };
  if (verbose && details) body.details = details;
  if (code)               body.code    = code;
  return res.status(statusCode).json(body);
};

const unauthorized    = (res, message = 'Authentication required') => error(res, 401, message);
const forbidden       = (res, message = 'Access denied')           => error(res, 403, message);
const notFound        = (res, message = 'Resource not found')      => error(res, 404, message);
const badRequest      = (res, message = 'Invalid request', details = null) => error(res, 400, message, { details });
const tooManyRequests = (res, retryAfter = '15 minutes') => error(res, 429, 'Too many requests', { details: { retryAfter } });
const serverError     = (res, err, verbose = false) => {
  const message = verbose ? err.message : 'Internal server error';
  const details = verbose ? err.stack   : null;
  return error(res, 500, message, { verbose, details });
};

module.exports = { ok, created, error, unauthorized, forbidden, notFound, badRequest, tooManyRequests, serverError };