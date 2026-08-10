'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { UserCheck, Plus, Trash2, Edit } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import SearchInput from '@/components/ui/SearchInput';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Pagination from '@/components/ui/Pagination';
import { SkeletonTableRow } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';
import { formatDate } from '@/lib/utils';
import { ADMIN_PERMISSIONS } from '@/constants/outreach';
import { useAdmin } from '@/components/providers/AdminProvider';
import AccessDenied from '@/components/ui/AccessDenied';

export default function AdminManagementPage() {
  const admin = useAdmin();
  const hasAccess = (admin?.permissions || []).includes('admins.view');

  const [admins, setAdmins] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  // Create/Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    permissions: ['users.view', 'outreaches.view', 'dashboard.view'],
    status: 'active',
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Deactivate modal state
  const [deactivateId, setDeactivateId] = useState(null);
  const [isDeactivating, setIsDeactivating] = useState(false);

  const fetchAdmins = useCallback(async () => {
    setIsLoading(true);
    setError(false);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '20' });
      if (search) params.append('search', search);

      const res = await fetch(`/api/v1/admin/admins?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch admins');
      const json = await res.json();
      setAdmins(json.data || []);
      setPagination(json.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 });
    } catch {
      setError(true);
    } finally {
      setIsLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    if (hasAccess) fetchAdmins();
  }, [fetchAdmins, hasAccess]);

  if (!hasAccess) return <AccessDenied permission="admins.view" />;

  const openCreateModal = () => {
    setEditingAdmin(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      permissions: ['users.view', 'outreaches.view', 'dashboard.view'],
      status: 'active',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (admin) => {
    setEditingAdmin(admin);
    setFormData({
      name: admin.name,
      email: admin.email,
      password: '',
      confirmPassword: '',
      permissions: admin.permissions || [],
      status: admin.status || 'active',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handlePermissionToggle = (permValue) => {
    setFormData((prev) => {
      const exists = prev.permissions.includes(permValue);
      const newPerms = exists
        ? prev.permissions.filter((p) => p !== permValue)
        : [...prev.permissions, permValue];
      return { ...prev, permissions: newPerms };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});

    const errors = {};
    if (!formData.name) errors.name = 'Name is required';
    if (!formData.email) errors.email = 'Email is required';

    if (!editingAdmin) {
      if (!formData.password) errors.password = 'Password is required';
      if (formData.password !== formData.confirmPassword) errors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);

    try {
      const url = editingAdmin ? `/api/v1/admin/admins/${editingAdmin._id}` : '/api/v1/admin/admins';
      const method = editingAdmin ? 'PATCH' : 'POST';

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

      setIsModalOpen(false);
      fetchAdmins();
    } catch {
      alert('An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivate = async () => {
    if (!deactivateId) return;
    setIsDeactivating(true);

    try {
      const res = await fetch(`/api/v1/admin/admins/${deactivateId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error?.message || 'Failed to deactivate admin');
      } else {
        setDeactivateId(null);
        fetchAdmins();
      }
    } catch {
      alert('Error deactivating admin');
    } finally {
      setIsDeactivating(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-amber-400" /> Admin Account Management
          </h1>
          <p className="text-sm text-slate-400">Create administrators and configure custom permissions</p>
        </div>
        <Button variant="danger" onClick={openCreateModal} className="shrink-0">
          <Plus className="w-4 h-4 mr-1" /> Create Admin
        </Button>
      </div>

      <div className="card p-4">
        <SearchInput
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search admins by name or email..."
        />
      </div>

      {error ? (
        <ErrorState onRetry={fetchAdmins} />
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Status</th>
                <th>Permissions</th>
                <th>Created Date</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => <SkeletonTableRow key={i} cols={6} />)
              ) : admins.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState title="No admin accounts found" description="Create an admin account to delegate administrative duties." />
                  </td>
                </tr>
              ) : (
                admins.map((adm) => (
                  <tr key={adm._id}>
                    <td className="primary">{adm.name}</td>
                    <td>{adm.email}</td>
                    <td>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${adm.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                        {adm.status.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {(adm.permissions || []).map((p) => (
                          <span key={p} className="px-1.5 py-0.5 text-[10px] bg-slate-800 text-slate-300 rounded font-mono">
                            {p}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>{formatDate(adm.createdAt)}</td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(adm)}
                          className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded cursor-pointer"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeactivateId(adm._id)}
                          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded cursor-pointer"
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

      {/* Create/Edit Admin Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingAdmin ? 'Edit Administrator' : 'Create New Administrator'}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={formErrors.name}
            required
          />
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            error={formErrors.email}
            required
          />

          {!editingAdmin && (
            <>
              <Input
                label="Password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                error={formErrors.password}
                required
              />
              <Input
                label="Confirm Password"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                error={formErrors.confirmPassword}
                required
              />
            </>
          )}

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 block">
              Assign Permissions
            </label>
            <div className="grid grid-cols-1 gap-2 bg-slate-950 p-3 rounded-lg border border-slate-800 sm:grid-cols-2">
              {ADMIN_PERMISSIONS.map((perm) => {
                const isChecked = formData.permissions.includes(perm.value);
                return (
                  <label key={perm.value} className="flex min-w-0 items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handlePermissionToggle(perm.value)}
                      className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="min-w-0 truncate">{perm.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 mt-4 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="danger" isLoading={isSubmitting}>
              {editingAdmin ? 'Save Changes' : 'Create Admin'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deactivateId}
        onClose={() => setDeactivateId(null)}
        onConfirm={handleDeactivate}
        isLoading={isDeactivating}
        title="Deactivate Admin"
        message="Are you sure you want to deactivate this admin account?"
      />
    </div>
  );
}
