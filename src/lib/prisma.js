import { PrismaClient } from '@prisma/client';

/**
 * PrismaClient is attached to the `global` object in development to prevent
 * exhausting your database connection limit.
 * Learn more: https://pris.ly/d/help/next-js-best-practices
 */

const globalForPrisma = global;

// Configure Prisma Client based on environment
const prismaClientOptions = {
  datasources: {
    db: {
      // Use DATABASE_URL (pooler) instead of DIRECT_URL for better reliability
      url: process.env.DATABASE_URL,
    },
  },
};

// Add logging in development
if (process.env.NODE_ENV === 'development') {
  prismaClientOptions.log = ['error', 'warn'];
}

// Create singleton instance
export const prisma = globalForPrisma.prisma || new PrismaClient(prismaClientOptions);

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Graceful shutdown
if (typeof window === 'undefined') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect();
  });
}

export default prisma;
