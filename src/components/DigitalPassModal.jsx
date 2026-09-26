import React from 'react';
import { ShieldCheck, AlertCircle, RefreshCw, Calendar, Sparkles, QrCode } from 'lucide-react';

const DigitalPassModal = ({ member, membership, serverTimestamp, onRefresh, onRenewClick, isRefreshing }) => {
  if (!member) return null;

  const isExpired = membership ? membership.isExpired || membership.status === 'expired' : true;
  const isActive = membership && !isExpired && membership.status === 'active';

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Outer Card with metallic gradient border */}
      <div
        className={`relative rounded-3xl p-1 bg-gradient-to-b ${
          isActive
            ? 'from-amber-400 via-amber-500/40 to-slate-900 shadow-2xl shadow-amber-500/10'
            : 'from-rose-500/50 via-slate-800 to-slate-900 shadow-xl shadow-rose-500/5'
        }`}
      >
        <div className="bg-slate-950 rounded-[22px] p-6 sm:p-7 relative overflow-hidden">
          {/* Subtle background glow */}
          <div
            className={`absolute -top-12 -right-12 w-44 h-44 rounded-full blur-3xl pointer-events-none ${
              isActive ? 'bg-amber-500/15' : 'bg-rose-500/15'
            }`}
          />

          {/* Header */}
          <div className="flex items-center justify-between pb-5 border-b border-slate-800/80">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-amber-500">
                Official Digital Member Pass
              </span>
              <h3 className="text-xl font-extrabold text-white tracking-tight font-['Space_Grotesk']">
                APEX<span className="text-amber-500">FIT</span> CLUB
              </h3>
            </div>
            {/* Status Badge */}
            <div
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border ${
                isActive
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
              }`}
            >
              {isActive ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Active
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-rose-400" />
                  Expired
                </>
              )}
            </div>
          </div>

          {/* Member Profile & Code */}
          <div className="py-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                Member Name
              </p>
              <h2 className="text-2xl font-bold text-white mt-0.5 tracking-tight">
                {member.name}
              </h2>
              <div className="mt-2 inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[11px] text-slate-400">ID:</span>
                <span className="font-mono font-bold text-amber-400 text-xs">
                  {member.memberCode}
                </span>
              </div>
            </div>

            {/* QR Code representation */}
            <div className="w-20 h-20 rounded-xl bg-white p-1.5 flex flex-col items-center justify-center shrink-0 shadow-md">
              <QrCode className="w-full h-full text-slate-950" />
            </div>
          </div>

          {/* Membership Plan Details */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Plan Tier:</span>
              <span className="text-xs font-bold text-white flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                {membership?.planName || 'Standard Pass'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Category:</span>
              <span className="text-xs font-medium text-slate-300">
                {membership?.planCategory || 'Gym Access'}
              </span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                Pass Expiry:
              </span>
              <span
                className={`text-xs font-bold ${
                  isActive ? 'text-emerald-400' : 'text-rose-400 font-semibold'
                }`}
              >
                {membership?.endDate
                  ? new Date(membership.endDate).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                  : 'No Active Membership'}
              </span>
            </div>

            {isActive && membership?.daysRemaining !== undefined && (
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Days Remaining:</span>
                <span className="font-semibold text-amber-400">
                  {membership.daysRemaining} {membership.daysRemaining === 1 ? 'day' : 'days'}
                </span>
              </div>
            )}
          </div>

          {/* Multi-Device Consistency Notice & Refresh Button */}
          <div className="mt-5 pt-4 border-t border-slate-900 flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Synced with MongoDB Atlas</span>
            </div>
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-1 text-amber-400 hover:text-amber-300 transition-colors font-medium cursor-pointer"
                title="Force refetch current live server pass from MongoDB"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Sync</span>
              </button>
            )}
          </div>

          {serverTimestamp && (
            <div className="text-[10px] text-slate-400 text-center mt-2">
              Server Record Time: {new Date(serverTimestamp).toLocaleTimeString()}
            </div>
          )}

          {/* Action CTA */}
          <div className="mt-5">
            {isExpired ? (
              <button
                onClick={onRenewClick}
                className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <AlertCircle className="w-4 h-4" />
                <span>Pass Expired — Renew Now</span>
              </button>
            ) : (
              <button
                onClick={onRenewClick}
                className="w-full py-2.5 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Extend / Upgrade Membership</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DigitalPassModal;
