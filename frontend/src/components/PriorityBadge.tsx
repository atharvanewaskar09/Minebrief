import React from 'react';

export type PriorityLevel = 'low' | 'medium' | 'high' | 'critical' | string;

interface PriorityBadgeProps {
  priority: PriorityLevel;
  className?: string;
}

const priorityConfig: Record<string, { label: string; bg: string; text: string }> = {
  low: { label: 'Low', bg: 'bg-slate-100 border-slate-200', text: 'text-slate-700' },
  medium: { label: 'Medium', bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700' },
  high: { label: 'High', bg: 'bg-amber-50 border-amber-200', text: 'text-amber-800' },
  critical: { label: 'Critical', bg: 'bg-red-50 border-red-200', text: 'text-red-700' },
};

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, className = '' }) => {
  const normalizedKey = (priority || '').toLowerCase();
  const config = priorityConfig[normalizedKey] || {
    label: priority || 'Normal',
    bg: 'bg-slate-100 border-slate-200',
    text: 'text-slate-700',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold tracking-wide uppercase border ${config.bg} ${config.text} ${className}`}
    >
      {config.label}
    </span>
  );
};

export default PriorityBadge;
