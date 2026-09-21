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
          <div className="flex flex-wrap gap-1 bg-white rounded-xl p-1 shadow-xs border border-gray-200 self-start sm:self-auto">
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
        </div>

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
                      </div>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}
