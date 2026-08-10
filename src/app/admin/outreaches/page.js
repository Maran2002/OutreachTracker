'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Send, Lock, Eye, ExternalLink } from 'lucide-react';
import SearchInput from '@/components/ui/SearchInput';
import SearchableDropdown from '@/components/ui/SearchableDropdown';
import StatusBadge from '@/components/ui/StatusBadge';
import Pagination from '@/components/ui/Pagination';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { SkeletonTableRow } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';
import { formatDate } from '@/lib/utils';
import { OUTREACH_TYPES, OUTREACH_METHODS, OUTREACH_STATUSES } from '@/constants/outreach';
import { useAdmin } from '@/components/providers/AdminProvider';
import AccessDenied from '@/components/ui/AccessDenied';

export default function AdminOutreachesPage() {
  const admin = useAdmin();
  const hasAccess = (admin?.permissions || []).includes('outreaches.view');

  const [outreaches, setOutreaches] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  // Detailed Modal State
  const [selectedOutreach, setSelectedOutreach] = useState(null);

  const fetchOutreaches = useCallback(async () => {
    setIsLoading(true);
    setError(false);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '20' });
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      if (typeFilter) params.append('outreachType', typeFilter);
      if (methodFilter) params.append('method', methodFilter);

      const res = await fetch(`/api/v1/admin/outreaches?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch outreaches');
      const json = await res.json();
      setOutreaches(json.data || []);
      setPagination(json.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 });
    } catch {
      setError(true);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, statusFilter, typeFilter, methodFilter]);

  useEffect(() => {
    if (hasAccess) fetchOutreaches();
  }, [fetchOutreaches, hasAccess]);

  if (!hasAccess) return <AccessDenied permission="outreaches.view" />;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Send className="w-6 h-6 text-emerald-400" /> Global Outreach Directory
          </h1>
          <p className="text-sm text-slate-400">
            Read-only audit view of outreach records submitted across all platform users.
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-400">
          <Lock className="w-3.5 h-3.5" /> Read-Only Mode (V1 Scope)
        </span>
      </div>

      <div className="card p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <SearchInput
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search company, contact, subject..."
        />
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

      {error ? (
        <ErrorState onRetry={fetchOutreaches} />
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>User Account</th>
                <th>Company</th>
                <th>Contact</th>
                <th>Type</th>
                <th>Method</th>
                <th>Status</th>
                <th>Interview</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonTableRow key={i} cols={9} />)
              ) : outreaches.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <EmptyState title="No global outreach records found" description="No records match your filter search." />
                  </td>
                </tr>
              ) : (
                outreaches.map((row) => (
                  <tr key={row._id}>
                    <td>{formatDate(row.date)}</td>
                    <td>
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-200">{row.userId?.name || 'Unknown'}</span>
                        <span className="text-[11px] text-slate-500">{row.userId?.email || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="primary">{row.company}</td>
                    <td>{row.contactName}</td>
                    <td className="capitalize text-slate-400">{row.outreachType?.replace('_', ' ')}</td>
                    <td className="capitalize text-slate-400">{row.method}</td>
                    <td>
                      <StatusBadge status={row.status} />
                    </td>
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
                      <button
                        type="button"
                        onClick={() => setSelectedOutreach(row)}
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
      {selectedOutreach && (
        <Modal
          isOpen={!!selectedOutreach}
          onClose={() => setSelectedOutreach(null)}
          title="Outreach Record Details"
          maxWidth="max-w-2xl"
        >
          <div className="flex flex-col gap-6">
            {/* Header info */}
            <div className="flex justify-between items-start gap-4 pb-4 border-b border-slate-800">
              <div>
                <h4 className="text-lg font-bold text-slate-100">{selectedOutreach.company}</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Submitted by:{' '}
                  <span className="font-semibold text-slate-200">{selectedOutreach.userId?.name || 'Unknown'}</span>{' '}
                  ({selectedOutreach.userId?.email || 'N/A'})
                </p>
              </div>
              <StatusBadge status={selectedOutreach.status} />
            </div>

            {/* Grid details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">Contact Person</span>
                <p className="text-slate-200 font-medium">{selectedOutreach.contactName || '—'}</p>
                {selectedOutreach.contactRole && (
                  <p className="text-xs text-slate-400 mt-0.5">{selectedOutreach.contactRole}</p>
                )}
              </div>

              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">Contact Email / URL</span>
                {selectedOutreach.contactUrl ? (
                  <a
                    href={selectedOutreach.contactUrl.startsWith('http') ? selectedOutreach.contactUrl : `https://${selectedOutreach.contactUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-400 hover:underline inline-flex items-center gap-1"
                  >
                    {selectedOutreach.contactUrl} <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <p className="text-slate-500">—</p>
                )}
              </div>

              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">Date Contacted</span>
                <p className="text-slate-200">{formatDate(selectedOutreach.date)}</p>
              </div>

              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">Follow-up Date</span>
                <p className="text-slate-200">{selectedOutreach.followUpDate ? formatDate(selectedOutreach.followUpDate) : '—'}</p>
              </div>

              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">Outreach Type</span>
                <p className="text-slate-200 capitalize">{selectedOutreach.outreachType?.replace('_', ' ')}</p>
              </div>

              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">Method</span>
                <p className="text-slate-200 capitalize">{selectedOutreach.method}</p>
              </div>

              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">Interview Scheduled</span>
                {selectedOutreach.interviewScheduled ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    YES
                  </span>
                ) : (
                  <p className="text-slate-500">No</p>
                )}
              </div>

              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">Next Action</span>
                <p className="text-slate-200">{selectedOutreach.nextAction || '—'}</p>
              </div>
            </div>

            {/* Response details */}
            {selectedOutreach.response && (
              <div className="pt-4 border-t border-slate-800 text-sm">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">Response Details</span>
                <p className="text-slate-200 leading-relaxed bg-slate-950/40 p-3 rounded-lg border border-slate-800 whitespace-pre-wrap">
                  {selectedOutreach.response}
                </p>
              </div>
            )}

            {/* Notes */}
            {selectedOutreach.notes && (
              <div className="pt-4 border-t border-slate-800 text-sm">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">Internal Notes</span>
                <p className="text-slate-200 leading-relaxed bg-slate-950/40 p-3 rounded-lg border border-slate-800 whitespace-pre-wrap">
                  {selectedOutreach.notes}
                </p>
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-slate-800">
              <Button onClick={() => setSelectedOutreach(null)} variant="secondary">
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
