'use client';

import React, { useState } from 'react';
import { Info } from 'lucide-react';
import AppInfoPanel from './AppInfoPanel';
import { useAdmin } from '@/components/providers/AdminProvider';
import { useUser } from '@/components/providers/UserProvider';

function SafeAdminName({ fallback }) {
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const admin = useAdmin();
    return admin?.name || fallback || 'Admin';
  } catch {
    return fallback || 'Admin';
  }
}

function SafeUserName({ fallback }) {
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const user = useUser();
    return user?.name || fallback || 'User';
  } catch {
    return fallback || 'User';
  }
}

export default function Topbar({ userName, role = 'user' }) {
  const [infoPanelOpen, setInfoPanelOpen] = useState(false);
  const isAdmin = role === 'admin';

  const displayName = isAdmin
    ? <SafeAdminName fallback={userName} />
    : <SafeUserName fallback={userName} />;

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
              {displayName}
            </p>
            <p className={`text-[10px] font-medium uppercase tracking-wider leading-tight ${isAdmin ? 'text-red-400' : 'text-slate-500'}`}>
              {isAdmin ? 'Administrator' : 'Logged in'}
            </p>
          </div>
        </div>

        {/* Right — info icon */}
        <div className="flex items-center gap-3">
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
