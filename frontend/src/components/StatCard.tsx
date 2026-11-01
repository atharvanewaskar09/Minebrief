import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  subtext?: string;
  trend?: {
    value: string | number;
    direction: 'up' | 'down' | 'neutral';
    label?: string;
  };
  iconColor?: string;
  iconBg?: string;
  onClick?: () => void;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon: Icon,
  subtext,
  trend,
  iconColor = 'text-forest-700',
  iconBg = 'bg-forest-50 border-forest-100',
  onClick,
  className = '',
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-lg border border-slate-200 p-5 shadow-sm transition-all hover:border-slate-300 ${
        onClick ? 'cursor-pointer hover:shadow' : ''
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="min-w-0 flex-1 text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</span>
        <div className={`w-9 h-9 shrink-0 rounded-md border flex items-center justify-center ${iconBg}`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight text-navy-900">{value}</span>
        {trend && (
          <span
            className={`inline-flex items-center text-xs font-semibold ${
              trend.direction === 'up'
                ? 'text-emerald-700'
                : trend.direction === 'down'
                ? 'text-red-600'
                : 'text-slate-500'
            }`}
          >
            {trend.direction === 'up' && <TrendingUp className="w-3.5 h-3.5 mr-0.5" />}
            {trend.direction === 'down' && <TrendingDown className="w-3.5 h-3.5 mr-0.5" />}
            {trend.direction === 'neutral' && <Minus className="w-3.5 h-3.5 mr-0.5" />}
            {trend.value}
            {trend.label && <span className="text-slate-400 font-normal ml-1">({trend.label})</span>}
          </span>
        )}
      </div>

      {subtext && <p className="mt-1 text-xs text-slate-500">{subtext}</p>}
    </div>
  );
};

export default StatCard;
