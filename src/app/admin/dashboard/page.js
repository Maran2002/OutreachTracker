'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, Send, UserCheck, Shield, ArrowRight } from 'lucide-react';
import { SkeletonCard } from '@/components/ui/Skeleton';
import ErrorState from '@/components/ui/ErrorState';
import { useAdmin } from '@/components/providers/AdminProvider';
import AccessDenied from '@/components/ui/AccessDenied';

export default function AdminDashboardPage() {
  const admin = useAdmin();
  const hasAccess = (admin?.permissions || []).includes('dashboard.view');

  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchStats = async () => {
    setIsLoading(true);
    setError(false);
    try {
      const [usersRes, outreachesRes, adminsRes] = await Promise.all([
        fetch('/api/v1/admin/users?limit=1'),
        fetch('/api/v1/admin/outreaches?limit=1'),
        fetch('/api/v1/admin/admins?limit=1'),
      ]);

      if (!usersRes.ok || !outreachesRes.ok || !adminsRes.ok) {
        throw new Error('Failed to fetch admin stats');
      }

      const usersData = await usersRes.json();
      const outreachesData = await outreachesRes.json();
      const adminsData = await adminsRes.json();

      setStats({
        totalUsers: usersData.pagination?.total || 0,
        totalOutreaches: outreachesData.pagination?.total || 0,
        totalAdmins: adminsData.pagination?.total || 0,
      });
    } catch {
      setError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (hasAccess) fetchStats();
  }, [hasAccess]);

  if (!hasAccess) return <AccessDenied permission="dashboard.view" />;
  if (error) return <ErrorState onRetry={fetchStats} />;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <Shield className="w-6 h-6 text-red-400" /> System Control Dashboard
        </h1>
        <p className="text-sm text-slate-400">System-wide visibility across all user accounts and outreach records</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <div className="metric-card border-red-950/40">
              <div className="flex items-center justify-between mb-2">
                <span className="metric-label text-slate-400">Total Registered Users</span>
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="metric-value">{stats?.totalUsers || 0}</div>
              <div className="metric-sub">Global read-only user count</div>
              <Link href="/admin/users" className="mt-4 inline-flex items-center gap-1 text-xs text-blue-400 hover:underline">
                Inspect Users <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="metric-card border-red-950/40">
              <div className="flex items-center justify-between mb-2">
                <span className="metric-label text-slate-400">Global Outreach Records</span>
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <Send className="w-5 h-5" />
                </div>
              </div>
              <div className="metric-value text-emerald-400">{stats?.totalOutreaches || 0}</div>
              <div className="metric-sub">Across all user accounts</div>
              <Link href="/admin/outreaches" className="mt-4 inline-flex items-center gap-1 text-xs text-blue-400 hover:underline">
                Inspect Outreaches <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="metric-card border-red-950/40">
              <div className="flex items-center justify-between mb-2">
                <span className="metric-label text-slate-400">System Administrators</span>
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                  <UserCheck className="w-5 h-5" />
                </div>
              </div>
              <div className="metric-value text-amber-400">{stats?.totalAdmins || 0}</div>
              <div className="metric-sub">Active admin accounts</div>
              <Link href="/admin/admins" className="mt-4 inline-flex items-center gap-1 text-xs text-blue-400 hover:underline">
                Manage Admins <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </>
        )}
      </div>

      <div className="card border-slate-800 p-6">
        <h3 className="text-base font-semibold text-slate-100 mb-2">Admin Governance & Permissions</h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          The Admin area operates under granular server-side permission checks (<code className="text-red-400 font-mono">users.view</code>, <code className="text-red-400 font-mono">outreaches.view</code>, <code className="text-red-400 font-mono">admins.create</code>, etc.). Admins have read-only visibility into regular users and outreach records to maintain data safety.
        </p>
      </div>
    </div>
  );
}
