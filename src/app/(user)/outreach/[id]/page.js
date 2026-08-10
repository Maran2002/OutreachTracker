'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Building2,
  User2,
  Mail,
  CalendarDays,
  Tag,
  Send,
  CalendarCheck,
  FileText,
  StickyNote,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { SkeletonCard } from '@/components/ui/Skeleton';
import ErrorState from '@/components/ui/ErrorState';

function DetailField({ icon: Icon, label, value, className = '' }) {
  if (!value && value !== false) return null;
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</span>
      <div className="flex items-start gap-2">
        {Icon && <Icon className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />}
        <span className="text-sm text-slate-200 leading-relaxed break-words">{value}</span>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="card flex flex-col gap-5">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 pb-3 border-b border-slate-800">
        {title}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">{children}</div>
    </div>
  );
}

export default function OutreachDetailPage({ params }) {
  const router = useRouter();
  const { id } = use(params);

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function fetchRecord() {
      setIsLoading(true);
      setError(false);
      try {
        const res = await fetch(`/api/v1/outreaches/${id}`);
        if (!res.ok) throw new Error('Not found');
        const json = await res.json();
        setData(json.data);
      } catch {
        setError(true);
      } finally {
        setIsLoading(false);
      }
    }
    fetchRecord();
  }, [id]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/v1/outreaches/${id}`, { method: 'DELETE' });
      if (res.ok) router.push('/outreach');
    } catch {
      alert('Failed to delete outreach record');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading)
    return (
      <div className="flex flex-col gap-4 max-w-5xl mx-auto">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  if (error || !data)
    return <ErrorState title="Outreach Record Not Found" onRetry={() => router.push('/outreach')} />;

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="min-w-0">
          <button
            type="button"
            onClick={() => router.push('/outreach')}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 mb-3 cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to All Outreach
          </button>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-100 leading-tight">{data.company}</h1>
            <StatusBadge status={data.status} />
            {data.interviewScheduled && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-500/10 border border-purple-500/30 text-purple-300">
                <CheckCircle2 className="w-3 h-3" /> Interview Scheduled
              </span>
            )}
          </div>
          <p className="text-sm text-slate-400 mt-1.5">
            {data.contactName}
            {data.contactRole ? ` · ${data.contactRole}` : ''}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
          <Button variant="danger" size="sm" onClick={() => setIsDeleteOpen(true)}>
            <Trash2 className="w-4 h-4" />
            Delete
          </Button>
          <Button variant="primary" size="sm" onClick={() => router.push(`/outreach/${id}/edit`)}>
            <Pencil className="w-4 h-4" />
            Edit Record
          </Button>
        </div>
      </div>

      {/* Prospect & Contact */}
      <Section title="Prospect & Contact Details">
        <DetailField icon={Building2} label="Company" value={data.company} />
        <DetailField icon={User2} label="Contact Name" value={data.contactName} />
        <DetailField icon={Tag} label="Contact Role" value={data.contactRole} />
        <DetailField icon={Mail} label="Email / URL" value={data.contactUrl} />
      </Section>

      {/* Outreach Parameters */}
      <Section title="Outreach Parameters">
        <DetailField
          icon={CalendarDays}
          label="Date Contacted"
          value={formatDate(data.date)}
        />
        <DetailField icon={Tag} label="Outreach Type" value={data.outreachType} />
        <DetailField icon={Send} label="Method" value={data.method} />
        <DetailField
          icon={CalendarCheck}
          label="Follow-up Date"
          value={formatDate(data.followUpDate)}
        />
      </Section>

      {/* Status & Follow-up */}
      <div className="card flex flex-col gap-5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 pb-3 border-b border-slate-800">
          Status & Next Steps
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Current Status</span>
            <StatusBadge status={data.status} />
          </div>
          <DetailField icon={Clock} label="Next Action" value={data.nextAction} />
          {data.response && (
            <div className="sm:col-span-2 flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Response Details</span>
              <div className="flex items-start gap-2">
                <FileText className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{data.response}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Notes */}
      {data.notes && (
        <div className="card flex flex-col gap-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 pb-3 border-b border-slate-800">
            Internal Notes
          </h3>
          <div className="flex items-start gap-2">
            <StickyNote className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{data.notes}</p>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title="Delete Record"
        message={`Are you sure you want to permanently delete the outreach record for "${data.company}"? This action cannot be undone.`}
      />
    </div>
  );
}
