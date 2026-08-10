'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Users, Lock } from 'lucide-react';
import SearchInput from '@/components/ui/SearchInput';
import SearchableDropdown from '@/components/ui/SearchableDropdown';
import Pagination from '@/components/ui/Pagination';
import { SkeletonTableRow } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';
import { formatDate } from '@/lib/utils';
import { useAdmin } from '@/components/providers/AdminProvider';
import AccessDenied from '@/components/ui/AccessDenied';

export default function AdminUsersPage() {
  const admin = useAdmin();
  const hasAccess = (admin?.permissions || []).includes('users.view');

  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(false);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '20' });
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);

      const res = await fetch(`/api/v1/admin/users?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch users');
      const json = await res.json();
      setUsers(json.data || []);
      setPagination(json.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 });
    } catch {
      setError(true);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    if (hasAccess) fetchUsers();
  }, [fetchUsers, hasAccess]);

  if (!hasAccess) return <AccessDenied permission="users.view" />;

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'closed', label: 'Closed' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-400" /> User Directory
          </h1>
          <p className="text-sm text-slate-400">
            Global read-only visibility into registered user accounts and outreach activity metrics.
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-400">
          <Lock className="w-3.5 h-3.5" /> Read-Only Mode (V1 Scope)
        </span>
      </div>

      <div className="card p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2">
          <SearchInput
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search users by name or email..."
          />
        </div>
        <SearchableDropdown
          placeholder="Filter Status"
          options={statusOptions}
          value={statusFilter}
          onChange={(val) => {
            setStatusFilter(val);
            setPage(1);
          }}
        />
      </div>

      {error ? (
        <ErrorState onRetry={fetchUsers} />
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>User Name</th>
                <th>Email</th>
                <th>Auth Provider</th>
                <th>Account Status</th>
                <th>Outreach Count</th>
                <th>Registered Date</th>
                <th>Last Login</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonTableRow key={i} cols={7} />)
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState title="No user accounts found" description="No users match your current filter parameters." />
                  </td>
                </tr>
              ) : (
                users.map((usr) => (
                  <tr key={usr._id}>
                    <td className="primary">{usr.name}</td>
                    <td>{usr.email}</td>
                    <td>
                      <span className="capitalize text-xs text-slate-400">{usr.authProvider || 'local'}</span>
                    </td>
                    <td>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        usr.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {(usr.status || 'active').toUpperCase()}
                      </span>
                    </td>
                    <td className="font-semibold text-slate-200">{usr.outreachCount || 0}</td>
                    <td>{formatDate(usr.createdAt)}</td>
                    <td>{usr.lastLoginAt ? formatDate(usr.lastLoginAt) : 'Never'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.total}
            limit={pagination.limit}
            onPageChange={(p) => setPage(p)}
          />
        </div>
      )}
    </div>
  );
}
