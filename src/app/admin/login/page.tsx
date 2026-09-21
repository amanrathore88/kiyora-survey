'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        router.push('/admin');
      } else {
        const data = await res.json();
        setError(data.error || 'Invalid credentials');
      }
    } catch {
      setError('An error occurred during login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1b2a4a] flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <Image
          src="/logo.png"
          alt="Kiyoki Private Limited"
          width={72}
          height={72}
          className="rounded-full mb-3 bg-white p-1 shadow-md"
        />
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-widest mb-1">KIYORA</h1>
        <h2 className="text-center text-sm sm:text-base font-medium text-gray-300">
          Admin Portal
        </h2>
      </div>

      <div className="mt-6 sm:mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-6 sm:py-8 px-5 sm:px-10 shadow-xl rounded-2xl border border-gray-100">
          <form className="space-y-5" onSubmit={handleLogin}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-xs sm:text-sm font-medium">
                {error}
              </div>
            )}
            <div>
              <label htmlFor="username" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="appearance-none block w-full px-3.5 py-2.5 border border-gray-300 rounded-xl shadow-xs placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1b2a4a] text-base sm:text-sm"
                placeholder="Enter admin username"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none block w-full px-3.5 py-2.5 border border-gray-300 rounded-xl shadow-xs placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1b2a4a] text-base sm:text-sm"
                placeholder="Enter password"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2.5 sm:py-3 px-4 border border-transparent rounded-xl shadow-xs text-sm font-semibold text-white bg-[#1b2a4a] hover:bg-[#2a3f6a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1b2a4a] disabled:opacity-50 transition cursor-pointer"
              >
                {loading ? 'Signing in...' : 'Sign in to Admin'}
              </button>
            </div>
          </form>

          <div className="mt-6 border-t border-gray-200 pt-4 text-center">
            <Link
              href="/"
              className="text-xs sm:text-sm font-medium text-[#1b2a4a] hover:text-[#2a3f6a] hover:underline inline-flex items-center gap-1.5"
            >
              &larr; Open / Take the Live Survey Form
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
