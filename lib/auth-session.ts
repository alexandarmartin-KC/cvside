import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';

const AUTH_SECRET = process.env.AUTH_SECRET || 'dev-secret-change-in-production';
const COOKIE_NAME = 'cv_session';

// Get the secret key for JWT
function getSecretKey() {
  return new TextEncoder().encode(AUTH_SECRET);
}

export interface SessionPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

// Create a session cookie with JWT
export async function createSession(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true },
  });

  if (!user || !user.email) {
    throw new Error('User not found');
  }

  const payload: Omit<SessionPayload, 'iat' | 'exp'> = {
    userId: user.id,
    email: user.email,
  };

  // Create JWT token with 7 days expiry
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecretKey());

  // Set cookie
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    priority: 'high',
  });

  console.log('Session created for user:', userId);
  return token;
}

// Get the current session user from cookie
export async function getSessionUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) {
      console.log('No session token found in cookies');
      return null;
    }

    try {
      const { payload } = await jwtVerify<SessionPayload>(token, getSecretKey());
      
      // Verify user still exists
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          createdAt: true,
        },
      });

      if (!user) {
        console.log('User not found for session:', payload.userId);
      }

      return user;
    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError);
      return null;
    }
  } catch (error) {
    console.error('Session verification failed:', error);
    return null;
  }
}

// Require authentication, redirect to login if not authenticated
export async function requireUser() {
  const user = await getSessionUser();
  
  if (!user) {
    redirect('/login');
  }

  return user;
}

// Sign out by clearing the session cookie
export async function signOut() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

// Verify password reset token
export async function verifyResetToken(tokenHash: string) {
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!resetToken) {
    return null;
  }

  // Check if token is expired
  if (resetToken.expiresAt < new Date()) {
    // Delete expired token
    await prisma.passwordResetToken.delete({
      where: { id: resetToken.id },
    });
    return null;
  }

  return resetToken;
}
