import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import GitHub from 'next-auth/providers/github';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { loginSchema, registerSchema } from '@/lib/validations/auth';
import { rateLimiter } from '@/lib/rate-limiter';
import { auditLogger } from '@/lib/audit';
import { createChildLogger } from '@/lib/logger';

const log = createChildLogger('auth');

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60,
  },
  jwt: {
    maxAge: 24 * 60 * 60,
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    }),
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        isRegister: { label: 'Is Register', type: 'boolean' },
        name: { label: 'Name', type: 'text' },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        const headers = req?.headers as unknown as Record<string, string> | undefined;
        const ip = headers?.['x-forwarded-for'] || headers?.['x-real-ip'] || 'unknown';
        const userAgent = headers?.['user-agent'] || '';

        const isRegister = credentials.isRegister === 'true';

        if (isRegister) {
          const registerResult = await rateLimiter.checkRegister(ip);
          if (!registerResult.allowed) {
            throw new Error('Too many registration attempts. Try again later.');
          }

          const parsed = registerSchema.safeParse(credentials);
          if (!parsed.success) {
            throw new Error('Invalid input');
          }

          const existingUser = await prisma.user.findUnique({
            where: { email },
          });

          if (existingUser) {
            throw new Error('Email already in use');
          }

          const hashedPassword = await bcrypt.hash(credentials.password as string, 12);

          const user = await prisma.user.create({
            data: {
              email,
              name: credentials.name as string,
              password: hashedPassword,
            },
          });

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
          };
        }

        const loginResult = await rateLimiter.checkLogin(email);
        if (!loginResult.allowed) {
          log.warn({ email, ip }, 'Login rate limit exceeded');
          throw new Error('Too many login attempts. Account temporarily locked.');
        }

        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          throw new Error('Invalid input');
        }

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.password) {
          await prisma.loginHistory.create({
            data: {
              userId: 'unknown',
              email,
              ipAddress: ip,
              userAgent,
              success: false,
              failReason: 'user_not_found',
            },
          }).catch(() => {});
          throw new Error('Invalid credentials');
        }

        const isPasswordValid = await bcrypt.compare(credentials.password as string, user.password);

        if (!isPasswordValid) {
          await prisma.loginHistory.create({
            data: {
              userId: user.id,
              email,
              ipAddress: ip,
              userAgent,
              success: false,
              failReason: 'invalid_password',
            },
          }).catch(() => {});
          throw new Error('Invalid credentials');
        }

        await prisma.loginHistory.create({
          data: {
            userId: user.id,
            email,
            ipAddress: ip,
            userAgent,
            success: true,
          },
        }).catch((err) => log.error({ err }, 'Failed to record login history'));

        await auditLogger.log({
          action: 'user.login',
          entityType: 'User',
          entityId: user.id,
          userId: user.id,
          workspaceId: '',
          metadata: { email, ipAddress: ip },
          ipAddress: ip,
          userAgent,
        });

        await rateLimiter.reset('auth:login', email.toLowerCase());

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
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
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
