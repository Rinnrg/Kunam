import crypto from 'crypto';

/**
 * Security utilities for admin authentication
 */

// In-memory store for rate limiting (use Redis in production)
const loginAttempts = new Map();
const blockedIPs = new Map();
const adminSessions = new Map();

// Configuration
const MAX_LOGIN_ATTEMPTS = 5;
const BLOCK_DURATION = 15 * 60 * 1000; // 15 minutes
const ATTEMPT_WINDOW = 5 * 60 * 1000; // 5 minutes
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

/**
 * Get client IP address
 */
export function getClientIP(req) {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded ? forwarded.split(',')[0] : req.socket.remoteAddress;
  return ip || 'unknown';
}

/**
 * Check if IP is blocked
 */
export function isIPBlocked(ip) {
  const blocked = blockedIPs.get(ip);
  if (!blocked) return false;

  // Check if block has expired
  if (Date.now() > blocked.until) {
    blockedIPs.delete(ip);
    return false;
  }

  return true;
}

/**
 * Block IP address
 */
export function blockIP(ip, duration = BLOCK_DURATION) {
  blockedIPs.set(ip, {
    until: Date.now() + duration,
    reason: 'Too many failed login attempts',
  });
}

/**
 * Record login attempt
 */
export function recordLoginAttempt(ip, success = false) {
  const now = Date.now();
  let attempts = loginAttempts.get(ip) || { count: 0, firstAttempt: now, attempts: [] };

  // Reset if window has passed
  if (now - attempts.firstAttempt > ATTEMPT_WINDOW) {
    attempts = { count: 0, firstAttempt: now, attempts: [] };
  }

  attempts.attempts.push({ timestamp: now, success });

  if (!success) {
    attempts.count += 1;

    // Block if too many attempts
    if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
      blockIP(ip);
      loginAttempts.delete(ip);
      return { blocked: true, attempts: attempts.count };
    }
  } else {
    // Reset on successful login
    loginAttempts.delete(ip);
  }

  loginAttempts.set(ip, attempts);
  return { blocked: false, attempts: attempts.count };
}

/**
 * Get remaining login attempts
 */
export function getRemainingAttempts(ip) {
  const attempts = loginAttempts.get(ip);
  if (!attempts) return MAX_LOGIN_ATTEMPTS;

  const now = Date.now();
  if (now - attempts.firstAttempt > ATTEMPT_WINDOW) {
    return MAX_LOGIN_ATTEMPTS;
  }

  return Math.max(0, MAX_LOGIN_ATTEMPTS - attempts.count);
}

/**
 * Generate secure token
 */
export function generateSecureToken(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Hash password with salt
 */
export async function hashPassword(password) {
  const bcrypt = await import('bcryptjs');
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password) {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const errors = [];

  if (password.length < minLength) {
    errors.push(`Password minimal ${minLength} karakter`);
  }
  if (!hasUpperCase) {
    errors.push('Password harus mengandung huruf besar');
  }
  if (!hasLowerCase) {
    errors.push('Password harus mengandung huruf kecil');
  }
  if (!hasNumbers) {
    errors.push('Password harus mengandung angka');
  }
  if (!hasSpecialChar) {
    errors.push('Password harus mengandung karakter spesial');
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength: calculatePasswordStrength(password),
  };
}

/**
 * Calculate password strength score (0-100)
 */
function calculatePasswordStrength(password) {
  let strength = 0;

  // Length
  if (password.length >= 8) strength += 20;
  if (password.length >= 12) strength += 10;
  if (password.length >= 16) strength += 10;

  // Character variety
  if (/[a-z]/.test(password)) strength += 15;
  if (/[A-Z]/.test(password)) strength += 15;
  if (/\d/.test(password)) strength += 15;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 15;

  return strength;
}

/**
 * Create admin session
 */
export function createAdminSession(adminId, metadata = {}) {
  const sessionId = generateSecureToken();
  const session = {
    adminId,
    createdAt: Date.now(),
    lastActivity: Date.now(),
    metadata,
  };

  adminSessions.set(sessionId, session);
  return sessionId;
}

/**
 * Validate admin session
 */
export function validateAdminSession(sessionId) {
  const session = adminSessions.get(sessionId);
  if (!session) return null;

  const now = Date.now();
  const inactive = now - session.lastActivity > SESSION_TIMEOUT;

  if (inactive) {
    adminSessions.delete(sessionId);
    return null;
  }

  // Update last activity
  session.lastActivity = now;
  adminSessions.set(sessionId, session);

  return session;
}

/**
 * Destroy admin session
 */
export function destroyAdminSession(sessionId) {
  adminSessions.delete(sessionId);
}

/**
 * Log security event
 */
export async function logSecurityEvent(event) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    type: event.type,
    severity: event.severity || 'info',
    ip: event.ip,
    userAgent: event.userAgent,
    details: event.details,
  };

  // In production, save to database or external logging service
  console.log('[SECURITY]', JSON.stringify(logEntry));

  // You can extend this to save to database
  // await prisma.securityLog.create({ data: logEntry });
}

/**
 * Validate request origin (CSRF protection)
 */
export function validateRequestOrigin(req) {
  const origin = req.headers.origin || req.headers.referer;
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXTAUTH_URL,
    'http://localhost:3000',
    'https://localhost:3000',
  ].filter(Boolean);

  if (!origin) return false;

  return allowedOrigins.some((allowed) => {
    try {
      const originUrl = new URL(origin);
      const allowedUrl = new URL(allowed);
      return originUrl.origin === allowedUrl.origin;
    } catch {
      return false;
    }
  });
}

/**
 * Sanitize input to prevent injection attacks
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;

  return input
    .trim()
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
}

/**
 * Generate CSRF token
 */
export function generateCSRFToken() {
  return generateSecureToken(32);
}

/**
 * Validate CSRF token
 */
export function validateCSRFToken(token, sessionToken) {
  return token === sessionToken;
}

/**
 * Clean up expired data (call periodically)
 */
export function cleanupExpiredData() {
  const now = Date.now();

  // Clean up blocked IPs
  for (const [ip, data] of blockedIPs.entries()) {
    if (now > data.until) {
      blockedIPs.delete(ip);
    }
  }

  // Clean up old login attempts
  for (const [ip, data] of loginAttempts.entries()) {
    if (now - data.firstAttempt > ATTEMPT_WINDOW) {
      loginAttempts.delete(ip);
    }
  }

  // Clean up expired sessions
  for (const [sessionId, session] of adminSessions.entries()) {
    if (now - session.lastActivity > SESSION_TIMEOUT) {
      adminSessions.delete(sessionId);
    }
  }
}

// Run cleanup every 5 minutes
setInterval(cleanupExpiredData, 5 * 60 * 1000);
