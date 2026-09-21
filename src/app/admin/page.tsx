'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminNav from '@/components/admin/AdminNav';

type DashboardStats = {
  totalSessions: number;
  completed: number;
  inProgress: number;
  abandoned: number;
  completionRate: string;
};

type AnalyticsData = {
  q16Distribution: { label: string; value: number }[];
  q23Distribution: { label: string; value: number }[];
  summary: { upgraded: number; downgraded: number; same: number };
};

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [sessionsRes, analyticsRes] = await Promise.all([
          fetch('/api/admin/sessions'),
          fetch('/api/admin/analytics'),
        ]);

        if (sessionsRes.status === 401 || analyticsRes.status === 401) {
          router.push('/admin/login');
          return;
        }

        if (sessionsRes.ok) {
          const sessionsData = await sessionsRes.json();
          if (sessionsData.dashboardStats) {
            const ds = sessionsData.dashboardStats;
            setStats({
              totalSessions: ds.totalSessions,
              completed: ds.completedSessions,
              inProgress: ds.inProgressSessions,
              abandoned: ds.abandonedSessions,
              completionRate: `${Number(ds.completionRate).toFixed(1)}%`,
            });
          } else {
            interface SessionItem {
              status: string;
            }
            const list: SessionItem[] = sessionsData.sessions || sessionsData.data || [];
            const total = list.length;
            const completed = list.filter((s) => s.status === 'completed').length;
            const inProgress = list.filter((s) => s.status === 'in_progress').length;
            const abandoned = list.filter((s) => s.status === 'abandoned').length;
            setStats({
              totalSessions: total,
              completed,
              inProgress,
              abandoned,
              completionRate: total > 0 ? ((completed / total) * 100).toFixed(1) + '%' : '0%',
            });
          }
        }

        if (analyticsRes.ok) {
          const data = await analyticsRes.json();
          const q16Entries = Object.entries(data.q16Distribution || {}).map(([label, value]) => ({
            label,
            value: Number(value),
          }));
          const q23Entries = Object.entries(data.q23Distribution || {}).map(([label, value]) => ({
            label,
            value: Number(value),
          }));

          const totalShifts =
            (data.shifts?.upgraded || 0) + (data.shifts?.downgraded || 0) + (data.shifts?.same || 0);

          setAnalytics({
            q16Distribution: q16Entries.length > 0 ? q16Entries : [
              { label: 'Definitely would consider', value: 0 },
              { label: 'Probably would consider', value: 0 },
              { label: 'Not sure', value: 0 },
              { label: 'Probably would not consider', value: 0 },
              { label: 'Definitely would not consider', value: 0 },
            ],
            q23Distribution: q23Entries.length > 0 ? q23Entries : [
              { label: 'Definitely yes', value: 0 },
              { label: 'Probably yes', value: 0 },
              { label: 'Not sure', value: 0 },
              { label: 'Probably no', value: 0 },
              { label: 'Definitely no', value: 0 },
            ],
            summary: {
              upgraded: totalShifts > 0 ? Math.round(((data.shifts?.upgraded || 0) / totalShifts) * 100) : 0,
              downgraded: totalShifts > 0 ? Math.round(((data.shifts?.downgraded || 0) / totalShifts) * 100) : 0,
              same: totalShifts > 0 ? Math.round(((data.shifts?.same || 0) / totalShifts) * 100) : 0,
            },
          });
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [router]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch('/api/admin/export');
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
      alert('Failed to export responses. Please try again.');
    } finally {
      setExporting(false);
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
          <p className="text-gray-500 text-sm font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const maxQ16 = Math.max(...(analytics?.q16Distribution.map((d) => d.value) || [1]));
  const maxQ23 = Math.max(...(analytics?.q23Distribution.map((d) => d.value) || [1]));
  const maxVal = Math.max(maxQ16, maxQ23);

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <AdminNav />

      <main className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
        {/* Header with Title and Export Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-xs sm:text-sm text-gray-500">Overview of respondent participation and research metrics.</p>
          </div>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="w-full sm:w-auto px-4 py-2.5 bg-[#1b2a4a] hover:bg-[#2a3f6a] text-white text-xs sm:text-sm font-semibold rounded-xl transition shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exporting ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Export CSV Data</span>
              </>
            )}
          </button>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-5">
            <div className="bg-white overflow-hidden shadow-sm rounded-xl p-4 sm:p-5 border border-gray-100">
              <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">Total Sessions</dt>
              <dd className="mt-1 text-2xl sm:text-3xl font-bold text-gray-900">{stats.totalSessions}</dd>
            </div>
            <div className="bg-white overflow-hidden shadow-sm rounded-xl p-4 sm:p-5 border border-gray-100">
              <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">Completed</dt>
              <dd className="mt-1 text-2xl sm:text-3xl font-bold text-[#1b2a4a]">{stats.completed}</dd>
            </div>
            <div className="bg-white overflow-hidden shadow-sm rounded-xl p-4 sm:p-5 border border-gray-100">
              <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">In Progress</dt>
              <dd className="mt-1 text-2xl sm:text-3xl font-bold text-amber-600">{stats.inProgress}</dd>
            </div>
            <div className="bg-white overflow-hidden shadow-sm rounded-xl p-4 sm:p-5 border border-gray-100">
              <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">Abandoned</dt>
              <dd className="mt-1 text-2xl sm:text-3xl font-bold text-red-600">{stats.abandoned}</dd>
            </div>
            <div className="col-span-2 lg:col-span-1 bg-white overflow-hidden shadow-sm rounded-xl p-4 sm:p-5 border border-gray-100">
              <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">Completion Rate</dt>
              <dd className="mt-1 text-2xl sm:text-3xl font-bold text-emerald-600">{stats.completionRate}</dd>
            </div>
          </div>
        )}

        {/* Purchase Intent Analytics */}
        {analytics && (
          <div className="mt-6 sm:mt-8 bg-white shadow-sm rounded-2xl p-4 sm:p-6 border border-gray-100">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-4">
              Purchase Intent Comparison (Q17 vs Q24)
            </h2>

            {/* Shift Summary Cards */}
            <div className="mb-6 bg-blue-50/70 border border-blue-100 p-3 sm:p-4 rounded-xl grid grid-cols-3 gap-2 text-center">
              <div>
                <span className="block text-lg sm:text-2xl font-bold text-emerald-600">
                  {analytics.summary.upgraded}%
                </span>
                <span className="text-xs sm:text-sm font-medium text-gray-600">Upgraded Intent</span>
              </div>
              <div className="border-x border-blue-200/60 px-1">
                <span className="block text-lg sm:text-2xl font-bold text-gray-700">
                  {analytics.summary.same}%
                </span>
                <span className="text-xs sm:text-sm font-medium text-gray-600">Same Intent</span>
              </div>
              <div>
                <span className="block text-lg sm:text-2xl font-bold text-red-600">
                  {analytics.summary.downgraded}%
                </span>
                <span className="text-xs sm:text-sm font-medium text-gray-600">Downgraded Intent</span>
              </div>
            </div>

            {/* Comparison Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-gray-800 mb-3 sm:mb-4">
                  Before Pricing (Q17 — Blind Concept)
                </h3>
                <div className="space-y-3 sm:space-y-4">
                  {analytics.q16Distribution.map((item, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-xs sm:text-sm mb-1 gap-2">
                        <span className="text-gray-700">{item.label}</span>
                        <span className="font-semibold text-gray-900">{item.value}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2.5">
                        <div
                          className="bg-gray-400 h-2.5 rounded-full transition-all duration-500"
                          style={{ width: `${(item.value / maxVal) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm sm:text-base font-semibold text-gray-800 mb-3 sm:mb-4">
                  After Pricing (Q24 — Final Kiyoki Proposition)
                </h3>
                <div className="space-y-3 sm:space-y-4">
                  {analytics.q23Distribution.map((item, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-xs sm:text-sm mb-1 gap-2">
                        <span className="text-gray-700">{item.label}</span>
                        <span className="font-semibold text-gray-900">{item.value}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2.5">
                        <div
                          className="bg-[#1b2a4a] h-2.5 rounded-full transition-all duration-500"
                          style={{ width: `${(item.value / maxVal) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
