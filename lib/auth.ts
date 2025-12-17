import { getServerSession as nextAuthGetServerSession } from 'next-auth/next';
import { authOptions } from '@/auth';
import { redirect } from 'next/navigation';

export async function getServerSession() {
  return await nextAuthGetServerSession(authOptions);
}

export async function auth() {
  return await getServerSession();
}

export async function protectRoute() {
  const session = await getServerSession();
  if (!session) {
    redirect('/login');
  }
  return session;
}

// Re-export client-side functions
export { signIn } from 'next-auth/react';
