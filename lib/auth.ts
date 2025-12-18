import { getServerSession as nextAuthGetServerSession } from 'next-auth/next';
import { authOptions } from '@/auth';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth-session';

export async function getServerSession() {
  return await nextAuthGetServerSession(authOptions);
}

// New auth function that uses the JWT session system
export async function auth() {
  const user = await getSessionUser();
  if (!user) return null;
  
  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
    },
  };
}

export async function protectRoute() {
  const user = await getSessionUser();
  if (!user) {
    redirect('/login');
  }
  // Return session-like object for compatibility
  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
    },
  };
}

// Re-export client-side functions
export { signIn } from 'next-auth/react';
