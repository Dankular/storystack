'use client';

import Link from 'next/link';
import { useAuthStore } from '@/stores/auth';
import { Button } from '@/components/ui';
import { NotificationsDropdown } from './notifications-dropdown';
import { GlobalSearch } from './global-search';

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();

  return (
    <header className="bg-white border-b border-gray-200">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-xl font-bold text-sky-600">
              StoryStack
            </Link>
            <div className="hidden sm:flex space-x-4">
              <Link
                href="/stories"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
              >
                Browse
              </Link>
              {isAuthenticated && (
                <>
                  <Link
                    href="/write"
                    className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
                  >
                    Write
                  </Link>
                  <Link
                    href="/library"
                    className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
                  >
                    Library
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="hidden md:block">
            <GlobalSearch />
          </div>

          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <NotificationsDropdown />
                <Link
                  href={`/user/${user?.username}`}
                  className="text-gray-600 hover:text-gray-900 text-sm font-medium"
                >
                  {user?.displayName || user?.username}
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                >
                  Sign out
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Sign in
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">
                    Get started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
