import React from 'react';
import { Bot, ArrowRight } from 'lucide-react';

export default function Navbar({ onOpenAuth, onGoToDashboard, user }) {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToSection = (e, sectionId) => {
    e.preventDefault();
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Link with Smooth Scroll to Top */}
        <button
          onClick={scrollToTop}
          className="flex items-center space-x-3 group text-left focus:outline-none"
          title="Back to Top"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white group-hover:text-slate-100 transition">
            AutoReply <span className="text-indigo-400">AI</span>
          </span>
        </button>

        {/* Smooth Scroll Navigation Links */}
        <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-300">
          <a
            href="#features"
            onClick={(e) => scrollToSection(e, 'features')}
            className="hover:text-white transition"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            onClick={(e) => scrollToSection(e, 'how-it-works')}
            className="hover:text-white transition"
          >
            How it Works
          </a>
          <a
            href="#pricing"
            onClick={(e) => scrollToSection(e, 'pricing')}
            className="hover:text-white transition"
          >
            Pricing
          </a>
        </nav>

        <div className="flex items-center space-x-4">
          {user ? (
            <button
              onClick={onGoToDashboard}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition shadow-lg shadow-indigo-600/30"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <>
              <button
                onClick={() => onOpenAuth('login')}
                className="text-sm font-semibold text-slate-300 hover:text-white transition px-4 py-2"
              >
                Log In
              </button>
              <button
                onClick={() => onOpenAuth('signup')}
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition shadow-lg shadow-indigo-600/30"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

