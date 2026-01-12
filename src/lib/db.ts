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

// Apply concurrency limiter to all Prisma operations via middleware
try {
  // prisma.$use exists on PrismaClient; wrap all queries so even direct usages are limited
  if (typeof (prisma as any).$use === 'function') {
    (prisma as any).$use(async (params: any, next: any) => {
      await acquire();
      try {
        return await next(params);
      } finally {
        release();
      }
    });
  }
} catch (e) {
  // If middleware cannot be registered (older Prisma versions), ignore silently and rely on executePrismaQuery
}

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

// Lightweight concurrency limiter to avoid exhausting DB connection pools
const PRISMA_MAX_CONCURRENT = Math.max(0, parseInt(process.env.PRISMA_MAX_CONCURRENT || '5', 10));
let _activeCount = 0;
const _queue: Array<() => void> = [];
function acquire(): Promise<void> {
  if (PRISMA_MAX_CONCURRENT <= 0) return Promise.resolve();
  return new Promise((resolve) => {
    const tryAcquire = () => {
      if (_activeCount < PRISMA_MAX_CONCURRENT) {
        _activeCount += 1;
        resolve();
      } else {
        _queue.push(tryAcquire);
      }
    };
    tryAcquire();
  });
}
function release(): void {
  if (PRISMA_MAX_CONCURRENT <= 0) return;
  _activeCount = Math.max(0, _activeCount - 1);
  if (_queue.length) {
    const next = _queue.shift();
    if (next) process.nextTick(next);
  }
}
export function getPrismaQueueStats() {
  return { active: _activeCount, pending: _queue.length, maxConcurrent: PRISMA_MAX_CONCURRENT };
}

/**
 * Wrapper function to safely execute Prisma queries with automatic retry
 */
export async function executePrismaQuery<T>(
  // eslint-disable-next-line no-unused-vars
  queryFn: (prismaClient: PrismaClient) => Promise<T>
): Promise<T> {
  const MAX_ATTEMPTS = Math.max(1, parseInt(process.env.PRISMA_QUERY_RETRIES || '3', 10));
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      await acquire();
      try {
        const result = await queryFn(prisma);
        return result;
      } finally {
        release();
      }
    } catch (error: unknown) {
      lastError = error;
      const msg = (error as { message?: string })?.message || '';
      const isMaxClients = msg.includes('max clients') || msg.includes('MaxClientsInSessionMode') || msg.includes('Too many connections');
      if (isMaxClients) {
        console.warn(`Prisma max clients error (attempt ${attempt}/${MAX_ATTEMPTS}): ${msg}`);
        try {
          await prisma.$disconnect();
        } catch (e) {
          // ignore disconnect errors
        }
        const backoff = Math.min(1000, 100 * (2 ** (attempt - 1)));
        await new Promise((resolve) => { setTimeout(resolve, backoff); });
        try {
          await prisma.$connect();
        } catch (e) {
          if (attempt >= MAX_ATTEMPTS) throw e;
        }
        if (attempt < MAX_ATTEMPTS) continue;
      }
      throw error;
    }
  }
  throw lastError;
}

export default prisma;
