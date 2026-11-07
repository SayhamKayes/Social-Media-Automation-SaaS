import React from 'react';
import { KeyRound, Sliders, PlayCircle } from 'lucide-react';

export default function HowItWorks() {
  const steps = [
    {
      step: "01",
      icon: <KeyRound className="w-6 h-6 text-indigo-400" />,
      title: "Connect Your Facebook Page",
      description: "Paste your Page ID and Long-Lived Page Access Token into the dashboard. We provide an easy step-by-step guide to get it in 2 minutes."
    },
    {
      step: "02",
      icon: <Sliders className="w-6 h-6 text-violet-400" />,
      title: "Set Your AI Sales Tone & Catalog",
      description: "Customize your business name, welcome greeting, and link your Products & Orders Google Sheets or Knowledge Base."
    },
    {
      step: "03",
      icon: <PlayCircle className="w-6 h-6 text-emerald-400" />,
      title: "Turn on 24/7 Autopilot",
      description: "Your bot handles incoming messages, answers queries in English or Bangla, and writes confirmed customer leads directly to your database."
    }
  ];

  return (
    <section id="how-it-works" className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs sm:text-sm font-semibold tracking-wider uppercase text-indigo-400">Simple Workflow</h2>
          <p className="mt-3 text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Live in 3 Simple Steps
          </p>
          <p className="mt-4 text-slate-400 text-base sm:text-lg">
            No complex setup. Connect your page, customize your sales instructions, and start closing deals automatically.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {steps.map((item, idx) => (
            <div key={idx} className="relative p-8 rounded-2xl bg-slate-900/60 border border-slate-800">
              <span className="text-5xl font-black text-slate-800 absolute top-6 right-6 select-none">
                {item.step}
              </span>
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6">
                {item.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

