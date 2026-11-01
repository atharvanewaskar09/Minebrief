import React, { useState } from 'react';
import { Calendar } from 'lucide-react';

export type DateFilterPeriod = 'today' | '7d' | '30d' | 'custom';

interface DateFilterProps {
  period: DateFilterPeriod;
  onPeriodChange: (period: DateFilterPeriod, customStart?: string, customEnd?: string) => void;
  startDate?: string;
  endDate?: string;
  className?: string;
}

export const DateFilter: React.FC<DateFilterProps> = ({
  period,
  onPeriodChange,
  startDate = '',
  endDate = '',
  className = '',
}) => {
  const [customStart, setCustomStart] = useState(startDate);
  const [customEnd, setCustomEnd] = useState(endDate);

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    onPeriodChange('custom', customStart, customEnd);
  };

  const options: { id: DateFilterPeriod; label: string }[] = [
    { id: 'today', label: 'Today' },
    { id: '7d', label: 'Last 7 Days' },
    { id: '30d', label: 'Last 30 Days' },
    { id: 'custom', label: 'Custom' },
  ];

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <div className="inline-flex rounded-md shadow-sm border border-slate-200 bg-white p-0.5">
        {options.map((opt) => {
          const isActive = period === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => {
                if (opt.id !== 'custom') {
                  onPeriodChange(opt.id);
                } else {
                  onPeriodChange('custom', customStart, customEnd);
                }
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-all ${
                isActive
                  ? 'bg-forest-800 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {period === 'custom' && (
        <form onSubmit={handleApplyCustom} className="flex items-center gap-1.5 text-xs">
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded px-2 py-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="text-xs text-slate-700 outline-none bg-transparent"
              aria-label="Start date"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="text-xs text-slate-700 outline-none bg-transparent"
              aria-label="End date"
            />
          </div>
          <button
            type="submit"
            className="px-2.5 py-1 text-xs font-medium text-white bg-forest-700 hover:bg-forest-800 rounded transition-colors"
          >
            Apply
          </button>
        </form>
      )}
    </div>
  );
};

export default DateFilter;
