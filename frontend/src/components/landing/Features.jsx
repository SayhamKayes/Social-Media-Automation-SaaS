import React from 'react';
import { Bot, FileSpreadsheet, Lock, Sparkles, MessageSquare, ShieldAlert } from 'lucide-react';

export default function Features() {
  const features = [
    {
      icon: <Bot className="w-6 h-6 text-indigo-400" />,
      title: "AI Sales Consultant",
      description: "Powered by Gemini 2.5 Flash, trained to behave like a polite, senior sales consultant that understands customer requirements."
    },
    {
      icon: <Lock className="w-6 h-6 text-violet-400" />,
      title: "Multi-Tenant Isolation",
      description: "Every user connects their own Facebook Page. Row-Level Security (RLS) guarantees your customer chats and credentials remain 100% private."
    },
    {
      icon: <FileSpreadsheet className="w-6 h-6 text-emerald-400" />,
      title: "Live Product & FAQ Sync",
      description: "Connect your Google Sheets or custom Knowledge Base. The AI strictly answers based on your catalog and pricing without hallucinating."
    },
    {
      icon: <ShieldAlert className="w-6 h-6 text-amber-400" />,
      title: "Pre-Confirmation Safety",
      description: "Orders are never submitted without explicit client approval. The AI summarizes name, phone, packages, and price before recording."
    },
    {
      icon: <MessageSquare className="w-6 h-6 text-sky-400" />,
      title: "Messenger Unicode Bold",
      description: "Formats Messenger texts with Unicode bold styling so important details pop on mobile without ugly unrendered asterisks."
    },
    {
      icon: <Sparkles className="w-6 h-6 text-pink-400" />,
      title: "Zero Server Maintenance",
      description: "Runs seamlessly on Supabase and Render keep-alive automation. No dedicated servers to maintain or expensive cloud bills."
    }
  ];

  return (
    <section id="features" className="py-24 bg-slate-900/40 border-y border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs sm:text-sm font-semibold tracking-wider uppercase text-indigo-400">Features</h2>
          <p className="mt-3 text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Built for Modern Social Commerce
          </p>
          <p className="mt-4 text-slate-400 text-base sm:text-lg">
            Everything your agency or business needs to automate client discovery, consultations, and confirmed orders.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="p-8 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition hover:-translate-y-1 shadow-lg group"
            >
              <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center mb-6 group-hover:scale-110 transition">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

