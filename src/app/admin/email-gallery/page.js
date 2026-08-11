'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Mail, Lock, Eye, RotateCcw } from 'lucide-react';
import SearchInput from '@/components/ui/SearchInput';
import SearchableDropdown from '@/components/ui/SearchableDropdown';
import Pagination from '@/components/ui/Pagination';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { SkeletonTableRow } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';
import { formatDate } from '@/lib/utils';
import { useAdmin } from '@/components/providers/AdminProvider';
import AccessDenied from '@/components/ui/AccessDenied';

export default function AdminEmailGalleryPage() {
  const admin = useAdmin();
  const hasAccess = (admin?.permissions || []).includes('email_gallery.view');

  // Search & Filter states
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [userFilter, setUserFilter] = useState('');

  // Data states
  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  // Dropdown options
  const [users, setUsers] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const fetchRecords = useCallback(async () => {
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
      if (userFilter) params.append('userId', userFilter);

      const res = await fetch(`/api/v1/admin/email-gallery?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch email records');

      const json = await res.json();
      setRecords(json.data || []);
      setPagination(json.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 });
    } catch {
      setError(true);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, userFilter, sortBy, sortOrder]);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/admin/users?limit=100');
      if (res.ok) {
        const json = await res.json();
        setUsers(json.data || []);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (hasAccess) {
      fetchRecords();
    }
  }, [fetchRecords, hasAccess]);

  useEffect(() => {
    if (hasAccess) {
      fetchUsers();
    }
  }, [fetchUsers, hasAccess]);

  if (!hasAccess) return <AccessDenied permission="email_gallery.view" />;

  const resetFilters = () => {
    setSearch('');
    setUserFilter('');
    setSortBy('createdAt');
    setSortOrder('desc');
    setPage(1);
  };

  const sortOptions = [
    { value: 'createdAt', label: 'Date Added' },
    { value: 'name', label: 'Name' },
    { value: 'email', label: 'Email' },
    { value: 'position', label: 'Position' },
    { value: 'companyName', label: 'Company Name' },
    { value: 'updatedAt', label: 'Last Updated' },
  ];

  const userOptions = [
    { value: '', label: 'All Users' },
    ...users.map((u) => ({ value: u._id, label: `${u.name} (${u.email})` })),
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Mail className="w-6 h-6 text-emerald-400" /> Global Email Gallery
          </h1>
          <p className="text-sm text-slate-400">Read-only global overview of contact emails submitted across all users.</p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-400">
          <Lock className="w-3.5 h-3.5" /> Read-Only Mode
        </span>
      </div>

      {/* Filter Controls Bar */}
      <div className="card p-4 flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <SearchInput
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search name, email, position, company..."
          />

          <SearchableDropdown
            placeholder="Filter by Submitting User"
            options={userOptions}
            value={userFilter}
            onChange={(val) => {
              setUserFilter(val);
              setPage(1);
            }}
          />

          <SearchableDropdown
            placeholder="Sort by"
            options={sortOptions}
            value={sortBy}
            onChange={(val) => {
              setSortBy(val);
              setPage(1);
            }}
            isClearable={false}
          />
        </div>

        <div className="flex flex-col gap-3 pt-2 border-t border-slate-800 text-xs sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="min-h-10 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 hover:text-white cursor-pointer font-medium"
            >
              Order: {sortOrder.toUpperCase()}
            </button>
          </div>

          {(search || userFilter) && (
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

      {/* Data Table */}
      {error ? (
        <ErrorState onRetry={fetchRecords} />
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Submitted By</th>
                <th>Name</th>
                <th>Email</th>
                <th>Position</th>
                <th>Company</th>
                <th>Date Added</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonTableRow key={i} cols={7} />)
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState title="No email records found" description="No email records match the selected filters." />
                  </td>
                </tr>
              ) : (
                records.map((row) => (
                  <tr key={row._id}>
                    <td>
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-200">{row.userId?.name || 'Unknown'}</span>
                        <span className="text-[11px] text-slate-500">{row.userId?.email || 'N/A'}</span>
                      </div>
                    </td>
                    <td>
                      <span className="text-slate-200">{row.name}</span>
                    </td>
                    <td>
                      <span className="text-slate-400">{row.email}</span>
                    </td>
                    <td>
                      <span className="text-slate-400">{row.position}</span>
                    </td>
                    <td>
                      <span className="text-slate-400 font-semibold">{row.companyName}</span>
                    </td>
                    <td>{formatDate(row.createdAt)}</td>
                    <td className="text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedRecord(row)}
                        className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded transition-colors cursor-pointer inline-flex items-center"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
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

      {/* Detailed View Modal */}
      {selectedRecord && (
        <Modal
          isOpen={!!selectedRecord}
          onClose={() => setSelectedRecord(null)}
          title="Contact Email Details"
          maxWidth="max-w-md"
        >
          <div className="flex flex-col gap-6">
            <div className="pb-4 border-b border-slate-800">
              <h4 className="text-lg font-bold text-slate-100">{selectedRecord.name}</h4>
              <p className="text-xs text-slate-400 mt-1">{selectedRecord.position}</p>
            </div>

            <div className="grid grid-cols-1 gap-4 text-sm">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">Email Address</span>
                <a href={`mailto:${selectedRecord.email}`} className="text-blue-400 hover:underline">
                  {selectedRecord.email}
                </a>
              </div>

              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">Company Name</span>
                <p className="text-slate-200">{selectedRecord.companyName}</p>
              </div>

              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">Submitted By</span>
                <p className="text-slate-200 font-medium">
                  {selectedRecord.userId?.name || 'Unknown'}{' '}
                  <span className="text-xs text-slate-400 font-normal">
                    ({selectedRecord.userId?.email || 'N/A'})
                  </span>
                </p>
              </div>

              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">Date Added</span>
                <p className="text-slate-200">{formatDate(selectedRecord.createdAt)}</p>
              </div>

              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">Last Updated</span>
                <p className="text-slate-200">{formatDate(selectedRecord.updatedAt)}</p>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-800">
              <Button onClick={() => setSelectedRecord(null)} variant="secondary">
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
