import React from 'react';
import { FolderOpen } from 'lucide-react';
import Button from './Button';

export default function EmptyState({
  title = 'No records found',
  description = 'Try adjusting your search or filters to find what you are looking for.',
  actionLabel,
  onAction,
  icon: Icon = FolderOpen,
}) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <Icon className="w-8 h-8 text-slate-400" />
      </div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-desc mb-5">{description}</p>
      {actionLabel && onAction && (
        <div className="mt-5">
          <Button variant="primary" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
