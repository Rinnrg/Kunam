import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import prisma from '../../../lib/prisma';

// Validate environment variables
if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET must be defined in environment variables');
}

if (!process.env.DATABASE_URL && !process.env.DIRECT_URL) {
  throw new Error('DATABASE_URL or DIRECT_URL must be defined in environment variables');
}

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
          // Validate credentials
          if (!credentials?.email || !credentials?.password) {
            // eslint-disable-next-line no-console
            console.log('[NextAuth] Missing credentials');
            return null;
          }

          // eslint-disable-next-line no-console
          console.log('[NextAuth] Attempting to find admin:', credentials.email);

          // Find admin by email
          const admin = await prisma.admin.findUnique({
            where: {
              email: credentials.email,
            },
            select: {
              id: true,
              email: true,
              password: true,
              name: true,
            },
          });

          if (!admin) {
            // eslint-disable-next-line no-console
            console.log('[NextAuth] Admin not found');
            return null;
          }

          // eslint-disable-next-line no-console
          console.log('[NextAuth] Admin found, verifying password');

          // Verify password
          const isPasswordValid = await bcrypt.compare(credentials.password, admin.password);

          if (!isPasswordValid) {
            // eslint-disable-next-line no-console
            console.log('[NextAuth] Invalid password');
            return null;
          }

          // eslint-disable-next-line no-console
          console.log('[NextAuth] Authorization successful');

          // Return user without password
          return {
            id: admin.id,
            email: admin.email,
            name: admin.name,
          };
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('[NextAuth] Authorization error:', error);
          // eslint-disable-next-line no-console
          console.error('[NextAuth] Error details:', {
            name: error.name,
            message: error.message,
            code: error.code,
          });
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.name = token.name;
      }
      return session;
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
  debug: true,
  logger: {
    error(code, metadata) {
      // eslint-disable-next-line no-console
      console.error('[NextAuth][error]', code, metadata);
    },
    warn(code) {
      // eslint-disable-next-line no-console
      console.warn('[NextAuth][warn]', code);
    },
    debug(code, metadata) {
      // eslint-disable-next-line no-console
      console.log('[NextAuth][debug]', code, metadata);
    },
  },
};

export default NextAuth(authOptions);
