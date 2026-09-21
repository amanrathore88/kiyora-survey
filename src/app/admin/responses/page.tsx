'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AdminNav from '@/components/admin/AdminNav';

type ResponseSummary = {
  sessionId: number;
  sessionToken: string;
  submittedAt: string | null;
  answerCount: number;
  participantName: string | null;
  participantContact: string | null;
  isArchived: boolean;
};

export default function ResponsesPage() {
  const router = useRouter();
  const [responses, setResponses] = useState<ResponseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'active' | 'archived' | 'all'>('active');
  const [exporting, setExporting] = useState(false);
  const [deletingSessionId, setDeletingSessionId] = useState<number | null>(null);
  const [deleteConfirmSession, setDeleteConfirmSession] = useState<{
    id: number;
    name: string | null;
  } | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchResponses = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/responses');
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setResponses(Array.isArray(data) ? data : data.responses || data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch responses', error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchResponses();
  }, [fetchResponses]);

  const handleToggleArchive = async (sessionId: number, currentArchived: boolean) => {
    try {
      await fetch('/api/admin/responses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, archive: !currentArchived }),
      });
      fetchResponses();
    } catch (error) {
      console.error('Failed to update response status', error);
    }
  };

  const handleDeleteResponse = async (sessionId: number) => {
    setDeletingSessionId(sessionId);
    try {
      const res = await fetch(`/api/admin/responses?sessionId=${sessionId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setDeleteConfirmSession(null);
        setSuccessMessage(`Response #${sessionId} and session token deleted successfully.`);
        setTimeout(() => setSuccessMessage(null), 4000);
        fetchResponses();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'Failed to delete response.');
      }
    } catch (error) {
      console.error('Delete response error:', error);
      alert('An error occurred while deleting response.');
    } finally {
      setDeletingSessionId(null);
    }
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const res = await fetch(`/api/admin/export?filter=${filter}`);
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
      const filterSuffix = filter !== 'all' ? `-${filter}` : '';
      link.download = `kiyoki-survey-responses${filterSuffix}-${timestamp}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export responses. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const filteredResponses = responses.filter((r) => {
    if (filter === 'all') return true;
    if (filter === 'archived') return r.isArchived;
    return !r.isArchived;
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <AdminNav />
      <main className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
        {/* Header and Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Completed Survey Responses</h1>
            <p className="text-xs sm:text-sm text-gray-500">View participant submissions, responses audit trail, and archive status.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <div className="flex flex-wrap gap-1 bg-white rounded-xl p-1 shadow-xs border border-gray-200">
              {(['active', 'archived', 'all'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition cursor-pointer ${
                    filter === f ? 'bg-[#1b2a4a] text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {f} ({responses.filter((r) => (f === 'all' ? true : f === 'archived' ? r.isArchived : !r.isArchived)).length})
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
          <div className="text-center py-12 text-gray-500 font-medium text-sm">Loading responses...</div>
        ) : (
          <div className="bg-white shadow-sm rounded-2xl overflow-hidden border border-gray-200">
            <ul className="divide-y divide-gray-200">
              {filteredResponses.length === 0 ? (
                <li className="px-6 py-12 text-center text-sm text-gray-500">No responses match this filter.</li>
              ) : (
                filteredResponses.map((r, idx) => (
                  <li key={r.sessionId}>
                    <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 hover:bg-gray-50/70 transition">
                      <div className="min-w-0 flex-1">
                        <Link href={`/admin/responses/${r.sessionId}`} className="block group">
                          <div className="flex items-center flex-wrap gap-2">
                            <span className="font-bold text-[#1b2a4a] text-sm">#{idx + 1}</span>
                            <span className="font-semibold text-gray-900 group-hover:text-[#1b2a4a] transition">
                              {r.participantName || 'Anonymous Participant'}
                            </span>
                            <span className="text-xs text-gray-500 break-all">
                              ({r.participantContact || 'No contact specified'})
                            </span>
                          </div>
                          <div className="mt-1.5 flex items-center flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                            <span>
                              Submitted: {r.submittedAt ? new Date(r.submittedAt).toLocaleString() : 'N/A'}
                            </span>
                            <span>•</span>
                            <span>Recorded Answers: <strong>{r.answerCount}</strong></span>
                            <span>•</span>
                            <span className="font-mono text-gray-400">Session #{r.sessionId}</span>
                          </div>
                        </Link>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 justify-end">
                        <span
                          className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                            !r.isArchived ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {r.isArchived ? 'Archived' : 'Active'}
                        </span>
                        <Link
                          href={`/admin/responses/${r.sessionId}`}
                          className="text-xs px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-100 font-semibold text-gray-700 transition cursor-pointer"
                        >
                          View Answers
                        </Link>
                        <button
                          onClick={() => handleToggleArchive(r.sessionId, r.isArchived)}
                          className="text-xs px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-100 font-semibold text-gray-600 transition cursor-pointer"
                        >
                          {r.isArchived ? 'Restore' : 'Archive'}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setDeleteConfirmSession({
                              id: r.sessionId,
                              name: r.participantName,
                            })
                          }
                          className="text-xs px-2.5 py-1.5 border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1"
                          title="Delete response and session"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        )}

        {/* Delete Confirmation Modal */}
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
                  <h3 className="text-base font-bold text-gray-900">Delete Respondent Data?</h3>
                  <p className="text-xs text-gray-500">Session #{deleteConfirmSession.id} • {deleteConfirmSession.name || 'Anonymous'}</p>
                </div>
              </div>

              <div className="bg-red-50/70 border border-red-200 rounded-xl p-3.5 mb-5 text-xs text-red-800 space-y-1.5 leading-relaxed">
                <p className="font-semibold">⚠️ This will permanently remove:</p>
                <ul className="list-disc list-inside space-y-0.5 text-red-700">
                  <li>All recorded answers for this respondent</li>
                  <li>Contact details (Name & Contact)</li>
                  <li>The session token from the <strong>Sessions</strong> list</li>
                </ul>
                <p className="pt-1 text-[11px] text-red-600">This ensures complete consistency between Responses and Sessions.</p>
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
                  onClick={() => handleDeleteResponse(deleteConfirmSession.id)}
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
      </main>
    </div>
  );
}
