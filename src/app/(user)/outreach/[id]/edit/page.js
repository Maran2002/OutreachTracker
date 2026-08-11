'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Trash2, CheckCircle2 } from 'lucide-react';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';
import SearchableDropdown from '@/components/ui/SearchableDropdown';
import DatePicker from '@/components/ui/DatePicker';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { SkeletonCard } from '@/components/ui/Skeleton';
import ErrorState from '@/components/ui/ErrorState';
import EmailGalleryCombobox from '@/components/ui/EmailGalleryCombobox';
import { OUTREACH_TYPES, OUTREACH_METHODS, OUTREACH_STATUSES } from '@/constants/outreach';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function OutreachEditPage({ params }) {
  const router = useRouter();
  const { id } = use(params);

  const [formData, setFormData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Email gallery contacts
  const [galleryContacts, setGalleryContacts] = useState([]);

  useEffect(() => {
    async function fetchRecord() {
      setIsLoading(true);
      setError(false);
      try {
        const res = await fetch(`/api/v1/outreaches/${id}`);
        if (!res.ok) throw new Error('Not found');
        const json = await res.json();
        setFormData(json.data);
      } catch {
        setError(true);
      } finally {
        setIsLoading(false);
      }
    }
    fetchRecord();
  }, [id]);

  const fetchGalleryContacts = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/email-gallery?limit=200&sortBy=name&sortOrder=asc');
      if (res.ok) {
        const json = await res.json();
        setGalleryContacts(json.data || []);
      }
    } catch {
      // Non-critical — silently ignore
    }
  }, []);

  useEffect(() => {
    fetchGalleryContacts();
  }, [fetchGalleryContacts]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Called when user picks a contact from the gallery combobox dropdown
  const handleContactSelect = (contact) => {
    if (!contact) return;
    setFormData((prev) => ({
      ...prev,
      contactName: contact.name,
      contactRole: contact.position,
      company: contact.companyName,
      contactUrl: contact.email,
    }));
  };

  // Silently upsert a manually-typed email to gallery (duplicate check by email)
  const upsertToGallery = async () => {
    const email = formData?.contactUrl?.trim();
    if (!email || !EMAIL_REGEX.test(email)) return;

    try {
      await fetch('/api/v1/email-gallery/upsert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.contactName || '',
          email,
          position: formData.contactRole || '',
          companyName: formData.company || '',
        }),
      });
    } catch {
      // Silently ignore — best-effort operation
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const res = await fetch(`/api/v1/outreaches/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error('Save failed');
      const json = await res.json();
      setFormData(json.data);

      // Best-effort: upsert contact to gallery if a valid email is present
      await upsertToGallery();

      setSaveSuccess(true);
      setTimeout(() => {
        router.push(`/outreach/${id}`);
      }, 1200);
    } catch {
      alert('Failed to update outreach record. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/v1/outreaches/${id}`, { method: 'DELETE' });
      if (res.ok) router.push('/outreach');
    } catch {
      alert('Failed to delete outreach record.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading)
    return (
      <div className="flex flex-col gap-4 max-w-5xl mx-auto">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  if (error || !formData)
    return <ErrorState title="Outreach Record Not Found" onRetry={() => router.push('/outreach')} />;

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="min-w-0">
          <button
            type="button"
            onClick={() => router.push(`/outreach/${id}`)}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 mb-3 cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Details
          </button>
          <h1 className="text-2xl font-bold text-slate-100 leading-tight">
            Edit: {formData.company}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Update the outreach record information below and save.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="danger" size="sm" onClick={() => setIsDeleteOpen(true)}>
            <Trash2 className="w-4 h-4" />
            Delete
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            isLoading={isSaving}
          >
            <Save className="w-4 h-4" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Success Banner */}
      {saveSuccess && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-900/50 rounded-xl flex items-start gap-3 text-emerald-400">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">Changes saved! Redirecting back to details…</span>
        </div>
      )}

      {/* Edit Form */}
      <form onSubmit={handleSave} className="flex flex-col gap-6">

        {/* Section 1: Prospect & Contact */}
        <div className="card flex flex-col gap-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 pb-3 border-b border-slate-800">
            1. Prospect &amp; Contact Details
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Company Name"
              value={formData.company || ''}
              onChange={(e) => handleChange('company', e.target.value)}
              placeholder="e.g. Acme Corporation"
              required
            />
            <Input
              label="Contact Name"
              value={formData.contactName || ''}
              onChange={(e) => handleChange('contactName', e.target.value)}
              placeholder="e.g. Jane Smith"
              required
            />
            <Input
              label="Contact Role / Title"
              value={formData.contactRole || ''}
              onChange={(e) => handleChange('contactRole', e.target.value)}
              placeholder="e.g. Hiring Manager"
            />
            <EmailGalleryCombobox
              label="Email / LinkedIn / URL"
              placeholder="e.g. jane@acme.com"
              value={formData.contactUrl || ''}
              onChange={(val) => handleChange('contactUrl', val)}
              onContactSelect={handleContactSelect}
              contacts={galleryContacts}
              helperText="Select a saved contact to auto-fill · new emails are saved to your gallery on save"
            />
          </div>
        </div>

        {/* Section 2: Outreach Parameters */}
        <div className="card flex flex-col gap-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 pb-3 border-b border-slate-800">
            2. Outreach Parameters
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <DatePicker
              label="Date Contacted"
              value={formData.date || ''}
              onChange={(val) => handleChange('date', val)}
            />
            <SearchableDropdown
              label="Outreach Type"
              options={OUTREACH_TYPES}
              value={formData.outreachType}
              onChange={(val) => handleChange('outreachType', val)}
            />
            <SearchableDropdown
              label="Contact Method"
              options={OUTREACH_METHODS}
              value={formData.method}
              onChange={(val) => handleChange('method', val)}
            />
          </div>
        </div>

        {/* Section 3: Status & Follow-up */}
        <div className="card flex flex-col gap-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 pb-3 border-b border-slate-800">
            3. Status &amp; Follow-up Plan
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <SearchableDropdown
              label="Current Status"
              options={OUTREACH_STATUSES}
              value={formData.status}
              onChange={(val) => handleChange('status', val)}
            />
            <DatePicker
              label="Follow-up Date"
              value={formData.followUpDate || ''}
              onChange={(val) => handleChange('followUpDate', val)}
              helperText="Target date for next check-in"
            />
            <div className="flex flex-col gap-1.5 justify-start pb-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Interview Scheduled?
              </label>
              <button
                type="button"
                onClick={() => handleChange('interviewScheduled', !formData.interviewScheduled)}
                className={`flex min-h-10 w-full items-center gap-2 px-3.5 py-2.5 text-left text-sm rounded-lg border cursor-pointer transition-colors ${
                  formData.interviewScheduled
                    ? 'bg-purple-500/10 border-purple-500/30 text-purple-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                {formData.interviewScheduled ? '✓ Yes – Interview Scheduled' : 'No Interview Scheduled'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Next Action"
              value={formData.nextAction || ''}
              onChange={(e) => handleChange('nextAction', e.target.value)}
              placeholder="e.g. Send thank-you email"
            />
            <Textarea
              label="Response Details"
              rows={3}
              value={formData.response || ''}
              onChange={(e) => handleChange('response', e.target.value)}
              placeholder="Summarise any response or feedback received"
            />
          </div>
        </div>

        {/* Section 4: Notes */}
        <div className="card flex flex-col gap-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 pb-3 border-b border-slate-800">
            4. Internal Notes
          </h3>
          <Textarea
            label=""
            rows={4}
            value={formData.notes || ''}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="Any private notes or context for this outreach…"
          />
        </div>

        {/* Action Footer */}
        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
          <Button
            variant="secondary"
            type="button"
            onClick={() => router.push(`/outreach/${id}`)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button variant="primary" type="submit" isLoading={isSaving}>
            <Save className="w-4 h-4" />
            Save Changes
          </Button>
        </div>
      </form>

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title="Delete Record"
        message={`Are you sure you want to permanently delete the outreach record for "${formData.company}"? This action cannot be undone.`}
      />
    </div>
  );
}
