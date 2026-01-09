import bcrypt from 'bcryptjs';
import prisma from '@src/lib/prisma';
import {
  getClientIP,
  isIPBlocked,
  recordLoginAttempt,
  getRemainingAttempts,
  logSecurityEvent,
  sanitizeInput,
  validateRequestOrigin,
} from '@src/lib/security';

/**
 * Enhanced Admin Login API with Security Features
 * - Rate limiting
 * - IP blocking
 * - Security logging
 * - CSRF protection
 * - Input sanitization
 */
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ip = getClientIP(req);
  const userAgent = req.headers['user-agent'] || 'unknown';

  try {
    // Validate request origin (CSRF protection)
    if (!validateRequestOrigin(req)) {
      await logSecurityEvent({
        type: 'INVALID_ORIGIN',
        severity: 'warning',
        ip,
        userAgent,
        details: { origin: req.headers.origin || req.headers.referer },
      });

      return res.status(403).json({
        error: 'Invalid request origin',
        message: 'Request tidak valid',
      });
    }

    // Check if IP is blocked
    if (isIPBlocked(ip)) {
      await logSecurityEvent({
        type: 'BLOCKED_IP_ATTEMPT',
        severity: 'warning',
        ip,
        userAgent,
        details: { reason: 'IP blocked due to too many failed attempts' },
      });

      return res.status(429).json({
        error: 'Too many requests',
        message: 'Terlalu banyak percobaan login. Silakan coba lagi nanti.',
        remainingAttempts: 0,
      });
    }

    // Get and sanitize credentials
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Missing credentials',
        message: 'Email dan password harus diisi',
      });
    }

    const sanitizedEmail = sanitizeInput(email).toLowerCase();

    // Check remaining attempts
    const remainingAttempts = getRemainingAttempts(ip);
    if (remainingAttempts <= 0) {
      await logSecurityEvent({
        type: 'MAX_ATTEMPTS_REACHED',
        severity: 'warning',
        ip,
        userAgent,
        details: { email: sanitizedEmail },
      });

      return res.status(429).json({
        error: 'Too many attempts',
        message: 'Terlalu banyak percobaan login. Silakan coba lagi nanti.',
        remainingAttempts: 0,
      });
    }

    // Find admin by email
    const admin = await prisma.Admin.findUnique({
      where: { email: sanitizedEmail },
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
        createdAt: true,
      },
    });

    // Always take similar time to prevent timing attacks
    const dummyHash = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYKxQzV8K8W';
    const passwordToCompare = admin ? admin.password : dummyHash;

    const isPasswordValid = await bcrypt.compare(password, passwordToCompare);

    // Check if credentials are valid
    if (!admin || !isPasswordValid) {
      // Record failed attempt
      const result = recordLoginAttempt(ip, false);

      await logSecurityEvent({
        type: 'FAILED_LOGIN',
        severity: 'warning',
        ip,
        userAgent,
        details: {
          email: sanitizedEmail,
          attempts: result.attempts,
          blocked: result.blocked,
        },
      });

      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email atau password salah',
        remainingAttempts: getRemainingAttempts(ip) - 1,
      });
    }

    // Successful login - record it
    recordLoginAttempt(ip, true);

    await logSecurityEvent({
      type: 'SUCCESSFUL_LOGIN',
      severity: 'info',
      ip,
      userAgent,
      details: {
        adminId: admin.id,
        email: admin.email,
        name: admin.name,
      },
    });

    // Return admin data (without password)
    return res.status(200).json({
      success: true,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
      },
    });
  } catch (error) {
    console.error('[Admin Login] Error:', error);

    await logSecurityEvent({
      type: 'LOGIN_ERROR',
      severity: 'error',
      ip,
      userAgent,
      details: {
        error: error.message,
        stack: error.stack,
      },
    });

    return res.status(500).json({
      error: 'Internal server error',
      message: 'Terjadi kesalahan. Silakan coba lagi.',
    });
  }
}
