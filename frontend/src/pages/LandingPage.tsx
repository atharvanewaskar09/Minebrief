import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Layers,
  FileText,
  Users,
  Wrench,
  Search,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  ClipboardCheck,
  BarChart3,
  Building2,
  Lock,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { enterDemo } = useAuth();

  const handleExploreDemo = () => {
    enterDemo();
    navigate('/app/dashboard');
  };

  return (
    <div className="min-h-screen bg-white text-navy-900 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-forest-800 flex items-center justify-center text-white shadow-xs">
              <Layers className="w-4 h-4 text-forest-200" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-tight text-navy-900 leading-none">
                MineBrief
              </span>
              <span className="text-[10px] text-slate-500 font-medium tracking-wide mt-0.5">
                OPERATIONS PLATFORM
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-navy-900 border border-slate-300 rounded hover:bg-slate-50 transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="hidden sm:inline-flex px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-navy-900 border border-slate-300 rounded hover:bg-slate-50 transition-colors"
            >
              Create Account
            </Link>
            <button
              type="button"
              onClick={handleExploreDemo}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-forest-800 hover:bg-forest-900 rounded shadow-xs transition-colors flex items-center gap-1.5"
            >
              <span>Explore Demo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-slate-50 border-b border-slate-200 py-16 sm:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-50 border border-forest-200 text-forest-800 text-xs font-medium mb-6">
            <ShieldCheck className="w-4 h-4 text-forest-700" />
            <span>Standardized Coal Mine Shift Intelligence</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-navy-900 tracking-tight leading-tight">
            From scattered mine reports to complete operational visibility.
          </h1>

          <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Consolidate hand-written shift logs, voice memos, equipment breakdowns, and attendance
            registers into unified, auditable shift reports. Built specifically for open-cast and
            underground coal mining operations.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleExploreDemo}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-forest-800 hover:bg-forest-900 rounded-md shadow transition-colors flex items-center gap-2"
            >
              <span>Explore Demo Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <Link
              to="/login"
              className="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-100 transition-colors"
            >
              Sign In to Your Workspace
            </Link>
            <Link
              to="/signup"
              className="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-100 transition-colors"
            >
              Create Account
            </Link>
          </div>

          <div className="mt-10 pt-8 border-t border-slate-200 flex flex-wrap items-center justify-center gap-8 text-xs text-slate-500 font-medium">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-forest-700" />
              <span>DGMS Compliance Ready</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-forest-700" />
              <span>Full Shift Handover Audit Trail</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-forest-700" />
              <span>Works Across All Pits & Coal Washeries</span>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-xs uppercase font-bold text-forest-800 tracking-wider">
              Operational Challenges
            </h2>
            <p className="mt-2 text-2xl sm:text-3xl font-bold text-navy-900">
              Why manual mine reporting creates costly operational blind spots
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded-lg border border-slate-200 bg-slate-50/50">
              <div className="w-10 h-10 rounded bg-red-100 text-red-700 flex items-center justify-center mb-4">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-navy-900 mb-1">
                Scattered Paper Logs & Audio
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Handwritten shift sheets and voice recordings stay trapped in shift supervisor cabins,
                making historical lookup almost impossible during audits.
              </p>
            </div>

            <div className="p-5 rounded-lg border border-slate-200 bg-slate-50/50">
              <div className="w-10 h-10 rounded bg-amber-100 text-amber-800 flex items-center justify-center mb-4">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-navy-900 mb-1">
                Delayed Handover Visibility
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Incoming shift supervisors spend up to an hour deciphering previous shift notes,
                causing production bottlenecks at shift changeovers.
              </p>
            </div>

            <div className="p-5 rounded-lg border border-slate-200 bg-slate-50/50">
              <div className="w-10 h-10 rounded bg-blue-100 text-blue-700 flex items-center justify-center mb-4">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-navy-900 mb-1">
                Attendance Discrepancies
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Physical muster rolls lead to unverified headcounts, safety non-compliance, and lack of
                correlation between manpower deployed and tonnage extracted.
              </p>
            </div>

            <div className="p-5 rounded-lg border border-slate-200 bg-slate-50/50">
              <div className="w-10 h-10 rounded bg-red-100 text-red-700 flex items-center justify-center mb-4">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-navy-900 mb-1">
                Untracked Machine Breakdowns
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Excavator and dumper faults reported verbally often fail to generate formal
                maintenance tickets, resulting in catastrophic repeat breakdowns.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-xs uppercase font-bold text-forest-800 tracking-wider">
              Standardized Workflow
            </h2>
            <p className="mt-2 text-2xl sm:text-3xl font-bold text-navy-900">
              How MineBrief streamlines shift reporting from pit face to boardroom
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg border border-slate-200 relative">
              <div className="text-xs font-bold text-forest-700 mb-2">STEP 01</div>
              <h3 className="text-sm font-bold text-navy-900 mb-1">Collect Field Logs</h3>
              <p className="text-xs text-slate-600">
                Supervisors record work done, delays, machine faults, safety observations, and attach
                photos or voice updates.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-slate-200 relative">
              <div className="text-xs font-bold text-forest-700 mb-2">STEP 02</div>
              <h3 className="text-sm font-bold text-navy-900 mb-1">Process & Structure</h3>
              <p className="text-xs text-slate-600">
                Input is organized into 8 standardized operational modules: attendance, machinery,
                delays, safety, and handover.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-slate-200 relative">
              <div className="text-xs font-bold text-forest-700 mb-2">STEP 03</div>
              <h3 className="text-sm font-bold text-navy-900 mb-1">Verify & Sign-off</h3>
              <p className="text-xs text-slate-600">
                Shift in-charges review data integrity, confirm headcounts, and electronically sign
                off on reports for audit compliance.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-slate-200 relative">
              <div className="text-xs font-bold text-forest-700 mb-2">STEP 04</div>
              <h3 className="text-sm font-bold text-navy-900 mb-1">Operational Analytics</h3>
              <p className="text-xs text-slate-600">
                Executive dashboards aggregate fleet health, section outputs, recurring bottlenecks,
                and safety trends across shifts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-xs uppercase font-bold text-forest-800 tracking-wider">
              Core Platform Modules
            </h2>
            <p className="mt-2 text-2xl sm:text-3xl font-bold text-navy-900">
              Built for mining engineering, maintenance, and safety managers
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-lg border border-slate-200 bg-white">
              <div className="w-10 h-10 rounded bg-forest-50 border border-forest-200 text-forest-800 flex items-center justify-center mb-4">
                <ClipboardCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-navy-900 mb-2">Shift Reporting & Handover</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Structured multi-category shift logging covering work completed, production delays,
                hazard observations, and incoming supervisor handover instructions.
              </p>
            </div>

            <div className="p-6 rounded-lg border border-slate-200 bg-white">
              <div className="w-10 h-10 rounded bg-forest-50 border border-forest-200 text-forest-800 flex items-center justify-center mb-4">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-navy-900 mb-2">Workforce Attendance</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Shift-wise scheduled vs present workforce validation. Automatic absentee tracking,
                section deployments, and historical attendance trends.
              </p>
            </div>

            <div className="p-6 rounded-lg border border-slate-200 bg-white">
              <div className="w-10 h-10 rounded bg-forest-50 border border-forest-200 text-forest-800 flex items-center justify-center mb-4">
                <Wrench className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-navy-900 mb-2">Equipment & Maintenance</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Maintain asset lifecycle history for draglines, shovels, dumpers, and conveyor belts.
                Track open breakdowns to resolution with priority levels.
              </p>
            </div>

            <div className="p-6 rounded-lg border border-slate-200 bg-white">
              <div className="w-10 h-10 rounded bg-forest-50 border border-forest-200 text-forest-800 flex items-center justify-center mb-4">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-navy-900 mb-2">Operational Issues Tracking</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Centralized registry of unresolved hazards, waterlogging, haul road conditions, and
                geotechnical warnings across all mining pits.
              </p>
            </div>

            <div className="p-6 rounded-lg border border-slate-200 bg-white">
              <div className="w-10 h-10 rounded bg-forest-50 border border-forest-200 text-forest-800 flex items-center justify-center mb-4">
                <Search className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-navy-900 mb-2">Historical Audit Search</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Instant search across years of shift archives by section, equipment ID, shift, hazard
                category, or keyword for regulatory inspections.
              </p>
            </div>

            <div className="p-6 rounded-lg border border-slate-200 bg-white">
              <div className="w-10 h-10 rounded bg-forest-50 border border-forest-200 text-forest-800 flex items-center justify-center mb-4">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-navy-900 mb-2">Executive Overview</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Aggregated daily summaries, verification status, equipment health distribution, and
                attendance rates configured for mine general managers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Enterprise Security Section */}
      <section className="py-12 bg-slate-50 border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 rounded-lg bg-white border border-slate-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded bg-forest-100 text-forest-800 flex items-center justify-center shrink-0">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-navy-900">Enterprise Data Governance</h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Role-based access controls, complete audit logging of shift verifications, and
                  support for on-premise or sovereign cloud hosting.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleExploreDemo}
              className="px-4 py-2 text-xs font-semibold text-white bg-forest-800 hover:bg-forest-900 rounded shadow-xs whitespace-nowrap"
            >
              Launch Demo Workspace
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-white py-8 border-t border-slate-200 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-forest-800" />
            <span className="font-semibold text-slate-800">MineBrief</span>
            <span>— Coal Mine Operations Platform</span>
          </div>

          <div className="flex items-center gap-6">
            <span>Rajmahal OCP Demo</span>
            <span>DGMS Guidelines Compliant</span>
            <span>© {new Date().getFullYear()} MineBrief. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
