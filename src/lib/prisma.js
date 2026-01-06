import { PrismaClient } from '@prisma/client';

/**
 * PrismaClient is attached to the `global` object in development to prevent
 * exhausting your database connection limit.
 * Learn more: https://pris.ly/d/help/next-js-best-practices
 */

const globalForPrisma = global;

// Configure Prisma Client with optimized connection pooling
const prismaClientOptions = {
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
};

// Create singleton instance
const prisma = (() => {
  if (process.env.NODE_ENV === 'production') {
    return new PrismaClient(prismaClientOptions);
  }
  // In development, use a global variable to preserve the client across hot reloads
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient(prismaClientOptions);
  }
  return globalForPrisma.prisma;
})();

// Graceful shutdown
if (typeof window === 'undefined') {
  const cleanup = async () => {
    try {
      await prisma.$disconnect();
    } catch (error) {
      // Silently fail during cleanup
    }
  };

  process.on('beforeExit', cleanup);
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}

/**
 * Wrapper function to safely execute Prisma queries with automatic retry on connection errors
 */
export async function executePrismaQuery(queryFn) {
  try {
    const result = await queryFn(prisma);
    return result;
  } catch (error) {
    // If max clients error, try to reconnect
    if (
      error.message?.includes('max clients') || 
      error.message?.includes('MaxClientsInSessionMode') ||
      error.message?.includes('Too many connections')
    ) {
      console.warn('Database connection issue, attempting to reconnect...');
      try {
        await prisma.$disconnect();
        // eslint-disable-next-line no-promise-executor-return
        await new Promise((resolve) => setTimeout(resolve, 100));
        await prisma.$connect();
        const result = await queryFn(prisma);
        return result;
      } catch (retryError) {
        console.error('Failed to reconnect:', retryError.message);
        throw retryError;
      }
    }
    throw error;
  }
}

/**
 * Middleware wrapper for API routes to ensure proper connection handling
 */
export function withPrisma(handler) {
  return async (req, res) => {
    try {
      return await handler(req, res, prisma);
    } catch (error) {
      // Handle connection errors in API routes
      if (
        error.message?.includes('max clients') || 
        error.message?.includes('MaxClientsInSessionMode')
      ) {
        console.error('Database connection pool exhausted');
        return res.status(503).json({ 
          error: 'Database temporarily unavailable. Please try again.' 
        });
      }
      throw error;
    }
  };
}

export { prisma };
export default prisma;
