'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Send,
  Calendar,
  Clock,
  Plus,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import { SkeletonCard } from '@/components/ui/Skeleton';
import ErrorState from '@/components/ui/ErrorState';
import { formatDate } from '@/lib/utils';

export default function DashboardPage() {
  const [metrics, setMetrics] = useState(null);
  const [recentOutreaches, setRecentOutreaches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(false);
    try {
      const [metricsRes, outreachRes] = await Promise.all([
        fetch('/api/v1/dashboard/metrics'),
        fetch('/api/v1/outreaches?limit=5&sortBy=date&sortOrder=desc'),
      ]);

      if (!metricsRes.ok || !outreachRes.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const metricsData = await metricsRes.json();
      const outreachData = await outreachRes.json();

      setMetrics(metricsData.data);
      setRecentOutreaches(outreachData.data || []);
    } catch {
      setError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (error) {
    return <ErrorState onRetry={fetchDashboardData} />;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Outreach Dashboard</h1>
          <p className="text-sm text-slate-400">Overview of your cold outreach performance and active follow-ups</p>
        </div>
        <Link href="/outreach/add">
          <Button variant="primary" size="md">
            <Plus className="w-4 h-4 mr-1" /> Add New Outreach
          </Button>
        </Link>
      </div>

      {/* Top Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <div className="metric-card">
              <div className="flex items-center justify-between mb-2">
                <span className="metric-label">Total Outreaches</span>
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                  <Send className="w-4 h-4" />
                </div>
              </div>
              <div className="metric-value">{metrics?.totalOutreach || 0}</div>
              <div className="metric-sub">Total attempts recorded</div>
            </div>

            <div className="metric-card">
              <div className="flex items-center justify-between mb-2">
                <span className="metric-label">Response Rate</span>
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="metric-value text-emerald-400">{metrics?.responseRate || 0}%</div>
              <div className="metric-sub">{metrics?.responses || 0} total responses received</div>
            </div>

            <div className="metric-card">
              <div className="flex items-center justify-between mb-2">
                <span className="metric-label">Interviews</span>
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
              <div className="metric-value text-purple-400">{metrics?.interviews || 0}</div>
              <div className="metric-sub">{metrics?.screeningCalls || 0} screening calls scheduled</div>
            </div>

            <div className="metric-card">
              <div className="flex items-center justify-between mb-2">
                <span className="metric-label">Follow-ups Due</span>
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="metric-value text-amber-400">{metrics?.followUpsDue || 0}</div>
              <div className="metric-sub text-red-400 font-medium">
                {metrics?.followUpsOverdue || 0} overdue follow-ups
              </div>
            </div>
          </>
        )}
      </div>

      {/* Breakdown by Outreach Type */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-slate-100">Outreach by Type</h3>
            <span className="text-xs text-slate-500">Distribution of methods</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Cold Email', key: 'cold_email', color: 'border-blue-500/30 text-blue-400' },
              { label: 'Warm Intro', key: 'warm_intro', color: 'border-purple-500/30 text-purple-400' },
              { label: 'LinkedIn DM', key: 'linkedin_dm', color: 'border-sky-500/30 text-sky-400' },
              { label: 'CTO Email', key: 'cto_email', color: 'border-indigo-500/30 text-indigo-400' },
            ].map((type) => (
              <div
                key={type.key}
                className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex flex-col justify-between gap-1"
              >
                <span className="text-xs text-slate-400 font-medium">{type.label}</span>
                <span className={`text-xl font-bold ${type.color}`}>
                  {metrics?.byType?.[type.key] || 0}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 grid grid-cols-3 gap-4 text-center">
            <div>
              <span className="text-xs text-slate-500 block">Replied</span>
              <span className="text-sm font-semibold text-slate-200">{metrics?.responses || 0}</span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Screening</span>
              <span className="text-sm font-semibold text-slate-200">{metrics?.screeningCalls || 0}</span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Rejected</span>
              <span className="text-sm font-semibold text-slate-200">{metrics?.rejected || 0}</span>
            </div>
          </div>
        </div>

        {/* Action Panel */}
        <div className="card flex flex-col justify-between bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/30 border-blue-900/30">
          <div>
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 mb-3">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-100 mb-1">Follow-up Reminders</h3>
            <p className="text-xs text-slate-400 mb-4">
              You have {metrics?.followUpsDue || 0} follow-up reminders pending action. Stay consistent to boost response rates.
            </p>
          </div>

          <Link href="/reminders" className="w-full">
            <Button variant="outline" size="sm" className="w-full justify-between">
              <span>View Reminders</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Recent Outreaches */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-slate-100">Recent Outreach Records</h3>
          <Link href="/outreach" className="text-xs text-blue-400 hover:underline flex items-center gap-1">
            View All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Company</th>
                <th>Contact</th>
                <th>Type</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentOutreaches.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-slate-500">
                    No outreach records added yet.
                  </td>
                </tr>
              ) : (
                recentOutreaches.map((row) => (
                  <tr key={row._id}>
                    <td>{formatDate(row.date)}</td>
                    <td className="primary">{row.company}</td>
                    <td>{row.contactName}</td>
                    <td className="capitalize text-slate-400">{row.outreachType.replace('_', ' ')}</td>
                    <td>
                      <StatusBadge status={row.status} />
                    </td>
                    <td>
                      <Link href={`/outreach/${row._id}`} className="text-xs text-blue-400 hover:underline">
                        Details
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
