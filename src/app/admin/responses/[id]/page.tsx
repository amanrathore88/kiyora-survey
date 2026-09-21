'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import AdminNav from '@/components/admin/AdminNav';

type AnswerDetail = {
  questionNumber: string;
  questionText: string;
  questionType: string;
  selectedOptions?: string[];
  otherText?: string | null;
  freeText?: string | null;
};

type ResponseDetail = {
  sessionId: number;
  sessionToken: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
  participantName?: string | null;
  participantContact?: string | null;
  isArchived: boolean;
  answers: AnswerDetail[];
};

export default function ResponseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [response, setResponse] = useState<ResponseDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchResponseDetail = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/responses/${id}`);
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setResponse(data.response || data.data || data);
      }
    } catch (error) {
      console.error('Failed to fetch response details', error);
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    if (id) {
      fetchResponseDetail();
    }
  }, [id, fetchResponseDetail]);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleToggleArchive = async () => {
    if (!response) return;
    try {
      await fetch('/api/admin/responses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: response.sessionId, archive: !response.isArchived }),
      });
      fetchResponseDetail();
    } catch (error) {
      console.error('Failed to update response status', error);
    }
  };

  const handleDeleteResponse = async () => {
    if (!response) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/responses/${response.sessionId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        router.push('/admin/responses');
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'Failed to delete response.');
        setIsDeleting(false);
      }
    } catch (error) {
      console.error('Delete response error:', error);
      alert('An error occurred while deleting response.');
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-[#1b2a4a]" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-gray-500 text-sm font-medium">Loading response details...</p>
        </div>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminNav />
        <div className="max-w-7xl mx-auto py-12 px-4 text-center">
          <p className="text-gray-500 text-lg">Response not found.</p>
          <Link href="/admin/responses" className="text-[#1b2a4a] hover:underline mt-4 inline-block font-semibold text-sm">
            &larr; Return to Responses
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <AdminNav />
      <main className="max-w-4xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
        {/* Navigation and Archive/Delete Action Bar */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <Link href="/admin/responses" className="text-[#1b2a4a] hover:underline font-semibold text-xs sm:text-sm flex items-center gap-1.5">
            &larr; Back to Responses
          </Link>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleToggleArchive}
              className="flex-1 sm:flex-none px-4 py-2 text-xs sm:text-sm border border-gray-300 rounded-xl bg-white hover:bg-gray-50 text-gray-700 font-semibold shadow-xs transition cursor-pointer text-center"
            >
              {response.isArchived ? 'Restore to Active' : 'Archive Response'}
            </button>
            <button
              onClick={() => setDeleteModalOpen(true)}
              className="flex-1 sm:flex-none px-4 py-2 text-xs sm:text-sm border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 font-semibold rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>Delete Response</span>
            </button>
          </div>
        </div>

        {/* Participant & Session Info Card */}
        <div className="bg-white shadow-sm rounded-2xl overflow-hidden mb-6 sm:mb-8 border border-gray-200">
          <div className="p-4 sm:px-6 sm:py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 bg-gray-50/70">
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-gray-900">
                Participant Submission (Session #{response.sessionId})
              </h3>
              <p className="text-xs text-gray-500 font-mono mt-0.5 break-all">{response.sessionToken}</p>
            </div>
            <span
              className={`self-start sm:self-center px-3 py-1 text-xs font-semibold rounded-full ${
                !response.isArchived ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'
              }`}
            >
              {response.isArchived ? 'Archived' : 'Active'}
            </span>
          </div>

          <div className="p-4 sm:px-6 sm:py-5">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Participant Name</dt>
                <dd className="mt-1 text-sm font-semibold text-gray-900 break-words">
                  {response.participantName || 'Anonymous (No name provided)'}
                </dd>
              </div>
              <div className="bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Contact Details</dt>
                <dd className="mt-1 text-sm font-semibold text-gray-900 break-all">
                  {response.participantContact || 'None provided'}
                </dd>
              </div>
              <div className="bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Session Started</dt>
                <dd className="mt-1 text-xs sm:text-sm text-gray-700">
                  {new Date(response.startedAt).toLocaleString()}
                </dd>
              </div>
              <div className="bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Completed At</dt>
                <dd className="mt-1 text-xs sm:text-sm text-gray-700">
                  {response.completedAt ? new Date(response.completedAt).toLocaleString() : 'In Progress'}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Survey Answers Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">
            Recorded Answers ({response.answers.length})
          </h2>
        </div>

        {/* Answers List */}
        <div className="space-y-3 sm:space-y-4">
          {response.answers.map((ans, idx) => (
            <div key={idx} className="bg-white shadow-sm rounded-2xl p-4 sm:p-5 border border-gray-200">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="font-bold text-xs bg-[#1b2a4a] text-white px-2 py-0.5 rounded-md">
                  {ans.questionNumber}
                </span>
                <span className="text-xs text-gray-400 capitalize font-medium">{ans.questionType}</span>
              </div>
              <h3 className="text-sm font-semibold text-gray-800 mb-3 break-words leading-snug">{ans.questionText}</h3>

              {ans.selectedOptions && ans.selectedOptions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {ans.selectedOptions.map((opt, oIdx) => (
                    <span
                      key={oIdx}
                      className="inline-block bg-blue-50 text-blue-900 text-xs sm:text-sm font-medium px-3 py-1 rounded-lg border border-blue-100 break-words"
                    >
                      {opt}
                    </span>
                  ))}
                </div>
              )}

              {ans.otherText && (
                <div className="mt-2 text-xs sm:text-sm text-gray-600 bg-gray-50 p-2.5 rounded-xl border border-gray-200 break-words">
                  <strong className="text-gray-800">Specified: </strong>
                  {ans.otherText}
                </div>
              )}

              {ans.freeText && (
                <div className="mt-2 text-xs sm:text-sm text-gray-800 bg-amber-50/70 p-3 rounded-xl border border-amber-200 whitespace-pre-wrap break-words">
                  {ans.freeText}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Delete Confirmation Modal */}
        {deleteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Delete Respondent Submission?</h3>
                  <p className="text-xs text-gray-500">Session #{response.sessionId} • {response.participantName || 'Anonymous'}</p>
                </div>
              </div>

              <div className="bg-red-50/70 border border-red-200 rounded-xl p-3.5 mb-5 text-xs text-red-800 space-y-1.5 leading-relaxed">
                <p className="font-semibold">⚠️ This will permanently remove:</p>
                <ul className="list-disc list-inside space-y-0.5 text-red-700">
                  <li>All {response.answers.length} recorded answers for this respondent</li>
                  <li>Contact details (Name & Contact)</li>
                  <li>The session token from the <strong>Sessions</strong> list</li>
                </ul>
                <p className="pt-1 text-[11px] text-red-600">This ensures complete consistency between Responses and Sessions.</p>
              </div>

              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setDeleteModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleDeleteResponse}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isDeleting ? (
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
