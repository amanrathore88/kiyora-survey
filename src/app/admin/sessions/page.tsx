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
  const [deletingSessionId, setDeletingSessionId] = useState<number | null>(null);
  const [deleteConfirmSession, setDeleteConfirmSession] = useState<SessionItem | null>(null);
  const [cleanupModalOpen, setCleanupModalOpen] = useState(false);
  const [cleaningUp, setCleaningUp] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

  const handleDeleteSession = async (sessionId: number) => {
    setDeletingSessionId(sessionId);
    try {
      const res = await fetch(`/api/admin/sessions?sessionId=${sessionId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setDeleteConfirmSession(null);
        setSuccessMessage(`Session #${sessionId} and all associated data deleted successfully.`);
        setTimeout(() => setSuccessMessage(null), 4000);
        fetchSessions();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'Failed to delete session.');
      }
    } catch (error) {
      console.error('Delete session error:', error);
      alert('An error occurred while deleting session.');
    } finally {
      setDeletingSessionId(null);
    }
  };

  const handleCleanupAbandoned = async () => {
    setCleaningUp(true);
    try {
      const res = await fetch('/api/admin/sessions?cleanupAbandoned=true', {
        method: 'DELETE',
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        setCleanupModalOpen(false);
        setSuccessMessage(data.message || 'All abandoned sessions cleaned up successfully.');
        setTimeout(() => setSuccessMessage(null), 4000);
        fetchSessions();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'Failed to cleanup abandoned sessions.');
      }
    } catch (error) {
      console.error('Cleanup error:', error);
      alert('An error occurred while cleaning up abandoned sessions.');
    } finally {
      setCleaningUp(false);
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
      link.download = `kiyoki-survey-responses-${timestamp}.csv`;
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

  const abandonedCount = sessions.filter((s) => s.status === 'abandoned').length;

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

            {abandonedCount > 0 && (
              <button
                onClick={() => setCleanupModalOpen(true)}
                className="px-3.5 py-1.5 sm:py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs sm:text-sm font-semibold rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                title="Remove all abandoned sessions"
              >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>Clean Up Abandoned ({abandonedCount})</span>
              </button>
            )}

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

        {/* Success alert */}
        {successMessage && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-2">
            <svg className="w-4 h-4 text-emerald-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>{successMessage}</span>
          </div>
        )}

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
                          {s.currentQuestionIndex} / 26 Questions
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            {s.status === 'in_progress' && (
                              <button
                                onClick={() => handleMarkAbandoned(s.id)}
                                className="text-xs px-2.5 py-1 border border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg cursor-pointer font-semibold"
                              >
                                Mark Abandoned
                              </button>
                            )}
                            {s.status === 'completed' && (
                              <Link href={`/admin/responses/${s.id}`} className="text-xs text-[#1b2a4a] hover:underline font-semibold">
                                View &rarr;
                              </Link>
                            )}
                            <button
                              onClick={() => setDeleteConfirmSession(s)}
                              className="text-xs px-2 py-1 border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg cursor-pointer font-semibold inline-flex items-center gap-1"
                              title="Delete session"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              <span>Delete</span>
                            </button>
                          </div>
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
                      <strong className="text-gray-900 font-semibold">{s.currentQuestionIndex} / 26 Questions</strong>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Last Active: {new Date(s.lastActivityAt).toLocaleTimeString()}</span>
                      <span>Started: {new Date(s.startedAt).toLocaleDateString()}</span>
                    </div>

                    {/* Action buttons */}
                    <div className="pt-2 border-t border-gray-100 flex items-center justify-end gap-2">
                      {s.status === 'in_progress' && (
                        <button
                          onClick={() => handleMarkAbandoned(s.id)}
                          className="flex-1 py-2 text-xs font-semibold border border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg text-center cursor-pointer"
                        >
                          Mark Abandoned
                        </button>
                      )}
                      {s.status === 'completed' && (
                        <Link
                          href={`/admin/responses/${s.id}`}
                          className="flex-1 py-2 text-xs font-semibold bg-[#1b2a4a] text-white rounded-lg hover:bg-[#2a3f6a] text-center shadow-xs"
                        >
                          View Response &rarr;
                        </Link>
                      )}
                      <button
                        onClick={() => setDeleteConfirmSession(s)}
                        className="px-3 py-2 text-xs font-semibold border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg text-center cursor-pointer flex items-center justify-center gap-1"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Delete Single Session Confirmation Modal */}
        {deleteConfirmSession && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Delete Survey Session?</h3>
                  <p className="text-xs text-gray-500">Session #{deleteConfirmSession.id} • Status: {deleteConfirmSession.status}</p>
                </div>
              </div>

              <div className="bg-red-50/70 border border-red-200 rounded-xl p-3.5 mb-5 text-xs text-red-800 space-y-1.5 leading-relaxed">
                <p className="font-semibold">⚠️ This will permanently remove:</p>
                <ul className="list-disc list-inside space-y-0.5 text-red-700">
                  <li>Session #{deleteConfirmSession.id} and its session token</li>
                  <li>Any answered questions and contacts associated with this session</li>
                  <li>The corresponding entry from the <strong>Responses</strong> tab (if completed)</li>
                </ul>
                <p className="pt-1 text-[11px] text-red-600">Both lists will remain completely synchronized.</p>
              </div>

              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  disabled={deletingSessionId !== null}
                  onClick={() => setDeleteConfirmSession(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deletingSessionId !== null}
                  onClick={() => handleDeleteSession(deleteConfirmSession.id)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {deletingSessionId === deleteConfirmSession.id ? (
                    <>
                      <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <span>Permanently Delete</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Clean Up Abandoned Sessions Modal */}
        {cleanupModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Clean Up Abandoned Sessions?</h3>
                  <p className="text-xs text-gray-500">Purge {abandonedCount} abandoned test session{abandonedCount > 1 ? 's' : ''}</p>
                </div>
              </div>

              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 mb-5 text-xs text-amber-900 space-y-1.5 leading-relaxed">
                <p className="font-semibold">🧹 This will remove all {abandonedCount} abandoned sessions:</p>
                <p>These are test or incomplete sessions where the respondent left without completing the questionnaire. Removing them resolves the count discrepancy between Sessions and Completed Responses.</p>
                <p className="pt-1 text-[11px] text-amber-700 font-semibold">Active in-progress sessions and completed responses will NOT be touched.</p>
              </div>

              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  disabled={cleaningUp}
                  onClick={() => setCleanupModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={cleaningUp}
                  onClick={handleCleanupAbandoned}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {cleaningUp ? (
                    <>
                      <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span>Cleaning up...</span>
                    </>
                  ) : (
                    <span>Clean Up All Abandoned</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
