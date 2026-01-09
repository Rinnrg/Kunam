import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import prisma from '../../../../lib/prisma';

export const userAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    CredentialsProvider({
      id: 'user-credentials',
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
      if (account?.provider === 'google') {
        try {
          const existingUser = await prisma.users.findUnique({
            where: { email: user.email.toLowerCase() },
          });

          if (existingUser) {
            // Update user info if already exists
            await prisma.users.update({
              where: { id: existingUser.id },
              data: {
                name: user.name,
                image: user.image,
                providerId: account.providerAccountId,
              },
            });
          } else {
            // Create new user
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
    async jwt({ token, user, account, trigger }) {
      if (user) {
        // For Google OAuth, we need to get the user ID from database
        if (account?.provider === 'google') {
          const dbUser = await prisma.users.findUnique({
            where: { email: user.email.toLowerCase() },
            select: { id: true, image: true },
          });
          if (dbUser) {
            token.id = dbUser.id.toString();
            token.image = dbUser.image || user.image;
          } else {
            console.error('[JWT] Google user not found in database:', user.email);
            return null;
          }
        } else {
          token.id = user.id;
          token.image = user.image;
        }
        token.email = user.email;
        token.name = user.name;
        token.role = 'user';
      }
      
      // Update token on session update
      if (trigger === 'update') {
        try {
          const userId = parseInt(token.id, 10);
          if (userId && !Number.isNaN(userId)) {
            const dbUser = await prisma.users.findUnique({
              where: { id: userId },
              select: { name: true, image: true, email: true },
            });
            if (dbUser) {
              token.name = dbUser.name;
              token.image = dbUser.image;
              token.email = dbUser.email;
            }
          }
        } catch (error) {
          console.error('[JWT] Update trigger error:', error);
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        // Always fetch fresh image from database
        try {
          const userId = parseInt(token.id, 10);
          
          // Validate that we have a valid numeric user ID
          if (!userId || Number.isNaN(userId)) {
            console.error('[Session] Invalid token.id:', token.id);
            session.user.id = token.id;
            session.user.email = token.email;
            session.user.name = token.name;
            session.user.image = token.image;
            session.user.role = token.role;
            return session;
          }
          
          const dbUser = await prisma.users.findUnique({
            where: { id: userId },
            select: { image: true },
          });
          
          session.user.id = token.id;
          session.user.email = token.email;
          session.user.name = token.name;
          session.user.image = dbUser?.image || token.image;
          session.user.role = token.role;
        } catch (error) {
          console.error('[Session] Database query error:', error);
          // Fallback to token image if database query fails
          session.user.id = token.id;
          session.user.email = token.email;
          session.user.name = token.name;
          session.user.image = token.image;
          session.user.role = token.role;
        }
      }
      return session;
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

export default NextAuth(userAuthOptions);
