import React, { useState, useEffect } from 'react';
import {
  Users,
  CreditCard,
  Receipt,
  ScanLine,
  IndianRupee,
  ShieldCheck,
  AlertTriangle,
  ArrowUpRight,
  RefreshCw,
  Clock,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';

const AdminDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [recentPayments, setRecentPayments] = useState([]);
  const [recentCheckIns, setRecentCheckIns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await api.get('/dashboard/stats');
      if (res.data.success) {
        setStats(res.data.stats);
        setRecentPayments(res.data.recentPayments || []);
        setRecentCheckIns(res.data.recentCheckIns || []);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();

    // Listen to global server sync event from sidebar
    const handleSync = () => fetchDashboard(true);
    window.addEventListener('apexfit_sync_server', handleSync);
    return () => window.removeEventListener('apexfit_sync_server', handleSync);
  }, []);

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-['Space_Grotesk']">
            Club Overview & Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time gym status powered directly by MongoDB Atlas single source of truth.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchDashboard(true)}
            disabled={refreshing}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-800 transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refetch Live DB</span>
          </button>
          <Link
            to="/admin/attendance"
            className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors flex items-center gap-1.5 shadow-md shadow-amber-500/20"
          >
            <ScanLine className="w-3.5 h-3.5" />
            <span>Scanner Terminal</span>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
        {/* Total Members */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Members</span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white font-['Space_Grotesk']">
            {stats ? stats.totalMembers : '—'}
          </div>
          <div className="text-[11px] text-slate-400">Registered member profiles</div>
        </div>

        {/* Active Passes */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Passes</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-400 font-['Space_Grotesk']">
            {stats ? stats.activePasses : '—'}
          </div>
          <div className="text-[11px] text-slate-400">Valid & unexpired passes</div>
        </div>

        {/* Expired Passes */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Expired Passes</span>
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-rose-400 font-['Space_Grotesk']">
            {stats ? stats.expiredPasses : '—'}
          </div>
          <div className="text-[11px] text-slate-400">Requires renewal via Razorpay</div>
        </div>

        {/* Today's Check-ins */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Today's Entries</span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <ScanLine className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white font-['Space_Grotesk']">
            {stats ? stats.todayCheckIns : '—'}
          </div>
          <div className="text-[11px] text-slate-400">Kiosk & desk check-ins</div>
        </div>

        {/* Total Revenue */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Verified Revenue</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-400 font-['Space_Grotesk']">
            ₹{stats ? stats.totalRevenue?.toLocaleString('en-IN') : '—'}
          </div>
          <div className="text-[11px] text-slate-400">Processed Razorpay volume</div>
        </div>
      </div>

      {/* Main Content Split: Recent Payments & Today's Attendance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Razorpay Payments */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-bold text-white">Recent Razorpay Payments</h3>
            </div>
            <Link
              to="/admin/payments"
              className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentPayments.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">No payment transactions yet.</div>
          ) : (
            <div className="space-y-3">
              {recentPayments.map((p) => (
                <div
                  key={p._id}
                  className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs"
                >
                  <div className="space-y-1">
                    <div className="font-bold text-white">
                      {p.memberId?.name || 'Member'}{' '}
                      <span className="text-slate-400 font-normal">({p.memberId?.memberCode})</span>
                    </div>
                    <div className="text-slate-400 text-[11px]">
                      {p.planId?.name || 'Membership'} •{' '}
                      <span className="font-mono text-slate-400">{p.razorpayPaymentId || p.razorpayOrderId}</span>
                    </div>
                  </div>

                  <div className="text-right space-y-1">
                    <div className="font-extrabold text-amber-400 font-['Space_Grotesk'] text-sm">
                      ₹{p.amount?.toLocaleString('en-IN')}
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold text-[10px] border border-emerald-500/20">
                      Verified
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Check-Ins */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <ScanLine className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white">Latest Check-ins</h3>
            </div>
            <Link
              to="/admin/attendance"
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold"
            >
              <span>View Logs</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentCheckIns.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">No check-ins recorded today yet.</div>
          ) : (
            <div className="space-y-3">
              {recentCheckIns.map((ci) => (
                <div
                  key={ci._id}
                  className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs"
                >
                  <div className="space-y-1">
                    <div className="font-bold text-white">
                      {ci.memberId?.name || 'Member'}{' '}
                      <span className="text-slate-400 font-mono">({ci.memberId?.memberCode})</span>
                    </div>
                    <div className="text-slate-400 flex items-center gap-1 text-[11px]">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {new Date(ci.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {ci.checkOut && ` – Out: ${new Date(ci.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${
                      ci.membershipStatusAtCheckIn === 'active'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    }`}
                  >
                    {ci.membershipStatusAtCheckIn === 'active' ? 'Active Pass' : 'Expired Alert'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
