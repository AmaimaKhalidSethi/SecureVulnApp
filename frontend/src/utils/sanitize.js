export const stripHtml = (input) => {
  if (typeof input !== 'string') return '';
  return input.replace(/<[^>]*>/g, '').replace(/&[a-z]+;/gi, '').trim();
};

const XSS_PATTERNS = [
  /<script/i, /javascript:/i, /onerror\s*=/i,
  /onload\s*=/i, /onclick\s*=/i, /<img[^>]+onerror/i,
  /<svg/i, /eval\s*\(/i, /document\.cookie/i,
];

export const containsXss = (input) => {
  if (typeof input !== 'string') return false;
  return XSS_PATTERNS.some(p => p.test(input));
};

export const containsMongoOperator = (input) => {
  if (typeof input === 'object' && input !== null) {
    return Object.keys(input).some(k => k.startsWith('$'));
  }
  if (typeof input === 'string') {
    return /\$(?:gt|lt|ne|in|nin|or|and|where|regex|exists)/i.test(input);
  }
  return false;
};

export const sanitizeField = (value, fieldName = 'field') => {
  const result = { value, warnings: [] };
  if (containsXss(value)) {
    result.warnings.push(`${fieldName}: XSS pattern detected`);
    result.value = stripHtml(value);
  }
  if (containsMongoOperator(value)) {
    result.warnings.push(`${fieldName}: MongoDB operator detected`);
    result.value = typeof value === 'string' ? value.replace(/\$/g, '') : '';
  }
  return result;
};

export const validate = {
  email: (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
  password: (password) => {
    if (password.length < 8)        return { valid: false, reason: 'Min 8 characters' };
    if (!/[A-Z]/.test(password))    return { valid: false, reason: 'Needs uppercase letter' };
    if (!/[a-z]/.test(password))    return { valid: false, reason: 'Needs lowercase letter' };
    if (!/\d/.test(password))       return { valid: false, reason: 'Needs a number' };
    return { valid: true };
  },
  username: (username) => {
    if (username.length < 3 || username.length > 20) return { valid: false, reason: '3–20 characters required' };
    if (!/^[a-zA-Z0-9_]+$/.test(username))           return { valid: false, reason: 'Letters, numbers, underscores only' };
    return { valid: true };
  },
};