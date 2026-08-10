'use client';

import React from 'react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Button from './Button';

export default function AccessDenied({ permission }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-900/50 border border-slate-800 rounded-xl my-10 max-w-lg mx-auto">
      <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-5">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <h2 className="text-xl font-bold text-slate-100 mb-2">Access Not Provided</h2>
      <p className="text-sm text-slate-400 mb-6 leading-relaxed">
        Your administrator account does not have the required permission (<code>{permission}</code>)
        to view or access this system resource. Please contact a system administrator to request access.
      </p>
      <Link href="/admin/dashboard">
        <Button variant="secondary" size="sm">
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Dashboard
        </Button>
      </Link>
    </div>
  );
}
