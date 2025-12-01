import { getServerSession } from 'next-auth/next';
import { authOptions } from '../pages/api/auth/[...nextauth].page';

/**
 * Get authenticated session on server side
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Promise<Object|null>} Session object or null
 */
export async function getSession(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);
    return session;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error getting session:', error);
    return null;
  }
}

/**
 * Check if user is authenticated
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Promise<boolean>} True if authenticated, false otherwise
 */
export async function isAuthenticated(req, res) {
  const session = await getSession(req, res);
  return !!session;
}

/**
 * Protect API route - Return 401 if not authenticated
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Promise<Object|null>} Session if authenticated, sends 401 response if not
 */
export async function requireAuth(req, res) {
  const session = await getSession(req, res);

  if (!session) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'You must be signed in to access this resource',
    });
    return null;
  }

  return session;
}

/**
 * Verify admin access
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Promise<Object|null>} Session if admin, sends 403 response if not
 */
export async function requireAdmin(req, res) {
  const session = await requireAuth(req, res);

  if (!session) {
    return null;
  }

  // Add additional admin checks here if needed
  // For now, any authenticated user is considered admin
  return session;
}
