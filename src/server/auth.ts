import NextAuth from 'next-auth';
import type { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from './db';
import { hit } from './limiter';
import { consumeLoginCode } from './loginCode';

// Compared when the address is unknown, so timing does not reveal who has an account.
const DUMMY_HASH = '$2b$12$C6UzMDM.H6dfI/f/IKcEeO7ZPZ6yr3xgYBG5ZQ1oQkI4i2zGmXk7K';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as NextAuthOptions['adapter'],
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const email = credentials.email.trim().toLowerCase();
        if (!(await hit(`login:${email}`, 10, 300))) throw new Error('RATE_LIMITED');

        const user = await prisma.user.findUnique({ where: { email } });
        const isValid = await bcrypt.compare(credentials.password, user?.passwordHash ?? DUMMY_HASH);
        if (!user?.passwordHash || !isValid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          tokenVersion: user.tokenVersion,
          isDemo: user.isDemo,
        };
      },
    }),
    CredentialsProvider({
      id: 'email-code',
      name: 'email-code',
      credentials: {
        email: { label: 'Email', type: 'email' },
        code: { label: 'Code', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.code) return null;
        const email = credentials.email.trim().toLowerCase();
        if (!(await hit(`code-login:${email}`, 10, 300))) throw new Error('RATE_LIMITED');
        if (!(await consumeLoginCode(email, credentials.code))) return null;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || user.isDemo) return null;
        return { id: user.id, name: user.name, email: user.email, image: user.image, tokenVersion: user.tokenVersion, isDemo: user.isDemo };
      },
    }),
  ],
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.tokenVersion = user.tokenVersion ?? 0;
        token.isDemo = user.isDemo ?? false;
      }
      if (trigger === 'update' && session) {
        if (typeof session.name === 'string') token.name = session.name;
        if (typeof session.email === 'string') token.email = session.email;
        if (typeof session.tokenVersion === 'number') token.tokenVersion = session.tokenVersion;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id;
        session.user.tokenVersion = token.tokenVersion ?? 0;
        session.user.isDemo = token.isDemo ?? false;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
