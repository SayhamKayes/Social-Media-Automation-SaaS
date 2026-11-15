import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck, 
  Zap, 
  Bot, 
  Phone, 
  Video, 
  Info, 
  FileSpreadsheet,
  CheckCheck
} from 'lucide-react';

export default function Hero({ onGetStarted }) {
  /* Animated Multi-Turn Messenger Simulation State */
  const [chatStep, setChatStep] = useState(1);

  useEffect(() => {
    const timer1 = setTimeout(() => setChatStep(2), 1200); // AI Typing 1
    const timer2 = setTimeout(() => setChatStep(3), 2600); // AI Reply 1
    const timer3 = setTimeout(() => setChatStep(4), 4600); // User Reply
    const timer4 = setTimeout(() => setChatStep(5), 5800); // AI Typing 2
    const timer5 = setTimeout(() => setChatStep(6), 7200); // AI Confirm & Sheet Sync
    const timerReset = setTimeout(() => setChatStep(1), 14000); // Loop back

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);
      clearTimeout(timerReset);
    };
  }, [chatStep === 1]);

  return (
    <section className="relative pt-36 pb-20 overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-indigo-600/20 blur-[130px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Top Eyebrow: Pure Styled Text Matching Features Top Header */}
        <p className="text-xs sm:text-sm font-semibold tracking-wider uppercase text-indigo-400 mb-6">
          AI-Powered Multi-Tenant Social Commerce Bot
        </p>

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

        {/* Large Animated Live Messenger Simulation */}
        <div className="mt-16 max-w-5xl mx-auto rounded-3xl border border-slate-800 bg-slate-900/80 shadow-2xl backdrop-blur-xl overflow-hidden text-left">
          {/* Messenger Window Header */}
          <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
            <div className="flex items-center space-x-3.5">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/20">
                  <Bot className="w-5 h-5" />
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-950 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <h3 className="text-sm font-bold text-white tracking-tight">AudioCraft BD (Official Page)</h3>
                  <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-bold">AI Bot</span>
                </div>
                <p className="text-[11px] text-slate-400 flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Active Now • Gemini 1.5 Flash Autopilot</span>
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 text-slate-400">
              <div className="hidden sm:flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Live Simulation</span>
              </div>
              <Phone className="w-4 h-4 hover:text-white cursor-pointer transition hidden sm:block" />
              <Video className="w-4 h-4 hover:text-white cursor-pointer transition hidden sm:block" />
              <Info className="w-4 h-4 hover:text-white cursor-pointer transition" />
            </div>
          </div>

          {/* Conversation Chat Stream */}
          <div className="p-5 sm:p-7 space-y-4 min-h-[380px] sm:min-h-[420px] bg-gradient-to-b from-slate-950/40 to-slate-900/60 flex flex-col justify-end">
            {/* Timestamp */}
            <div className="text-center my-1">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider bg-slate-950/60 px-3 py-1 rounded-full border border-slate-800">
                Today 10:42 AM • Messenger
              </span>
            </div>

            {/* Turn 1: Customer Question */}
            {chatStep >= 1 && (
              <div className="flex items-end space-x-2.5 max-w-[85%] sm:max-w-[70%] animate-fade-in">
                <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs text-slate-300 font-bold shrink-0">
                  T
                </div>
                <div className="bg-slate-800/90 border border-slate-700/70 rounded-2xl rounded-bl-sm p-4 text-slate-200 text-xs sm:text-sm shadow-md leading-relaxed">
                  <p>Hello! Do you have the Black Edition wireless headset in stock?</p>
                  <span className="text-[10px] text-slate-500 block text-right mt-1">10:42 AM</span>
                </div>
              </div>
            )}

            {/* AI Typing Indicator for Turn 1 */}
            {chatStep === 2 && (
              <div className="flex items-center space-x-2 ml-auto animate-fade-in">
                <div className="bg-indigo-600/40 border border-indigo-500/30 rounded-2xl rounded-br-sm px-4 py-3 flex items-center space-x-1.5 shadow-md">
                  <span className="w-2 h-2 rounded-full bg-indigo-300 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-indigo-300 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-indigo-300 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            {/* Turn 2: AI Consultant Response */}
            {chatStep >= 3 && (
              <div className="flex items-end space-x-2.5 max-w-[88%] sm:max-w-[75%] ml-auto justify-end animate-fade-in">
                <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl rounded-br-sm p-4 text-white text-xs sm:text-sm shadow-xl shadow-indigo-600/20 leading-relaxed space-y-1.5">
                  <p>
                    Hello! Yes, we have 4 units left of <strong>Black Edition</strong> at <strong>৳2,490</strong> with 1-Year Official Warranty.
                  </p>
                  <p className="text-indigo-100 text-[11px] sm:text-xs">
                    Would you like to confirm an order today with free express delivery?
                  </p>
                  <div className="flex items-center justify-between pt-1 border-t border-indigo-400/20 text-[10px] text-indigo-200">
                    <span className="flex items-center space-x-1">
                      <Zap className="w-3 h-3 text-amber-300" />
                      <span>Gemini 1.5 Flash • 0.8s response</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <span>10:42 AM</span>
                      <CheckCheck className="w-3.5 h-3.5 text-indigo-300" />
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Turn 3: Customer Order Details */}
            {chatStep >= 4 && (
              <div className="flex items-end space-x-2.5 max-w-[85%] sm:max-w-[70%] animate-fade-in">
                <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs text-slate-300 font-bold shrink-0">
                  T
                </div>
                <div className="bg-slate-800/90 border border-slate-700/70 rounded-2xl rounded-bl-sm p-4 text-slate-200 text-xs sm:text-sm shadow-md leading-relaxed">
                  <p>Yes please! My name is Tanvir Ahmed, phone: 01712-345678, Dhanmondi 27, Dhaka.</p>
                  <span className="text-[10px] text-slate-500 block text-right mt-1">10:43 AM</span>
                </div>
              </div>
            )}

            {/* AI Typing Indicator for Turn 3 */}
            {chatStep === 5 && (
              <div className="flex items-center space-x-2 ml-auto animate-fade-in">
                <div className="bg-indigo-600/40 border border-indigo-500/30 rounded-2xl rounded-br-sm px-4 py-3 flex items-center space-x-1.5 shadow-md">
                  <span className="w-2 h-2 rounded-full bg-indigo-300 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-indigo-300 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-indigo-300 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            {/* Turn 4: AI Order Confirmation & Auto Sync */}
            {chatStep >= 6 && (
              <div className="flex items-end space-x-2.5 max-w-[88%] sm:max-w-[75%] ml-auto justify-end animate-fade-in">
                <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl rounded-br-sm p-4 text-white text-xs sm:text-sm shadow-xl shadow-indigo-600/20 leading-relaxed space-y-2">
                  <p className="font-bold text-white flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    <span>Order Confirmed, Tanvir!</span>
                  </p>
                  <div className="p-2.5 rounded-xl bg-black/20 border border-white/10 text-xs space-y-1 font-mono">
                    <p>• Item: Black Edition Headset (৳2,490)</p>
                    <p>• Payment: Cash on Delivery (Free Delivery)</p>
                    <p>• Delivery Address: Dhanmondi 27, Dhaka</p>
                    <p>• Dispatch: Within 24 Hours</p>
                  </div>

                  {/* Google Sheets Live Sync Chip */}
                  <div className="p-2 rounded-lg bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs flex items-center justify-between font-sans">
                    <span className="flex items-center space-x-1.5">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Synced to Google Sheets #ORD-9842</span>
                    </span>
                    <span className="font-bold text-[10px] text-emerald-300 uppercase">Automated</span>
                  </div>

                  <div className="flex items-center justify-end text-[10px] text-indigo-200 pt-0.5">
                    <span className="flex items-center space-x-1">
                      <span>10:43 AM</span>
                      <CheckCheck className="w-3.5 h-3.5 text-indigo-300" />
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Messenger Bottom Quick Reply Bar */}
          <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
            <span className="font-mono text-[11px] text-indigo-400 flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Simulating 24/7 Autopilot order capture</span>
            </span>
            <button
              onClick={() => setChatStep(1)}
              className="text-[11px] px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition"
            >
              Replay Chat
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

