import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import prisma from '../../../lib/prisma';

export const authOptions = {
  providers: [
    // Google OAuth for users
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
    // Admin credentials
    CredentialsProvider({
      id: 'admin-credentials',
      name: 'Admin Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          const admin = await prisma.Admin.findUnique({
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
            return null;
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, admin.password);

          if (!isPasswordValid) {
            return null;
          }

          return {
            id: admin.id.toString(),
            email: admin.email,
            name: admin.name,
            role: 'admin',
          };
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('[Admin Auth] Authorization error:', error);
          return null;
        }
      },
    }),
    // User credentials
    CredentialsProvider({
      id: 'user-credentials',
      name: 'User Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          const user = await prisma.users.findUnique({
            where: {
              email: credentials.email.toLowerCase(),
            },
            select: {
              id: true,
              email: true,
              password: true,
              name: true,
              image: true,
              provider: true,
            },
          });

          if (!user) {
            return null;
          }

          // Check if user registered with OAuth
          if (user.provider !== 'credentials') {
            throw new Error('Akun ini terdaftar dengan Google. Silakan login dengan Google.');
          }

          if (!user.password) {
            return null;
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

          if (!isPasswordValid) {
            return null;
          }

          return {
            id: user.id.toString(),
            email: user.email,
            name: user.name,
            image: user.image,
            role: 'user',
          };
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('[User Auth] Authorization error:', error);
          throw error;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Handle Google OAuth for users
      if (account?.provider === 'google') {
        try {
          const existingUser = await prisma.users.findUnique({
            where: { email: user.email.toLowerCase() },
          });

          if (existingUser) {
            await prisma.users.update({
              where: { id: existingUser.id },
              data: {
                name: user.name,
                image: user.image,
                providerId: account.providerAccountId,
              },
            });
          } else {
            await prisma.users.create({
              data: {
                email: user.email.toLowerCase(),
                name: user.name,
                image: user.image,
                provider: 'google',
                providerId: account.providerAccountId,
              },
            });
          }

          return true;
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('[User Auth] Google sign in error:', error);
          return false;
        }
      }

      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        // For Google OAuth, get user ID from database
        if (account?.provider === 'google') {
          const dbUser = await prisma.users.findUnique({
            where: { email: user.email.toLowerCase() },
            select: { id: true },
          });
          token.id = dbUser?.id.toString();
          token.role = 'user';
        } else {
          token.id = user.id;
          token.role = user.role;
        }
        token.email = user.email;
        token.name = user.name;
        token.image = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.name = token.name;
        session.user.image = token.image;
        session.user.role = token.role;
      }
      return session;
    },
    async redirect({ url, baseUrl, token }) {
      // Always redirect to home after logout
      if (url.includes('signout') || url.includes('logout')) {
        return baseUrl;
      }
      
      // Check if user is admin and redirect to admin dashboard
      if (token?.role === 'admin') {
        if (url.includes('/admin/login') || url.includes('/api/auth/callback')) {
          return `${baseUrl}/admin`;
        }
        if (url.includes('/admin')) {
          return url.startsWith('/') ? `${baseUrl}${url}` : url;
        }
        return `${baseUrl}/admin`;
      }
      
      // Prevent redirect to /api/auth/signin
      if (url.includes('/api/auth/signin')) {
        return `${baseUrl}/login`;
      }
      
      // After successful login, redirect to home
      if (url.includes('/api/auth/callback')) {
        return baseUrl;
      }
      
      // For regular users, redirect to home by default
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};

export default NextAuth(authOptions);
