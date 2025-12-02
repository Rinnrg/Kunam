import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import prisma from '../../../lib/prisma';

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
            where: { email: credentials.email },
          });

          if (!admin) {
            return null;
          }

          const isValid = await bcrypt.compare(credentials.password, admin.password);

          if (!isValid) {
            return null;
          }

          return {
            id: admin.id,
            email: admin.email,
            name: admin.name,
          };
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Auth error:', error.message);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
      }
      return session;
    },
  },
  pages: {
    signIn: '/admin/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);
