import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  FilePlus,
  Users,
  Wrench,
  AlertTriangle,
  History,
  Settings,
  LogOut,
  Layers,
  ChevronRight,
  Shield,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, isDemo, logout, exitDemo } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    if (isDemo) {
      exitDemo();
    } else {
      logout();
    }
    navigate('/');
  };

  const navItems = [
    { name: 'Overview', to: '/app/dashboard', icon: LayoutDashboard },
    { name: 'Shift Reports', to: '/app/reports', icon: FileText },
    { name: 'New Report', to: '/app/reports/new', icon: FilePlus },
    { name: 'Workforce', to: '/app/workforce', icon: Users },
    { name: 'Equipment & Maint.', to: '/app/equipment', icon: Wrench },
    { name: 'Pending Issues', to: '/app/issues', icon: AlertTriangle },
    { name: 'Historical Records', to: '/app/history', icon: History },
    { name: 'Settings', to: '/app/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-navy-950/60 lg:hidden backdrop-blur-xs"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Logo / MineBrief Brand */}
          <div className="h-16 flex items-center justify-between px-5 border-b border-slate-200">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded bg-forest-800 flex items-center justify-center text-white shadow-xs">
                <Layers className="w-4 h-4 text-forest-200" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-base tracking-tight text-navy-900 leading-none">
                  MineBrief
                </span>
                <span className="text-[10px] text-slate-500 font-medium tracking-wide mt-0.5">
                  OPERATIONS SUITE
                </span>
              </div>
            </div>
            {isDemo && (
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                Demo
              </span>
            )}
          </div>

          {/* Mine context info */}
          <div className="px-4 py-3 bg-slate-50/70 border-b border-slate-200 text-xs">
            <p className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
              Mine Workspace
            </p>
            <p className="font-semibold text-slate-800 truncate mt-0.5">Rajmahal OCP (ECL)</p>
            <p className="text-[11px] text-slate-500 truncate">Section: All Active Pits</p>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                      isActive
                        ? 'bg-forest-50 text-forest-800 font-semibold border-l-4 border-forest-800 shadow-2xs'
                        : 'text-slate-600 hover:text-navy-900 hover:bg-slate-100'
                    }`
                  }
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.name}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-40" />
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User Profile and Logout */}
        <div className="p-3 border-t border-slate-200 bg-slate-50/60">
          <div className="flex items-center gap-3 p-2 rounded-md bg-white border border-slate-200 shadow-2xs">
            <div className="w-8 h-8 rounded-full bg-forest-800 text-white flex items-center justify-center font-bold text-xs">
              {user?.name ? user.name.charAt(0) : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-800 truncate">
                {user?.name || 'Operator'}
              </p>
              <div className="flex items-center gap-1 text-[10px] text-slate-500 capitalize">
                <Shield className="w-2.5 h-2.5 text-forest-700" />
                <span>{user?.role || 'Supervisor'}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-slate-100 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
