import { PrismaClient } from '@prisma/client';

/**
 * PrismaClient is attached to the `global` object in development to prevent
 * exhausting your database connection limit.
 * Learn more: https://pris.ly/d/help/next-js-best-practices
 */

const globalForPrisma = global;

// Configure Prisma Client with optimized settings
const prismaClientOptions = {
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  // Connection pool configuration
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
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

// Don't explicitly connect - let Prisma manage connections lazily
// This prevents creating unnecessary connections at startup

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
  process.on('SIGUSR2', cleanup); // nodemon restart
}

// Lightweight concurrency limiter to avoid exhausting DB connection pools
const PRISMA_MAX_CONCURRENT = Math.max(0, parseInt(process.env.PRISMA_MAX_CONCURRENT || '5', 10));
const PRISMA_MAX_PENDING = Math.max(0, parseInt(process.env.PRISMA_MAX_PENDING || '500', 10));
let _activeCount = 0;
const _queue = [];
function acquire() {
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
function release() {
  if (PRISMA_MAX_CONCURRENT <= 0) return;
  _activeCount = Math.max(0, _activeCount - 1);
  if (_queue.length) {
    const next = _queue.shift();
    // schedule next microtask so release happens after current call stack
    process.nextTick(next);
  }
}
function getPrismaQueueStats() {
  return { active: _activeCount, pending: _queue.length, maxConcurrent: PRISMA_MAX_CONCURRENT };
}

// Detect common serverless Postgres providers and emit a runtime hint
if (typeof process !== 'undefined' && process.env.DATABASE_URL) {
  const url = process.env.DATABASE_URL;
  if (url.includes('neon') || url.includes('neondb') || url.includes('neontech')) {
    console.warn('Detected Neon DB in DATABASE_URL. Neon uses session pooling; consider using Prisma Data Platform (Data Proxy) or configure connection limits to avoid MaxClientsInSessionMode errors.');
  }
}

/**
 * Wrapper function to safely execute Prisma queries with automatic retry on connection errors
 */
export async function executePrismaQuery(queryFn) {
  const MAX_ATTEMPTS = Math.max(1, parseInt(process.env.PRISMA_QUERY_RETRIES || '3', 10));
  let lastError = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      // Acquire slot to limit concurrency per process
      await acquire();
      try {
        const result = await queryFn(prisma);
        return result;
      } finally {
        release();
      }
    } catch (error) {
      lastError = error;
      const msg = error?.message || '';
      const isMaxClients = msg.includes('max clients') || msg.includes('MaxClientsInSessionMode') || msg.includes('Too many connections');
      if (isMaxClients) {
        console.warn(`Prisma max clients error (attempt ${attempt}/${MAX_ATTEMPTS}): ${msg}`);
        // try a graceful reconnect with exponential backoff
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
          // connecting might still fail; if last attempt then throw
          if (attempt >= MAX_ATTEMPTS) throw e;
        }
        if (attempt < MAX_ATTEMPTS) continue;
      }
      // Non-retryable error or retries exhausted
      throw error;
    }
  }
  throw lastError;
}

/**
 * Middleware wrapper for API routes to ensure proper connection handling
 */
export function withPrisma(handler) {
  return async (req, res) => {
    // If there are already a lot of pending Prisma requests, fail fast to avoid queueing
    if (_queue.length >= PRISMA_MAX_PENDING) {
      console.error('Prisma queue overloaded, returning 503');
      return res.status(503).json({ error: 'Server busy. Please try again.' });
    }

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

try {
  if (typeof prisma.$use === 'function') {
    prisma.$use(async (params, next) => {
      await acquire();
      try {
        return await next(params);
      } finally {
        release();
      }
    });
  }
} catch (e) {
  // If middleware registration fails, we still have executePrismaQuery as a fallback
}

export { prisma, getPrismaQueueStats };
export default prisma;
