'use client';

import React, { useEffect } from 'react';
import { X, Target, Layers, Lightbulb, Rocket, User2, ExternalLink } from 'lucide-react';

export default function AppInfoPanel({ isOpen, onClose }) {
  // Close on Escape
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <aside
        className="fixed top-0 right-0 z-50 h-full w-full max-w-sm bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label="About this application"
      >
        {/* Panel Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Target className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-semibold text-slate-100">About OutreachTracker</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-7">

          {/* Why It Was Created */}
          <section className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2 text-blue-400">
              <Lightbulb className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider">Why It Was Created</h3>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              During a tough job search period, tracking cold outreach across spreadsheets became
              chaotic and unreliable. OutreachTracker was built to solve that — giving job seekers
              a single, structured place to record every cold contact, follow-up, and conversation.
            </p>
          </section>

          {/* Purpose */}
          <section className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2 text-emerald-400">
              <Target className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider">Purpose</h3>
            </div>
            <ul className="flex flex-col gap-2 text-sm text-slate-300">
              {[
                'Log and track every cold outreach attempt',
                'Monitor response rates and follow-up schedules',
                'Stay on top of reminders — never miss a follow-up',
                'Understand which methods and channels work best',
                'Maintain a clear history of your job search efforts',
              ].map((point) => (
                <li key={point} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                  <span className="leading-relaxed">{point}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Uses */}
          <section className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2 text-violet-400">
              <Layers className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider">Key Features</h3>
            </div>
            <ul className="flex flex-col gap-2 text-sm text-slate-300">
              {[
                'Multi-user with secure JWT session auth',
                'Add, view, edit & delete outreach records',
                'Filter by status, type, method & date',
                'Automated reminder system (up to 2 per record)',
                'Admin console for platform management',
                'Fully responsive dark-mode UI',
              ].map((use) => (
                <li key={use} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-1.5 flex-shrink-0" />
                  <span className="leading-relaxed">{use}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Future Updates */}
          <section className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2 text-amber-400">
              <Rocket className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider">Planned Improvements</h3>
            </div>
            <ul className="flex flex-col gap-2 text-sm text-slate-300">
              {[
                'Email integration — send & track messages in-app',
                'Analytics & charts for outreach performance',
                'CSV import / export of records',
                'Browser push notifications for reminders',
                'Kanban-style board view',
                'Team / organisation shared accounts',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Made By */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-rose-400">
              <User2 className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider">Made By</h3>
            </div>
            <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 flex flex-col gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-100">Elamaran A</p>
                <p className="text-xs text-slate-400 mt-0.5">Full-Stack Developer</p>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Passionate about building purposeful tools that solve real problems.
                OutreachTracker is a personal project built to simplify the job-search
                outreach workflow.
              </p>
              <a
                href="https://elamaran-portfolio.web.app/?por-ref=OutReachTracker"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                View Portfolio
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-500">OutreachTracker v1.2.11</span>
          <span className="text-xs text-slate-600">© 2026 Elamaran A</span>
        </div>
      </aside>
    </>
  );
}
