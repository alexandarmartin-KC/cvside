import { requireUser } from '@/lib/auth-session';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { ProfileForm } from './client';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const user = await requireUser();
  
  // Fetch user's CV profile
  const cvProfile = await prisma.cvProfile.findUnique({
    where: { userId: user.id },
  });

  // If no profile, redirect to upload
  if (!cvProfile) {
    redirect('/upload');
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Profile & CV</h1>
      <ProfileForm profile={cvProfile} />
    </div>
  );
}
