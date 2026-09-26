import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  RefreshCw,
  Eye,
  Edit2,
  Trash2,
  AlertCircle,
  Calendar,
  CreditCard,
  ShieldCheck,
  X,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import api from '../../api/axios';
import DigitalPassModal from '../../components/DigitalPassModal';
import RazorpayPaymentModal from '../../components/RazorpayPaymentModal';

const AdminMembersPage = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Selected Member for Profile Drawer / Inspection
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [selectedMemberProfile, setSelectedMemberProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Add Member Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newMemberData, setNewMemberData] = useState({
    name: '',
    email: '',
    phone: '',
    gender: 'Prefer not to say',
    address: '',
    notes: '',
  });
  const [submittingMember, setSubmittingMember] = useState(false);
  const [formError, setFormError] = useState('');

  // Renewal Modal
  const [availablePlans, setAvailablePlans] = useState([]);
  const [selectedPlanForRenewal, setSelectedPlanForRenewal] = useState(null);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);

  // Fetch all members directly from MongoDB
  const fetchMembers = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const res = await api.get(`/members?${params.toString()}`);
      if (res.data.success) {
        setMembers(res.data.members);
      }
    } catch (err) {
      console.error('Failed to fetch members:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Open member details & fetch fresh server record (Multi-device consistency requirement!)
  const inspectMember = async (memberId) => {
    setSelectedMemberId(memberId);
    setLoadingProfile(true);
    try {
      // ALWAYS fetch current server record directly from MongoDB
      const res = await api.get(`/members/${memberId}`);
      if (res.data.success) {
        setSelectedMemberProfile(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch member server record:', err);
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    fetchMembers();

    // Listen to global server sync event from sidebar
    const handleSync = () => {
      fetchMembers(true);
      if (selectedMemberId) {
        inspectMember(selectedMemberId);
      }
    };
    window.addEventListener('apexfit_sync_server', handleSync);
    return () => window.removeEventListener('apexfit_sync_server', handleSync);
  }, [search, statusFilter]);

  // Load plans for renewal
  const openRenewalDialog = async () => {
    try {
      const res = await api.get('/plans');
      if (res.data.success && res.data.plans.length > 0) {
        setAvailablePlans(res.data.plans);
        setSelectedPlanForRenewal(res.data.plans[0]);
        setIsRenewModalOpen(true);
      }
    } catch (err) {
      console.error('Failed to load plans:', err);
    }
  };

  const handleCreateMember = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmittingMember(true);

    try {
      const res = await api.post('/members', newMemberData);
      if (res.data.success) {
        setIsAddModalOpen(false);
        setNewMemberData({
          name: '',
          email: '',
          phone: '',
          gender: 'Prefer not to say',
          address: '',
          notes: '',
        });
        fetchMembers(true);
      }
    } catch (err) {
      console.error('Create member error:', err);
      setFormError(err.response?.data?.message || 'Failed to create member');
    } finally {
      setSubmittingMember(false);
    }
  };

  const handleDeleteMember = async (memberId) => {
    if (!window.confirm('Are you sure you want to remove this member profile? This will also archive related passes.')) {
      return;
    }
    try {
      await api.delete(`/members/${memberId}`);
      if (selectedMemberId === memberId) {
        setSelectedMemberId(null);
        setSelectedMemberProfile(null);
      }
      fetchMembers(true);
    } catch (err) {
      console.error('Delete member error:', err);
    }
  };

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-['Space_Grotesk']">
            Member Management & Passes
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time digital pass statuses and member profiles from MongoDB.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchMembers(true)}
            disabled={refreshing}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-800 transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-60"
            title="Force refresh member records from MongoDB"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refetch Live DB</span>
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors flex items-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Register Member</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, ID (AF-...), or phone..."
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-400 font-semibold whitespace-nowrap">Filter:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
          >
            <option value="all">All Members ({members.length})</option>
            <option value="active">Active Pass</option>
            <option value="expired">Expired Pass</option>
            <option value="inactive">Inactive / No Pass</option>
          </select>
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Member Info</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Current Plan</th>
                <th className="px-6 py-4">Expiry Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-500" />
                    <span className="mt-2 block">Loading live server records...</span>
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-slate-400">
                    No members found matching the criteria.
                  </td>
                </tr>
              ) : (
                members.map((m) => {
                  const membership = m.currentMembership;
                  const isExpired = membership ? membership.status === 'expired' || new Date(membership.endDate) < new Date() : true;
                  const isActive = membership && !isExpired && membership.status === 'active';

                  return (
                    <tr
                      key={m._id}
                      className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                      onClick={() => inspectMember(m._id)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 font-bold flex items-center justify-center border border-amber-500/20">
                            {m.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-white group-hover:text-amber-400 transition-colors">
                              {m.name}
                            </div>
                            <div className="font-mono text-[11px] text-amber-400/90 font-medium">
                              {m.memberCode}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div>{m.email}</div>
                        <div className="text-slate-400 text-[11px]">{m.phone}</div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="font-semibold text-white">
                          {membership?.planId?.name || 'No Active Plan'}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {membership ? `₹${membership.planId?.price?.toLocaleString('en-IN')}` : '—'}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className={isActive ? 'text-emerald-400 font-bold' : 'text-rose-400'}>
                          {membership?.endDate
                            ? new Date(membership.endDate).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })
                            : '—'}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            isActive
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : m.status === 'expired' || isExpired
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {isActive ? 'Active' : isExpired ? 'Expired' : 'Inactive'}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => inspectMember(m._id)}
                            title="Inspect Live Pass"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteMember(m._id)}
                            title="Delete Member"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Member Profile Drawer / Inspection Modal */}
      {selectedMemberId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-bold text-white">Member Server Profile</h3>
              </div>
              <button
                onClick={() => {
                  setSelectedMemberId(null);
                  setSelectedMemberProfile(null);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingProfile || !selectedMemberProfile ? (
              <div className="py-16 text-center text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-500" />
                <p className="mt-2 text-xs">Querying MongoDB for latest server record...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Visual Digital Pass */}
                <DigitalPassModal
                  member={selectedMemberProfile.member}
                  membership={
                    selectedMemberProfile.membership
                      ? {
                          ...selectedMemberProfile.membership,
                          planName: selectedMemberProfile.membership.planId?.name,
                          planCategory: selectedMemberProfile.membership.planId?.category,
                          daysRemaining: Math.max(
                            0,
                            Math.ceil(
                              (new Date(selectedMemberProfile.membership.endDate) - new Date()) /
                                (1000 * 60 * 60 * 24)
                            )
                          ),
                        }
                      : null
                  }
                  serverTimestamp={selectedMemberProfile.serverTime}
                  onRefresh={() => inspectMember(selectedMemberId)}
                  onRenewClick={openRenewalDialog}
                />

                {/* Member Contact Info Grid */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 uppercase font-semibold text-[10px]">Email:</span>
                    <p className="text-white font-medium">{selectedMemberProfile.member.email}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 uppercase font-semibold text-[10px]">Phone:</span>
                    <p className="text-white font-medium">{selectedMemberProfile.member.phone}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 uppercase font-semibold text-[10px]">Joined On:</span>
                    <p className="text-slate-300">
                      {new Date(selectedMemberProfile.member.joinDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500 uppercase font-semibold text-[10px]">Address:</span>
                    <p className="text-slate-300">{selectedMemberProfile.member.address || '—'}</p>
                  </div>
                </div>

                {/* Payment History */}
                <div>
                  <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-2">
                    Verified Payment History
                  </h4>
                  {selectedMemberProfile.payments?.length === 0 ? (
                    <div className="p-4 rounded-xl bg-slate-950 text-slate-500 text-xs text-center">
                      No payment transactions on record.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedMemberProfile.payments.map((pmt) => (
                        <div
                          key={pmt._id}
                          className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-bold text-white">{pmt.planId?.name || 'Plan'}</div>
                            <div className="text-[11px] font-mono text-slate-400">
                              Order: {pmt.razorpayOrderId} | Pay: {pmt.razorpayPaymentId || '—'}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-extrabold text-amber-400">
                              ₹{pmt.amount?.toLocaleString('en-IN')}
                            </div>
                            <span className="text-[10px] font-bold text-emerald-400">
                              {pmt.paymentStatus}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">Register New Member</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateMember} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newMemberData.name}
                  onChange={(e) => setNewMemberData({ ...newMemberData, name: e.target.value })}
                  placeholder="e.g. Sunil Gavaskar"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={newMemberData.email}
                    onChange={(e) => setNewMemberData({ ...newMemberData, email: e.target.value })}
                    placeholder="sunil@example.com"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Phone *</label>
                  <input
                    type="tel"
                    required
                    value={newMemberData.phone}
                    onChange={(e) => setNewMemberData({ ...newMemberData, phone: e.target.value })}
                    placeholder="+91 98765 12345"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Address</label>
                <input
                  type="text"
                  value={newMemberData.address}
                  onChange={(e) => setNewMemberData({ ...newMemberData, address: e.target.value })}
                  placeholder="Street / City"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submittingMember}
                  className="w-full py-3 rounded-xl font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  {submittingMember ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Save Member to MongoDB</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Plan selection for member renewal */}
      {isRenewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">Select Renewal Plan</h3>
              <button onClick={() => setIsRenewModalOpen(false)} className="text-slate-400 hover:text-white">
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
              Proceed to Razorpay
            </button>
          </div>
        </div>
      )}

      {/* Razorpay checkout modal for admin renewal */}
      {selectedPlanForRenewal && !isRenewModalOpen && selectedMemberProfile && (
        <RazorpayPaymentModal
          isOpen={true}
          plan={selectedPlanForRenewal}
          member={selectedMemberProfile.member}
          onClose={() => setSelectedPlanForRenewal(null)}
          onSuccess={() => {
            // Re-fetch member record immediately from MongoDB to update state
            inspectMember(selectedMemberId);
            fetchMembers(true);
          }}
        />
      )}
    </div>
  );
};

export default AdminMembersPage;
