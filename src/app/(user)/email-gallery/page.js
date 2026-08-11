'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Mail, Plus, Trash2, Edit, Eye, RotateCcw } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import SearchInput from '@/components/ui/SearchInput';
import SearchableDropdown from '@/components/ui/SearchableDropdown';
import Pagination from '@/components/ui/Pagination';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { SkeletonTableRow } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';
import { formatDate } from '@/lib/utils';

export default function EmailGalleryPage() {
  // Search & Filter states
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);

  // Data states
  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    position: '',
    companyName: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedRecord, setSelectedRecord] = useState(null);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

      const res = await fetch(`/api/v1/email-gallery?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch email records');

      const json = await res.json();
      setRecords(json.data || []);
      setPagination(json.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 });
    } catch {
      setError(true);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, sortBy, sortOrder]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleOpenAddModal = () => {
    setEditingRecord(null);
    setFormData({
      name: '',
      email: '',
      position: '',
      companyName: '',
    });
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (record) => {
    setEditingRecord(record);
    setFormData({
      name: record.name,
      email: record.email,
      position: record.position,
      companyName: record.companyName,
    });
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});

    const errors = {};
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }
    if (!formData.position.trim()) errors.position = 'Position is required';
    if (!formData.companyName.trim()) errors.companyName = 'Company name is required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);

    try {
      const url = editingRecord ? `/api/v1/email-gallery/${editingRecord._id}` : '/api/v1/email-gallery';
      const method = editingRecord ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error?.message || 'Operation failed');
        setIsSubmitting(false);
        return;
      }

      setIsFormModalOpen(false);
      fetchRecords();
    } catch {
      alert('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/v1/email-gallery/${deleteTargetId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setDeleteTargetId(null);
        fetchRecords();
      } else {
        alert('Failed to delete the record.');
      }
    } catch {
      alert('An error occurred during deletion.');
    } finally {
      setIsDeleting(false);
    }
  };

  const resetFilters = () => {
    setSearch('');
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

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Mail className="w-6 h-6 text-blue-400" /> Email Gallery
          </h1>
          <p className="text-sm text-slate-400">Manage and browse email contacts of different positions from different companies</p>
        </div>
        <Button variant="primary" onClick={handleOpenAddModal}>
          <Plus className="w-4 h-4 mr-1" /> Add Contact Email
        </Button>
      </div>

      {/* Filter Controls Bar */}
      <div className="card p-4 flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <SearchInput
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search contact name, email, position, or company..."
            />
          </div>
          <SearchableDropdown
            options={sortOptions}
            value={sortBy}
            onChange={(val) => {
              setSortBy(val);
              setPage(1);
            }}
            isClearable={false}
            placeholder="Sort by"
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

          {search && (
            <button
              type="button"
              onClick={resetFilters}
              className="flex items-center gap-1 text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Clear Search
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
                <th>Name</th>
                <th>Email</th>
                <th>Position</th>
                <th>Company</th>
                <th>Date Added</th>
                <th>Last Updated</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonTableRow key={i} cols={7} />)
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState
                      title="No email records found"
                      description="Try clearing your search or add a new contact email."
                      actionLabel="Add Contact Email"
                      onAction={handleOpenAddModal}
                    />
                  </td>
                </tr>
              ) : (
                records.map((row) => (
                  <tr key={row._id}>
                    <td>
                      <span className="font-medium text-slate-200">{row.name}</span>
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
                    <td>{formatDate(row.updatedAt)}</td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedRecord(row)}
                          className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(row)}
                          className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                          title="Edit Record"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
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

      {/* Add / Edit Form Modal */}
      {isFormModalOpen && (
        <Modal
          isOpen={isFormModalOpen}
          onClose={() => setIsFormModalOpen(false)}
          title={editingRecord ? 'Edit Contact Email' : 'Add Contact Email'}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
            <Input
              label="Contact Name"
              placeholder="e.g. John Doe"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              error={formErrors.name}
              required
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="e.g. john.doe@company.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              error={formErrors.email}
              required
            />
            <Input
              label="Position / Role"
              placeholder="e.g. CTO, Engineering Lead"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              error={formErrors.position}
              required
            />
            <Input
              label="Company Name"
              placeholder="e.g. Google, Stripe"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              error={formErrors.companyName}
              required
            />

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <Button type="button" onClick={() => setIsFormModalOpen(false)} variant="secondary">
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isSubmitting}>
                {editingRecord ? 'Save Changes' : 'Add Contact'}
              </Button>
            </div>
          </form>
        </Modal>
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

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
        title="Delete Email Record?"
        message="This email record will be permanently deleted from the gallery. This action cannot be undone."
      />
    </div>
  );
}
