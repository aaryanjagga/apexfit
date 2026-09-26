import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Dumbbell,
  ShieldCheck,
  Zap,
  Check,
  Clock,
  MapPin,
  ChevronRight,
  Flame,
  Award,
  Users,
  Sparkles,
} from 'lucide-react';
import api from '../../api/axios';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import RazorpayPaymentModal from '../../components/RazorpayPaymentModal';
import MemberAttendanceModal from '../../components/MemberAttendanceModal';

const LandingPage = () => {
  const [plans, setPlans] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);

  useEffect(() => {
    const fetchPublicData = async () => {
      try {
        const [plansRes, trainersRes] = await Promise.all([
          api.get('/plans'),
          api.get('/trainers'),
        ]);

        if (plansRes.data.success) {
          setPlans(plansRes.data.plans);
        }
        if (trainersRes.data.success) {
          setTrainers(trainersRes.data.trainers);
        }
      } catch (err) {
        console.error('Failed to fetch public gym data:', err);
      } finally {
        setLoadingPlans(false);
      }
    };

    fetchPublicData();
  }, []);

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    setIsPaymentModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-12 pb-24 md:pt-20 md:pb-32 overflow-hidden">
        {/* Background Ambient Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-20 right-10 w-96 h-96 bg-orange-600/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider mb-6">
            <Flame className="w-4 h-4 fill-amber-500" />
            Unleash Your Full Potential
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white font-['Space_Grotesk'] max-w-4xl mx-auto leading-[1.1]">
            Forge Your Peak <span className="text-amber-500 underline decoration-amber-500/40">Performance</span> & Strength
          </h1>

          <p className="mt-6 text-base sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Bengaluru’s premier high-performance fitness club. Olympic barbells, functional conditioning arena, steam recovery suites, and certified coaching.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#plans"
              className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-base bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-xl shadow-amber-500/25 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Zap className="w-5 h-5 fill-slate-950" />
              View Membership Plans
            </a>
            <Link
              to="/pass-lookup"
              className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-base bg-slate-900 hover:bg-slate-800 text-white border border-slate-800 transition-all flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              Member Pass Portal
            </Link>
            <button
              onClick={() => setIsAttendanceModalOpen(true)}
              className="w-full sm:w-auto px-7 py-4 rounded-xl font-bold text-base bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <MapPin className="w-5 h-5 fill-slate-950" />
              <span>Mark GPS Attendance</span>
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-16 pt-12 border-t border-slate-900 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-extrabold text-white font-['Space_Grotesk']">
                12,000+
              </div>
              <div className="text-xs sm:text-sm text-slate-400 font-medium">Sq. Ft. Training Floor</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-extrabold text-amber-500 font-['Space_Grotesk']">
                100%
              </div>
              <div className="text-xs sm:text-sm text-slate-400 font-medium">Digital Pass Check-ins</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-extrabold text-white font-['Space_Grotesk']">
                15+
              </div>
              <div className="text-xs sm:text-sm text-slate-400 font-medium">Certified Strength Coaches</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-extrabold text-emerald-400 font-['Space_Grotesk']">
                Razorpay
              </div>
              <div className="text-xs sm:text-sm text-slate-400 font-medium">Instant Secure Payments</div>
            </div>
          </div>
        </div>
      </section>

      {/* Membership Plans Section */}
      <section id="plans" className="py-20 bg-slate-900/40 border-y border-slate-900 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-500">
              Clear & Transparent Pricing
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white font-['Space_Grotesk'] mt-2">
              Select Your Membership Plan
            </h2>
            <p className="text-slate-400 mt-4 text-sm sm:text-base">
              Activate your pass immediately via Razorpay. Zero hidden fees, instant digital activation, and server-side verification.
            </p>
          </div>

          {loadingPlans ? (
            <div className="text-center py-12 text-slate-400">Loading plans from server...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {plans.map((plan) => (
                <div
                  key={plan._id}
                  className={`relative rounded-3xl p-7 flex flex-col justify-between transition-all duration-300 ${
                    plan.isPopular
                      ? 'bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-amber-500 shadow-2xl shadow-amber-500/10 -translate-y-2'
                      : 'bg-slate-900/80 border border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {plan.isPopular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-md">
                      Most Popular
                    </div>
                  )}

                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                      {plan.category || 'Gym Access'}
                    </span>
                    <h3 className="text-xl font-bold text-white mt-1">{plan.name}</h3>
                    <p className="text-xs text-slate-400 mt-2 min-h-[36px]">{plan.description}</p>

                    {/* Price */}
                    <div className="mt-6 pb-6 border-b border-slate-800">
                      <div className="flex items-baseline gap-1">
                        <span className="text-sm font-semibold text-slate-400">₹</span>
                        <span className="text-4xl font-extrabold text-white font-['Space_Grotesk']">
                          {plan.price?.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400 mt-1 block">
                        Valid for {plan.durationDays} Days
                      </span>
                    </div>

                    {/* Features list */}
                    <ul className="mt-6 space-y-3">
                      {plan.features?.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                          <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-8 pt-4">
                    <button
                      onClick={() => handleSelectPlan(plan)}
                      className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 ${
                        plan.isPopular
                          ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                          : 'bg-slate-800 hover:bg-slate-700 text-white'
                      }`}
                    >
                      <Zap className="w-4 h-4" />
                      Buy with Razorpay
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Facilities & Training Zones */}
      <section id="facilities" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-500">
            World-Class Infrastructure
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white font-['Space_Grotesk'] mt-2">
            Engineered for Pure Performance
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Dumbbell className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Heavy Iron & Olympic Racks</h3>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
              Calibrated Eleiko barbell plates, 8 power racks with lifting platforms, and dumbbells up to 60kg for serious lifters.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">HIIT & CrossFit Turf</h3>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
              30-meter indoor sled sprint track, Concept2 rowers, SkiErgs, assault bikes, and plyometric jump boxes.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Steam, Sauna & Recovery</h3>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
              Nordic dry sauna, eucalyptus steam chambers, and percussion therapy stations to accelerate muscle recovery.
            </p>
          </div>
        </div>
      </section>

      {/* Coaches Section */}
      <section id="coaches" className="py-20 bg-slate-900/40 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-500">
              Expert Mentorship
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white font-['Space_Grotesk'] mt-2">
              Certified Strength & Conditioning Coaches
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {trainers.map((coach) => (
              <div
                key={coach._id}
                className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 font-bold text-xl">
                  {coach.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{coach.name}</h3>
                  <span className="text-xs font-semibold text-amber-400">
                    {coach.specialization}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed min-h-[48px]">{coach.bio}</p>
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span>Experience:</span>
                  <span className="font-semibold text-slate-200">{coach.experienceYears} Years</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Member Pass Portal CTA Section */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl p-8 sm:p-14 bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 border border-amber-500/20 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              Live Server Digital Card
            </div>
            <h3 className="text-2xl sm:text-4xl font-extrabold text-white font-['Space_Grotesk']">
              Already an ApexFit Member?
            </h3>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              Check your real-time pass validity, verify days remaining, or instantly renew your membership via Razorpay Checkout.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Link
              to="/pass-lookup"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-sm bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <span>Member Pass Portal</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
            <button
              onClick={() => setIsAttendanceModalOpen(true)}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
            >
              <MapPin className="w-4 h-4 fill-slate-950" />
              <span>Mark GPS Attendance</span>
            </button>
          </div>
        </div>
      </section>

      {/* Hours & Location */}
      <section id="contact" className="py-16 bg-slate-900/60 border-t border-slate-900 text-slate-400 text-xs sm:text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-3">
            <h3 className="text-xl font-bold text-white font-['Space_Grotesk']">
              ApexFit Flagship Club
            </h3>
            <p className="text-slate-400">
              100 Feet Road, HAL 2nd Stage, Indiranagar, Bengaluru, Karnataka 560038
            </p>
            <p className="text-slate-400">
              Phone: +91 98765 43200 | Email: hello@apexfitclub.com
            </p>
          </div>
          <div className="space-y-1 md:text-right">
            <p className="text-white font-semibold">Club Operating Schedule</p>
            <p>Mon - Fri: 5:30 AM – 11:00 PM</p>
            <p>Sat - Sun: 6:00 AM – 9:00 PM</p>
            <p className="text-amber-400 text-xs">24/7 Access available for VIP Elite Tier</p>
          </div>
        </div>
      </section>

      <Footer />

      {/* Payment Checkout Modal */}
      {selectedPlan && (
        <RazorpayPaymentModal
          isOpen={isPaymentModalOpen}
          plan={selectedPlan}
          onClose={() => {
            setIsPaymentModalOpen(false);
            setSelectedPlan(null);
          }}
          onSuccess={() => {
            // Updated directly from server
          }}
        />
      )}

      {/* GPS Location Attendance Modal */}
      <MemberAttendanceModal
        isOpen={isAttendanceModalOpen}
        onClose={() => setIsAttendanceModalOpen(false)}
      />
    </div>
  );
};

export default LandingPage;
