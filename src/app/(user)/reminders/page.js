'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bell, CheckCircle2, ArrowRight } from 'lucide-react';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import { SkeletonCard } from '@/components/ui/Skeleton';
import ErrorState from '@/components/ui/ErrorState';
import EmptyState from '@/components/ui/EmptyState';
import { formatDate } from '@/lib/utils';

export default function RemindersPage() {
  const [reminders, setReminders] = useState({ upcoming: [], dueToday: [], overdue: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState('dueToday');

  const fetchReminders = async () => {
    setIsLoading(true);
    setError(false);
    try {
      const res = await fetch('/api/v1/reminders');
      if (!res.ok) throw new Error('Failed to fetch reminders');
      const json = await res.json();
      setReminders(json.data);
    } catch {
      setError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, []);

  const handleAction = async (id, status) => {
    try {
      const res = await fetch(`/api/v1/reminders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        fetchReminders();
      }
    } catch {
      // Handle error
    }
  };

  if (error) return <ErrorState onRetry={fetchReminders} />;

  const tabs = [
    { key: 'dueToday', label: 'Due Today', count: reminders.dueToday.length, color: 'text-amber-400' },
    { key: 'overdue', label: 'Overdue', count: reminders.overdue.length, color: 'text-red-400' },
    { key: 'upcoming', label: 'Upcoming', count: reminders.upcoming.length, color: 'text-blue-400' },
  ];

  const currentList = reminders[activeTab] || [];

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <Bell className="w-6 h-6 text-amber-400" /> Follow-up Reminders
        </h1>
        <p className="text-sm text-slate-400">
          Automated 3-day interval reminders (max 2 per outreach). Take action to keep prospects engaged.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-800 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${
              activeTab === tab.key
                ? 'bg-slate-800 text-slate-100 border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>{tab.label}</span>
            <span className={`px-2 py-0.5 text-xs rounded-full bg-slate-900 border border-slate-800 font-bold ${tab.color}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Reminder Cards List */}
      {isLoading ? (
        <div className="flex flex-col gap-3">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : currentList.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="All caught up!"
          description={`No ${activeTab.replace(/([A-Z])/g, ' $1').toLowerCase()} reminders right now. Great job keeping up with your outreach!`}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {currentList.map((rem) => {
            const outreach = rem.outreachId || {};
            return (
              <div
                key={rem._id}
                className="card p-4 flex flex-col gap-4 border-l-4 border-l-amber-500 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h4 className="min-w-0 text-base font-semibold text-slate-100">{outreach.company || 'Unknown Company'}</h4>
                    {outreach.status && <StatusBadge status={outreach.status} />}
                    <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                      Reminder #{rem.reminderNumber}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Contact: <span className="text-slate-200 font-medium">{outreach.contactName || 'N/A'}</span> • Scheduled for: {formatDate(rem.scheduledFor)}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleAction(rem._id, 'dismissed')}
                  >
                    Dismiss
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleAction(rem._id, 'completed')}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Complete
                  </Button>
                  {outreach._id && (
                    <Link href={`/outreach/${outreach._id}`}>
                      <Button variant="outline" size="sm">
                        View <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
