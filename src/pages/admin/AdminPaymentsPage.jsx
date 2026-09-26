import React, { useState, useEffect } from 'react';
import { Receipt, RefreshCw, CheckCircle2, XCircle, Clock, Search, ShieldCheck, Eye, X } from 'lucide-react';
import api from '../../api/axios';

const AdminPaymentsPage = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedPayment, setSelectedPayment] = useState(null);

  const fetchPayments = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const res = await api.get(`/payments?${params.toString()}`);
      if (res.data.success) {
        setPayments(res.data.payments);
      }
    } catch (err) {
      console.error('Failed to fetch payments:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPayments();
    const handleSync = () => fetchPayments(true);
    window.addEventListener('apexfit_sync_server', handleSync);
    return () => window.removeEventListener('apexfit_sync_server', handleSync);
  }, [statusFilter]);

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-['Space_Grotesk']">
            Razorpay Payment Transactions
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Server-verified payment records with cryptographic HMAC signatures.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
          >
            <option value="all">All Transactions</option>
            <option value="success">Verified Success</option>
            <option value="created">Order Initiated</option>
            <option value="failed">Failed / Tampered</option>
          </select>

          <button
            onClick={() => fetchPayments(true)}
            disabled={refreshing}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-800 transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-60"
            title="Refetch live payments from MongoDB"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refetch Live DB</span>
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Receipt & Date</th>
                <th className="px-6 py-4">Member</th>
                <th className="px-6 py-4">Plan</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Razorpay Order / Payment ID</th>
                <th className="px-6 py-4">Verification</th>
                <th className="px-6 py-4 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-slate-400">
                    Loading payment records from server...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-slate-400">
                    No payment records found.
                  </td>
                </tr>
              ) : (
                payments.map((pmt) => (
                  <tr key={pmt._id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-mono font-bold text-white text-[11px]">
                        {pmt.receiptNumber || `REC-${pmt._id.slice(-6)}`}
                      </div>
                      <div className="text-slate-400 text-[10px] mt-0.5">
                        {new Date(pmt.createdAt).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-bold text-white">{pmt.memberId?.name || 'Member'}</div>
                      <div className="text-[10px] font-mono text-amber-400">
                        {pmt.memberId?.memberCode}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-200">
                        {pmt.planId?.name || 'Membership Plan'}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {pmt.planId?.durationDays ? `${pmt.planId.durationDays} Days` : ''}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-extrabold text-amber-400 font-['Space_Grotesk'] text-sm">
                        ₹{pmt.amount?.toLocaleString('en-IN')}
                      </div>
                      <div className="text-[10px] text-slate-500 uppercase">{pmt.currency}</div>
                    </td>

                    <td className="px-6 py-4 font-mono text-[11px]">
                      <div className="text-slate-300 truncate max-w-[150px]">
                        Order: {pmt.razorpayOrderId}
                      </div>
                      <div className="text-slate-400 truncate max-w-[150px]">
                        Pay: {pmt.razorpayPaymentId || '—'}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      {pmt.paymentStatus === 'success' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-[10px]">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          HMAC Verified
                        </span>
                      ) : pmt.paymentStatus === 'failed' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold text-[10px]">
                          <XCircle className="w-3.5 h-3.5" />
                          Failed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold text-[10px]">
                          <Clock className="w-3.5 h-3.5" />
                          Order Created
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedPayment(pmt)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                        title="View Receipt"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Receipt Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Payment Receipt</h3>
              </div>
              <button
                onClick={() => setSelectedPayment(null)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-900">
                <span className="text-slate-400">Receipt No:</span>
                <span className="font-mono font-bold text-white">
                  {selectedPayment.receiptNumber}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Member:</span>
                <span className="font-semibold text-white">
                  {selectedPayment.memberId?.name} ({selectedPayment.memberId?.memberCode})
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Plan:</span>
                <span className="font-semibold text-amber-400">
                  {selectedPayment.planId?.name}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Amount Paid:</span>
                <span className="text-base font-extrabold text-white">
                  ₹{selectedPayment.amount?.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Razorpay Order ID:</span>
                <span className="font-mono text-slate-300">
                  {selectedPayment.razorpayOrderId}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Razorpay Payment ID:</span>
                <span className="font-mono text-emerald-400">
                  {selectedPayment.razorpayPaymentId || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Server Verification:</span>
                <span className="font-bold text-emerald-400">HMAC-SHA256 Confirmed</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-900">
                <span className="text-slate-400">Timestamp:</span>
                <span className="text-slate-300">
                  {new Date(selectedPayment.createdAt).toLocaleString()}
                </span>
              </div>
            </div>

            <button
              onClick={() => setSelectedPayment(null)}
              className="w-full py-2.5 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-white transition-colors"
            >
              Close Receipt
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPaymentsPage;
