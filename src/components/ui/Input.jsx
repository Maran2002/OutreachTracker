'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export default function Input({
  label,
  error,
  helperText,
  icon: Icon,
  className,
  type = 'text',
  disabled = false,
  required = false,
  id,
  ...props
}) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="flex flex-col gap-1.5 w-full min-w-0">
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3 text-slate-500 pointer-events-none">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          id={inputId}
          type={type}
          disabled={disabled}
          className={cn(
            'w-full min-h-10 bg-slate-900 border border-slate-800 text-slate-100 text-sm rounded-lg py-2.5 pr-3.5 transition-all focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder:text-slate-600',
            Icon ? 'pl-10' : 'pl-3.5',
            disabled && 'opacity-50 cursor-not-allowed bg-slate-950',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
            className
          )}
          {...props}
        />
      </div>

      {error && <span className="text-xs text-red-400 mt-0.5">{error}</span>}
      {helperText && !error && <span className="text-xs text-slate-500 mt-0.5">{helperText}</span>}
    </div>
  );
}
