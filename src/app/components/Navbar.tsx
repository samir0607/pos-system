'use client';
import Link from 'next/link';
import { useState } from 'react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
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
          <div className="hidden sm:flex sm:space-x-8">
            <Link href="/products" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900">Products</Link>
            <Link href="/billing" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900">Billing</Link>
            <Link href="/dashboard" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900">Dashboard</Link>
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
          </div>
        </div>
      )}
    </nav>
  );
} 