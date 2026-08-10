'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Bell, ShieldAlert, Save, CheckCircle2 } from 'lucide-react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import SearchableDropdown from '@/components/ui/SearchableDropdown';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { SkeletonCard } from '@/components/ui/Skeleton';
import ErrorState from '@/components/ui/ErrorState';

export default function ProfilePage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    intervalDays: 3,
    maxReminders: 2,
    reminderTime: '10:00',
    timezone: 'UTC',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState(false);

  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [isClosingAccount, setIsClosingAccount] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      setIsLoading(true);
      setError(false);
      try {
        const res = await fetch('/api/v1/profile');
        if (!res.ok) throw new Error('Failed to fetch');
        const json = await res.json();
        setUser(json.data);
        setFormData({
          name: json.data.name || '',
          intervalDays: json.data.reminderSettings?.intervalDays || 3,
          maxReminders: json.data.reminderSettings?.maxReminders || 2,
          reminderTime: json.data.reminderSettings?.reminderTime || '10:00',
          timezone: json.data.reminderSettings?.timezone || 'UTC',
        });
      } catch {
        setError(true);
      } finally {
        setIsLoading(false);
      }
    }
    fetchProfile();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch('/api/v1/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          reminderSettings: {
            intervalDays: Number(formData.intervalDays),
            maxReminders: Number(formData.maxReminders),
            reminderTime: formData.reminderTime,
            timezone: formData.timezone,
          },
        }),
      });

      if (!res.ok) throw new Error('Update failed');
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      alert('Failed to update profile settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseAccount = async () => {
    setIsClosingAccount(true);
    try {
      const res = await fetch('/api/v1/profile/close-account', { method: 'POST' });
      if (res.ok) {
        router.push('/login');
      }
    } catch {
      alert('Failed to close account');
    } finally {
      setIsClosingAccount(false);
    }
  };

  if (isLoading) return <div className="p-6 max-w-3xl mx-auto"><SkeletonCard /><SkeletonCard className="mt-4" /></div>;
  if (error || !user) return <ErrorState onRetry={() => router.refresh()} />;

  const timezoneOptions = [
    { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'Asia/Kolkata', label: 'India Standard Time (IST)' },
    { value: 'Europe/London', label: 'Greenwich Mean Time (GMT)' },
  ];

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <User className="w-6 h-6 text-blue-500" /> Account Settings
        </h1>
        <p className="text-sm text-slate-400">Manage your profile details and follow-up reminder preferences</p>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-900/50 rounded-lg text-xs text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> Profile settings updated successfully!
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="card flex flex-col gap-6">
        <div className="min-w-0">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4 pb-2 border-b border-slate-800">
            Personal Details
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <Input
              label="Email Address"
              value={user.email}
              disabled
              helperText="Auth provider: Local Email"
            />
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4 pb-2 border-b border-slate-800 flex items-center gap-1.5">
            <Bell className="w-4 h-4 text-amber-400" /> Reminder Defaults & Schedule
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Follow-up Interval (Days)"
              type="number"
              min={1}
              max={30}
              value={formData.intervalDays}
              onChange={(e) => setFormData({ ...formData, intervalDays: e.target.value })}
              helperText="Default: 3 days between follow-ups"
            />

            <Input
              label="Maximum Reminders Per Outreach"
              type="number"
              min={1}
              max={10}
              value={formData.maxReminders}
              onChange={(e) => setFormData({ ...formData, maxReminders: e.target.value })}
              helperText="Default: Stop after 2 reminders"
            />

            <Input
              label="Preferred Reminder Time (HH:MM)"
              type="text"
              placeholder="10:00"
              value={formData.reminderTime}
              onChange={(e) => setFormData({ ...formData, reminderTime: e.target.value })}
            />

            <SearchableDropdown
              label="Timezone"
              options={timezoneOptions}
              value={formData.timezone}
              onChange={(val) => setFormData({ ...formData, timezone: val })}
            />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-800">
          <Button type="submit" variant="primary" isLoading={isSaving}>
            <Save className="w-4 h-4 mr-1.5" /> Save Preferences
          </Button>
        </div>
      </form>

      {/* Danger Zone */}
      <div className="card border-red-900/30 bg-red-950/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <h4 className="text-base font-semibold text-red-400 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4" /> Close Account
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Deactivate your account and revoke active sessions. This action requires confirmation.
          </p>
        </div>
        <Button variant="danger" size="sm" onClick={() => setIsCloseModalOpen(true)} className="shrink-0">
          Close Account
        </Button>
      </div>

      <ConfirmDialog
        isOpen={isCloseModalOpen}
        onClose={() => setIsCloseModalOpen(false)}
        onConfirm={handleCloseAccount}
        isLoading={isClosingAccount}
        title="Confirm Account Closure"
        message="Are you sure you want to close your account? Your active session will end immediately."
      />
    </div>
  );
}
