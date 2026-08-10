'use client';

import React, { useState } from 'react';
import { Info } from 'lucide-react';
import AppInfoPanel from './AppInfoPanel';

export default function Topbar({ userName, role = 'user' }) {
  const [infoPanelOpen, setInfoPanelOpen] = useState(false);

  const isAdmin = role === 'admin';

  return (
    <>
      <header
        className={`topbar${isAdmin ? ' border-red-950/30' : ''}`}
        style={{ justifyContent: 'space-between' }}
      >
        {/* Left — logged-in user name */}
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
              isAdmin
                ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
            }`}
          >
            {userName ? userName.charAt(0).toUpperCase() : '?'}
          </span>
          <div className="min-w-0 hidden sm:block">
            <p className="text-sm font-semibold text-slate-100 truncate leading-tight">
              {userName || 'User'}
            </p>
            <p className={`text-[10px] font-medium uppercase tracking-wider leading-tight ${isAdmin ? 'text-red-400' : 'text-slate-500'}`}>
              {isAdmin ? 'Administrator' : 'Logged in'}
            </p>
          </div>
        </div>

        {/* Right — status badge + info icon */}
        <div className="flex items-center gap-3">
          {/* <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
              isAdmin
                ? 'bg-red-500/10 text-red-400 border-red-500/20'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                isAdmin ? 'bg-red-400' : 'bg-emerald-400'
              }`}
            />
            {isAdmin ? 'Admin Session' : 'Active Session'}
          </span> */}

          <button
            type="button"
            id="app-info-btn"
            onClick={() => setInfoPanelOpen(true)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition-colors cursor-pointer"
            title="About this application"
            aria-label="Open app info"
          >
            <Info className="w-5 h-5" />
          </button>
        </div>
      </header>

      <AppInfoPanel isOpen={infoPanelOpen} onClose={() => setInfoPanelOpen(false)} />
    </>
  );
}
