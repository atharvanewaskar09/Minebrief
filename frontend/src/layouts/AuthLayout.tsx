import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Layers } from 'lucide-react';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2.5">
          <div className="w-10 h-10 rounded bg-forest-800 flex items-center justify-center text-white shadow-xs">
            <Layers className="w-5 h-5 text-forest-200" />
          </div>
          <div className="text-left">
            <span className="font-bold text-xl tracking-tight text-navy-900 block leading-tight">
              MineBrief
            </span>
            <span className="text-[11px] text-slate-500 font-medium tracking-wide">
              COAL MINE OPERATIONS PLATFORM
            </span>
          </div>
        </Link>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm border border-slate-200 sm:rounded-lg sm:px-10">
          <Outlet />
        </div>

        <div className="mt-6 text-center text-xs text-slate-500">
          <p>© {new Date().getFullYear()} MineBrief. Enterprise Coal Mine Operations Suite.</p>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
