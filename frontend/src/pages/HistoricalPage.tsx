import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Calendar,
  Filter,
  RotateCcw,
  FileText,
  Wrench,
  AlertTriangle,
  Clock,
  ShieldAlert,
  CheckCircle2,
  ChevronRight,
  Inbox,
  ArrowRight,
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import searchService, { SearchParams, SearchResultItem } from '../services/searchService';

export const HistoricalPage: React.FC = () => {
  const navigate = useNavigate();

  const [query, setQuery] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [shift, setShift] = useState<string>('');
  const [section, setSection] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [status, setStatus] = useState<string>('');

  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      setLoading(true);
      setHasSearched(true);
      setError(null);
      const params: SearchParams = {
        q: query || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        shift: shift || undefined,
        section: section || undefined,
        category: category || undefined,
        status: status || undefined,
      };

      const data = await searchService.searchRecords(params);
      setResults(data || []);
    } catch (err: any) {
      setResults([]);
      setError(err?.message || 'Unable to search historical records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch of recent records
    handleSearch();
  }, []);

  const handleReset = () => {
    setQuery('');
    setDateFrom('');
    setDateTo('');
    setShift('');
    setSection('');
    setCategory('');
    setStatus('');
    setLoading(true);
    setHasSearched(true);
    setError(null);
    searchService.searchRecords({})
      .then((res) => setResults(res))
      .catch((err: { message?: string }) => {
        setResults([]);
        setError(err.message || 'Unable to search historical records.');
      })
      .finally(() => setLoading(false));
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'work':
        return <CheckCircle2 className="w-4 h-4 text-emerald-700" />;
      case 'breakdown':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'delay':
        return <Clock className="w-4 h-4 text-amber-700" />;
      case 'maintenance':
        return <Wrench className="w-4 h-4 text-forest-700" />;
      case 'safety':
        return <ShieldAlert className="w-4 h-4 text-red-600" />;
      case 'issue':
        return <AlertTriangle className="w-4 h-4 text-amber-800" />;
      default:
        return <FileText className="w-4 h-4 text-slate-600" />;
    }
  };

  const getCategoryBadgeClass = (cat: string) => {
    switch (cat) {
      case 'work':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'breakdown':
        return 'bg-red-50 text-red-800 border-red-200';
      case 'delay':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'maintenance':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'safety':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-2 border-b border-slate-200">
        <h2 className="text-xl font-bold text-navy-900 tracking-tight">
          Historical Operational Search
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Query cross-colliery records across work done, equipment faults, production delays, and DGMS safety inspections
        </p>
      </div>

      {/* Search Input Bar */}
      <form onSubmit={handleSearch} className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by equipment ID (EX-04), keyword (hydraulic, berm, blasting), or location..."
              className="w-full pl-9 pr-4 py-2.5 text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-forest-700 focus:border-forest-700 bg-white shadow-2xs"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 text-xs font-semibold text-white bg-forest-800 hover:bg-forest-900 rounded-md shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search Records</span>
          </button>
        </div>

        {/* Filter Row */}
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs flex flex-wrap items-center gap-2.5 text-xs">
          <div className="flex items-center gap-1 text-slate-500 font-medium">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Filters:</span>
          </div>

          {/* Date range */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded px-2 py-1">
            <Calendar className="w-3 h-3 text-slate-400" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="text-xs text-slate-700 bg-transparent outline-none"
              title="From Date"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="text-xs text-slate-700 bg-transparent outline-none"
              title="To Date"
            />
          </div>

          {/* Category */}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-700 outline-none"
          >
            <option value="">All Categories</option>
            <option value="work">Work Completed</option>
            <option value="breakdown">Equipment Breakdown</option>
            <option value="delay">Production Delay</option>
            <option value="maintenance">Maintenance Ticket</option>
            <option value="safety">Safety Observation</option>
            <option value="issue">Operational Issue</option>
            <option value="report">Shift Report</option>
            <option value="attendance">Workforce Attendance</option>
            <option value="handover">Shift Handover</option>
          </select>

          {/* Section */}
          <select
            value={section}
            onChange={(e) => setSection(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-700 outline-none"
          >
            <option value="">All Sections</option>
            <option value="Open Cast Block A">Open Cast Block A</option>
            <option value="Open Cast Block B">Open Cast Block B</option>
            <option value="Underground Section 1">Underground Section 1</option>
            <option value="Processing Plant">Processing Plant</option>
          </select>

          {/* Shift */}
          <select
            value={shift}
            onChange={(e) => setShift(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-700 outline-none"
          >
            <option value="">All Shifts</option>
            <option value="Morning">Morning</option>
            <option value="Afternoon">Afternoon</option>
            <option value="Night">Night</option>
          </select>

          {/* Status */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-700 outline-none"
          >
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="under_review">Under Review</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>

          {(query || dateFrom || dateTo || category || section || shift || status) && (
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-600 px-2 py-1 rounded hover:bg-slate-100 transition-colors ml-auto"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </form>

      {/* Results Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>
            Found <strong className="text-slate-800">{results.length}</strong> matching operational records
          </span>
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800" role="alert">
            <span>{error}</span>
            <button type="button" onClick={() => handleSearch()} className="ml-3 font-semibold underline">
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <LoadingSpinner message="Searching colliery archives..." size="md" />
        ) : results.length > 0 ? (
          <div className="space-y-3">
            {results.map((item) => (
              <div
                key={`${item.category}-${item.id}`}
                onClick={() => item.report_id && navigate(`/app/reports/${item.report_id}`)}
                className={`bg-white p-4 rounded-lg border border-slate-200 shadow-2xs hover:border-slate-300 transition-all ${
                  item.report_id ? 'cursor-pointer hover:shadow-xs' : ''
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded bg-slate-50 border border-slate-200 shrink-0">
                      {getCategoryIcon(item.category)}
                    </div>
                    <span
                      className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${getCategoryBadgeClass(
                        item.category
                      )}`}
                    >
                      {item.category}
                    </span>
                    <h3 className="text-xs font-bold text-navy-900">{item.title}</h3>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    {item.priority && <PriorityBadge priority={item.priority} />}
                    {item.status && <StatusBadge status={item.status} />}
                  </div>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed mb-3">{item.description}</p>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-4">
                    <span>Section: <strong className="text-slate-600">{item.section}</strong></span>
                    <span>Date: <strong className="text-slate-600">{item.date}</strong></span>
                    {item.shift && <span>Shift: <strong className="text-slate-600">{item.shift}</strong></span>}
                  </div>

                  {item.report_id && (
                    <span className="text-forest-700 font-semibold flex items-center gap-1 hover:text-forest-900">
                      View Shift Report #{item.report_id}
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No Records Found"
            description="No colliery entries match your keyword, date range, or category criteria. Try broadening your query."
          />
        )}
      </div>
    </div>
  );
};

export default HistoricalPage;
