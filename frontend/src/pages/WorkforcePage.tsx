import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  UserCheck,
  UserX,
  Percent,
  Plus,
  Calendar,
  Filter,
  RotateCcw,
  X,
  CheckCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import StatCard from '../components/StatCard';
import DataTable, { Column } from '../components/DataTable';
import LoadingSpinner from '../components/LoadingSpinner';
import attendanceService, { AttendanceFilters } from '../services/attendanceService';
import { Attendance } from '../types';

export const WorkforcePage: React.FC = () => {
  const [records, setRecords] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [shiftFilter, setShiftFilter] = useState<string>('');
  const [sectionFilter, setSectionFilter] = useState<string>('');

  // Add Attendance Modal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalDate, setModalDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [modalShift, setModalShift] = useState<string>('Morning');
  const [modalSection, setModalSection] = useState<string>('Open Cast Block A');
  const [modalScheduled, setModalScheduled] = useState<number>(40);
  const [modalPresent, setModalPresent] = useState<number>(38);
  const [modalAbsent, setModalAbsent] = useState<number>(2);
  const [modalRemarks, setModalRemarks] = useState<string>('');
  const [modalError, setModalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      setError(null);
      const filters: AttendanceFilters = {};
      if (dateFrom) filters.start_date = dateFrom;
      if (dateTo) filters.end_date = dateTo;
      if (shiftFilter) filters.shift = shiftFilter;
      if (sectionFilter) filters.section = sectionFilter;

      const data = await attendanceService.getAttendance(filters);
      setRecords(data || []);
    } catch (err: any) {
      setRecords([]);
      setError(err?.message || 'Unable to load attendance records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [dateFrom, dateTo, shiftFilter, sectionFilter]);

  // Aggregate stats
  const totals = useMemo(() => {
    const scheduled = records.reduce((acc, r) => acc + (r.total_scheduled || 0), 0);
    const present = records.reduce((acc, r) => acc + (r.present || 0), 0);
    const absent = records.reduce((acc, r) => acc + (r.absent || 0), 0);
    const rate = scheduled > 0 ? Math.round((present / scheduled) * 100) : 0;
    return { scheduled, present, absent, rate };
  }, [records]);

  // Trend Chart Data
  const trendData = useMemo(() => {
    const dateMap: Record<string, { present: number; scheduled: number }> = {};
    records.forEach((r) => {
      if (!dateMap[r.report_date]) {
        dateMap[r.report_date] = { present: 0, scheduled: 0 };
      }
      dateMap[r.report_date].present += r.present || 0;
      dateMap[r.report_date].scheduled += r.total_scheduled || 0;
    });

    return Object.keys(dateMap)
      .sort()
      .map((dt) => ({
        date: dt.slice(5),
        present: dateMap[dt].present,
        scheduled: dateMap[dt].scheduled,
      }));
  }, [records]);

  // Shift Comparison Chart Data
  const shiftData = useMemo(() => {
    const map: Record<string, { present: number; absent: number }> = {
      Morning: { present: 0, absent: 0 },
      Afternoon: { present: 0, absent: 0 },
      Night: { present: 0, absent: 0 },
    };
    records.forEach((r) => {
      const sh = r.shift || 'Morning';
      if (map[sh]) {
        map[sh].present += r.present || 0;
        map[sh].absent += r.absent || 0;
      }
    });

    return Object.keys(map).map((k) => ({
      shift: k,
      present: map[k].present,
      absent: map[k].absent,
    }));
  }, [records]);

  // Modal handlers
  const handleScheduledChange = (val: number) => {
    const s = Math.max(0, val);
    const p = Math.min(modalPresent, s);
    setModalScheduled(s);
    setModalPresent(p);
    setModalAbsent(s - p);
  };

  const handlePresentChange = (val: number) => {
    const p = Math.min(modalScheduled, Math.max(0, val));
    const s = modalScheduled;
    setModalPresent(p);
    setModalAbsent(Math.max(0, s - p));
  };

  const handleCreateAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (modalPresent + modalAbsent !== modalScheduled) {
      setModalError(
        `Present (${modalPresent}) + Absent (${modalAbsent}) must equal Scheduled (${modalScheduled}).`
      );
      return;
    }

    try {
      setIsSubmitting(true);
      await attendanceService.createAttendance({
        report_date: modalDate,
        shift: modalShift,
        section: modalSection,
        total_scheduled: modalScheduled,
        present: modalPresent,
        absent: modalAbsent,
        remarks: modalRemarks,
      });
      setIsModalOpen(false);
      await fetchAttendance();
    } catch (err: any) {
      setModalError(err?.message || 'Failed to record attendance');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: Column<Attendance>[] = [
    {
      key: 'report_date',
      header: 'Date',
      sortable: true,
      render: (r) => <span className="font-semibold text-slate-800">{r.report_date}</span>,
    },
    {
      key: 'shift',
      header: 'Shift',
      sortable: true,
      render: (r) => (
        <span className="px-2 py-0.5 rounded text-xs bg-slate-100 font-medium text-slate-700">
          {r.shift}
        </span>
      ),
    },
    {
      key: 'section',
      header: 'Colliery Section',
      sortable: true,
      render: (r) => <span className="text-slate-800">{r.section}</span>,
    },
    {
      key: 'total_scheduled',
      header: 'Scheduled',
      sortable: true,
      render: (r) => <span className="text-slate-700 font-mono">{r.total_scheduled}</span>,
    },
    {
      key: 'present',
      header: 'Present',
      sortable: true,
      render: (r) => (
        <span className="text-emerald-700 font-bold font-mono">{r.present}</span>
      ),
    },
    {
      key: 'absent',
      header: 'Absent',
      sortable: true,
      render: (r) => (
        <span
          className={`font-mono ${
            r.absent > 0 ? 'text-red-600 font-semibold' : 'text-slate-400'
          }`}
        >
          {r.absent}
        </span>
      ),
    },
    {
      key: 'rate',
      header: 'Attendance %',
      sortable: true,
      render: (r) => {
        const pct = r.total_scheduled
          ? Math.round((r.present / r.total_scheduled) * 100)
          : 0;
        return (
          <span
            className={`font-semibold ${
              pct >= 90 ? 'text-emerald-700' : pct >= 80 ? 'text-amber-700' : 'text-red-600'
            }`}
          >
            {pct}%
          </span>
        );
      },
    },
    {
      key: 'remarks',
      header: 'Remarks',
      render: (r) => <span className="text-slate-500 truncate max-w-xs block">{r.remarks || '—'}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Title & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-navy-900 tracking-tight">Workforce Attendance</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Muster roll verification, shift deployment headcounts, and absentee analysis
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 text-xs font-semibold text-white bg-forest-800 hover:bg-forest-900 rounded-md shadow-xs transition-colors flex items-center justify-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Attendance Record</span>
        </button>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800" role="alert">
          <span>{error}</span>
          <button type="button" onClick={fetchAttendance} className="ml-3 font-semibold underline">
            Retry
          </button>
        </div>
      )}

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          label="Total Scheduled"
          value={totals.scheduled}
          icon={Users}
          iconColor="text-slate-700"
          iconBg="bg-slate-100 border-slate-200"
          subtext="Total workforce deployed across filter"
        />
        <StatCard
          label="Total Present"
          value={totals.present}
          icon={UserCheck}
          iconColor="text-emerald-700"
          iconBg="bg-emerald-50 border-emerald-100"
          subtext="Confirmed physically on colliery muster"
        />
        <StatCard
          label="Total Absent"
          value={totals.absent}
          icon={UserX}
          iconColor="text-red-600"
          iconBg="bg-red-50 border-red-100"
          subtext="Unscheduled & approved leaves"
        />
        <StatCard
          label="Overall Attendance %"
          value={`${totals.rate}%`}
          icon={Percent}
          iconColor="text-forest-700"
          iconBg="bg-forest-50 border-forest-100"
          subtext="Colliery statutory compliance threshold: 85%"
        />
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-1.5 text-slate-500 font-medium">
          <Filter className="w-4 h-4 text-slate-400" />
          <span>Filter Records:</span>
        </div>

        <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="text-xs text-slate-700 bg-transparent outline-none"
            title="Date from"
          />
          <span className="text-slate-400">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="text-xs text-slate-700 bg-transparent outline-none"
            title="Date to"
          />
        </div>

        <select
          value={shiftFilter}
          onChange={(e) => setShiftFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-700 outline-none"
        >
          <option value="">All Shifts</option>
          <option value="Morning">Morning</option>
          <option value="Afternoon">Afternoon</option>
          <option value="Night">Night</option>
        </select>

        <select
          value={sectionFilter}
          onChange={(e) => setSectionFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-700 outline-none"
        >
          <option value="">All Sections</option>
          <option value="Open Cast Block A">Open Cast Block A</option>
          <option value="Open Cast Block B">Open Cast Block B</option>
          <option value="Underground Section 1">Underground Section 1</option>
          <option value="Processing Plant">Processing Plant</option>
        </select>

        {(dateFrom || dateTo || shiftFilter || sectionFilter) && (
          <button
            type="button"
            onClick={() => {
              setDateFrom('');
              setDateTo('');
              setShiftFilter('');
              setSectionFilter('');
            }}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-600 px-2 py-1 rounded hover:bg-slate-100 transition-colors ml-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Chart */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs">
          <h3 className="text-sm font-bold text-navy-900 mb-1">Attendance Trend by Date</h3>
          <p className="text-xs text-slate-500 mb-4">Scheduled vs present workforce headcounts</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="wfPresent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#15803d" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#15803d" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
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
                  dataKey="present"
                  name="Workers Present"
                  stroke="#15803d"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#wfPresent)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Shift Comparison Chart */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs">
          <h3 className="text-sm font-bold text-navy-900 mb-1">Shift Headcount Comparison</h3>
          <p className="text-xs text-slate-500 mb-4">Present vs absent ratio across daily shifts</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={shiftData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="shift" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
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
                  verticalAlign="top"
                  height={30}
                  formatter={(val) => <span className="text-xs text-slate-700 capitalize">{val}</span>}
                />
                <Bar dataKey="present" name="Present" fill="#15803d" radius={[3, 3, 0, 0]} />
                <Bar dataKey="absent" name="Absent" fill="#dc2626" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Attendance Log Table */}
      <div className="space-y-2">
        <h3 className="text-sm font-bold text-navy-900">Muster Register Logs</h3>
        {loading ? (
          <LoadingSpinner message="Loading workforce registers..." size="md" />
        ) : (
          <DataTable
            columns={columns}
            data={records}
            pageSize={10}
            emptyTitle="No Attendance Logs Found"
            emptyDescription="There are no attendance logs matching your criteria."
          />
        )}
      </div>

      {/* Modal: Add Attendance Record */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-lg max-w-lg w-full shadow-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-navy-900">Add Shift Attendance Record</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAttendance} className="p-5 space-y-4">
              {modalError && (
                <div className="text-xs text-red-600 bg-red-50 border border-red-200 p-2.5 rounded">
                  {modalError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={modalDate}
                    onChange={(e) => setModalDate(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Shift *
                  </label>
                  <select
                    value={modalShift}
                    onChange={(e) => setModalShift(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded"
                  >
                    <option value="Morning">Morning Shift</option>
                    <option value="Afternoon">Afternoon Shift</option>
                    <option value="Night">Night Shift</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Section *
                </label>
                <select
                  value={modalSection}
                  onChange={(e) => setModalSection(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded"
                >
                  <option value="Open Cast Block A">Open Cast Block A</option>
                  <option value="Open Cast Block B">Open Cast Block B</option>
                  <option value="Underground Section 1">Underground Section 1</option>
                  <option value="Processing Plant">Processing Plant</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Scheduled *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={modalScheduled}
                    onChange={(e) => handleScheduledChange(Number(e.target.value))}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-emerald-800 mb-1">
                    Present *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={modalPresent}
                    onChange={(e) => handlePresentChange(Number(e.target.value))}
                    className="w-full text-xs px-2.5 py-1.5 border border-emerald-300 rounded font-bold text-emerald-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-red-800 mb-1">Absent</label>
                  <div className="text-xs px-2.5 py-2 border border-slate-200 bg-slate-100 rounded font-bold text-red-700">
                    {modalAbsent}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Remarks</label>
                <input
                  type="text"
                  value={modalRemarks}
                  onChange={(e) => setModalRemarks(e.target.value)}
                  placeholder="e.g. Muster taken at shift start by Supervisor"
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-forest-800 hover:bg-forest-900 rounded disabled:opacity-60"
                >
                  {isSubmitting ? 'Saving...' : 'Save Muster Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkforcePage;
