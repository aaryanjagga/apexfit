import React from 'react';
import { Dumbbell, MapPin, Phone, Mail, Clock, Shield, Globe, Share2, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-slate-950 border-t border-slate-900 text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center text-slate-950">
                <Dumbbell className="w-5 h-5 stroke-[2.5]" />
              </div>
              <span className="text-xl font-extrabold tracking-tight text-white font-['Space_Grotesk']">
                APEX<span className="text-amber-500">FIT</span>
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed text-xs sm:text-sm">
              Premier high-performance fitness center equipped with Olympic-grade strength equipment, HIIT zones, wellness recovery suites, and certified fitness coaches.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <span className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors cursor-pointer">
                <Globe className="w-4 h-4" />
              </span>
              <span className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors cursor-pointer">
                <Share2 className="w-4 h-4" />
              </span>
              <span className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors cursor-pointer">
                <MessageCircle className="w-4 h-4" />
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-white font-bold text-base tracking-wide uppercase font-['Space_Grotesk']">
              Club Links
            </h4>
            <ul className="space-y-2.5">
              <li>
                <a href="/#plans" className="hover:text-amber-400 transition-colors">
                  Membership Plans & Pricing
                </a>
              </li>
              <li>
                <Link to="/pass-lookup" className="hover:text-amber-400 transition-colors flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  Digital Pass & Renewal
                </Link>
              </li>
              <li>
                <a href="/#facilities" className="hover:text-amber-400 transition-colors">
                  Gym Zones & Facilities
                </a>
              </li>
              <li>
                <a href="/#coaches" className="hover:text-amber-400 transition-colors">
                  Certified Personal Trainers
                </a>
              </li>
            </ul>
          </div>

          {/* Club Hours */}
          <div className="space-y-4">
            <h4 className="text-white font-bold text-base tracking-wide uppercase font-['Space_Grotesk']">
              Operating Hours
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <span className="text-white font-medium">Monday – Friday:</span>
                  <p className="text-slate-400">5:30 AM – 11:00 PM</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <span className="text-white font-medium">Saturday & Sunday:</span>
                  <p className="text-slate-400">6:00 AM – 9:00 PM</p>
                </div>
              </li>
              <li className="text-xs text-amber-400/90 pt-1">
                * VIP Elite Members enjoy 24/7 Access Pass
              </li>
            </ul>
          </div>

          {/* Club Location & Contact */}
          <div className="space-y-4">
            <h4 className="text-white font-bold text-base tracking-wide uppercase font-['Space_Grotesk']">
              Contact & Location
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <span>ApexFit Club, 100 Feet Road, Indiranagar, Bangalore, 560038</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-amber-500 shrink-0" />
                <span>+91 98765 43200</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-500 shrink-0" />
                <span>hello@apexfitclub.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p>© {new Date().getFullYear()} ApexFit Gym & Performance Club. All rights reserved.</p>
          <div className="flex items-center gap-6 text-slate-500">
            <span className="hover:text-slate-400 cursor-pointer">Terms of Service</span>
            <span className="hover:text-slate-400 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-slate-400 cursor-pointer">Safety Guidelines</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
