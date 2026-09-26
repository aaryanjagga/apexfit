import React, { useState } from 'react';
import { X, CheckCircle2, AlertCircle, Loader2, ShieldCheck, CreditCard, Lock } from 'lucide-react';
import confetti from 'canvas-confetti';
import api from '../api/axios';

const RazorpayPaymentModal = ({ plan, member, isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: member?.name || '',
    email: member?.email || '',
    phone: member?.phone || '',
  });

  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);

  if (!isOpen || !plan) return null;

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleStartPayment = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let targetMemberId = member?.id || member?._id;

      // If user is registering fresh from landing page:
      if (!targetMemberId) {
        if (!formData.name || !formData.email || !formData.phone) {
          setError('Please provide your full name, email address, and phone number.');
          setLoading(false);
          return;
        }

        // Check if member already exists by email/phone or create one
        try {
          const passLookup = await api.get(`/members/lookup/pass?query=${encodeURIComponent(formData.email)}`);
          if (passLookup.data.success && passLookup.data.member) {
            targetMemberId = passLookup.data.member.id;
          }
        } catch {
          // If not found, create new member via server
          const newMemberRes = await api.post('/members', {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
          });
          targetMemberId = newMemberRes.data.member._id;
        }
      }

      // Step 2 & 3: Request Razorpay Order from backend
      const orderRes = await api.post('/payments/create-order', {
        planId: plan._id || plan.id,
        memberId: targetMemberId,
      });

      if (!orderRes.data.success) {
        throw new Error(orderRes.data.message || 'Failed to create payment order on backend.');
      }

      const { orderId, amount, currency, keyId, isSimulation } = orderRes.data;

      // Handle Razorpay Checkout Modal
      if (typeof window !== 'undefined' && window.Razorpay && !isSimulation) {
        const options = {
          key: keyId,
          amount: amount,
          currency: currency || 'INR',
          name: 'ApexFit Gym & Performance',
          description: `Membership: ${plan.name} (${plan.durationDays} Days)`,
          order_id: orderId,
          prefill: {
            name: formData.name || member?.name,
            email: formData.email || member?.email,
            contact: formData.phone || member?.phone,
          },
          theme: {
            color: '#f59e0b',
          },
          handler: async function (response) {
            // Step 8: Frontend sends returned tokens to backend for server-side verification
            await sendVerificationToBackend({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              memberId: targetMemberId,
              planId: plan._id || plan.id,
            });
          },
          modal: {
            ondismiss: function () {
              setLoading(false);
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (failResponse) {
          setError(`Payment Failed: ${failResponse.error?.description || 'Transaction declined'}`);
          setLoading(false);
        });
        rzp.open();
        setLoading(false);
      } else {
        // Fallback simulation mode for testing when live keys are placeholders:
        const simRes = await api.post('/payments/simulate-checkout-success', {
          orderId,
        });

        await sendVerificationToBackend({
          razorpayOrderId: simRes.data.razorpay_order_id,
          razorpayPaymentId: simRes.data.razorpay_payment_id,
          razorpaySignature: simRes.data.razorpay_signature,
          memberId: targetMemberId,
          planId: plan._id || plan.id,
        });
      }
    } catch (err) {
      console.error('Payment Error:', err);
      setError(err.response?.data?.message || err.message || 'An error occurred while processing payment.');
      setLoading(false);
      setVerifying(false);
    }
  };

  // Step 9 & 10: Strict server-side verification
  const sendVerificationToBackend = async (payload) => {
    setVerifying(true);
    setLoading(false);
    try {
      const verifyRes = await api.post('/payments/verify', payload);

      if (verifyRes.data.success) {
        setVerificationResult(verifyRes.data);
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });

        if (onSuccess) {
          onSuccess(verifyRes.data);
        }
      } else {
        setError(verifyRes.data.message || 'Server verification failed.');
      }
    } catch (verErr) {
      console.error('Verification Error:', verErr);
      setError(
        verErr.response?.data?.message ||
          'Payment verification failed on the server. Membership was not activated.'
      );
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Membership Checkout</h3>
              <p className="text-xs text-slate-400">Powered by Razorpay Secure Gateway</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {verificationResult ? (
            /* Verified Success View */
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-white">
                  Payment Verified & Activated!
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Cryptographically confirmed and stored in MongoDB.
                </p>
              </div>

              {/* Pass Card Details */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-left space-y-2 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
                  <span className="text-slate-400">Member:</span>
                  <span className="font-semibold text-white">
                    {verificationResult.member?.name} ({verificationResult.member?.memberCode})
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Plan:</span>
                  <span className="font-semibold text-amber-400">{plan.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">New Expiry Date:</span>
                  <span className="font-semibold text-emerald-400">
                    {verificationResult.membership?.endDate
                      ? new Date(verificationResult.membership.endDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Payment ID:</span>
                  <span className="font-mono text-slate-300">
                    {verificationResult.payment?.razorpayPaymentId}
                  </span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg shadow-amber-500/20"
              >
                Done / View Pass
              </button>
            </div>
          ) : (
            /* Checkout Form View */
            <form onSubmit={handleStartPayment} className="space-y-4">
              {/* Plan Summary Box */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs uppercase tracking-wider font-semibold text-amber-400">
                    Selected Plan
                  </span>
                  <h4 className="text-base font-bold text-white">{plan.name}</h4>
                  <p className="text-xs text-slate-400">{plan.durationDays} Days Unlimited Access</p>
                </div>
                <div className="text-right">
                  <div className="text-xl font-extrabold text-white">
                    ₹{plan.price?.toLocaleString('en-IN')}
                  </div>
                  <span className="text-[11px] text-emerald-400 font-medium flex items-center justify-end gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> All taxes included
                  </span>
                </div>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-2.5 text-rose-400 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Member Details Fields (if not already provided) */}
              {!member && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g. Arjun Verma"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="e.g. arjun@example.com"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="e.g. +91 98765 43210"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                </div>
              )}

              {member && (
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs space-y-1">
                  <div className="text-slate-400">
                    Renewing Pass For: <span className="font-semibold text-white">{member.name}</span>
                  </div>
                  <div className="text-slate-400">
                    Member Code: <span className="font-mono text-amber-400">{member.memberCode}</span>
                  </div>
                </div>
              )}

              {/* Security Banner */}
              <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1">
                <Lock className="w-3.5 h-3.5 text-amber-500" />
                <span>HMAC-SHA256 Server Signature Verification Guaranteed</span>
              </div>

              {/* Action Button */}
              <button
                type="submit"
                disabled={loading || verifying}
                className="w-full py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                {loading || verifying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{verifying ? 'Verifying with Server...' : 'Connecting Gateway...'}</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Pay ₹{plan.price?.toLocaleString('en-IN')} with Razorpay</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default RazorpayPaymentModal;
