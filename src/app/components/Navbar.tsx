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
      <nav className="bg-gradient-to-r from-blue-900/90 via-purple-900/90 to-pink-900/90 backdrop-blur-lg border-b border-white/20 shadow-xl">
        <div className="container mx-auto px-4">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold text-white drop-shadow-lg hover:text-blue-200 transition-colors duration-300">
                GenZ
              </Link>
            </div>
            <div className="text-white/70">Loading...</div>
          </div>
        </div>
      </nav>
    );
  }

  if (!session) {
    return (
      <nav className="bg-gradient-to-r from-blue-900/90 via-purple-900/90 to-pink-900/90 backdrop-blur-lg border-b border-white/20 shadow-xl">
        <div className="container mx-auto px-4">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold text-white drop-shadow-lg hover:text-blue-200 transition-colors duration-300">
                GenZ
              </Link>
            </div>
            <div className="hidden sm:flex sm:space-x-8">
              <Link href="/auth/signin" className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl hover:bg-white/30 transition-all duration-300 shadow-lg">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-gradient-to-r from-blue-900/90 via-purple-900/90 to-pink-900/90 backdrop-blur-lg border-b border-white/20 shadow-xl">
      <div className="container mx-auto px-4">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-white drop-shadow-lg hover:text-blue-200 transition-colors duration-300">
              GenZ
            </Link>
          </div>
          {/* Desktop menu */}
          <div className="hidden sm:flex sm:items-center sm:space-x-6">
            <Link href="/products" className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl hover:bg-white/20 transition-all duration-300 shadow-lg hover:shadow-blue-500/25">
              Products
            </Link>
            <Link href="/billing" className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl hover:bg-white/20 transition-all duration-300 shadow-lg hover:shadow-purple-500/25">
              Billing
            </Link>
            <Link href="/dashboard" className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl hover:bg-white/20 transition-all duration-300 shadow-lg hover:shadow-pink-500/25">
              Dashboard
            </Link>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleSignOut}
                className="inline-flex items-center px-4 py-2 text-sm leading-4 font-medium rounded-xl text-white bg-red-500/70 backdrop-blur-sm border border-red-400/30 hover:bg-red-500/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500/50 transition-all duration-300 shadow-lg hover:shadow-red-500/25"
              >
                Sign Out
              </button>
            </div>
          </div>
          
          {/* Mobile menu button */}
          <div className="sm:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-xl text-white bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white/50 transition-all duration-300"
            >
              <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isOpen && (
        <div className="sm:hidden border-t border-white/20" id="mobile-menu">
          <div className="px-4 pt-2 pb-3 space-y-2 bg-black/20 backdrop-blur-lg">
            <Link 
              href="/products" 
              className="block px-4 py-3 rounded-xl text-base font-medium text-white bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300"
              onClick={() => setIsOpen(false)}
            >
              Products
            </Link>
            <Link 
              href="/billing" 
              className="block px-4 py-3 rounded-xl text-base font-medium text-white bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300"
              onClick={() => setIsOpen(false)}
            >
              Billing
            </Link>
            <Link 
              href="/dashboard" 
              className="block px-4 py-3 rounded-xl text-base font-medium text-white bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300"
              onClick={() => setIsOpen(false)}
            >
              Dashboard
            </Link>
            <div className="border-t border-white/20 pt-4">
              <button
                onClick={handleSignOut}
                className="block w-full text-left px-4 py-3 rounded-xl text-base font-medium text-white bg-red-500/50 backdrop-blur-sm border border-red-400/30 hover:bg-red-500/70 transition-all duration-300"
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