import React, { useState } from 'react';
import {
  User,
  Shield,
  RotateCcw,
  Building2,
  Bell,
  Sliders,
  Info,
  CheckCircle2,
  Layers,
  Database,
  ExternalLink,
} from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';
import { useAuth } from '../hooks/useAuth';
import demoService from '../services/demoService';

export const SettingsPage: React.FC = () => {
  const { user, isDemo, exitDemo } = useAuth();

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  // Preference placeholders
  const [voiceTranscription, setVoiceTranscription] = useState(true);
  const [autoOcr, setAutoOcr] = useState(true);
  const [shiftAlerts, setShiftAlerts] = useState(true);
  const [emailDigest, setEmailDigest] = useState(false);

  const handleResetDemoData = async () => {
    try {
      setResetting(true);
      setResetError(null);
      await demoService.resetDemo();
      setShowResetConfirm(false);
      setResetSuccess(true);
      setTimeout(() => setResetSuccess(false), 5000);
    } catch (err: any) {
      setResetError(err?.message || 'Unable to reset demo data.');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="pb-2 border-b border-slate-200">
        <h2 className="text-xl font-bold text-navy-900 tracking-tight">Workspace Settings</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          User colliery profile, colliery workspace details, and system processing preferences
        </p>
      </div>

      {resetSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 rounded-md flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Demo database has been successfully reset to initial seed state.</span>
        </div>
      )}
      {resetError && (
        <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-800 rounded-md" role="alert">
          {resetError}
        </div>
      )}

      {/* 1. User Profile */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-2xs space-y-4">
        <h3 className="text-xs font-bold text-navy-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
          <User className="w-4 h-4 text-forest-700" />
          User Profile
        </h3>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-forest-800 text-white flex items-center justify-center font-bold text-xl shrink-0">
            {user?.name ? user.name.charAt(0) : 'U'}
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-navy-900">{user?.name || 'Authorized Operator'}</h4>
            <p className="text-xs text-slate-500">{user?.email || 'operator@rajmahal.coal.in'}</p>
            <div className="flex items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-forest-800 bg-forest-50 px-2 py-0.5 rounded border border-forest-200 capitalize">
                <Shield className="w-3 h-3" />
                Role: {user?.role || 'Shift Supervisor'}
              </span>
              <span className="text-[11px] text-slate-400">DGMS Authorized</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Workspace & Colliery Details */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-2xs space-y-4">
        <h3 className="text-xs font-bold text-navy-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
          <Building2 className="w-4 h-4 text-forest-700" />
          Mine Workspace Details
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded border border-slate-200">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Colliery Project</span>
            <span className="font-bold text-slate-800 text-sm">Rajmahal Open Cast Project</span>
            <p className="text-[11px] text-slate-500 mt-0.5">Eastern Coalfields Limited (ECL), Coal India Ltd.</p>
          </div>

          <div className="p-3 bg-slate-50 rounded border border-slate-200">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Geographic Location</span>
            <span className="font-bold text-slate-800 text-sm">Godda District, Jharkhand</span>
            <p className="text-[11px] text-slate-500 mt-0.5">Mine Code: ECL-RJ-04 • Latitude: 25.04°N, 87.38°E</p>
          </div>

          <div className="p-3 bg-slate-50 rounded border border-slate-200">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Registered Active Pits</span>
            <span className="font-semibold text-slate-800">Open Cast Block A, Open Cast Block B, Underground Section 1</span>
          </div>

          <div className="p-3 bg-slate-50 rounded border border-slate-200">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Processing Facilities</span>
            <span className="font-semibold text-slate-800">Rajmahal Processing Plant and associated material-handling assets</span>
          </div>
        </div>
      </div>

      {/* 3. Demo Workspace Management */}
      {isDemo && (
        <div className="bg-amber-50/60 rounded-lg border border-amber-200 p-6 shadow-2xs space-y-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-2">
                <Database className="w-4 h-4 text-amber-800" />
                Demo Sandbox Environment
              </h3>
              <p className="text-xs text-amber-800 leading-relaxed max-w-xl">
                You are currently working in the Rajmahal sandbox workspace. You can reset all sample
                records, breakdowns, and muster logs back to their original state at any time.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded shadow-2xs transition-colors flex items-center gap-1.5 shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Demo Data</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. Processing & OCR Preferences (Placeholders) */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-2xs space-y-4">
        <h3 className="text-xs font-bold text-navy-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
          <Sliders className="w-4 h-4 text-forest-700" />
          Shift Parsing & Audio Ingestion Preferences
        </h3>

        <div className="space-y-3 text-xs">
          <label className="flex items-center justify-between p-2 rounded hover:bg-slate-50 cursor-pointer">
            <div>
              <p className="font-semibold text-slate-800">Automatic Audio Transcription</p>
              <p className="text-[11px] text-slate-500">
                Transcribe spoken Hindi and English shift supervisor audio updates into text notes
              </p>
            </div>
            <input
              type="checkbox"
              checked={voiceTranscription}
              onChange={(e) => setVoiceTranscription(e.target.checked)}
              className="rounded border-slate-300 text-forest-700 focus:ring-forest-700 h-4 w-4"
            />
          </label>

          <label className="flex items-center justify-between p-2 rounded hover:bg-slate-50 cursor-pointer">
            <div>
              <p className="font-semibold text-slate-800">OCR Scanned Sheet Table Extraction</p>
              <p className="text-[11px] text-slate-500">
                Parse photographed physical shift tally sheets into structured muster table rows
              </p>
            </div>
            <input
              type="checkbox"
              checked={autoOcr}
              onChange={(e) => setAutoOcr(e.target.checked)}
              className="rounded border-slate-300 text-forest-700 focus:ring-forest-700 h-4 w-4"
            />
          </label>

          <label className="flex items-center justify-between p-2 rounded hover:bg-slate-50 cursor-pointer">
            <div>
              <p className="font-semibold text-slate-800">Urgent Breakdown Alert Notifications</p>
              <p className="text-[11px] text-slate-500">
                Trigger high-priority alert on excavator and truck stoppages exceeding 30 minutes
              </p>
            </div>
            <input
              type="checkbox"
              checked={shiftAlerts}
              onChange={(e) => setShiftAlerts(e.target.checked)}
              className="rounded border-slate-300 text-forest-700 focus:ring-forest-700 h-4 w-4"
            />
          </label>
        </div>
      </div>

      {/* 5. About Platform */}
      <div className="bg-slate-50 rounded-lg border border-slate-200 p-5 text-xs text-slate-600 flex items-start gap-3">
        <div className="p-2 rounded bg-white border border-slate-200 shrink-0">
          <Layers className="w-5 h-5 text-forest-800" />
        </div>
        <div className="space-y-1">
          <h4 className="font-bold text-navy-900 text-sm">MineBrief v1.0 — Operational Reporting Platform</h4>
          <p className="leading-relaxed">
            Enterprise shift intelligence system for mining engineering, fleet telemetry, and statutory
            handover audit compliance. Built for coal mines, mineral extraction collieries, and washeries.
          </p>
          <p className="text-[11px] text-slate-400 pt-1">
            Designed for DGMS compliance • Coal India Ltd. standard shift formats
          </p>
        </div>
      </div>

      {/* Reset Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showResetConfirm}
        title="Reset Demo Data"
        message="Are you sure you want to restore the Rajmahal Coal Mine demo data? All recently added test shift reports, attachments, and modified breakdowns will be reset to their factory state."
        confirmText="Reset Database"
        variant="warning"
        isLoading={resetting}
        onConfirm={handleResetDemoData}
        onCancel={() => setShowResetConfirm(false)}
      />
    </div>
  );
};

export default SettingsPage;
