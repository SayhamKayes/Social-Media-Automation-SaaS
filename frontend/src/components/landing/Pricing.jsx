import React from 'react';
import { Check, Sparkles } from 'lucide-react';

export default function Pricing({ onSelectPlan }) {
  const plans = [
    {
      name: "Free Starter",
      price: "$0",
      period: "forever",
      description: "Ideal for testing your workflow and running a single business page.",
      popular: false,
      features: [
        "1 Facebook Page connected",
        "Up to 1,500 AI replies / month",
        "Google Sheets Sync (Products & Orders)",
        "Pre-confirmation Order Guard",
        "Community Support"
      ],
      buttonText: "Start Free",
      action: () => onSelectPlan('free')
    },
    {
      name: "Agency Pro",
      price: "$29",
      period: "/ month",
      description: "For agencies and growing businesses managing multiple client pages.",
      popular: true,
      features: [
        "Unlimited Facebook Pages",
        "Unlimited AI Conversations",
        "Custom Knowledge Base (RAG)",
        "Multi-agent Sales Consultation",
        "Priority Webhook Queue",
        "24/7 Dedicated Support"
      ],
      buttonText: "Upgrade to Pro",
      action: () => onSelectPlan('pro')
    }
  ];

  return (
    <section id="pricing" className="py-24 bg-slate-900/40 border-t border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs sm:text-sm font-semibold tracking-wider uppercase text-indigo-400">Pricing</h2>
          <p className="mt-3 text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Transparent Pricing for High ROI
          </p>
          <p className="mt-4 text-slate-400 text-base sm:text-lg">
            Start 100% free with your own Google Gemini Free Tier API key, upgrade when you scale.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, idx) => (
            <div
              key={idx}
              className={`relative p-8 rounded-2xl border transition ${
                plan.popular
                  ? 'bg-slate-900/90 border-indigo-500 shadow-2xl shadow-indigo-500/10'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-xs font-bold uppercase tracking-wider flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Most Popular</span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                <p className="text-slate-400 text-sm mt-1">{plan.description}</p>
                <div className="mt-4 flex items-baseline space-x-1">
                  <span className="text-4xl font-black text-white">{plan.price}</span>
                  <span className="text-slate-400 text-sm">{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feat, fIdx) => (
                  <li key={fIdx} className="flex items-center space-x-3 text-sm text-slate-300">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={plan.action}
                className={`w-full py-3.5 rounded-xl font-bold text-sm transition shadow-lg ${
                  plan.popular
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                    : 'bg-slate-800 hover:bg-slate-700 text-white'
                }`}
              >
                {plan.buttonText}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

