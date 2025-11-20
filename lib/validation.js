// lib/validation.js - Server-side validation utilities

/**
 * Validates an email address using a simple regex pattern.
 * @param {string} email - The email address to validate
 * @returns {boolean} - True if valid, false otherwise
 */
function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  
  // Basic email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validates and normalizes an email address.
 * @param {string} email - The email address to validate
 * @returns {{ valid: boolean, normalized?: string, error?: string }} - Validation result
 */
function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required' };
  }
  
  const trimmed = email.trim();
  
  if (trimmed.length === 0) {
    return { valid: false, error: 'Email cannot be empty' };
  }
  
  if (trimmed.length > 254) {
    return { valid: false, error: 'Email is too long' };
  }
  
  if (!isValidEmail(trimmed)) {
    return { valid: false, error: 'Invalid email format' };
  }
  
  const normalized = trimmed.toLowerCase();
  return { valid: true, normalized };
}

/**
 * Sanitizes log messages to avoid logging PII in production.
 * @param {string} message - The message to sanitize
 * @param {object} context - Additional context (will mask email fields)
 * @returns {object} - Sanitized log data
 */
function sanitizeLogData(message, context = {}) {
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (!isProduction) {
    return { message, ...context };
  }
  
  // In production, mask email addresses
  const sanitized = { message };
  for (const [key, value] of Object.entries(context)) {
    if (key === 'email' || key.includes('Email')) {
      // Mask email but keep domain for debugging
      if (typeof value === 'string' && value.includes('@')) {
        const parts = value.split('@');
        sanitized[key] = `***@${parts[1] || '***'}`;
      } else {
        sanitized[key] = '***';
      }
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

module.exports = {
  isValidEmail,
  validateEmail,
  sanitizeLogData,
};
