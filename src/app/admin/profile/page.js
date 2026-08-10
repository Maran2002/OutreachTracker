'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Save, Key, CheckCircle2 } from 'lucide-react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { SkeletonCard } from '@/components/ui/Skeleton';
import ErrorState from '@/components/ui/ErrorState';

export default function AdminProfilePage() {
  const [admin, setAdmin] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchAdminProfile() {
      setIsLoading(true);
      setError(false);
      try {
        const res = await fetch('/api/v1/admin/session');
        if (!res.ok) throw new Error('Not auth');
        const json = await res.json();
        setAdmin(json.data?.admin || json.data?.user || null);
        setName(json.data?.admin?.name || '');
        setEmail(json.data?.admin?.email || '');
      } catch {
        setError(true);
      } finally {
        setIsLoading(false);
      }
    }
    fetchAdminProfile();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    if (password && password !== confirmPassword) {
      alert('Passwords do not match');
      setIsSaving(false);
      return;
    }

    try {
      const payload = { name, email };
      if (password) {
        payload.password = password;
        payload.confirmPassword = confirmPassword;
      }

      const res = await fetch(`/api/v1/admin/admins/${admin._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Save failed');
      setSaveSuccess(true);
      setPassword('');
      setConfirmPassword('');
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      alert('Failed to update admin profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="p-6 max-w-xl mx-auto"><SkeletonCard /></div>;
  if (error) return <ErrorState onRetry={() => location.reload()} />;

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <Shield className="w-6 h-6 text-red-400" /> Administrator Profile
        </h1>
        <p className="text-sm text-slate-400">Manage your administrative profile details and credentials</p>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-900/50 rounded-lg text-xs text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> Admin details updated successfully!
        </div>
      )}

      <form onSubmit={handleSave} className="card border-red-950/40 flex flex-col gap-6">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4 pb-2 border-b border-slate-800">
            Admin Identity
          </h3>
          <div className="flex flex-col gap-4">
            <Input
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              label="Admin Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4 pb-2 border-b border-slate-800 flex items-center gap-1.5">
            <Key className="w-4 h-4 text-amber-400" /> Password Change (Optional)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="New Password"
              type="password"
              placeholder="Leave blank to keep current"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Input
              label="Confirm New Password"
              type="password"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-800">
          <Button type="submit" variant="danger" isLoading={isSaving}>
            <Save className="w-4 h-4 mr-1.5" /> Save Admin Profile
          </Button>
        </div>
      </form>
    </div>
  );
}
