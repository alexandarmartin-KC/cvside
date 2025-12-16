import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import EmailProvider from 'next-auth/providers/email';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import type { Adapter } from 'next-auth/adapters';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  providers: [
    // Test/Demo credentials - works without database
    CredentialsProvider({
      id: 'test',
      name: 'Test Account',
      credentials: {
        email: { label: "Email", type: "email", placeholder: "test@example.com" }
      },
      async authorize(credentials) {
        // Allow any email for testing
        if (credentials?.email) {
          return {
            id: `test-${credentials.email}`,
            email: credentials.email,
            name: credentials.email.split('@')[0],
          };
        }
        return null;
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || 'dummy-client-id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy-client-secret',
    }),
    EmailProvider({
      server: process.env.EMAIL_SERVER || '',
      from: process.env.EMAIL_FROM || 'noreply@example.com',
    }),
  ],
  pages: {
    signIn: '/login',
    verifyRequest: '/login?verify=true',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    session: async ({ session, user, token }) => {
      if (session.user) {
        // For database sessions (OAuth)
        if (user) {
          session.user.id = user.id;
        }
        // For JWT sessions (test credentials)
        else if (token?.id) {
          session.user.id = token.id as string;
        }
      }
      return session;
    },
  },
  session: {
    // Always use JWT for flexibility with test accounts
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET || 'dev-secret-change-in-production',
};

export default NextAuth(authOptions);
