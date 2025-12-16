import { auth, signOut } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

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

    // Sign out the user
    await signOut({ redirect: false });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user data:', error);
    return NextResponse.json({ error: 'Failed to delete data' }, { status: 500 });
  }
}
