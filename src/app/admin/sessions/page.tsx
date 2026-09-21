'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminNav from '@/components/admin/AdminNav';

type SessionItem = {
  id: number;
  sessionToken: string;
  status: 'in_progress' | 'completed' | 'abandoned';
  language?: string;
  currentQuestionIndex: number;
  startedAt: string;
  completedAt: string | null;
  lastActivityAt: string;
};

export default function SessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'in_progress' | 'completed' | 'abandoned'>('all');
  const [exporting, setExporting] = useState(false);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/sessions');
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch sessions', error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleMarkAbandoned = async (sessionId: number) => {
    try {
      await fetch('/api/admin/sessions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, action: 'abandon' }),
      });
      fetchSessions();
    } catch (error) {
      console.error('Failed to update session status', error);
    }
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const statusParam = filter === 'all' ? 'completed' : filter;
      const res = await fetch(`/api/admin/export?status=${statusParam}`);
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      if (!res.ok) {
        throw new Error('Export failed');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const timestamp = new Date().toISOString().split('T')[0];
      link.download = `kiyora-survey-responses-${timestamp}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export CSV. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const filteredSessions = sessions.filter((s) => {
    if (filter === 'all') return true;
    return s.status === filter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="px-2.5 py-0.5 inline-flex text-xs font-semibold rounded-full bg-green-100 text-green-800">Completed</span>;
      case 'in_progress':
        return <span className="px-2.5 py-0.5 inline-flex text-xs font-semibold rounded-full bg-amber-100 text-amber-800">In Progress</span>;
      case 'abandoned':
        return <span className="px-2.5 py-0.5 inline-flex text-xs font-semibold rounded-full bg-red-100 text-red-800">Abandoned</span>;
      default:
        return <span className="px-2.5 py-0.5 inline-flex text-xs font-semibold rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <AdminNav />
      <main className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
        {/* Header & Filter Controls */}
        <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Survey Sessions</h1>
            <p className="text-xs sm:text-sm text-gray-500">Track active respondent sessions, abandonment, and progress in real time.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <div className="flex flex-wrap gap-1 bg-white rounded-xl p-1 shadow-xs border border-gray-200">
              {(['all', 'in_progress', 'completed', 'abandoned'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition cursor-pointer ${
                    filter === f ? 'bg-[#1b2a4a] text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {f.replace('_', ' ')}
                </button>
              ))}
            </div>

            <button
              onClick={handleExportCSV}
              disabled={exporting}
              className="px-3.5 py-1.5 sm:py-2 bg-[#1b2a4a] hover:bg-[#2a3f6a] text-white text-xs sm:text-sm font-semibold rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title="Export response entries to CSV"
            >
              {exporting ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Exporting...</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>Export CSV</span>
                </>
              )}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500 font-medium text-sm">Loading sessions...</div>
        ) : (
          <div className="bg-white shadow-sm rounded-2xl overflow-hidden border border-gray-200">
            {/* Desktop Table View (visible on medium & large screens) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Session Token</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Started</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Activity</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Progress</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSessions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">No sessions found.</td>
                    </tr>
                  ) : (
                    filteredSessions.map((s) => (
                      <tr key={s.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900" title={s.sessionToken}>
                          #{s.id} — {s.sessionToken.substring(0, 8)}...
                          <span className="ml-2 text-xs uppercase px-1.5 py-0.5 rounded bg-gray-100 border text-gray-600 font-sans font-semibold">
                            {s.language || 'en'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(s.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(s.startedAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(s.lastActivityAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {s.currentQuestionIndex} / 25 Questions
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {s.status === 'in_progress' && (
                            <button
                              onClick={() => handleMarkAbandoned(s.id)}
                              className="text-xs px-2.5 py-1 border border-red-300 text-red-600 rounded hover:bg-red-50 cursor-pointer"
                            >
                              Mark Abandoned
                            </button>
                          )}
                          {s.status === 'completed' && (
                            <Link href={`/admin/responses/${s.id}`} className="text-xs text-[#1b2a4a] hover:underline font-semibold ml-2">
                              View Response &rarr;
                            </Link>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View (visible on small phone screens) */}
            <div className="md:hidden divide-y divide-gray-200">
              {filteredSessions.length === 0 ? (
                <div className="p-6 text-center text-sm text-gray-500">No sessions found.</div>
              ) : (
                filteredSessions.map((s) => (
                  <div key={s.id} className="p-4 space-y-2.5 hover:bg-gray-50/70 transition">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-bold text-sm text-[#1b2a4a]">#{s.id}</span>
                        <span className="font-mono text-xs text-gray-500 truncate" title={s.sessionToken}>
                          {s.sessionToken.substring(0, 12)}...
                        </span>
                        <span className="text-xs uppercase px-1.5 py-0.5 rounded bg-gray-100 border text-gray-600 font-semibold flex-shrink-0">
                          {s.language || 'en'}
                        </span>
                      </div>
                      <div className="flex-shrink-0">
                        {getStatusBadge(s.status)}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-600 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                      <span>Progress:</span>
                      <strong className="text-gray-900 font-semibold">{s.currentQuestionIndex} / 25 Questions</strong>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Last Active: {new Date(s.lastActivityAt).toLocaleTimeString()}</span>
                      <span>Started: {new Date(s.startedAt).toLocaleDateString()}</span>
                    </div>

                    {/* Action buttons */}
                    <div className="pt-2 border-t border-gray-100 flex justify-end gap-2">
                      {s.status === 'in_progress' && (
                        <button
                          onClick={() => handleMarkAbandoned(s.id)}
                          className="w-full py-2 text-xs font-semibold border border-red-300 text-red-600 rounded-lg hover:bg-red-50 text-center cursor-pointer"
                        >
                          Mark Abandoned
                        </button>
                      )}
                      {s.status === 'completed' && (
                        <Link
                          href={`/admin/responses/${s.id}`}
                          className="w-full py-2 text-xs font-semibold bg-[#1b2a4a] text-white rounded-lg hover:bg-[#2a3f6a] text-center shadow-xs"
                        >
                          View Response Details &rarr;
                        </Link>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
