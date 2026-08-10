import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import Button from './Button';

export default function ErrorState({
  title = 'Something went wrong',
  description = 'An error occurred while loading this data. Please try again.',
  onRetry,
}) {
  return (
    <div className="flex flex-col items-center justify-center p-10 text-center bg-red-950/20 border border-red-900/30 rounded-xl my-6">
      <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center text-red-400 mb-4">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h4 className="text-base font-semibold text-slate-100 mb-2">{title}</h4>
      <p className="text-xs text-slate-400 max-w-sm mb-5">{description}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Retry
        </Button>
      )}
    </div>
  );
}
