import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

// Create Prisma Client with singleton pattern to avoid too many connections
const globalForPrisma = global;

const prisma = globalForPrisma.prisma || new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          console.log('[NextAuth] Attempting to authorize...');
          
          if (!credentials?.email || !credentials?.password) {
            console.log('[NextAuth] Missing credentials');
            return null;
          }

          // Test database connection
          try {
            await prisma.$connect();
            console.log('[NextAuth] Database connected successfully');
          } catch (dbError) {
            console.error('[NextAuth] Database connection failed:', dbError);
            throw new Error('Database connection failed');
          }

          const admin = await prisma.admin.findUnique({
            where: {
              email: credentials.email,
            },
          });

          if (!admin) {
            console.log('[NextAuth] Admin not found');
            return null;
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, admin.password);

          if (!isPasswordValid) {
            console.log('[NextAuth] Invalid password');
            return null;
          }

          console.log('[NextAuth] Authorization successful');
          return {
            id: admin.id,
            email: admin.email,
            name: admin.name,
          };
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('[NextAuth] Error in authorize:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      try {
        if (user) {
          token.id = user.id;
          token.email = user.email;
          token.name = user.name;
        }
        return token;
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('[NextAuth] Error in jwt callback:', error);
        return token;
      }
    },
    async session({ session, token }) {
      try {
        if (token && session.user) {
          session.user.id = token.id;
          session.user.email = token.email;
          session.user.name = token.name;
        }
        return session;
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('[NextAuth] Error in session callback:', error);
        return session;
      }
    },
  },
  pages: {
    signIn: '/admin/login',
    error: '/admin/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: true, // Enable debug for troubleshooting
  logger: {
    error(code, metadata) {
      console.error('[NextAuth][error]', code, metadata);
    },
    warn(code) {
      console.warn('[NextAuth][warn]', code);
    },
    debug(code, metadata) {
      console.log('[NextAuth][debug]', code, metadata);
    },
  },
};

// Validate environment variables
if (!process.env.NEXTAUTH_SECRET) {
  console.error('NEXTAUTH_SECRET is not defined in environment variables');
}

if (!process.env.DATABASE_URL && !process.env.DIRECT_URL) {
  console.error('DATABASE_URL or DIRECT_URL is not defined in environment variables');
}

export default NextAuth(authOptions);
