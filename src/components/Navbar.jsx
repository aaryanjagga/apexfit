import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Dumbbell, Menu, X, ShieldCheck, Zap } from 'lucide-react';

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo Branding */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform duration-200">
              <Dumbbell className="w-6 h-6 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-2xl font-extrabold tracking-tight text-white font-['Space_Grotesk']">
                  APEX<span className="text-amber-500">FIT</span>
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-amber-500/10 text-amber-400 rounded border border-amber-500/20">
                  CLUB
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium tracking-wide">
                High Performance Fitness
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <a
              href="/#plans"
              className="text-sm font-semibold text-slate-300 hover:text-amber-400 transition-colors"
            >
              Plans & Pricing
            </a>
            <Link
              to="/pass-lookup"
              className="text-sm font-semibold text-slate-300 hover:text-amber-400 transition-colors flex items-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Member Pass Portal
            </Link>
            <a
              href="/#facilities"
              className="text-sm font-semibold text-slate-300 hover:text-amber-400 transition-colors"
            >
              Facilities
            </a>
            <a
              href="/#coaches"
              className="text-sm font-semibold text-slate-300 hover:text-amber-400 transition-colors"
            >
              Coaches
            </a>
            <a
              href="/#contact"
              className="text-sm font-semibold text-slate-300 hover:text-amber-400 transition-colors"
            >
              Hours & Location
            </a>
          </div>

          {/* Public Action CTA */}
          <div className="hidden md:flex items-center gap-4">
            <a
              href="/#plans"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all duration-200 active:scale-95"
            >
              <Zap className="w-4 h-4 fill-slate-950" />
              Join ApexFit
            </a>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 focus:outline-none"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-slate-950/95 px-4 pt-2 pb-6 space-y-3">
          <a
            href="/#plans"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-300 hover:bg-slate-900 hover:text-amber-400"
          >
            Plans & Pricing
          </a>
          <Link
            to="/pass-lookup"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-base font-medium text-slate-300 hover:bg-slate-900 hover:text-amber-400"
          >
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            Member Pass Portal
          </Link>
          <a
            href="/#facilities"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-300 hover:bg-slate-900 hover:text-amber-400"
          >
            Facilities
          </a>
          <a
            href="/#coaches"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-300 hover:bg-slate-900 hover:text-amber-400"
          >
            Coaches
          </a>
          <a
            href="/#contact"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-300 hover:bg-slate-900 hover:text-amber-400"
          >
            Hours & Location
          </a>
          <div className="pt-2">
            <a
              href="/#plans"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center block px-4 py-3 rounded-xl font-bold bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
            >
              Join ApexFit
            </a>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
