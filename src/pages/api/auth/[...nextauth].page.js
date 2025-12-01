import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

// Create Prisma Client with explicit connection
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

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
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          const admin = await prisma.admin.findUnique({
            where: {
              email: credentials.email,
            },
          });

          if (!admin) {
            return null;
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, admin.password);

          if (!isPasswordValid) {
            return null;
          }

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
  debug: process.env.NODE_ENV === 'development',
};

export default NextAuth(authOptions);
