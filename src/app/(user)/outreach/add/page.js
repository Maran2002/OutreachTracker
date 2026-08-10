'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PlusCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';
import SearchableDropdown from '@/components/ui/SearchableDropdown';
import DatePicker from '@/components/ui/DatePicker';
import { OUTREACH_TYPES, OUTREACH_METHODS, OUTREACH_STATUSES } from '@/constants/outreach';

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

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
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
        {/* Section 1: Core Target Info */}
        <div>
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 pb-2 border-b border-slate-800">
            1. Prospect & Target Info
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

            <Input
              label="Email / LinkedIn Profile URL"
              placeholder="e.g. sarah@acme.com or linkedin.com/in/sarah"
              value={formData.contactUrl}
              onChange={(e) => handleChange('contactUrl', e.target.value)}
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
            3. Status & Follow-up Plan
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
