'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export default function Textarea({
  label,
  error,
  helperText,
  className,
  disabled = false,
  required = false,
  rows = 4,
  id,
  ...props
}) {
  const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="flex flex-col gap-1.5 w-full min-w-0">
      {label && (
        <label htmlFor={textareaId} className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      )}

      <textarea
        id={textareaId}
        disabled={disabled}
        rows={rows}
        className={cn(
          'w-full min-h-24 bg-slate-900 border border-slate-800 text-slate-100 text-sm rounded-lg p-3.5 transition-all focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder:text-slate-600 resize-y',
          disabled && 'opacity-50 cursor-not-allowed bg-slate-950',
          error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
          className
        )}
        {...props}
      />

      {error && <span className="text-xs text-red-400 mt-0.5">{error}</span>}
      {helperText && !error && <span className="text-xs text-slate-500 mt-0.5">{helperText}</span>}
    </div>
  );
}
