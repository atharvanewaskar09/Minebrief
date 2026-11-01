import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FilePlus,
  Filter,
  Calendar,
  RotateCcw,
  ChevronRight,
  CheckCircle,
  FileText,
} from 'lucide-react';
import DataTable, { Column } from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import reportService, { ReportFilters } from '../services/reportService';
import { ShiftReport } from '../types';

export const ShiftReportsPage: React.FC = () => {
  const navigate = useNavigate();

  const [date, setDate] = useState<string>('');
  const [shift, setShift] = useState<string>('');
  const [section, setSection] = useState<string>('');
  const [status, setStatus] = useState<string>('');

  const [reports, setReports] = useState<ShiftReport[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const filters: ReportFilters = {};
      if (date) filters.date = date;
      if (shift) filters.shift = shift;
      if (section) filters.section = section;
      if (status) filters.status = status;

      const res = await reportService.getReports(filters);
      setReports(res.reports || []);
    } catch (err: any) {
      setReports([]);
      setError(err?.message || 'Unable to load shift reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [date, shift, section, status]);

  const handleResetFilters = () => {
    setDate('');
    setShift('');
    setSection('');
    setStatus('');
  };

  const columns: Column<ShiftReport>[] = [
    {
      key: 'report_date',
      header: 'Report Date',
      sortable: true,
      render: (r) => <span className="font-semibold text-slate-800">{r.report_date}</span>,
    },
    {
      key: 'shift',
      header: 'Shift',
      sortable: true,
      render: (r) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-slate-100 font-medium text-slate-700">
          {r.shift}
        </span>
      ),
    },
    {
      key: 'section',
      header: 'Mine Section',
      sortable: true,
      render: (r) => <span className="text-slate-800 font-medium">{r.section}</span>,
    },
    {
      key: 'submitted_by',
      header: 'Submitted By',
      sortable: true,
      render: (r) => <span className="text-slate-600">{r.submitted_by}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: 'verified_by',
      header: 'Verification Sign-off',
      render: (r) =>
        r.verified_by ? (
          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
            <CheckCircle className="w-3.5 h-3.5" />
            {r.verified_by}
          </span>
        ) : (
          <span className="text-slate-400 text-xs italic">Pending</span>
        ),
    },
    {
      key: 'action',
      header: '',
      render: (r) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/app/reports/${r.id}`);
          }}
          className="text-forest-700 hover:text-forest-900 font-medium inline-flex items-center gap-1 text-xs"
        >
          View Details <ChevronRight className="w-3.5 h-3.5" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-navy-900 tracking-tight">Shift Reports Register</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Official operational logs submitted by colliery shift supervisors
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/app/reports/new')}
          className="px-4 py-2 text-xs font-semibold text-white bg-forest-800 hover:bg-forest-900 rounded-md shadow-xs transition-colors flex items-center justify-center gap-2 self-start sm:self-auto"
        >
          <FilePlus className="w-4 h-4" />
          <span>New Shift Report</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-1.5 text-slate-500 font-medium">
          <Filter className="w-4 h-4 text-slate-400" />
          <span>Filters:</span>
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="text-xs text-slate-700 bg-transparent outline-none"
            title="Filter by report date"
          />
        </div>

        {/* Shift Filter */}
        <select
          value={shift}
          onChange={(e) => setShift(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-700 outline-none"
        >
          <option value="">All Shifts</option>
          <option value="Morning">Morning Shift</option>
          <option value="Afternoon">Afternoon Shift</option>
          <option value="Night">Night Shift</option>
        </select>

        {/* Section Filter */}
        <select
          value={section}
          onChange={(e) => setSection(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-700 outline-none"
        >
          <option value="">All Mine Sections</option>
          <option value="Open Cast Block A">Open Cast Block A</option>
          <option value="Open Cast Block B">Open Cast Block B</option>
          <option value="Underground Section 1">Underground Section 1</option>
          <option value="Processing Plant">Processing Plant</option>
          <option value="Sub-station">Sub-station & Pumps</option>
        </select>

        {/* Status Filter */}
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-700 outline-none"
        >
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="submitted">Submitted (Pending Sign-off)</option>
          <option value="verified">Verified (Approved)</option>
        </select>

        {(date || shift || section || status) && (
          <button
            type="button"
            onClick={handleResetFilters}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-600 px-2 py-1 rounded hover:bg-slate-100 transition-colors ml-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Reports Data Table */}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800" role="alert">
          <span>{error}</span>
          <button type="button" onClick={fetchReports} className="ml-3 font-semibold underline">
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <LoadingSpinner message="Fetching shift reports..." size="md" />
      ) : (
        <DataTable
          columns={columns}
          data={reports}
          pageSize={10}
          onRowClick={(r) => navigate(`/app/reports/${r.id}`)}
          emptyTitle="No Shift Reports Match Filters"
          emptyDescription="Try selecting a different date range, shift, or mine section."
        />
      )}
    </div>
  );
};

export default ShiftReportsPage;
