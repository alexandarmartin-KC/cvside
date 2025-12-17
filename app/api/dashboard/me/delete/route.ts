import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Delete all user data (cascade will handle related records)
    await prisma.user.delete({
      where: { id: session.user.id },
    });

    // Clear session cookies
    const cookieStore = await cookies();
    cookieStore.delete('next-auth.session-token');
    cookieStore.delete('__Secure-next-auth.session-token');
    cookieStore.delete('next-auth.csrf-token');
    cookieStore.delete('__Host-next-auth.csrf-token');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user data:', error);
    return NextResponse.json({ error: 'Failed to delete data' }, { status: 500 });
  }
}
