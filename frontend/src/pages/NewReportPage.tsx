import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Send,
  Users,
  Wrench,
  Clock,
  ShieldAlert,
  ArrowRightLeft,
  Paperclip,
  UploadCloud,
} from 'lucide-react';
import FileUpload from '../components/FileUpload';
import reportService from '../services/reportService';
import equipmentService from '../services/equipmentService';
import attendanceService from '../services/attendanceService';
import uploadService from '../services/uploadService';
import { useAuth } from '../hooks/useAuth';
import { ExtractedShiftReport } from '../services/reportService';
import {
  WorkCompleted,
  EquipmentBreakdown,
  ProductionDelay,
  Maintenance,
  SafetyObservation,
  Handover,
  Attendance,
  Issue,
  Equipment,
} from '../types';

export const NewReportPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeStep, setActiveStep] = useState<number>(0);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [workflowStage, setWorkflowStage] = useState<'upload' | 'review'>('upload');
  const [extracting, setExtracting] = useState<boolean>(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [sourceFile, setSourceFile] = useState<File | null>(null);

  // Section 1: Report Details
  const [reportDate, setReportDate] = useState<string>('');
  const [shift, setShift] = useState<'Morning' | 'Afternoon' | 'Night' | ''>('');
  const [section, setSection] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Section 2: Work Completed
  const [workCompletedList, setWorkCompletedList] = useState<WorkCompleted[]>([]);

  // Section 3: Equipment Breakdowns
  const [breakdownList, setBreakdownList] = useState<EquipmentBreakdown[]>([]);

  // Section 4: Production Delays
  const [delayList, setDelayList] = useState<ProductionDelay[]>([]);

  // Section 5: Maintenance Requirements
  const [maintenanceList, setMaintenanceList] = useState<Maintenance[]>([]);

  // Section 6: Safety Observations
  const [safetyList, setSafetyList] = useState<SafetyObservation[]>([]);

  // Section 7: Operational Issues
  const [issueList, setIssueList] = useState<Issue[]>([]);

  // Section 8: Shift Handover
  const [handover, setHandover] = useState<Handover>({
    pending_work: '',
    equipment_condition: '',
    unresolved_issues: '',
    instructions: '',
  });

  // Section 9: Workforce Attendance
  const [attendance, setAttendance] = useState<Attendance>({
    report_date: '',
    shift: '',
    section: '',
    total_scheduled: 0,
    present: 0,
    absent: 0,
    remarks: '',
  });

  // Files
  const [files, setFiles] = useState<File[]>([]);
  const [equipmentOptions, setEquipmentOptions] = useState<Equipment[]>([]);
  const [equipmentLoadError, setEquipmentLoadError] = useState<string | null>(null);
  const [existingAttendance, setExistingAttendance] = useState<Attendance | null>(null);
  const [attendanceLookupError, setAttendanceLookupError] = useState<string | null>(null);

  const handleExtractReport = async () => {
    if (!sourceFile) return;
    setExtracting(true);
    setExtractionError(null);
    try {
      const extracted: ExtractedShiftReport = await reportService.extractReport(sourceFile);
      if (typeof extracted.report_date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(extracted.report_date)) {
        setReportDate(extracted.report_date);
      }
      if (extracted.shift === 'Morning' || extracted.shift === 'Afternoon' || extracted.shift === 'Night') {
        setShift(extracted.shift);
      }
      if (typeof extracted.section === 'string' && extracted.section.trim()) {
        setSection(extracted.section.trim());
      }
      setNotes(typeof extracted.notes === 'string' ? extracted.notes : '');
      setWorkCompletedList(extracted.work_completed.map((item) => ({
        description: item.description || '',
        remarks: item.remarks || '',
      })));
      setBreakdownList(extracted.equipment_breakdowns.map((item) => {
        const equipmentName = item.equipment_name?.toLowerCase() || '';
        const equipment = equipmentOptions.find((option) => (
          option.name.toLowerCase() === equipmentName
          || option.equipment_id_tag?.toLowerCase() === equipmentName
          || (option.equipment_id_tag && equipmentName.includes(option.equipment_id_tag.toLowerCase()))
        ));
        return {
          equipment_id: equipment?.id || 0,
          equipment_name: item.equipment_name || '',
          fault_description: item.fault_description || '',
          location: item.location || '',
          status: 'open',
        };
      }));
      setDelayList(extracted.production_delays.map((item) => ({
        affected_activity: item.affected_activity || '',
        ...(typeof item.duration_minutes === 'number' ? { duration_minutes: item.duration_minutes } : {}),
        reason: item.reason || '',
        remarks: item.remarks || '',
      })));
      setMaintenanceList(extracted.maintenance_items.map((item) => {
        const equipmentName = item.equipment_name?.toLowerCase() || '';
        const equipment = equipmentOptions.find((option) => (
          option.name.toLowerCase() === equipmentName
          || option.equipment_id_tag?.toLowerCase() === equipmentName
          || (option.equipment_id_tag && equipmentName.includes(option.equipment_id_tag.toLowerCase()))
        ));
        return {
          equipment_id: equipment?.id || 0,
          equipment_name: item.equipment_name || '',
          requirement: item.requirement || '',
          priority: item.priority || 'medium',
          status: 'open',
          remarks: item.remarks || '',
        };
      }));
      setSafetyList(extracted.safety_observations.map((item) => ({
        hazard_type: item.hazard_type || 'General',
        location: item.location || '',
        description: item.description || '',
        severity: item.severity || 'low',
      })));
      setIssueList(extracted.issues.map((item) => ({
        description: item.description || '',
        section: item.section || extracted.section || section,
        status: 'open',
        date_reported: extracted.report_date || reportDate,
        assigned_to: item.assigned_to || '',
      })));
      setHandover({
        pending_work: extracted.handover?.pending_work || '',
        equipment_condition: extracted.handover?.equipment_condition || '',
        unresolved_issues: extracted.handover?.unresolved_issues || '',
        instructions: extracted.handover?.instructions || '',
      });
      if (extracted.attendance) {
        setAttendance({
          report_date: extracted.report_date || reportDate,
          shift: extracted.shift || shift,
          section: extracted.section || section,
          total_scheduled: extracted.attendance.total_scheduled,
          present: extracted.attendance.present,
          absent: extracted.attendance.absent,
          remarks: extracted.attendance.remarks || '',
        });
      } else {
        setAttendance((previous) => ({
          ...previous,
          total_scheduled: 0,
          present: 0,
          absent: 0,
          remarks: '',
        }));
      }
      setFiles([sourceFile]);
      setActiveStep(0);
      setWorkflowStage('review');
    } catch (reason) {
      setExtractionError(
        reason && typeof reason === 'object' && 'message' in reason
          ? String(reason.message)
          : 'Unable to extract structured data from this report.'
      );
    } finally {
      setExtracting(false);
    }
  };

  useEffect(() => {
    equipmentService.getEquipment()
      .then(setEquipmentOptions)
      .catch((err: { message?: string }) => {
        setEquipmentLoadError(err.message || 'Unable to load equipment options.');
      });
  }, []);

  useEffect(() => {
    let active = true;
    setExistingAttendance(null);
    setAttendanceLookupError(null);
    if (!reportDate || !shift || !section) {
      return () => {
        active = false;
      };
    }
    attendanceService.getAttendance({ date: reportDate, shift, section })
      .then((records) => {
        if (active) setExistingAttendance(records[0] || null);
      })
      .catch((err: { message?: string }) => {
        if (active) setAttendanceLookupError(err.message || 'Unable to check existing attendance.');
      });

    return () => {
      active = false;
    };
  }, [reportDate, shift, section]);

  // Attendance handlers
  const handleScheduledChange = (val: number) => {
    const scheduled = Math.max(0, val);
    const present = Math.min(attendance.present, scheduled);
    const absent = Math.max(0, scheduled - present);
    setAttendance((prev) => ({
      ...prev,
      total_scheduled: scheduled,
      present,
      absent,
    }));
  };

  const handlePresentChange = (val: number) => {
    const present = Math.min(attendance.total_scheduled, Math.max(0, val));
    const scheduled = attendance.total_scheduled;
    const absent = Math.max(0, scheduled - present);
    setAttendance((prev) => ({
      ...prev,
      present,
      absent,
    }));
  };

  const steps = [
    { id: 0, label: 'Report Details', icon: FileText },
    { id: 1, label: 'Work Completed', icon: CheckCircle2 },
    { id: 2, label: 'Breakdowns', icon: AlertCircle },
    { id: 3, label: 'Delays', icon: Clock },
    { id: 4, label: 'Maintenance', icon: Wrench },
    { id: 5, label: 'Safety', icon: ShieldAlert },
    { id: 6, label: 'Issues', icon: AlertCircle },
    { id: 7, label: 'Handover', icon: ArrowRightLeft },
    { id: 8, label: 'Attendance & Files', icon: Users },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (!reportDate) {
      setErrorMessage('Report date is required.');
      setActiveStep(0);
      return;
    }
    if (!shift || !section) {
      setErrorMessage('Shift and mine section are required. Confirm the extracted values or enter them manually.');
      setActiveStep(0);
      return;
    }
    const hasAttendance = attendance.total_scheduled > 0
      || attendance.present > 0
      || attendance.absent > 0;
    if (hasAttendance && attendance.present + attendance.absent !== attendance.total_scheduled) {
      setErrorMessage(
        `Attendance mismatch: Present (${attendance.present}) + Absent (${attendance.absent}) must equal Scheduled (${attendance.total_scheduled}).`
      );
      setActiveStep(8);
      return;
    }

    try {
      setSubmitting(true);

      // Clean work completed
      const cleanedWork = workCompletedList.filter((w) => w.description.trim() !== '');
      const cleanedBreakdowns = breakdownList.filter((b) => b.fault_description.trim() !== '');
      const cleanedDelays = delayList.filter((d) => d.affected_activity.trim() !== '');
      const cleanedMaintenance = maintenanceList.filter((m) => m.requirement.trim() !== '');
      const cleanedSafety = safetyList.filter((s) => s.description.trim() !== '');
      const cleanedIssues = issueList.filter((issue) => issue.description.trim() !== '');
      if (cleanedBreakdowns.some((breakdown) => !breakdown.equipment_id)) {
        setErrorMessage('Select a registered equipment asset for each breakdown.');
        setActiveStep(2);
        return;
      }
      if (cleanedMaintenance.some((item) => !item.equipment_id)) {
        setErrorMessage('Select a registered equipment asset for each maintenance item.');
        setActiveStep(4);
        return;
      }

      const payload = {
        report_date: reportDate,
        shift,
        section,
        submitted_by: user?.name || 'Shift Supervisor',
        status: 'submitted' as const,
        notes,
        work_completed: cleanedWork,
        equipment_breakdowns: cleanedBreakdowns,
        production_delays: cleanedDelays,
        maintenance_items: cleanedMaintenance,
        safety_observations: cleanedSafety,
        issues: cleanedIssues.map((issue) => ({
          ...issue,
          date_reported: reportDate,
          section,
        })),
        handover,
        ...(!existingAttendance && hasAttendance ? {
          attendance: {
            ...attendance,
            report_date: reportDate,
            shift,
            section,
          },
        } : {}),
      };

      const created = await reportService.createReport(payload);

      const failedUploads: string[] = [];
      if (files.length > 0 && created?.id) {
        for (const file of files) {
          try {
            await uploadService.uploadFile(file, created.id);
          } catch (fileError) {
            const message = fileError && typeof fileError === 'object' && 'message' in fileError
              ? String(fileError.message)
              : 'Upload failed';
            failedUploads.push(`${file.name}: ${message}`);
          }
        }
      }

      navigate(`/app/reports/${created.id}`, {
        state: failedUploads.length ? { uploadFailures: failedUploads } : undefined,
      });
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to submit shift report. Please review fields.');
    } finally {
      setSubmitting(false);
    }
  };

  if (workflowStage === 'upload') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-xl font-bold text-navy-900 tracking-tight">New Shift Report</h2>
            <p className="mt-0.5 text-xs text-slate-500">Upload once, extract operational data, then review before saving.</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/app/reports')}
            className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-xs">
          <h3 className="mb-1 flex items-center gap-2 text-sm font-bold text-navy-900">
            <UploadCloud className="h-4 w-4 text-forest-700" />
            Upload shift report
          </h3>
          <p className="mb-4 text-xs text-slate-500">
            MineBrief extracts report details and operational categories. You can review and correct everything before confirming.
          </p>
          {extractionError && (
            <p className="mb-3 rounded border border-red-200 bg-red-50 p-3 text-xs text-red-700" role="alert">
              {extractionError}
            </p>
          )}
          <FileUpload
            files={sourceFile ? [sourceFile] : []}
            onFilesChange={(selected) => {
              setSourceFile(selected[0] || null);
              setExtractionError(null);
            }}
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            maxFiles={1}
            helperText="PDF, JPG, PNG, or WEBP shift report (up to 20 MB)"
          />
          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={handleExtractReport}
              disabled={!sourceFile || extracting}
              className="inline-flex items-center gap-2 rounded bg-forest-800 px-4 py-2 text-xs font-semibold text-white hover:bg-forest-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FileText className="h-4 w-4" />
              {extracting ? 'Extracting report...' : 'Extract report'}
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-navy-900 tracking-tight">New Shift Log Entry</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Review and correct extracted report details before confirming.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setWorkflowStage('upload')}
            className="px-3 py-1.5 text-xs font-semibold text-forest-800 bg-white border border-forest-300 rounded hover:bg-forest-50"
          >
            Replace report
          </button>
          <button
            type="button"
            onClick={() => navigate('/app/reports')}
            className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </div>

      <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-900" role="status">
        Extracted from <strong>{sourceFile?.name}</strong>. Review the sections below; only information in the uploaded report was extracted. Correct missing or inaccurate details before confirming.
      </div>

      {errorMessage && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-md flex items-start gap-2.5 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}
      {equipmentLoadError && (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-xs text-amber-900" role="alert">
          Equipment could not be loaded from the server. Breakdown and maintenance items require a registered asset.
          <span className="block mt-1">{equipmentLoadError}</span>
        </div>
      )}

      {/* Step Indicator Tabs */}
      <div className="bg-white border border-slate-200 rounded-lg p-2 shadow-xs overflow-x-auto">
        <div className="flex items-center min-w-[700px]">
          {steps.map((st, idx) => {
            const Icon = st.icon;
            const isActive = activeStep === idx;
            const isCompleted = activeStep > idx;

            return (
              <button
                key={st.id}
                type="button"
                onClick={() => setActiveStep(idx)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-medium rounded transition-colors ${
                  isActive
                    ? 'bg-forest-800 text-white shadow-2xs font-semibold'
                    : isCompleted
                    ? 'text-forest-900 bg-forest-50/70 hover:bg-forest-100'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{st.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-slate-200 shadow-xs">
        <div className="p-6">
          {/* STEP 0: Report Details */}
          {activeStep === 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-navy-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-forest-700" />
                Shift & Location Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Report Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={reportDate}
                    onChange={(e) => setReportDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-forest-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Shift *
                  </label>
                  <select
                    required
                    value={shift}
                    onChange={(e) => setShift(e.target.value as 'Morning' | 'Afternoon' | 'Night' | '')}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-forest-700"
                  >
                    <option value="">Select shift</option>
                    <option value="Morning">Morning Shift (06:00 - 14:00)</option>
                    <option value="Afternoon">Afternoon Shift (14:00 - 22:00)</option>
                    <option value="Night">Night Shift (22:00 - 06:00)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mine Section *
                  </label>
                  <select
                    required
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-forest-700"
                  >
                    <option value="">Select mine section</option>
                    {section && ![
                      'Open Cast Block A',
                      'Open Cast Block B',
                      'Underground Section 1',
                      'Processing Plant',
                    ].includes(section) && <option value={section}>{section}</option>}
                    <option value="Open Cast Block A">Open Cast Block A</option>
                    <option value="Open Cast Block B">Open Cast Block B</option>
                    <option value="Underground Section 1">Underground Section 1</option>
                    <option value="Processing Plant">Processing Plant</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  General Shift Observations / Weather Notes
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Dry weather conditions, clear visibility. Dust suppression spraying carried out on Ramp 2 at 10:00."
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-forest-700"
                />
              </div>
            </div>
          )}

          {/* STEP 1: Work Completed */}
          {activeStep === 1 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-sm font-bold text-navy-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-forest-700" />
                  Work Completed During Shift
                </h3>
                <button
                  type="button"
                  onClick={() =>
                    setWorkCompletedList([...workCompletedList, { description: '', remarks: '' }])
                  }
                  className="inline-flex items-center gap-1 text-xs font-semibold text-forest-800 hover:text-forest-900 bg-forest-50 px-2.5 py-1 rounded border border-forest-200"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Activity
                </button>
              </div>

              {workCompletedList.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-md space-y-2 relative"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase">
                      Activity #{idx + 1}
                    </span>
                    {workCompletedList.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setWorkCompletedList(workCompletedList.filter((_, i) => i !== idx))
                        }
                        className="text-slate-400 hover:text-red-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Activity Description *
                      </label>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => {
                          const updated = [...workCompletedList];
                          updated[idx].description = e.target.value;
                          setWorkCompletedList(updated);
                        }}
                        placeholder="e.g. Stripped 1,800 cu.m overburden using Shovel EX-04"
                        className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Remarks / Tonnage / Target Reference
                      </label>
                      <input
                        type="text"
                        value={item.remarks || ''}
                        onChange={(e) => {
                          const updated = [...workCompletedList];
                          updated[idx].remarks = e.target.value;
                          setWorkCompletedList(updated);
                        }}
                        placeholder="e.g. 102% of shift target achieved"
                        className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* STEP 2: Equipment Breakdowns */}
          {activeStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-sm font-bold text-navy-900 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  Heavy Machinery Breakdowns & Faults
                </h3>
                <button
                  type="button"
                  onClick={() =>
                    setBreakdownList([
                      ...breakdownList,
                      {
                        equipment_id: 0,
                        equipment_name: '',
                        fault_description: '',
                        location: section,
                        status: 'open',
                      },
                    ])
                  }
                  className="inline-flex items-center gap-1 text-xs font-semibold text-forest-800 hover:text-forest-900 bg-forest-50 px-2.5 py-1 rounded border border-forest-200"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Breakdown
                </button>
              </div>

              {breakdownList.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-md space-y-2 relative"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase">
                      Incident #{idx + 1}
                    </span>
                    {breakdownList.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setBreakdownList(breakdownList.filter((_, i) => i !== idx))
                        }
                        className="text-slate-400 hover:text-red-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Equipment Asset *
                      </label>
                      <select
                        required
                        value={item.equipment_id || ''}
                        onChange={(e) => {
                          const updated = [...breakdownList];
                          const selectedEquipment = equipmentOptions.find(
                            (equipment) => equipment.id === Number(e.target.value)
                          );
                          updated[idx] = {
                            ...updated[idx],
                            equipment_id: selectedEquipment?.id || 0,
                            equipment_name: selectedEquipment?.name || '',
                          };
                          setBreakdownList(updated);
                        }}
                        className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                      >
                        <option value="">Select registered equipment</option>
                        {equipmentOptions.map((equipment) => (
                          <option key={equipment.id} value={equipment.id}>
                            {equipment.equipment_id_tag} — {equipment.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Location / Bench *
                      </label>
                      <input
                        type="text"
                        value={item.location}
                        onChange={(e) => {
                          const updated = [...breakdownList];
                          updated[idx].location = e.target.value;
                          setBreakdownList(updated);
                        }}
                        placeholder="e.g. Pit 1 Bench 4"
                        className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Status
                      </label>
                      <select
                        value={item.status}
                        onChange={(e) => {
                          const updated = [...breakdownList];
                          updated[idx].status = e.target.value as any;
                          setBreakdownList(updated);
                        }}
                        className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                      >
                        <option value="open">Open (Stoppage)</option>
                        <option value="under_review">Under Review</option>
                        <option value="in_progress">In Progress (Workshop)</option>
                        <option value="resolved">Resolved During Shift</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Fault Description & Symptoms
                    </label>
                    <input
                      type="text"
                      value={item.fault_description}
                      onChange={(e) => {
                        const updated = [...breakdownList];
                        updated[idx].fault_description = e.target.value;
                        setBreakdownList(updated);
                      }}
                      placeholder="e.g. Main hydraulic pump line blown out; high temperature alert"
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* STEP 3: Production Delays */}
          {activeStep === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-sm font-bold text-navy-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-700" />
                  Production Stoppages & Delays
                </h3>
                <button
                  type="button"
                  onClick={() =>
                    setDelayList([
                      ...delayList,
                      {
                        affected_activity: 'Hauling / Tipping',
                        duration_minutes: 20,
                        reason: '',
                        remarks: '',
                      },
                    ])
                  }
                  className="inline-flex items-center gap-1 text-xs font-semibold text-forest-800 hover:text-forest-900 bg-forest-50 px-2.5 py-1 rounded border border-forest-200"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Delay
                </button>
              </div>

              {delayList.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-md space-y-2 relative"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase">
                      Delay #{idx + 1}
                    </span>
                    {delayList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setDelayList(delayList.filter((_, i) => i !== idx))}
                        className="text-slate-400 hover:text-red-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Affected Activity *
                      </label>
                      <input
                        type="text"
                        value={item.affected_activity}
                        onChange={(e) => {
                          const updated = [...delayList];
                          updated[idx].affected_activity = e.target.value;
                          setDelayList(updated);
                        }}
                        placeholder="e.g. Dumper hauling / Shovel loading"
                        className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Duration (Minutes)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={item.duration_minutes || ''}
                        onChange={(e) => {
                          const updated = [...delayList];
                          updated[idx].duration_minutes = Number(e.target.value);
                          setDelayList(updated);
                        }}
                        className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Reason / Bottleneck
                      </label>
                      <input
                        type="text"
                        value={item.reason}
                        onChange={(e) => {
                          const updated = [...delayList];
                          updated[idx].reason = e.target.value;
                          setDelayList(updated);
                        }}
                        placeholder="e.g. Blasting clearance delay / Road grading"
                        className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* STEP 4: Maintenance Requirements */}
          {activeStep === 4 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-sm font-bold text-navy-900 flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-forest-700" />
                  Workshop Maintenance Requirements
                </h3>
                <button
                  type="button"
                  onClick={() =>
                    setMaintenanceList([
                      ...maintenanceList,
                      {
                        equipment_id: 0,
                        equipment_name: '',
                        requirement: '',
                        priority: 'medium',
                        status: 'open',
                      },
                    ])
                  }
                  className="inline-flex items-center gap-1 text-xs font-semibold text-forest-800 hover:text-forest-900 bg-forest-50 px-2.5 py-1 rounded border border-forest-200"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Maintenance
                </button>
              </div>

              {maintenanceList.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-md space-y-2 relative"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase">
                      Requirement #{idx + 1}
                    </span>
                    {maintenanceList.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setMaintenanceList(maintenanceList.filter((_, i) => i !== idx))
                        }
                        className="text-slate-400 hover:text-red-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Equipment Name
                      </label>
                      <select
                        required
                        value={item.equipment_id || ''}
                        onChange={(e) => {
                          const updated = [...maintenanceList];
                          const selectedEquipment = equipmentOptions.find(
                            (equipment) => equipment.id === Number(e.target.value)
                          );
                          updated[idx] = {
                            ...updated[idx],
                            equipment_id: selectedEquipment?.id || 0,
                            equipment_name: selectedEquipment?.name || '',
                          };
                          setMaintenanceList(updated);
                        }}
                        className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                      >
                        <option value="">Select registered equipment</option>
                        {equipmentOptions.map((equipment) => (
                          <option key={equipment.id} value={equipment.id}>
                            {equipment.equipment_id_tag} — {equipment.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Priority Level
                      </label>
                      <select
                        value={item.priority}
                        onChange={(e) => {
                          const updated = [...maintenanceList];
                          updated[idx].priority = e.target.value as any;
                          setMaintenanceList(updated);
                        }}
                        className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                      >
                        <option value="low">Low Priority</option>
                        <option value="medium">Medium Priority</option>
                        <option value="high">High Priority</option>
                        <option value="critical">Critical / Immediate Action</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Work Required
                      </label>
                      <input
                        type="text"
                        value={item.requirement}
                        onChange={(e) => {
                          const updated = [...maintenanceList];
                          updated[idx].requirement = e.target.value;
                          setMaintenanceList(updated);
                        }}
                        placeholder="e.g. Track tension adjustment & shoe bolt check"
                        className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* STEP 5: Safety Observations */}
          {activeStep === 5 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-sm font-bold text-navy-900 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-forest-700" />
                  Mine Safety Observations & Hazards (DGMS)
                </h3>
                <button
                  type="button"
                  onClick={() =>
                    setSafetyList([
                      ...safetyList,
                      {
                        hazard_type: 'Berm / Parapet',
                        location: 'Haul Ramp 3',
                        description: '',
                        severity: 'medium',
                      },
                    ])
                  }
                  className="inline-flex items-center gap-1 text-xs font-semibold text-forest-800 hover:text-forest-900 bg-forest-50 px-2.5 py-1 rounded border border-forest-200"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Observation
                </button>
              </div>

              {safetyList.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-md space-y-2 relative"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase">
                      Observation #{idx + 1}
                    </span>
                    {safetyList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setSafetyList(safetyList.filter((_, i) => i !== idx))}
                        className="text-slate-400 hover:text-red-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Hazard Category
                      </label>
                      <input
                        type="text"
                        value={item.hazard_type}
                        onChange={(e) => {
                          const updated = [...safetyList];
                          updated[idx].hazard_type = e.target.value;
                          setSafetyList(updated);
                        }}
                        placeholder="e.g. Geotechnical / Gas / Berm / Electrical"
                        className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Location / Bench
                      </label>
                      <input
                        type="text"
                        value={item.location}
                        onChange={(e) => {
                          const updated = [...safetyList];
                          updated[idx].location = e.target.value;
                          setSafetyList(updated);
                        }}
                        placeholder="e.g. Highwall Section B"
                        className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Severity
                      </label>
                      <select
                        value={item.severity}
                        onChange={(e) => {
                          const updated = [...safetyList];
                          updated[idx].severity = e.target.value as any;
                          setSafetyList(updated);
                        }}
                        className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                      >
                        <option value="low">Low Risk</option>
                        <option value="medium">Medium Warning</option>
                        <option value="high">High Risk</option>
                        <option value="critical">Critical / Stop Work</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Hazard Description & Corrective Steps Taken
                    </label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => {
                        const updated = [...safetyList];
                        updated[idx].description = e.target.value;
                        setSafetyList(updated);
                      }}
                      placeholder="e.g. Loose boulders noticed on Bench 4 crest; area barricaded with warning flags"
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* STEP 6: Operational Issues */}
          {activeStep === 6 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-sm font-bold text-navy-900 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-700" />
                  Operational Issues for Follow-up
                </h3>
                <button
                  type="button"
                  onClick={() =>
                    setIssueList([
                      ...issueList,
                      {
                        description: '',
                        section,
                        status: 'open',
                        date_reported: reportDate,
                      },
                    ])
                  }
                  className="inline-flex items-center gap-1 text-xs font-semibold text-forest-800 hover:text-forest-900 bg-forest-50 px-2.5 py-1 rounded border border-forest-200"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Issue
                </button>
              </div>

              {issueList.map((item, idx) => (
                <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-md space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase">
                      Issue #{idx + 1}
                    </span>
                    {issueList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setIssueList(issueList.filter((_, i) => i !== idx))}
                        className="text-slate-400 hover:text-red-600 p-1"
                        aria-label={`Remove issue ${idx + 1}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Mine Section
                      </label>
                      <input
                        type="text"
                        value={item.section}
                        onChange={(e) => {
                          const updated = [...issueList];
                          updated[idx] = { ...updated[idx], section: e.target.value };
                          setIssueList(updated);
                        }}
                        className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Status
                      </label>
                      <select
                        value={item.status}
                        onChange={(e) => {
                          const updated = [...issueList];
                          updated[idx] = {
                            ...updated[idx],
                            status: e.target.value as Issue['status'],
                          };
                          setIssueList(updated);
                        }}
                        className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                      >
                        <option value="open">Open</option>
                        <option value="under_review">Under Review</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Issue Description
                    </label>
                    <textarea
                      rows={2}
                      value={item.description}
                      onChange={(e) => {
                        const updated = [...issueList];
                        updated[idx] = { ...updated[idx], description: e.target.value };
                        setIssueList(updated);
                      }}
                      placeholder="Record a hazard, infrastructure concern, or unresolved operational issue."
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                    />
                  </div>
                </div>
              ))}
              <p className="text-[11px] text-slate-500">
                Leave descriptions blank for issues that do not apply to this shift.
              </p>
            </div>
          )}

          {/* STEP 7: Shift Handover */}
          {activeStep === 7 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-navy-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-forest-700" />
                Shift Handover Briefing to Incoming In-Charge
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pending / Ongoing Work
                  </label>
                  <textarea
                    rows={3}
                    value={handover.pending_work}
                    onChange={(e) =>
                      setHandover({ ...handover, pending_work: e.target.value })
                    }
                    placeholder="e.g. Bench 3 overburden excavation ongoing. 15 trips dumper haulage remaining to complete current round."
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Machinery & Equipment Condition
                  </label>
                  <textarea
                    rows={3}
                    value={handover.equipment_condition}
                    onChange={(e) =>
                      setHandover({ ...handover, equipment_condition: e.target.value })
                    }
                    placeholder="e.g. Shovel EX-04 under hydraulic repair. 8 dumpers operational and fueled."
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Unresolved Safety / Operational Issues
                  </label>
                  <textarea
                    rows={3}
                    value={handover.unresolved_issues}
                    onChange={(e) =>
                      setHandover({ ...handover, unresolved_issues: e.target.value })
                    }
                    placeholder="e.g. Water accumulation near sump 2 pump. Requires extra hose extension."
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Special Instructions for Next Shift
                  </label>
                  <textarea
                    rows={3}
                    value={handover.instructions}
                    onChange={(e) =>
                      setHandover({ ...handover, instructions: e.target.value })
                    }
                    placeholder="e.g. Prioritize coal extraction from seam 3 once water pump has run 2 hours."
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 8: Workforce Attendance & Attachments */}
          {activeStep === 8 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-navy-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                  <Users className="w-4 h-4 text-forest-700" />
                  Workforce Attendance Verification
                </h3>

                {attendanceLookupError && (
                  <p className="rounded border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900" role="alert">
                    {attendanceLookupError} The server will still validate attendance when this report is submitted.
                  </p>
                )}
                {existingAttendance && (
                  <div className="rounded border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900" role="status">
                    Attendance for {reportDate}, {shift} shift, {section} is already recorded: {existingAttendance.present} present of {existingAttendance.total_scheduled} scheduled ({existingAttendance.absent} absent).
                    This report will not create a duplicate attendance record; the existing workforce record will remain unchanged.
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Total Scheduled Workers *
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={attendance.total_scheduled}
                      onChange={(e) => handleScheduledChange(Number(e.target.value))}
                      disabled={Boolean(existingAttendance)}
                      className="w-full text-sm font-bold px-3 py-1.5 border border-slate-300 rounded bg-white"
                    />
                  </div>

                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded">
                    <label className="block text-xs font-semibold text-emerald-900 mb-1">
                      Workers Present *
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={attendance.total_scheduled}
                      value={attendance.present}
                      onChange={(e) => handlePresentChange(Number(e.target.value))}
                      disabled={Boolean(existingAttendance)}
                      className="w-full text-sm font-bold px-3 py-1.5 border border-emerald-300 rounded bg-white text-emerald-800"
                    />
                  </div>

                  <div className="p-3 bg-slate-100 border border-slate-200 rounded">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Workers Absent (Auto-calculated)
                    </label>
                    <div className="text-sm font-bold py-1.5 text-slate-800">
                      {attendance.absent}
                    </div>
                  </div>
                </div>

                {attendance.present + attendance.absent !== attendance.total_scheduled && (
                  <p className="text-xs text-red-600 font-medium">
                    ⚠️ Validation Error: Present + Absent must equal Total Scheduled!
                  </p>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Attendance Remarks
                  </label>
                  <input
                    type="text"
                    value={attendance.remarks || ''}
                    onChange={(e) =>
                      setAttendance({ ...attendance, remarks: e.target.value })
                    }
                    disabled={Boolean(existingAttendance)}
                    placeholder="e.g. 2 excavator operators absent; replaced with reserve operators from muster"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded bg-white"
                  />
                </div>
              </div>

              {/* Attachments Section */}
              <div className="pt-4 border-t border-slate-200 space-y-3">
                <h3 className="text-sm font-bold text-navy-900 flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-forest-700" />
                  Shift Attachments (Handwritten Logs, Photos, Audio)
                </h3>
                <FileUpload
                  files={files}
                  onFilesChange={setFiles}
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  maxFiles={1}
                  helperText="Upload scanned shift tally sheets, equipment fault photos, or supervisor voice notes"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Buttons */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 rounded-b-lg flex items-center justify-between">
          <button
            type="button"
            disabled={activeStep === 0}
            onClick={() => setActiveStep((p) => Math.max(0, p - 1))}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          <span className="text-xs text-slate-500 font-medium">
            Step {activeStep + 1} of {steps.length}:{' '}
            <strong className="text-slate-700">{steps[activeStep].label}</strong>
          </span>

          {activeStep < steps.length - 1 ? (
            <button
              type="button"
              onClick={() => setActiveStep((p) => Math.min(steps.length - 1, p + 1))}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-forest-800 hover:bg-forest-900 rounded shadow-xs flex items-center gap-1.5"
            >
              Next Section
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-forest-800 hover:bg-forest-900 rounded shadow-xs flex items-center gap-2 disabled:opacity-60"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Saving Report...' : 'Confirm Report'}</span>
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default NewReportPage;
