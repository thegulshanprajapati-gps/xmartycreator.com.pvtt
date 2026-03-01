import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { recordStudentLogin } from '@/lib/student-management';

const googleClientId = process.env.GOOGLE_CLIENT_ID || 'missing-google-client-id';
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || 'missing-google-client-secret';
const authSecret =
  process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || 'change-me-in-production';

export const studentAuthOptions: NextAuthOptions = {
  secret: authSecret,
  providers: [
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60 * 24 * 30,
  },
  pages: {
    signIn: '/student/login',
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== 'google' || !user.email) {
        return false;
      }

      try {
        await recordStudentLogin({
          id: user.id || '',
          name: user.name,
          email: user.email,
          image: user.image,
        });
        return true;
      } catch (error) {
        console.error('[student-auth] Failed to sync Google user:', error);
        return false;
      }
    },
    async jwt({ token }) {
      token.role = 'student';
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub || '';
        session.user.role = (token.role as string) || 'student';
      }
      return session;
    },
  },
};
