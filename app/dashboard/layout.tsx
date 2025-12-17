import { requireUser } from '@/lib/auth-session';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { NavLink, MobileNavLink } from './nav-links';

async function handleSignOut() {
  'use server';
  const { signOut } = await import('@/lib/auth-session');
  await signOut();
  redirect('/');
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Require authentication
  const user = await requireUser();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/dashboard/profile" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">CV</span>
              </div>
              <span className="font-bold text-gray-900 hidden sm:block">CV Matcher</span>
            </Link>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-3">
                {user.image && (
                  <img
                    src={user.image}
                    alt={user.name || 'User'}
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <div className="text-sm">
                  <div className="font-medium text-gray-900">{user.name || 'User'}</div>
                  <div className="text-gray-500 text-xs">{user.email}</div>
                </div>
              </div>
              <form action={handleSignOut}>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Logout
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden md:flex md:flex-shrink-0">
          <div className="w-64 bg-white border-r border-gray-200 min-h-screen">
            <nav className="px-4 py-6 space-y-1">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 mb-3">
                Dashboard
              </div>
              <NavLink href="/dashboard/profile" icon="document" primary>
                Profile & CV
              </NavLink>
              <NavLink href="/dashboard/matches" icon="briefcase">
                Job Matches
              </NavLink>
              <NavLink href="/dashboard/saved" icon="bookmark">
                Saved Jobs
              </NavLink>
              <NavLink href="/dashboard/applications" icon="list">
                Applications
              </NavLink>
              
              <div className="pt-4 mt-4 border-t border-gray-200">
                <NavLink href="/dashboard/privacy" icon="shield">
                  Privacy & Data
                </NavLink>
              </div>
            </nav>
          </div>
        </aside>

        {/* Mobile Bottom Nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-10">
          <div className="flex justify-around py-2">
            <MobileNavLink href="/dashboard/profile" icon="document" label="Profile" />
            <MobileNavLink href="/dashboard/matches" icon="briefcase" label="Matches" />
            <MobileNavLink href="/dashboard/saved" icon="bookmark" label="Saved" />
            <MobileNavLink href="/dashboard/applications" icon="list" label="Applied" />
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 pb-20 md:pb-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
