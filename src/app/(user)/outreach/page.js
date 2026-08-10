'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Trash2,
  Eye,
  ExternalLink,
  RotateCcw,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import SearchInput from '@/components/ui/SearchInput';
import SearchableDropdown from '@/components/ui/SearchableDropdown';
import StatusBadge from '@/components/ui/StatusBadge';
import Pagination from '@/components/ui/Pagination';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { SkeletonTableRow } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';
import { formatDate } from '@/lib/utils';
import { OUTREACH_TYPES, OUTREACH_METHODS, OUTREACH_STATUSES } from '@/constants/outreach';

export default function OutreachListPage() {
  const router = useRouter();

  // Filter & Search states
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);

  // Data states
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  // Modal states
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchOutreaches = useCallback(async () => {
    setIsLoading(true);
    setError(false);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        sortBy,
        sortOrder,
      });

      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      if (typeFilter) params.append('outreachType', typeFilter);
      if (methodFilter) params.append('method', methodFilter);

      const res = await fetch(`/api/v1/outreaches?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch outreaches');

      const json = await res.json();
      setData(json.data || []);
      setPagination(json.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 });
    } catch {
      setError(true);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, statusFilter, typeFilter, methodFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchOutreaches();
  }, [fetchOutreaches]);

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/v1/outreaches/${deleteTargetId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setDeleteTargetId(null);
        fetchOutreaches();
      }
    } catch {
      // Keep modal open or show alert
    } finally {
      setIsDeleting(false);
    }
  };

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('');
    setTypeFilter('');
    setMethodFilter('');
    setSortBy('date');
    setSortOrder('desc');
    setPage(1);
  };

  const sortOptions = [
    { value: 'date', label: 'Sort by Date' },
    { value: 'company', label: 'Sort by Company' },
    { value: 'contactName', label: 'Sort by Contact Name' },
    { value: 'status', label: 'Sort by Status' },
    { value: 'followUpDate', label: 'Sort by Follow-up Date' },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Outreach Records</h1>
          <p className="text-sm text-slate-400">Search, filter, and manage all your prospect communication</p>
        </div>
        <Link href="/outreach/add">
          <Button variant="primary">
            <Plus className="w-4 h-4 mr-1" /> Log New Outreach
          </Button>
        </Link>
      </div>

      {/* Filter Controls Bar */}
      <div className="card p-4 flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="lg:col-span-2">
            <SearchInput
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search company, contact, notes..."
            />
          </div>

          <SearchableDropdown
            placeholder="Filter Status"
            options={OUTREACH_STATUSES}
            value={statusFilter}
            onChange={(val) => {
              setStatusFilter(val);
              setPage(1);
            }}
          />

          <SearchableDropdown
            placeholder="Filter Type"
            options={OUTREACH_TYPES}
            value={typeFilter}
            onChange={(val) => {
              setTypeFilter(val);
              setPage(1);
            }}
          />

          <SearchableDropdown
            placeholder="Filter Method"
            options={OUTREACH_METHODS}
            value={methodFilter}
            onChange={(val) => {
              setMethodFilter(val);
              setPage(1);
            }}
          />
        </div>

        <div className="flex flex-col gap-3 pt-2 border-t border-slate-800 text-xs sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <SearchableDropdown
              options={sortOptions}
              value={sortBy}
              onChange={(val) => setSortBy(val)}
              isClearable={false}
              className="w-full sm:w-44"
            />
            <button
              type="button"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="min-h-10 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 hover:text-white cursor-pointer font-medium"
            >
              Order: {sortOrder.toUpperCase()}
            </button>
          </div>

          {(search || statusFilter || typeFilter || methodFilter) && (
            <button
              type="button"
              onClick={resetFilters}
              className="flex items-center gap-1 text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Data Table */}
      {error ? (
        <ErrorState onRetry={fetchOutreaches} />
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Company</th>
                <th>Contact</th>
                <th>Type</th>
                <th>Method</th>
                <th>Status</th>
                <th>Follow-up</th>
                <th>Interview</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonTableRow key={i} cols={9} />)
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <EmptyState
                      title="No outreach records match your filter"
                      description="Try clearing your search or logging a new outreach record."
                      actionLabel="Add Outreach Record"
                      onAction={() => router.push('/outreach/add')}
                    />
                  </td>
                </tr>
              ) : (
                data.map((row) => (
                  <tr key={row._id}>
                    <td>{formatDate(row.date)}</td>
                    <td className="primary">
                      <div className="flex flex-col">
                        <span>{row.company}</span>
                        {row.contactUrl && (
                          <a
                            href={row.contactUrl.startsWith('http') ? row.contactUrl : `https://${row.contactUrl}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-blue-400 hover:underline inline-flex items-center gap-0.5"
                          >
                            Link <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-200">{row.contactName}</span>
                        {row.contactRole && <span className="text-[11px] text-slate-500">{row.contactRole}</span>}
                      </div>
                    </td>
                    <td className="capitalize text-slate-400">{row.outreachType.replace('_', ' ')}</td>
                    <td className="capitalize text-slate-400">{row.method}</td>
                    <td>
                      <StatusBadge status={row.status} />
                    </td>
                    <td>{row.followUpDate ? formatDate(row.followUpDate) : '—'}</td>
                    <td>
                      {row.interviewScheduled ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          YES
                        </span>
                      ) : (
                        <span className="text-slate-600 text-xs">—</span>
                      )}
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/outreach/${row._id}`}
                          className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => setDeleteTargetId(row._id)}
                          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                          title="Delete Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
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

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
        title="Delete Outreach Record?"
        message="This outreach record and its status history will be permanently deleted. This action cannot be undone."
      />
    </div>
  );
}
