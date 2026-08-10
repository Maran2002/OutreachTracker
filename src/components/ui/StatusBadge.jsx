import React from 'react';
import { cn } from '@/lib/utils';
import { OUTREACH_STATUSES } from '@/constants/outreach';

export default function StatusBadge({ status, className }) {
  const statusObj = OUTREACH_STATUSES.find((s) => s.value === status);
  const label = statusObj ? statusObj.label : status;

  const badgeClassMap = {
    sent: 'badge-sent',
    no_response: 'badge-no_response',
    replied: 'badge-replied',
    screening_call: 'badge-screening_call',
    interview: 'badge-interview',
    rejected: 'badge-rejected',
  };

  return (
    <span className={cn('badge', badgeClassMap[status] || 'badge-sent', className)}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {label}
    </span>
  );
}
