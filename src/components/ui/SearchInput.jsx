'use client';

import React from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SearchInput({
  value,
  onChange,
  onClear,
  placeholder = 'Search...',
  className,
  ...props
}) {
  return (
    <div className={cn('relative flex items-center w-full min-w-0', className)}>
      <Search className="absolute left-3 w-4 h-4 text-slate-500 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full min-h-10 bg-slate-900 border border-slate-800 text-slate-100 text-sm rounded-lg pl-10 pr-9 py-2.5 transition-all focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder:text-slate-500"
        {...props}
      />
      {value && (
        <button
          type="button"
          onClick={onClear || (() => onChange({ target: { value: '' } }))}
          className="absolute right-2.5 p-1 text-slate-500 hover:text-slate-200 rounded"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
