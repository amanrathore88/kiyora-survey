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
        {/* Navigation and Archive Action Bar */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <Link href="/admin/responses" className="text-[#1b2a4a] hover:underline font-semibold text-xs sm:text-sm flex items-center gap-1.5">
            &larr; Back to Responses
          </Link>
          <button
            onClick={handleToggleArchive}
            className="w-full sm:w-auto px-4 py-2 text-xs sm:text-sm border border-gray-300 rounded-xl bg-white hover:bg-gray-50 text-gray-700 font-semibold shadow-xs transition cursor-pointer text-center"
          >
            {response.isArchived ? 'Restore to Active' : 'Archive Response'}
          </button>
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
      </main>
    </div>
  );
}
