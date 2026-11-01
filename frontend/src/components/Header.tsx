import React from 'react';
import { Menu, Bell, Search, ShieldCheck } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Link, useLocation } from 'react-router-dom';

interface HeaderProps {
  onToggleSidebar: () => void;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  title,
  subtitle,
  actions,
}) => {
  const { user } = useAuth();
  const location = useLocation();

  // Determine title from path if not explicitly provided
  const getPageTitle = () => {
    if (title) return title;
    const path = location.pathname;
    if (path.includes('/dashboard')) return 'Operational Overview';
    if (path.includes('/reports/new')) return 'New Shift Report';
    if (path.match(/\/reports\/\d+/)) return 'Shift Report Detail';
    if (path.includes('/reports')) return 'Shift Reports Log';
    if (path.includes('/workforce')) return 'Workforce Attendance';
    if (path.includes('/equipment')) return 'Equipment & Maintenance';
    if (path.includes('/issues')) return 'Pending Operational Issues';
    if (path.includes('/history')) return 'Historical Records Search';
    if (path.includes('/settings')) return 'Workspace Settings';
    return 'Mine Operations';
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          title="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold text-navy-900 tracking-tight leading-none">
              {getPageTitle()}
            </h1>
          </div>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-0.5 hidden sm:block">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {actions && <div className="hidden md:flex items-center">{actions}</div>}

        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <Link
            to="/app/history"
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
            title="Search Historical Records"
          >
            <Search className="w-4 h-4" />
          </Link>

          <div
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200"
            title="System Operational Status"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-forest-700" />
            <span>Shift Active</span>
          </div>

          <div className="w-8 h-8 rounded-full bg-forest-800 text-white flex items-center justify-center font-bold text-xs ring-2 ring-white">
            {user?.name ? user.name.charAt(0) : 'U'}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
