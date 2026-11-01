import React, { useState } from 'react';
import { Info, X, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const DemoBanner: React.FC = () => {
  const { isDemo, exitDemo } = useAuth();
  const [isDismissed, setIsDismissed] = useState(false);

  if (!isDemo || isDismissed) return null;

  return (
    <div className="lg:ml-64 bg-amber-500 text-navy-950 px-4 py-2 border-b border-amber-600/30 text-xs font-medium flex flex-wrap items-center justify-between gap-x-3 gap-y-2 shadow-xs">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <Info className="w-4 h-4 text-navy-950 shrink-0" />
        <span>
          <strong className="font-semibold">Demo Workspace:</strong> You are viewing the{' '}
          <strong className="font-semibold">Rajmahal Coal Mine</strong> sandbox. All records, telemetry, and figures are fictional.
        </span>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={exitDemo}
          className="inline-flex items-center gap-1 text-[11px] font-semibold bg-navy-900 text-white px-2.5 py-1 rounded hover:bg-navy-950 transition-colors"
        >
          <LogOut className="w-3 h-3" />
          Exit Demo
        </button>
        <button
          type="button"
          onClick={() => setIsDismissed(true)}
          className="text-navy-900 hover:text-navy-950 p-1 rounded hover:bg-amber-400/40"
          title="Dismiss banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default DemoBanner;
