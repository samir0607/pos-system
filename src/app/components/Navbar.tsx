'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: session, status } = useSession();

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/auth/signin' });
  };

  if (status === 'loading') {
    return (
      <nav className="bg-white shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold text-gray-800">
                POS System
              </Link>
            </div>
            <div className="text-gray-500">Loading...</div>
          </div>
        </div>
      </nav>
    );
  }

  if (!session) {
    return (
      <nav className="bg-white shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold text-gray-800">
                POS System
              </Link>
            </div>
            <div className="hidden sm:flex sm:space-x-8">
              <Link href="/auth/signin" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-gray-800">
              POS System
            </Link>
          </div>
          {/* Hamburger menu button */}
          <div className="sm:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
              aria-controls="mobile-menu"
              aria-expanded={isOpen}
            >
              <span className="sr-only">Open main menu</span>
              <svg
                className="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                {isOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
          {/* Desktop menu */}
          <div className="hidden sm:flex sm:items-center sm:space-x-8">
            <Link href="/products" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900">Products</Link>
            <Link href="/billing" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900">Billing</Link>
            <Link href="/dashboard" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900">Dashboard</Link>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">Welcome, {session.user?.name || session.user?.email}</span>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Mobile menu */}
      {isOpen && (
        <div className="sm:hidden" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link href="/products" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100">Products</Link>
            <Link href="/billing" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100">Billing</Link>
            <Link href="/dashboard" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100">Dashboard</Link>
            <div className="border-t border-gray-200 pt-4">
              <div className="px-3 py-2 text-sm text-gray-700">
                Welcome, {session.user?.name || session.user?.email}
              </div>
              <button
                onClick={handleSignOut}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
} 