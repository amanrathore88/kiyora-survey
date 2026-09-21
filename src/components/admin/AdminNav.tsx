'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { adminFetch, removeAdminToken } from '@/lib/admin-client';

export default function AdminNav() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await adminFetch('/api/admin/auth', { method: 'DELETE' });
    } catch (error) {
      console.error('Logout failed', error);
    } finally {
      removeAdminToken();
      window.location.href = '/admin/login';
    }
  };

  const navLinks = [
    { name: 'Dashboard', path: '/admin' },
    { name: 'Responses', path: '/admin/responses' },
    { name: 'Questions', path: '/admin/questions' },
    { name: 'Sessions', path: '/admin/sessions' },
  ];

  const isActive = (path: string) =>
    pathname === path || (path !== '/admin' && pathname.startsWith(path));

  return (
    <nav className="bg-[#1b2a4a] text-white shadow-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Brand */}
          <div className="flex items-center">
            <Link href="/admin" className="flex items-center">
              <Image
                src="/logo.png"
                alt="Kiyoki Private Limited"
                width={36}
                height={36}
                className="rounded-full bg-white p-0.5"
              />
              <span className="font-bold text-lg ml-2.5 tracking-wide text-white">KIYOKI</span>
              <span className="ml-2 text-xs text-gray-300 border-l border-gray-500 pl-2">Admin</span>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden sm:ml-8 sm:flex sm:space-x-6">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.path}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition ${
                    isActive(link.path)
                      ? 'border-[#E0A96D] text-white font-semibold'
                      : 'border-transparent text-gray-300 hover:border-gray-300 hover:text-white'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Desktop Right Actions */}
          <div className="hidden sm:flex sm:items-center sm:space-x-3">
            <Link
              href="/"
              target="_blank"
              className="px-3 py-1.5 border border-amber-300/60 text-amber-200 hover:bg-white/10 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Open Survey Form
            </Link>
            <button
              onClick={handleLogout}
              className="px-3.5 py-1.5 border border-transparent text-xs font-semibold rounded-lg text-[#1b2a4a] bg-white hover:bg-gray-100 transition shadow-xs cursor-pointer"
            >
              Logout
            </button>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex sm:hidden items-center gap-2">
            <Link
              href="/"
              target="_blank"
              className="p-1.5 border border-amber-300/60 text-amber-200 rounded-lg text-xs flex items-center gap-1"
              title="Open Survey"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 focus:outline-none transition cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-white/10 bg-[#15223c] px-4 pt-2 pb-4 space-y-1 shadow-lg animate-fadeIn">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                isActive(link.path)
                  ? 'bg-white/15 text-[#E0A96D] font-semibold'
                  : 'text-gray-200 hover:bg-white/10 hover:text-white'
              }`}
            >
              {link.name}
            </Link>
          ))}
          <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
            <Link
              href="/"
              target="_blank"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-2.5 px-3 border border-amber-300/60 text-amber-200 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 hover:bg-white/10 transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Open Survey Form
            </Link>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogout();
              }}
              className="w-full py-2.5 px-3 rounded-lg text-xs font-semibold text-[#1b2a4a] bg-white hover:bg-gray-100 text-center transition cursor-pointer"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
