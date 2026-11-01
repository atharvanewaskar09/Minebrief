import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Clock,
  CheckCircle,
  Users,
  UserX,
  AlertTriangle,
  Wrench,
  AlertOctagon,
  Calendar,
  Activity as ActivityIcon,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

import StatCard from '../components/StatCard';
import DateFilter, { DateFilterPeriod } from '../components/DateFilter';
import DataTable, { Column } from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import dashboardService from '../services/dashboardService';
import { DashboardSummary, ShiftReport, PendingAction, Activity } from '../types';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<DateFilterPeriod>('7d');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  const fetchSummary = async (p: string, start?: string, end?: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await dashboardService.getDashboardSummary(p, start, end);
      setSummary(data);
    } catch (err: any) {
      setSummary(null);
      setError(err?.message || 'Unable to load dashboard data from the server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary(period, customStart, customEnd);
  }, [period]);

  const handlePeriodChange = (newPeriod: DateFilterPeriod, start?: string, end?: string) => {
    setPeriod(newPeriod);
    if (newPeriod === 'custom' && start && end) {
      setCustomStart(start);
      setCustomEnd(end);
      fetchSummary('custom', start, end);
    }
  };

  const PIE_COLORS: Record<string, string> = {
    Open: '#dc2626',
    'Under Review': '#d97706',
    'In Progress': '#2563eb',
    Resolved: '#16a34a',
  };

  const reportColumns: Column<ShiftReport>[] = [
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
          {r.shift} Shift
        </span>
      ),
    },
    {
      key: 'section',
      header: 'Mine Section',
      sortable: true,
      render: (r) => <span className="text-slate-800">{r.section}</span>,
    },
    {
      key: 'submitted_by',
      header: 'Submitted By',
      render: (r) => <span className="text-slate-600">{r.submitted_by}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: 'actions',
      header: '',
      render: (r) => (
        <button
          type="button"
          onClick={() => navigate(`/app/reports/${r.id}`)}
          className="text-forest-700 hover:text-forest-900 font-medium inline-flex items-center gap-1 text-xs"
        >
          View Detail <ChevronRight className="w-3.5 h-3.5" />
        </button>
      ),
    },
  ];

  if (loading && !summary) {
    return <LoadingSpinner message="Loading operational dashboard..." size="lg" />;
  }

  if (error || !summary) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-800">
        <p className="font-semibold">Dashboard data is unavailable.</p>
        <p className="mt-1 text-xs">{error || 'No dashboard summary was returned.'}</p>
        <button
          type="button"
          onClick={() => fetchSummary(period, customStart, customEnd)}
          className="mt-3 rounded border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold hover:bg-red-100"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Filter Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-navy-900 tracking-tight">Operations Dashboard</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time shift performance, workforce muster, and heavy earthmoving machinery status
          </p>
        </div>

        <DateFilter
          period={period}
          onPeriodChange={handlePeriodChange}
          startDate={customStart}
          endDate={customEnd}
        />
      </div>

      {/* 8 Stat Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Total Reports"
          value={summary?.total_reports ?? 0}
          icon={FileText}
          iconColor="text-slate-700"
          iconBg="bg-slate-100 border-slate-200"
          onClick={() => navigate('/app/reports')}
        />
        <StatCard
          label="Today's Logs"
          value={summary?.reports_today ?? 0}
          icon={Calendar}
          iconColor="text-forest-700"
          iconBg="bg-forest-50 border-forest-100"
          onClick={() => navigate('/app/reports')}
        />
        <StatCard
          label="Pending Verification"
          value={summary?.pending_verification ?? 0}
          icon={Clock}
          iconColor="text-amber-700"
          iconBg="bg-amber-50 border-amber-100"
          onClick={() => navigate('/app/reports?status=submitted')}
        />
        <StatCard
          label="Workers Present"
          value={summary?.workers_present ?? 0}
          icon={Users}
          iconColor="text-emerald-700"
          iconBg="bg-emerald-50 border-emerald-100"
          onClick={() => navigate('/app/workforce')}
        />
        <StatCard
          label="Workers Absent"
          value={summary?.workers_absent ?? 0}
          icon={UserX}
          iconColor="text-slate-600"
          iconBg="bg-slate-100 border-slate-200"
          onClick={() => navigate('/app/workforce')}
        />
        <StatCard
          label="Breakdowns"
          value={summary?.equipment_breakdowns ?? 0}
          icon={AlertTriangle}
          iconColor="text-red-600"
          iconBg="bg-red-50 border-red-100"
          onClick={() => navigate('/app/equipment')}
        />
        <StatCard
          label="Pending Maint."
          value={summary?.pending_maintenance ?? 0}
          icon={Wrench}
          iconColor="text-amber-700"
          iconBg="bg-amber-50 border-amber-100"
          onClick={() => navigate('/app/equipment')}
        />
        <StatCard
          label="Open Issues"
          value={summary?.unresolved_issues ?? 0}
          icon={AlertOctagon}
          iconColor="text-red-700"
          iconBg="bg-red-50 border-red-100"
          onClick={() => navigate('/app/issues')}
        />
      </div>

      {/* 2x2 Grid of Recharts Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Workforce Attendance Trend */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-navy-900">Workforce Attendance Trend</h3>
              <p className="text-xs text-slate-500">Muster attendance across active shifts</p>
            </div>
            <span className="text-xs font-semibold text-forest-700 bg-forest-50 px-2 py-0.5 rounded border border-forest-200">
              Avg ~95% Present
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={summary?.attendance_trend || []}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#15803d" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#15803d" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} domain={['dataMin - 20', 'dataMax + 20']} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: '4px',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  name="Workers Present"
                  stroke="#15803d"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#attendanceGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Daily Report Submissions */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-navy-900">Daily Shift Report Submissions</h3>
              <p className="text-xs text-slate-500">Total shift logs generated per calendar date</p>
            </div>
            <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              Target: 6/day
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={summary?.report_trend || []}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: '4px',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                />
                <Bar dataKey="value" name="Shift Reports" fill="#1e293b" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Equipment Breakdown Frequency */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-navy-900">Breakdown Incidents by Asset</h3>
              <p className="text-xs text-slate-500">Machines with highest reported outages</p>
            </div>
            <span className="text-xs font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
              HEMM Telemetry
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={summary?.breakdown_frequency || []}
                layout="vertical"
                margin={{ top: 10, right: 20, left: 20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#334155' }} width={90} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: '4px',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                />
                <Bar dataKey="count" name="Incidents" fill="#dc2626" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Maintenance Status Breakdown */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-navy-900">Maintenance Workorders Status</h3>
              <p className="text-xs text-slate-500">Distribution of active workshop tickets</p>
            </div>
            <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              Workshop Load
            </span>
          </div>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={summary?.maintenance_status || []}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                >
                  {(summary?.maintenance_status || []).map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PIE_COLORS[entry.status] || '#64748b'}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: '4px',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => <span className="text-xs text-slate-700">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Middle Grid: Operational Activity & Pending Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Operational Activity */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
          <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ActivityIcon className="w-4 h-4 text-forest-700" />
              <h3 className="text-xs font-bold text-navy-900 uppercase tracking-wider">
                Recent Operational Activity
              </h3>
            </div>
            <span className="text-[11px] text-slate-500">Latest shift entries</span>
          </div>

          <div className="divide-y divide-slate-100">
            {summary?.recent_activities && summary.recent_activities.length > 0 ? (
              summary.recent_activities.map((act) => (
                <div key={`${act.type}-${act.id}`} className="p-3.5 hover:bg-slate-50/60 transition-colors text-xs">
                  <div className="flex items-center justify-between text-slate-500 mb-1">
                    <span className="font-semibold text-slate-700">{act.section}</span>
                    <span className="text-[11px]">
                      {act.date} • {act.shift} Shift
                    </span>
                  </div>
                  <p className="text-slate-800 leading-relaxed">{act.description}</p>
                  <span className="inline-block mt-1 text-[10px] uppercase font-bold text-forest-800 bg-forest-50 px-1.5 py-0.5 rounded border border-forest-200">
                    {act.type}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-slate-400">No recent activity logged</div>
            )}
          </div>
        </div>

        {/* Pending Actions & Unresolved Issues */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
          <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-700" />
              <h3 className="text-xs font-bold text-navy-900 uppercase tracking-wider">
                Pending Actions & Urgent Items
              </h3>
            </div>
            <button
              type="button"
              onClick={() => navigate('/app/issues')}
              className="text-xs text-forest-700 hover:text-forest-900 font-semibold"
            >
              View All →
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {summary?.pending_actions && summary.pending_actions.length > 0 ? (
              summary.pending_actions.map((act) => (
                <div key={`${act.type}-${act.id}`} className="p-3.5 hover:bg-slate-50/60 transition-colors text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-800">{act.section}</span>
                      {act.priority && <PriorityBadge priority={act.priority} />}
                    </div>
                    <StatusBadge status={act.status} />
                  </div>
                  <p className="text-slate-700 text-xs">{act.description}</p>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="capitalize text-slate-500 font-medium">Type: {act.type}</span>
                    <span>Reported: {act.date}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-slate-400">No open pending actions</div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Shift Reports Table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-navy-900">Recent Shift Reports</h3>
            <p className="text-xs text-slate-500">Official logbooks submitted across colliery pits</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/app/reports')}
            className="text-xs font-semibold text-forest-700 hover:text-forest-900"
          >
            Open All Reports Log →
          </button>
        </div>

        <DataTable
          columns={reportColumns}
          data={summary?.recent_reports || []}
          onRowClick={(r) => navigate(`/app/reports/${r.id}`)}
          pageSize={5}
        />
      </div>
    </div>
  );
};

export default DashboardPage;
