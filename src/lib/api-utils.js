/**
 * API Response utilities
 */

/**
 * Send success response
 * @param {Object} res - Response object
 * @param {*} data - Data to send
 * @param {number} statusCode - HTTP status code (default: 200)
 */
export function sendSuccess(res, data, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data,
  });
}

/**
 * Send error response
 * @param {Object} res - Response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default: 500)
 */
export function sendError(res, message, statusCode = 500) {
  return res.status(statusCode).json({
    success: false,
    error: message,
  });
}

/**
 * Handle Prisma errors
 * @param {Object} error - Prisma error object
 * @returns {Object} Formatted error object
 */
export function handlePrismaError(error) {
  if (error.code === 'P2002') {
    return {
      message: 'A record with this value already exists',
      statusCode: 409,
    };
  }

  if (error.code === 'P2025') {
    return {
      message: 'Record not found',
      statusCode: 404,
    };
  }

  if (error.code === 'P2003') {
    return {
      message: 'Foreign key constraint failed',
      statusCode: 400,
    };
  }

  // Default error
  return {
    message: 'Database error occurred',
    statusCode: 500,
  };
}

/**
 * Async handler wrapper for API routes
 * @param {Function} handler - Async handler function
 * @returns {Function} Wrapped handler
 */
export function asyncHandler(handler) {
  return async (req, res) => {
    try {
      return await handler(req, res);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('API Error:', error);

      // Handle Prisma errors
      if (error.code && error.code.startsWith('P')) {
        const { message, statusCode } = handlePrismaError(error);
        return sendError(res, message, statusCode);
      }

      // Handle other errors
      const statusCode = error.statusCode || 500;
      const message = error.message || 'Internal server error';
      return sendError(res, message, statusCode);
    }
  };
}

/**
 * Validate required fields
 * @param {Object} data - Data object to validate
 * @param {string[]} requiredFields - Array of required field names
 * @throws {Error} If validation fails
 */
export function validateRequired(data, requiredFields) {
  const missing = requiredFields.filter((field) => !data[field]);

  if (missing.length > 0) {
    const error = new Error(`Missing required fields: ${missing.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }
}
