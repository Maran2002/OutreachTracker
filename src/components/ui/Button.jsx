'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  type = 'button',
  className,
  onClick,
  ...props
}) {
  const baseStyles =
    'inline-flex min-w-0 items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-500 text-white focus:ring-blue-500 shadow-md shadow-blue-900/20',
    secondary: 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 focus:ring-slate-600',
    danger: 'bg-red-600 hover:bg-red-500 text-white focus:ring-red-500 shadow-md shadow-red-900/20',
    ghost: 'bg-transparent hover:bg-slate-800 text-slate-300 hover:text-white focus:ring-slate-700',
    outline: 'border border-blue-500/30 text-blue-400 hover:bg-blue-500/10 focus:ring-blue-500',
  };

  const sizes = {
    sm: 'min-h-9 text-xs px-3.5 py-2 gap-1.5',
    md: 'min-h-10 text-sm px-5 py-2.5 gap-2',
    lg: 'min-h-12 text-base px-6 py-3 gap-2.5',
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}
