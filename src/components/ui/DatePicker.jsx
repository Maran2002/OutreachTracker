'use client';

import React from 'react';
import { Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function DatePicker({
  label,
  value,
  onChange,
  error,
  helperText,
  disabled = false,
  required = false,
  className,
  id,
}) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  // Format YYYY-MM-DD for native input date representation
  const formattedValue = value ? new Date(value).toISOString().split('T')[0] : '';

  return (
    <div className="flex flex-col gap-1.5 w-full min-w-0">
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        <input
          id={inputId}
          type="date"
          disabled={disabled}
          value={formattedValue}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            'w-full min-h-10 bg-slate-900 border border-slate-800 text-slate-100 text-sm rounded-lg pl-3.5 pr-9 py-2.5 transition-all focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 [color-scheme:dark]',
            disabled && 'opacity-50 cursor-not-allowed bg-slate-950',
            error && 'border-red-500',
            className
          )}
        />
        <Calendar className="absolute right-3 w-4 h-4 text-slate-500 pointer-events-none" />
      </div>

      {error && <span className="text-xs text-red-400 mt-0.5">{error}</span>}
      {helperText && !error && <span className="text-xs text-slate-500 mt-0.5">{helperText}</span>}
    </div>
  );
}
