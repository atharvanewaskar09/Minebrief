import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Filter,
  RotateCcw,
  CheckCircle,
  Clock,
  ChevronRight,
  X,
  FileText,
  AlertOctagon,
} from 'lucide-react';
import DataTable, { Column } from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import issueService from '../services/issueService';
import { Issue } from '../types';

export const PendingIssuesPage: React.FC = () => {
  const navigate = useNavigate();

  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [sectionFilter, setSectionFilter] = useState<string>('');

  // Status update modal
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [targetStatus, setTargetStatus] = useState<string>('in_progress');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  const fetchIssues = async () => {
    try {
      setLoading(true);
      setError(null);
      const filters: { status?: string; section?: string } = {};
      if (statusFilter) filters.status = statusFilter;
      if (sectionFilter) filters.section = sectionFilter;

      const data = await issueService.getIssues(filters);
      setIssues(data || []);
    } catch (err: any) {
      setIssues([]);
      setError(err?.message || 'Unable to load operational issues.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, [statusFilter, sectionFilter]);

  const handleUpdateStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssue || !selectedIssue.id) return;

    try {
      setIsUpdating(true);
      await issueService.updateIssue(selectedIssue.id, {
        status: targetStatus as any,
      });
      setSelectedIssue(null);
      await fetchIssues();
    } catch (err: any) {
      alert(err?.message || 'Failed to update issue status');
    } finally {
      setIsUpdating(false);
    }
  };

  const columns: Column<Issue>[] = [
    {
      key: 'date_reported',
      header: 'Reported Date',
      sortable: true,
      render: (i) => <span className="font-semibold text-slate-800">{i.date_reported}</span>,
    },
    {
      key: 'section',
      header: 'Colliery Section',
      sortable: true,
      render: (i) => <span className="font-medium text-slate-700">{i.section}</span>,
    },
    {
      key: 'description',
      header: 'Issue Description',
      render: (i) => (
        <span className="text-slate-800 font-medium block max-w-md leading-relaxed">
          {i.description}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (i) => <StatusBadge status={i.status} />,
    },
    {
      key: 'report_id',
      header: 'Originating Report',
      render: (i) =>
        i.report_id ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/app/reports/${i.report_id}`);
            }}
            className="text-forest-700 hover:text-forest-900 font-medium inline-flex items-center gap-1 text-xs"
          >
            <FileText className="w-3.5 h-3.5" />
            Report #{i.report_id}
          </button>
        ) : (
          <span className="text-slate-400 italic">Direct Log</span>
        ),
    },
    {
      key: 'actions',
      header: '',
      render: (i) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedIssue(i);
            setTargetStatus(i.status);
          }}
          className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors"
        >
          Update Status
        </button>
      ),
    },
  ];

  const openCount = issues.filter((i) => i.status === 'open').length;
  const inProgressCount = issues.filter(
    (i) => i.status === 'in_progress' || i.status === 'under_review'
  ).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-navy-900 tracking-tight">
              Pending Operational Issues
            </h2>
            {openCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
                {openCount} Open Action Items
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Cross-shift hazards, waterlogging alerts, safety notices, and infrastructure repairs
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800" role="alert">
          <span>{error}</span>
          <button type="button" onClick={fetchIssues} className="ml-3 font-semibold underline">
            Retry
          </button>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-1.5 text-slate-500 font-medium">
          <Filter className="w-4 h-4 text-slate-400" />
          <span>Filter Issues:</span>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-700 outline-none"
        >
          <option value="">All Statuses</option>
          <option value="open">Open (Immediate Attention)</option>
          <option value="under_review">Under Review</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
        </select>

        <select
          value={sectionFilter}
          onChange={(e) => setSectionFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-700 outline-none"
        >
          <option value="">All Colliery Sections</option>
          <option value="Open Cast Block A">Open Cast Block A</option>
          <option value="Open Cast Block B">Open Cast Block B</option>
          <option value="Underground Section 1">Underground Section 1</option>
          <option value="Processing Plant">Processing Plant</option>
        </select>

        {(statusFilter || sectionFilter) && (
          <button
            type="button"
            onClick={() => {
              setStatusFilter('');
              setSectionFilter('');
            }}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-600 px-2 py-1 rounded hover:bg-slate-100 transition-colors ml-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Issues Table */}
      {loading ? (
        <LoadingSpinner message="Fetching pending colliery issues..." size="md" />
      ) : (
        <DataTable
          columns={columns}
          data={issues}
          pageSize={10}
          emptyTitle="No Pending Issues Recorded"
          emptyDescription="All operational and safety issues have been resolved across this colliery section."
        />
      )}

      {/* Status Update Modal */}
      {selectedIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-lg max-w-md w-full shadow-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h3 className="text-sm font-bold text-navy-900">Update Issue Status</h3>
              <button
                type="button"
                onClick={() => setSelectedIssue(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded border border-slate-200 mb-4 leading-relaxed">
              {selectedIssue.description}
            </p>

            <form onSubmit={handleUpdateStatusSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Transition Status
                </label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value)}
                  className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded bg-white"
                >
                  <option value="open">Open (Unresolved)</option>
                  <option value="under_review">Under Review by Safety/Civil Team</option>
                  <option value="in_progress">In Progress (Corrective Action Ongoing)</option>
                  <option value="resolved">Resolved (Certified Closed)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedIssue(null)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-forest-800 hover:bg-forest-900 rounded disabled:opacity-50"
                >
                  {isUpdating ? 'Saving...' : 'Update Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingIssuesPage;
