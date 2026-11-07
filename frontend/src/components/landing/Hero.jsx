import React from 'react';
import { ArrowRight, Sparkles, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';

export default function Hero({ onGetStarted }) {
  return (
    <section className="relative pt-36 pb-20 overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-indigo-600/20 blur-[130px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Top Badge */}
        <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs sm:text-sm font-medium mb-8">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>AI-Powered Multi-Tenant Social Commerce Bot</span>
        </div>

        {/* Heading */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight sm:leading-none">
          Turn Facebook Messenger into an <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-300 to-indigo-200">Autopilot Sales Engine</span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Connect your Facebook page in seconds. Let Gemini AI answer customer queries 24/7, recommend packages, verify orders, and sync data straight to your database.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={onGetStarted}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-3 px-8 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-base transition shadow-xl shadow-indigo-600/30"
          >
            <span>Start Free Today</span>
            <ArrowRight className="w-5 h-5" />
          </button>
          <a
            href="#how-it-works"
            className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-200 font-semibold text-base transition"
          >
            <span>See How it Works</span>
          </a>
        </div>

        {/* Trust Points */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs sm:text-sm text-slate-400">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Multi-Tenant Architecture</span>
          </div>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Row-Level Security (RLS)</span>
          </div>
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-emerald-400" />
            <span>Instant Webhook Routing</span>
          </div>
        </div>

        {/* Interactive Mock Preview Card */}
        <div className="mt-16 max-w-4xl mx-auto rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-6 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/80" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
            </div>
            <span className="text-xs text-slate-400 font-mono">Live Messenger Simulation</span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium">● Connected</span>
          </div>
          <div className="space-y-3 text-left max-w-lg mx-auto py-2">
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-3.5 max-w-[85%] text-slate-200 text-sm">
              Hello! Do you have website development packages available?
            </div>
            <div className="bg-indigo-600/90 text-white rounded-2xl p-3.5 ml-auto max-w-[85%] text-sm shadow-md">
              Yes, absolutely! We offer three main packages: Standard, Business, and E-commerce. Would you like me to share the pricing and delivery details for your business?
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

