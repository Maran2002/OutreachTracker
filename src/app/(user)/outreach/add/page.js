'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { PlusCircle, ArrowLeft, CheckCircle2, BookUser } from 'lucide-react';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';
import SearchableDropdown from '@/components/ui/SearchableDropdown';
import DatePicker from '@/components/ui/DatePicker';
import EmailGalleryCombobox from '@/components/ui/EmailGalleryCombobox';
import { OUTREACH_TYPES, OUTREACH_METHODS, OUTREACH_STATUSES } from '@/constants/outreach';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AddOutreachPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    outreachType: 'cold_email',
    company: '',
    contactName: '',
    contactRole: '',
    contactUrl: '',
    method: 'email',
    subjectMessage: '',
    status: 'sent',
    response: '',
    interviewScheduled: false,
    nextAction: '',
    followUpDate: '',
    notes: '',
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState(false);

  // Email gallery contacts
  const [galleryContacts, setGalleryContacts] = useState([]);
  const [selectedGalleryId, setSelectedGalleryId] = useState('');

  // Build dropdown options for the Quick-Fill SearchableDropdown
  const galleryOptions = galleryContacts.map((c) => ({
    value: c._id,
    label: `${c.name} — ${c.email} (${c.position}, ${c.companyName})`,
  }));

  // Handle Quick-Fill gallery selection → auto-fill form + sync combobox
  const handleGallerySelect = (id) => {
    setSelectedGalleryId(id);
    if (!id) return;
    const contact = galleryContacts.find((c) => c._id === id);
    if (!contact) return;
    setFormData((prev) => ({
      ...prev,
      contactName: contact.name,
      contactRole: contact.position,
      company: contact.companyName,
      contactUrl: contact.email,
    }));
    setErrors((prev) => ({ ...prev, contactName: '', company: '', contactUrl: '' }));
  };

  // Load email gallery contacts on mount
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

  // Called when user picks a contact from the combobox dropdown
  const handleContactSelect = (contact) => {
    if (!contact) return;
    setFormData((prev) => ({
      ...prev,
      contactName: contact.name,
      contactRole: contact.position,
      company: contact.companyName,
      contactUrl: contact.email,
    }));
    setErrors((prev) => ({
      ...prev,
      contactName: '',
      company: '',
      contactUrl: '',
    }));
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  // Silently upsert email to gallery when contactUrl is a valid email
  // and was NOT selected from the gallery (i.e. manually typed)
  const upsertToGallery = async () => {
    const email = formData.contactUrl?.trim();
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    setSuccess(false);

    // Validate required fields
    const newErrors = {};
    if (!formData.date) newErrors.date = 'Date is required';
    if (!formData.company) newErrors.company = 'Company is required';
    if (!formData.contactName) newErrors.contactName = 'Contact Name is required';
    if (!formData.outreachType) newErrors.outreachType = 'Outreach Type is required';
    if (!formData.method) newErrors.method = 'Method is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/v1/outreaches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setServerError(data.error?.message || 'Failed to save outreach record');
        setIsLoading(false);
        return;
      }

      // Best-effort: add contact to email gallery if not already there
      await upsertToGallery();

      setSuccess(true);
      setTimeout(() => {
        router.push('/outreach');
      }, 1500);
    } catch {
      setServerError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 mb-2 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to List
          </button>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <PlusCircle className="w-6 h-6 text-blue-500" /> Log Outreach Attempt
          </h1>
          <p className="text-xs text-slate-400">
            Record details of your prospect contact. Note: This saves tracking data only — no emails are sent.
          </p>
        </div>
      </div>

      {success && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-900/50 rounded-xl flex items-start gap-3 text-emerald-400">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">Outreach record created successfully! Redirecting...</span>
        </div>
      )}

      {serverError && (
        <div className="p-4 bg-red-950/40 border border-red-900/50 rounded-xl text-red-400 text-sm">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card flex flex-col gap-6">

        {/* Email Gallery Quick-Pick */}
        {galleryContacts.length > 0 && (
          <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
            <div className="flex items-center gap-2 mb-3">
              <BookUser className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                Quick-Fill from Email Gallery
              </span>
            </div>
            <SearchableDropdown
              placeholder="Search and select a saved contact to auto-fill the form..."
              options={galleryOptions}
              value={selectedGalleryId}
              onChange={handleGallerySelect}
              searchPlaceholder="Type to search contacts..."
            />
            {selectedGalleryId && (
              <p className="text-[11px] text-slate-500 mt-2">
                Contact fields filled from gallery. You can still edit them manually below.
              </p>
            )}
          </div>
        )}

        {/* Section 1: Core Target Info */}
        <div>
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 pb-2 border-b border-slate-800">
            1. Prospect &amp; Target Info
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Company"
              placeholder="e.g. Acme Corp"
              value={formData.company}
              onChange={(e) => handleChange('company', e.target.value)}
              error={errors.company}
              required
            />

            <Input
              label="Contact Name"
              placeholder="e.g. Sarah Jenkins"
              value={formData.contactName}
              onChange={(e) => handleChange('contactName', e.target.value)}
              error={errors.contactName}
              required
            />

            <Input
              label="Contact Role"
              placeholder="e.g. VP of Engineering"
              value={formData.contactRole}
              onChange={(e) => handleChange('contactRole', e.target.value)}
            />

            <EmailGalleryCombobox
              label="Email / LinkedIn Profile URL"
              placeholder="e.g. sarah@acme.com or linkedin.com/in/sarah"
              value={formData.contactUrl}
              onChange={(val) => {
                setSelectedGalleryId(''); // deselect quick-fill when user types manually
                handleChange('contactUrl', val);
              }}
              onContactSelect={(contact) => {
                if (contact) setSelectedGalleryId(contact._id);
                handleContactSelect(contact);
              }}
              contacts={galleryContacts}
              error={errors.contactUrl}
              helperText="Select a saved contact to auto-fill · new emails are saved to your gallery automatically"
            />
          </div>
        </div>

        {/* Section 2: Outreach Method & Classification */}
        <div>
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 pb-2 border-b border-slate-800">
            2. Communication Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <DatePicker
              label="Date Contacted"
              value={formData.date}
              onChange={(val) => handleChange('date', val)}
              error={errors.date}
              required
            />

            <SearchableDropdown
              label="Outreach Type"
              options={OUTREACH_TYPES}
              value={formData.outreachType}
              onChange={(val) => handleChange('outreachType', val)}
              error={errors.outreachType}
            />

            <SearchableDropdown
              label="Method"
              options={OUTREACH_METHODS}
              value={formData.method}
              onChange={(val) => handleChange('method', val)}
              error={errors.method}
            />
          </div>

          <div className="mt-4">
            <Textarea
              label="Subject Line / Message Used"
              placeholder="Copy of email subject line or introductory message sent..."
              rows={3}
              value={formData.subjectMessage}
              onChange={(e) => handleChange('subjectMessage', e.target.value)}
            />
          </div>
        </div>

        {/* Section 3: Status & Follow-up Tracking */}
        <div>
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 pb-2 border-b border-slate-800">
            3. Status &amp; Follow-up Plan
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SearchableDropdown
              label="Current Status"
              options={OUTREACH_STATUSES}
              value={formData.status}
              onChange={(val) => handleChange('status', val)}
            />

            <DatePicker
              label="Follow-up Date"
              value={formData.followUpDate}
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
                className={`flex min-h-10 w-full items-center gap-2 px-3 py-2 text-left text-sm rounded-lg border cursor-pointer transition-colors ${
                  formData.interviewScheduled
                    ? 'bg-purple-500/10 border-purple-500/30 text-purple-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <span className={`w-4 h-4 rounded border flex items-center justify-center ${formData.interviewScheduled ? 'bg-purple-500 border-purple-500 text-white' : 'border-slate-700'}`}>
                  {formData.interviewScheduled && '✓'}
                </span>
                Yes, Interview Scheduled
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <Input
              label="Next Action"
              placeholder="e.g. Send follow-up email #1"
              value={formData.nextAction}
              onChange={(e) => handleChange('nextAction', e.target.value)}
            />

            <Textarea
              label="Response Details (if received)"
              placeholder="Summary of response received..."
              rows={2}
              value={formData.response}
              onChange={(e) => handleChange('response', e.target.value)}
            />
          </div>

          <div className="mt-4">
            <Textarea
              label="Internal Notes"
              placeholder="Any additional background context..."
              rows={2}
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
            />
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex flex-col-reverse gap-2 pt-4 border-t border-slate-800 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
          <Button variant="secondary" onClick={() => router.back()} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            Save Record
          </Button>
        </div>
      </form>
    </div>
  );
}
