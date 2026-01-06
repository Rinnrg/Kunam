import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Configure Prisma Client with optimized settings
const prismaClientOptions = {
  log: (process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error']) as Array<'error' | 'warn' | 'info' | 'query'>,
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
};

// Create singleton instance
export const prisma = (() => {
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
 * Wrapper function to safely execute Prisma queries with automatic retry
 */
export async function executePrismaQuery<T>(
  // eslint-disable-next-line no-unused-vars
  queryFn: (prismaClient: PrismaClient) => Promise<T>
): Promise<T> {
  try {
    const result = await queryFn(prisma);
    return result;
  } catch (error: unknown) {
    const err = error as { message?: string };
    // If max clients error, try to reconnect
    if (
      err.message?.includes('max clients') ||
      err.message?.includes('MaxClientsInSessionMode') ||
      err.message?.includes('Too many connections')
    ) {
      console.warn('Database connection issue, attempting to reconnect...');
      try {
        await prisma.$disconnect();
        // eslint-disable-next-line no-promise-executor-return
        await new Promise((resolve) => setTimeout(resolve, 100));
        await prisma.$connect();
        const result = await queryFn(prisma);
        return result;
      } catch (retryError: any) {
        console.error('Failed to reconnect:', retryError.message);
        throw retryError;
      }
    }
    throw error;
  }
}

export default prisma;
