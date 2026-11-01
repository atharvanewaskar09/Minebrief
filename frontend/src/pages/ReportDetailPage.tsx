import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  User,
  CheckCircle,
  FileText,
  Users,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  ShieldAlert,
  ArrowRightLeft,
  Paperclip,
  File,
  Printer,
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmDialog from '../components/ConfirmDialog';
import reportService from '../services/reportService';
import uploadService from '../services/uploadService';
import { ShiftReport } from '../types';

export const ReportDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const routeState = location.state as { uploadFailures?: string[] } | null;
  const uploadFailures = routeState?.uploadFailures || [];

  const [report, setReport] = useState<ShiftReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState<boolean>(false);
  const [showVerifyConfirm, setShowVerifyConfirm] = useState<boolean>(false);
  const [editValues, setEditValues] = useState<Pick<
    ShiftReport,
    'report_date' | 'shift' | 'section' | 'submitted_by' | 'notes'
  > | null>(null);
  const [savingEdit, setSavingEdit] = useState<boolean>(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [attachmentLinks, setAttachmentLinks] = useState<Record<number, string>>({});
  const [attachmentLinkError, setAttachmentLinkError] = useState<string | null>(null);
  const attachmentLinksRef = useRef<Record<number, string>>({});

  const fetchReport = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await reportService.getReport(Number(id));
      setReport(data);
    } catch (err: any) {
      setReport(null);
      setError(err?.message || `Unable to load report #${id}.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [id]);

  useEffect(() => () => {
    Object.values(attachmentLinksRef.current).forEach((url) => {
      if (url.startsWith('blob:')) URL.revokeObjectURL(url);
    });
  }, []);

  const createAttachmentLink = async (attachmentId: number) => {
    try {
      setAttachmentLinkError(null);
      const url = await uploadService.getAttachmentUrl(attachmentId);
      attachmentLinksRef.current[attachmentId] = url;
      setAttachmentLinks((previous) => ({ ...previous, [attachmentId]: url }));
    } catch (reason) {
      setAttachmentLinkError(
        reason && typeof reason === 'object' && 'message' in reason
          ? String(reason.message)
          : 'Unable to create an authorized attachment link.'
      );
    }
  };

  const handleVerify = async () => {
    if (!id) return;
    try {
      setVerifying(true);
      await reportService.verifyReport(Number(id));
      setShowVerifyConfirm(false);
      // Refresh report
      await fetchReport();
    } catch (err: any) {
      alert(err?.message || 'Failed to verify report');
    } finally {
      setVerifying(false);
    }
  };

  const startEditing = () => {
    if (!report) return;
    setEditError(null);
    setEditValues({
      report_date: report.report_date,
      shift: report.shift,
      section: report.section,
      submitted_by: report.submitted_by,
      notes: report.notes || '',
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!report || !editValues) return;
    try {
      setSavingEdit(true);
      setEditError(null);
      const updated = await reportService.updateReport(report.id, editValues);
      setReport(updated);
      setEditValues(null);
    } catch (err: any) {
      setEditError(err?.message || 'Unable to save report changes.');
    } finally {
      setSavingEdit(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(2) + ' MB';
  };

  if (loading) {
    return <LoadingSpinner message="Fetching shift report records..." size="lg" />;
  }

  if (error || !report) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
        <AlertTriangle className="w-8 h-8 text-amber-600 mx-auto mb-2" />
        <h3 className="text-sm font-bold text-slate-800">Shift Report Not Found</h3>
        <p className="text-xs text-slate-500 mt-1">{error || `Unable to locate report with ID #${id}.`}</p>
        <button
          type="button"
          onClick={fetchReport}
          className="mt-3 mr-3 inline-flex items-center gap-1 text-xs font-semibold text-forest-700 hover:text-forest-800"
        >
          Retry
        </button>
        <Link
          to="/app/reports"
          className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-forest-700 hover:text-forest-800"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to reports register
        </Link>
      </div>
    );
  }

  const attendancePercent = report.attendance?.total_scheduled
    ? Math.round((report.attendance.present / report.attendance.total_scheduled) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Top Navigation & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/app/reports')}
            className="p-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
            title="Back to Reports"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-navy-900 tracking-tight">
                Shift Report #{report.id}
              </h2>
              <StatusBadge status={report.status} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {report.section} • {report.report_date} • {report.shift} Shift
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={startEditing}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50"
          >
            Edit Details
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Report
          </button>

          {report.status === 'submitted' && (
            <button
              type="button"
              onClick={() => setShowVerifyConfirm(true)}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-forest-800 hover:bg-forest-900 rounded shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Verify & Sign Off</span>
            </button>
          )}
        </div>
      </div>

      {uploadFailures.length > 0 && (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-xs text-amber-900" role="alert">
          <p className="font-semibold">Report saved, but some attachments could not be uploaded:</p>
          <ul className="mt-1 list-disc pl-5">
            {uploadFailures.map((failure) => <li key={failure}>{failure}</li>)}
          </ul>
        </div>
      )}

      {/* Meta Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded-lg border border-slate-200 shadow-xs text-xs">
        <div>
          <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
            Report Date
          </span>
          <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            {report.report_date}
          </span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
            Shift Cycle
          </span>
          <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            {report.shift} Shift
          </span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
            Colliery Section
          </span>
          <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            {report.section}
          </span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
            Logged By
          </span>
          <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
            <User className="w-3.5 h-3.5 text-slate-400" />
            {report.submitted_by}
          </span>
        </div>
      </div>

      {editValues && (
        <form onSubmit={handleSaveEdit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-xs">
          <h3 className="text-sm font-bold text-navy-900">Edit Report Details</h3>
          {editError && <p className="text-xs text-red-700" role="alert">{editError}</p>}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="text-xs font-semibold text-slate-700">
              Report Date
              <input
                type="date"
                required
                value={editValues.report_date}
                onChange={(e) => setEditValues({ ...editValues, report_date: e.target.value })}
                className="mt-1 w-full rounded border border-slate-300 px-2.5 py-1.5 font-normal"
              />
            </label>
            <label className="text-xs font-semibold text-slate-700">
              Shift
              <select
                value={editValues.shift}
                onChange={(e) => setEditValues({
                  ...editValues,
                  shift: e.target.value as ShiftReport['shift'],
                })}
                className="mt-1 w-full rounded border border-slate-300 px-2.5 py-1.5 font-normal"
              >
                <option value="Morning">Morning</option>
                <option value="Afternoon">Afternoon</option>
                <option value="Night">Night</option>
              </select>
            </label>
            <label className="text-xs font-semibold text-slate-700">
              Mine Section
              <input
                required
                value={editValues.section}
                onChange={(e) => setEditValues({ ...editValues, section: e.target.value })}
                className="mt-1 w-full rounded border border-slate-300 px-2.5 py-1.5 font-normal"
              />
            </label>
            <label className="text-xs font-semibold text-slate-700">
              Submitted By
              <input
                required
                value={editValues.submitted_by}
                onChange={(e) => setEditValues({ ...editValues, submitted_by: e.target.value })}
                className="mt-1 w-full rounded border border-slate-300 px-2.5 py-1.5 font-normal"
              />
            </label>
          </div>
          <label className="block text-xs font-semibold text-slate-700">
            General Notes
            <textarea
              rows={3}
              value={editValues.notes || ''}
              onChange={(e) => setEditValues({ ...editValues, notes: e.target.value })}
              className="mt-1 w-full rounded border border-slate-300 px-2.5 py-1.5 font-normal"
            />
          </label>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setEditValues(null)} className="rounded border border-slate-300 px-3 py-1.5 text-xs">
              Cancel
            </button>
            <button type="submit" disabled={savingEdit} className="rounded bg-forest-800 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60">
              {savingEdit ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      )}

      {report.verified_by && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>
              <strong>Verified & Signed Off by:</strong> {report.verified_by}
            </span>
          </div>
          {report.verified_at && (
            <span className="text-emerald-700 text-[11px] font-mono">
              Signed: {new Date(report.verified_at).toLocaleString()}
            </span>
          )}
        </div>
      )}

      {/* 1. Overview & General Notes */}
      {report.notes && (
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs">
          <h3 className="text-xs font-bold text-navy-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-forest-700" />
            General Notes & Observations
          </h3>
          <p className="text-xs text-slate-700 leading-relaxed bg-slate-50/70 p-3 rounded border border-slate-200">
            {report.notes}
          </p>
        </div>
      )}

      {/* 2. Workforce Attendance */}
      {report.attendance && (
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold text-navy-900 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-4 h-4 text-forest-700" />
              Workforce Attendance Muster
            </h3>
            <span className="text-xs font-bold text-forest-800 bg-forest-50 px-2 py-0.5 rounded border border-forest-200">
              {attendancePercent}% Attendance
            </span>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-slate-50 rounded border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Scheduled
              </span>
              <span className="text-xl font-bold text-navy-900">
                {report.attendance.total_scheduled}
              </span>
            </div>
            <div className="p-3 bg-emerald-50 rounded border border-emerald-200">
              <span className="text-[10px] uppercase font-bold text-emerald-700 block">
                Present
              </span>
              <span className="text-xl font-bold text-emerald-800">
                {report.attendance.present}
              </span>
            </div>
            <div className="p-3 bg-red-50 rounded border border-red-200">
              <span className="text-[10px] uppercase font-bold text-red-700 block">Absent</span>
              <span className="text-xl font-bold text-red-800">{report.attendance.absent}</span>
            </div>
          </div>

          {report.attendance.remarks && (
            <p className="mt-3 text-xs text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-200">
              <strong className="text-slate-800">Remarks:</strong> {report.attendance.remarks}
            </p>
          )}
        </div>
      )}

      {/* 3. Work Completed */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs">
        <h3 className="text-xs font-bold text-navy-900 uppercase tracking-wider mb-3 border-b border-slate-100 pb-2 flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-forest-700" />
          Work Completed During Shift
        </h3>
        {report.work_completed && report.work_completed.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {report.work_completed.map((item, idx) => (
              <div key={idx} className="py-2.5 flex items-start justify-between text-xs gap-4">
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-forest-50 text-forest-800 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5 border border-forest-200">
                    {idx + 1}
                  </span>
                  <div>
                    <p className="font-semibold text-slate-800">{item.description}</p>
                    {item.remarks && (
                      <p className="text-[11px] text-slate-500 mt-0.5">{item.remarks}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">No specific work entries logged.</p>
        )}
      </div>

      {/* 4. Equipment Breakdowns & Maintenance in 2-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Breakdowns */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs">
          <h3 className="text-xs font-bold text-navy-900 uppercase tracking-wider mb-3 border-b border-slate-100 pb-2 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            Equipment Breakdowns
          </h3>
          {report.equipment_breakdowns && report.equipment_breakdowns.length > 0 ? (
            <div className="space-y-3">
              {report.equipment_breakdowns.map((b, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-red-50/40 border border-red-200 rounded text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">
                      {b.equipment_name || `Equipment #${b.equipment_id}`}
                    </span>
                    <StatusBadge status={b.status} />
                  </div>
                  <p className="text-slate-700">{b.fault_description}</p>
                  <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-red-200/60">
                    <span>Location: {b.location}</span>
                    {b.reported_time && <span>Time: {b.reported_time}</span>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">No equipment breakdowns reported.</p>
          )}
        </div>

        {/* Maintenance Requirements */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs">
          <h3 className="text-xs font-bold text-navy-900 uppercase tracking-wider mb-3 border-b border-slate-100 pb-2 flex items-center gap-1.5">
            <Wrench className="w-4 h-4 text-forest-700" />
            Maintenance Items
          </h3>
          {report.maintenance_items && report.maintenance_items.length > 0 ? (
            <div className="space-y-3">
              {report.maintenance_items.map((m, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 border border-slate-200 rounded text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">
                      {m.equipment_name || `Asset #${m.equipment_id}`}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <PriorityBadge priority={m.priority} />
                      <StatusBadge status={m.status} />
                    </div>
                  </div>
                  <p className="text-slate-700">{m.requirement}</p>
                  {m.remarks && (
                    <p className="text-[11px] text-slate-500 italic">Note: {m.remarks}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">No open maintenance tickets generated.</p>
          )}
        </div>
      </div>

      {/* 5. Production Delays & Safety Observations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Delays */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs">
          <h3 className="text-xs font-bold text-navy-900 uppercase tracking-wider mb-3 border-b border-slate-100 pb-2 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-amber-700" />
            Production Delays & Stoppages
          </h3>
          {report.production_delays && report.production_delays.length > 0 ? (
            <div className="space-y-3">
              {report.production_delays.map((d, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-amber-50/30 border border-amber-200 rounded text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">{d.affected_activity}</span>
                    <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                      {d.duration_minutes || 0} mins
                    </span>
                  </div>
                  <p className="text-slate-700">Reason: {d.reason}</p>
                  {d.remarks && <p className="text-[11px] text-slate-500">{d.remarks}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">No production stoppages logged.</p>
          )}
        </div>

        {/* Safety Observations */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs">
          <h3 className="text-xs font-bold text-navy-900 uppercase tracking-wider mb-3 border-b border-slate-100 pb-2 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-forest-700" />
            Safety Observations & Hazards
          </h3>
          {report.safety_observations && report.safety_observations.length > 0 ? (
            <div className="space-y-3">
              {report.safety_observations.map((s, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 border border-slate-200 rounded text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">{s.hazard_type}</span>
                    <PriorityBadge priority={s.severity} />
                  </div>
                  <p className="text-slate-700">{s.description}</p>
                  <p className="text-[11px] text-slate-400">Location: {s.location}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">No safety violations or hazards noted.</p>
          )}
        </div>
      </div>

      {/* 6. Handover Details */}
      {report.handover && (
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs">
          <h3 className="text-xs font-bold text-navy-900 uppercase tracking-wider mb-3 border-b border-slate-100 pb-2 flex items-center gap-1.5">
            <ArrowRightLeft className="w-4 h-4 text-forest-700" />
            Shift Handover Briefing
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded border border-slate-200">
              <span className="font-semibold text-slate-700 block mb-1">
                Pending / Continuous Operations:
              </span>
              <p className="text-slate-600 leading-relaxed">
                {report.handover.pending_work || 'None specified'}
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded border border-slate-200">
              <span className="font-semibold text-slate-700 block mb-1">
                Equipment Availability Status:
              </span>
              <p className="text-slate-600 leading-relaxed">
                {report.handover.equipment_condition || 'All fleet functional'}
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded border border-slate-200">
              <span className="font-semibold text-slate-700 block mb-1">
                Unresolved Field Issues:
              </span>
              <p className="text-slate-600 leading-relaxed">
                {report.handover.unresolved_issues || 'None'}
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded border border-slate-200">
              <span className="font-semibold text-slate-700 block mb-1">
                Instructions for Next Shift Supervisor:
              </span>
              <p className="text-slate-600 leading-relaxed">
                {report.handover.instructions || 'Standard operating procedures'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Operational Issues */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs">
        <h3 className="text-xs font-bold text-navy-900 uppercase tracking-wider mb-3 border-b border-slate-100 pb-2 flex items-center gap-1.5">
          <AlertTriangle className="w-4 h-4 text-amber-700" />
          Operational Issues ({report.issues?.length || 0})
        </h3>
        {report.issues && report.issues.length > 0 ? (
          <div className="space-y-2">
            {report.issues.map((issue) => (
              <div key={issue.id} className="rounded border border-slate-200 bg-slate-50 p-3 text-xs">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="font-semibold text-slate-800">{issue.section}</span>
                  <StatusBadge status={issue.status} />
                </div>
                <p className="text-slate-700">{issue.description}</p>
                {issue.assigned_to && (
                  <p className="mt-1 text-[11px] text-slate-500">Assigned to: {issue.assigned_to}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">No operational issues were recorded.</p>
        )}
      </div>

      {/* Attachments */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs">
        <h3 className="text-xs font-bold text-navy-900 uppercase tracking-wider mb-3 border-b border-slate-100 pb-2 flex items-center gap-1.5">
          <Paperclip className="w-4 h-4 text-forest-700" />
          Shift Documentation & Attachments ({report.attachments?.length || 0})
        </h3>
        {report.attachments && report.attachments.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {attachmentLinkError && (
              <p className="sm:col-span-2 text-xs text-red-700" role="alert">{attachmentLinkError}</p>
            )}
            {report.attachments.map((att) => (
              <div key={att.id} className="p-3 bg-slate-50 border border-slate-200 rounded text-xs">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="w-8 h-8 rounded bg-forest-100 text-forest-800 flex items-center justify-center shrink-0">
                    <File className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <p className="font-semibold text-slate-800 truncate">{att.original_name}</p>
                    <p className="text-[10px] text-slate-400">
                      {formatFileSize(att.file_size)} • {att.file_type}
                    </p>
                  </div>
                </div>
                {attachmentLinks[att.id] ? (
                  <a
                    href={attachmentLinks[att.id]}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex font-semibold text-forest-800 underline"
                  >
                    Open attachment
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => createAttachmentLink(att.id)}
                    className="mt-2 font-semibold text-forest-800 underline"
                  >
                    Create secure link
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">No attachments attached to this shift report.</p>
        )}
      </div>

      {/* Verify Confirm Dialog */}
      <ConfirmDialog
        isOpen={showVerifyConfirm}
        title="Verify and Sign Off Shift Report"
        message={`Are you sure you want to verify Report #${report.id} for ${report.section} (${report.shift} Shift)? This will mark the report as officially signed off in accordance with colliery operating procedure.`}
        confirmText="Verify & Sign Off"
        variant="primary"
        isLoading={verifying}
        onConfirm={handleVerify}
        onCancel={() => setShowVerifyConfirm(false)}
      />
    </div>
  );
};

export default ReportDetailPage;
