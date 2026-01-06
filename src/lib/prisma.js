import { PrismaClient } from '@prisma/client';

/**
 * PrismaClient is attached to the `global` object in development to prevent
 * exhausting your database connection limit.
 * Learn more: https://pris.ly/d/help/next-js-best-practices
 */

const globalForPrisma = global;

// Configure Prisma Client based on environment with optimized settings
const prismaClientOptions = {
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Add connection pooling and timeout settings
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
};

// Create singleton instance with better error handling
const prisma =
  globalForPrisma.prisma ||
  new PrismaClient(prismaClientOptions);

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Graceful shutdown - improved handling
if (typeof window === 'undefined') {
  // Handle various exit signals
  const cleanup = async () => {
    try {
      await prisma.$disconnect();
    } catch (error) {
      console.error('Error disconnecting Prisma:', error);
    }
  };

  process.on('beforeExit', cleanup);
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  process.on('exit', cleanup);
}

export { prisma };
export default prisma;
