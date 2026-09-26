import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Receipt,
  ScanLine,
  Dumbbell,
  ClipboardList,
  LogOut,
  RefreshCw,
  Database,
  Menu,
  X,
  Shield,
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';

const AdminLayout = () => {
  const { admin, logout } = useAdminAuth();
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(new Date().toLocaleTimeString());

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const handleGlobalSync = () => {
    setSyncing(true);
    // Trigger custom event so any active admin view refetches fresh MongoDB data
    window.dispatchEvent(new CustomEvent('apexfit_sync_server'));
    setTimeout(() => {
      setSyncing(false);
      setLastSyncTime(new Date().toLocaleTimeString());
    }, 400);
  };

  const navLinks = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard, exact: true },
    { name: 'Members & Passes', path: '/admin/members', icon: Users },
    { name: 'Plans & Pricing', path: '/admin/plans', icon: CreditCard },
    { name: 'Razorpay Payments', path: '/admin/payments', icon: Receipt },
    { name: 'Attendance Scanner', path: '/admin/attendance', icon: ScanLine },
    { name: 'Trainers & Coaches', path: '/admin/trainers', icon: Dumbbell },
    { name: 'System Audit Logs', path: '/admin/audit', icon: ClipboardList },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 border-r border-slate-800 shrink-0">
        {/* Brand */}
        <div className="h-20 px-6 flex items-center gap-3 border-b border-slate-800/80">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/20">
            <Dumbbell className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-extrabold tracking-tight text-white font-['Space_Grotesk']">
                APEX<span className="text-amber-500">FIT</span>
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 font-bold border border-rose-500/20">
                ADMIN
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Control Center</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
          {navLinks.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`
              }
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>

        {/* Multi-Device Server Truth Status Card */}
        <div className="p-4 mx-3 mb-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              MongoDB Source
            </span>
            <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold text-[10px] border border-emerald-500/20">
              Live Truth
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Last Synced:</span>
            <span className="font-mono text-slate-300">{lastSyncTime}</span>
          </div>

          <button
            onClick={handleGlobalSync}
            disabled={syncing}
            className="w-full py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700/60 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
            title="Force refresh data across all views directly from MongoDB"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            <span>Sync Live Records</span>
          </button>
        </div>

        {/* Admin User info & logout */}
        <div className="p-4 border-t border-slate-800/80 flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <p className="text-xs font-bold text-white truncate">{admin?.name || 'Administrator'}</p>
            <p className="text-[11px] text-slate-400 truncate">{admin?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Sign Out"
            className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between h-16 px-4 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-bold">
            <Dumbbell className="w-4 h-4 stroke-[2.5]" />
          </div>
          <span className="font-bold text-white font-['Space_Grotesk']">ApexFit Admin</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleGlobalSync}
            className="p-2 rounded-lg text-amber-400 bg-slate-800"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className="p-2 rounded-lg text-slate-400 hover:text-white"
          >
            {mobileNavOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Nav */}
      {mobileNavOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 py-4 space-y-1">
          {navLinks.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              onClick={() => setMobileNavOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`
              }
            >
              <item.icon className="w-4 h-4" />
              <span>{item.name}</span>
            </NavLink>
          ))}
          <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-xs">
            <span className="text-slate-400">{admin?.email}</span>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 font-bold"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Main Outlet View */}
      <main className="flex-1 bg-slate-950 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
