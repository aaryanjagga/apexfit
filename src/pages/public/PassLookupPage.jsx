import React, { useState } from 'react';
import { Search, Loader2, ShieldAlert, Sparkles, ArrowLeft, RefreshCw, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import DigitalPassModal from '../../components/DigitalPassModal';
import RazorpayPaymentModal from '../../components/RazorpayPaymentModal';
import MemberAttendanceModal from '../../components/MemberAttendanceModal';

const PassLookupPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [passData, setPassData] = useState(null);

  // Renewal states
  const [availablePlans, setAvailablePlans] = useState([]);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [selectedPlanForRenewal, setSelectedPlanForRenewal] = useState(null);

  // GPS Attendance state
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);

  const fetchPass = async (queryToSearch, isSync = false) => {
    if (!queryToSearch) return;
    if (isSync) setIsRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const res = await api.get(`/members/lookup/pass?query=${encodeURIComponent(queryToSearch.trim())}`);
      if (res.data.success) {
        setPassData(res.data);
      } else {
        setError(res.data.message || 'Pass not found.');
      }
    } catch (err) {
      console.error('Pass Lookup Error:', err);
      setError(
        err.response?.data?.message || 'No member record found matching that Member ID, Email, or Phone.'
      );
      setPassData(null);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setError('Please enter your Member ID (e.g. AF-1001), Email, or Phone.');
      return;
    }
    fetchPass(searchQuery);
  };

  const handleOpenRenewal = async () => {
    try {
      const res = await api.get('/plans');
      if (res.data.success && res.data.plans.length > 0) {
        setAvailablePlans(res.data.plans);
        setSelectedPlanForRenewal(res.data.plans[0]);
        setIsRenewModalOpen(true);
      }
    } catch (err) {
      console.error('Failed to load plans for renewal:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 py-12 md:py-20 max-w-5xl mx-auto px-4 sm:px-6 w-full">
        {/* Breadcrumb / Back */}
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-amber-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to ApexFit Home
          </Link>

          <button
            onClick={() => setIsAttendanceModalOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-400 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <MapPin className="w-3.5 h-3.5 fill-slate-950" />
            <span>Mark GPS Attendance</span>
          </button>
        </div>

        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Digital Member Pass & Attendance Portal
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-['Space_Grotesk']">
            Verify Pass & Mark On-Site Attendance
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-2">
            Real-time synchronization with MongoDB Atlas database. Look up your pass, mark your on-site attendance via gym geolocation, or renew instantly via Razorpay.
          </p>
        </div>

        {/* Search Bar Form */}
        <div className="max-w-lg mx-auto mb-12">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter Member ID (e.g. AF-1001), Email, or Phone..."
              className="w-full pl-11 pr-32 py-3.5 bg-slate-900 border border-slate-800 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-all shadow-lg shadow-black/40"
            />
            <Search className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-5 py-2.5 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Searching...</span>
                </>
              ) : (
                <span>Lookup Pass</span>
              )}
            </button>
          </form>

          {/* Quick sample pills */}
          <div className="mt-3 flex items-center justify-center gap-2 text-[11px] text-slate-500">
            <span>Try sample:</span>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('AF-1001');
                fetchPass('AF-1001');
              }}
              className="text-amber-400/80 hover:text-amber-300 underline underline-offset-2"
            >
              AF-1001 (Active)
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('AF-1002');
                fetchPass('AF-1002');
              }}
              className="text-rose-400/80 hover:text-rose-300 underline underline-offset-2"
            >
              AF-1002 (Expired)
            </button>
          </div>

          {/* Error notice */}
          {error && (
            <div className="mt-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2.5">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Digital Pass Result Display */}
        {passData && (
          <div className="animate-in fade-in zoom-in-95 duration-300 max-w-md mx-auto space-y-4">
            <DigitalPassModal
              member={passData.member}
              membership={passData.membership}
              serverTimestamp={passData.serverTimestamp}
              isRefreshing={isRefreshing}
              onRefresh={() => fetchPass(passData.member.memberCode || searchQuery, true)}
              onRenewClick={handleOpenRenewal}
            />

            {/* Direct Member Attendance Button using Gym Location */}
            <button
              onClick={() => setIsAttendanceModalOpen(true)}
              className="w-full py-3.5 rounded-2xl font-bold text-xs bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <MapPin className="w-4 h-4 fill-slate-950" />
              <span>Mark Attendance at Gym (GPS Location)</span>
            </button>
          </div>
        )}
      </main>

      {/* Plan selection and Razorpay Checkout Modal for renewal */}
      {isRenewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">Select Renewal Plan</h3>
              <button
                onClick={() => setIsRenewModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              {availablePlans.map((plan) => (
                <div
                  key={plan._id}
                  onClick={() => setSelectedPlanForRenewal(plan)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    selectedPlanForRenewal?._id === plan._id
                      ? 'bg-amber-500/10 border-amber-500/60'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <h4 className="text-sm font-bold text-white">{plan.name}</h4>
                    <p className="text-xs text-slate-400">{plan.durationDays} Days Access</p>
                  </div>
                  <div className="text-sm font-extrabold text-amber-400">
                    ₹{plan.price?.toLocaleString('en-IN')}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                setIsRenewModalOpen(false);
              }}
              className="w-full py-3 rounded-xl font-bold text-sm bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors"
            >
              Continue to Razorpay Checkout
            </button>
          </div>
        </div>
      )}

      {selectedPlanForRenewal && !isRenewModalOpen && passData && (
        <RazorpayPaymentModal
          isOpen={true}
          plan={selectedPlanForRenewal}
          member={passData.member}
          onClose={() => setSelectedPlanForRenewal(null)}
          onSuccess={() => {
            fetchPass(passData.member.memberCode || searchQuery, true);
          }}
        />
      )}

      {/* Member Attendance GPS Geofence Modal */}
      <MemberAttendanceModal
        isOpen={isAttendanceModalOpen}
        onClose={() => setIsAttendanceModalOpen(false)}
        memberCode={passData?.member?.memberCode || searchQuery}
        onCheckInSuccess={() => {
          if (passData) {
            fetchPass(passData.member.memberCode || searchQuery, true);
          }
        }}
      />

      <Footer />
    </div>
  );
};

export default PassLookupPage;
