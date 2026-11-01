import React from 'react';

export type StatusType =
  | 'open'
  | 'under_review'
  | 'in_progress'
  | 'resolved'
  | 'draft'
  | 'submitted'
  | 'verified'
  | 'operational'
  | 'under_maintenance'
  | 'out_of_service'
  | string;

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const statusConfig: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  open: { label: 'Open', bg: 'bg-red-50', text: 'text-red-700 border-red-200', dot: 'bg-red-500' },
  under_review: { label: 'Under Review', bg: 'bg-amber-50', text: 'text-amber-800 border-amber-200', dot: 'bg-amber-500' },
  in_progress: { label: 'In Progress', bg: 'bg-blue-50', text: 'text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  resolved: { label: 'Resolved', bg: 'bg-emerald-50', text: 'text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  draft: { label: 'Draft', bg: 'bg-slate-100', text: 'text-slate-600 border-slate-200', dot: 'bg-slate-400' },
  submitted: { label: 'Submitted', bg: 'bg-blue-50', text: 'text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  verified: { label: 'Verified', bg: 'bg-emerald-50', text: 'text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  operational: { label: 'Operational', bg: 'bg-emerald-50', text: 'text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  under_maintenance: { label: 'Under Maintenance', bg: 'bg-amber-50', text: 'text-amber-800 border-amber-200', dot: 'bg-amber-500' },
  out_of_service: { label: 'Out of Service', bg: 'bg-red-50', text: 'text-red-700 border-red-200', dot: 'bg-red-500' },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const normalizedKey = (status || '').toLowerCase().replace(/[-\s]/g, '_');
  const config = statusConfig[normalizedKey] || {
    label: status ? status.replace(/_/g, ' ') : 'Unknown',
    bg: 'bg-slate-100',
    text: 'text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <span className="capitalize">{config.label}</span>
    </span>
  );
};

export default StatusBadge;
