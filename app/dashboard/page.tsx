import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth-session';

export default async function DashboardPage() {
  await requireUser();
  
  // Redirect to Profile & CV as the main landing page
  redirect('/dashboard/profile');
}
