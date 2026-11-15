import React, { useState, useEffect } from 'react';
import { Check, CheckCircle2, Sparkles, Users, Crown, Zap, ShieldCheck } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import bkashLogo from '../../assets/bkash.png';
import nagadLogo from '../../assets/nagad.png';
import rocketLogo from '../../assets/rocket.png';
import sslcommerzLogo from '../../assets/sslcommerz.svg';

/* Default 4 SaaS Packages matching Admin Panel single source of truth */
const DEFAULT_PACKAGES = [
  {
    id: 'free',
    name: 'Free Trial',
    badge: 'Default',
    price_bdt: '৳0',
    price_usd: '$0',
    period: '1 Month',
    pages_allowed: 1,
    description: 'Introductory plan for small pages testing AI sales automation.',
    features: [
      '1 Facebook Business Page',
      'Standard Google Gemini 1.5 Flash AI',
      'Basic Product Catalog & FAQ lookup',
      'Standard Messenger Support'
    ],
    is_popular: false
  },
  {
    id: 'starter',
    name: 'Starter Growth',
    badge: 'Popular',
    price_bdt: '৳1,499',
    price_usd: '$15',
    period: '/ mo',
    pages_allowed: 3,
    description: 'Ideal for independent shops and boutique ecommerce brands.',
    features: [
      'Up to 3 Connected Pages (FB & Instagram)',
      'Unlimited AI Messenger Inquiries',
      'Custom Sales Consultant Personality',
      'Automated Google Sheets Order Capture',
      'Basic Analytics & Lead Export'
    ],
    is_popular: true
  },
  {
    id: 'business',
    name: 'Business Pro',
    badge: 'High Value',
    price_bdt: '৳3,999',
    price_usd: '$39',
    period: '/ mo',
    pages_allowed: 10,
    description: 'High-volume businesses needing multi-channel auto-sales bots.',
    features: [
      'Up to 10 Connected Business Pages',
      'Facebook, Instagram & WhatsApp Ready',
      'Custom Knowledge Base & Product Engines',
      'Direct WhatsApp Order Notification Dispatch',
      'Dedicated RLS Database Isolation',
      'Priority AI Token Execution'
    ],
    is_popular: false
  },
  {
    id: 'agency',
    name: 'Agency Enterprise',
    badge: 'Master Tier',
    price_bdt: '৳9,999',
    price_usd: '$99',
    period: '/ mo',
    pages_allowed: 9999,
    description: 'For digital agencies managing dozens of client brand pages.',
    features: [
      'Unlimited Connected Social Accounts',
      'Full Multi-Tenant Sub-Client Management',
      'Custom System Prompt Library Presets',
      'Master Lead Audit & CRM Integration',
      '24/7 Priority VIP Uptime Guarantee',
      'Dedicated Workflow Tuning'
    ],
    is_popular: false
  }
];

export default function Pricing({
  user = null,
  userProfile = null,
  onSelectPlan,
  onGoToDashboard
}) {
  const [packages, setPackages] = useState(DEFAULT_PACKAGES);

  /* User active subscription state */
  const userPlanTier = user ? (userProfile?.plan_tier || 'free').toLowerCase() : null;
  const tierRanks = { free: 1, starter: 2, business: 3, agency: 4 };
  const currentRank = userPlanTier ? (tierRanks[userPlanTier] || 1) : 0;

  /* Function to load live packages from Supabase */
  const loadPackages = async () => {
    if (!isSupabaseConfigured()) return;
    try {
      const { data, error } = await supabase
        .from('subscription_packages')
        .select('*')
        .order('display_order', { ascending: true });

      if (!error && data && data.length > 0) {
        setPackages(data);
      }
    } catch (err) {
      console.warn('Using cached landing pricing plans:', err);
    }
  };

  /* Dynamically load and subscribe to Realtime Supabase changes */
  useEffect(() => {
    loadPackages();

    if (!isSupabaseConfigured()) return;

    /* Live Realtime subscription: updates Landing Page the instant Admin saves */
    const channel = supabase
      .channel('realtime:subscription_packages')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'subscription_packages' },
        () => {
          loadPackages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <>
      <section id="pricing" className="py-24 bg-slate-900/40 border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs sm:text-sm font-semibold tracking-wider uppercase text-indigo-400 mb-3">
              Transparent Tiered Pricing
            </h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Predictable Plans for Growing Businesses
            </p>
            <p className="mt-4 text-slate-400 text-sm sm:text-base leading-relaxed">
              Deploy autonomous AI sales agents on your Facebook pages. Choose the tier that matches your social volume and scale without friction.
            </p>
          </div>

          {/* 4-Tier Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {packages.map((tier) => {
              const isUnlimited = Number(tier.pages_allowed) >= 999;
              const displayPages = isUnlimited ? 'Unlimited' : `${tier.pages_allowed} Page${tier.pages_allowed > 1 ? 's' : ''}`;

              const isCurrentPlan = Boolean(user && userPlanTier === tier.id.toLowerCase());
              const isUpgrade = Boolean(user && (tierRanks[tier.id] || 1) > currentRank);

              let badgeClasses = 'bg-slate-800 text-slate-300 border border-slate-700';
              if (isCurrentPlan) {
                badgeClasses = 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-sm shadow-emerald-500/20';
              } else if (tier.id === 'starter' || tier.is_popular) {
                badgeClasses = 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm shadow-indigo-500/20';
              } else if (tier.id === 'business') {
                badgeClasses = 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm shadow-purple-500/20';
              } else if (tier.id === 'agency') {
                badgeClasses = 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/20';
              }

              return (
                <div
                  key={tier.id}
                  className={`relative p-6 sm:p-7 rounded-2xl border transition flex flex-col justify-between ${isCurrentPlan
                    ? 'bg-slate-900 border-emerald-500 shadow-2xl shadow-emerald-500/15 ring-2 ring-emerald-500/50'
                    : tier.is_popular
                      ? 'bg-slate-900/90 border-indigo-500 shadow-2xl shadow-indigo-500/10 ring-1 ring-indigo-500/40'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                >
                  {/* Current Active Plan Top Pill */}
                  {isCurrentPlan ? (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black uppercase tracking-wider flex items-center space-x-1 shadow-md shadow-emerald-500/30">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Current Tier</span>
                    </div>
                  ) : tier.is_popular ? (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3.5 py-0.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[10px] font-black uppercase tracking-wider flex items-center space-x-1 shadow-md shadow-indigo-500/20">
                      <Sparkles className="w-3 h-3" />
                      <span>Most Popular</span>
                    </div>
                  ) : null}

                  <div>
                    {/* Tier Header & Badge */}
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center space-x-1 ${badgeClasses}`}>
                        {isCurrentPlan ? (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            <span>In Use</span>
                          </>
                        ) : (
                          <span>{tier.badge || 'Standard'}</span>
                        )}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-white tracking-tight">{tier.name}</h3>
                    <p className="text-slate-400 text-xs mt-1.5 min-h-[32px] leading-relaxed">
                      {tier.description}
                    </p>

                    {/* Price Box */}
                    <div className="mt-4 pt-4 border-t border-slate-800">
                      <div className="flex items-baseline space-x-1.5">
                        <span className="text-3xl font-black text-white">{tier.price_bdt}</span>
                        <span className="text-xs text-slate-400 font-semibold">{tier.period || '/ mo'}</span>
                      </div>

                      {/* Allowed Pages quota highlight */}
                      <div className="mt-3 py-1.5 px-2.5 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs">
                        <span className="text-slate-400 text-[11px]">Social Quota:</span>
                        <strong className={`font-bold text-xs ${isCurrentPlan ? 'text-emerald-400' : 'text-indigo-300'}`}>
                          {displayPages}
                        </strong>
                      </div>
                    </div>

                    {/* Feature Bullets */}
                    <div className="mt-6 space-y-2">
                      <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                        Included Features
                      </p>
                      <ul className="space-y-2">
                        {Array.isArray(tier.features) && tier.features.map((feat, fIdx) => (
                          <li key={fIdx} className="flex items-start space-x-2 text-xs text-slate-300">
                            <Check className={`w-4 h-4 shrink-0 mt-0.5 ${isCurrentPlan ? 'text-emerald-400' : 'text-emerald-400'}`} />
                            <span className="leading-snug">{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Call to action */}
                  <div className="mt-8 pt-4 border-t border-slate-800">
                    {isCurrentPlan ? (
                      <button
                        type="button"
                        onClick={() => onGoToDashboard ? onGoToDashboard() : (onSelectPlan && onSelectPlan(tier, true))}
                        className="w-full py-3 rounded-xl font-bold text-xs transition shadow-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 flex items-center justify-center space-x-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Current Tier</span>
                      </button>
                    ) : user ? (
                      <button
                        type="button"
                        onClick={() => onSelectPlan && onSelectPlan(tier, false)}
                        className={`w-full py-3 rounded-xl font-bold text-xs transition shadow-lg ${isUpgrade
                          ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                          }`}
                      >
                        {isUpgrade ? `Upgrade to ${tier.name}` : `Switch to ${tier.name}`}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onSelectPlan && onSelectPlan(tier, false)}
                        className={`w-full py-3 rounded-xl font-bold text-xs transition shadow-lg ${tier.is_popular
                          ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                          : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                          }`}
                      >
                        {tier.id === 'free' ? 'Start Free Trial' : `Select ${tier.name}`}
                      </button>
                    )}

                    <p className="text-center text-[10px] text-slate-500 mt-2">
                      {isCurrentPlan ? (
                        <span className="text-emerald-400 font-medium">Your account is currently on this plan</span>
                      ) : (
                        isUnlimited ? 'Unlimited accounts' : `Strictly capped to ${displayPages}`
                      )}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Official Payment Gateways Section (Full-Width Border, Simple Workflow bg-slate-950 Background) */}
      <section className="w-full border-t border-slate-800/80 bg-slate-950 py-24 text-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto mb-10">
            <p className="text-xs sm:text-sm font-semibold tracking-wider uppercase text-indigo-400 mb-3">
              Official Payment Gateways
            </p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Accepted Payment Methods in Bangladesh
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-3 leading-relaxed">
              Seamlessly activate your subscription using any major Mobile Financial Service or debit and credit card in Bangladesh.
            </p>
          </div>

          {/* Prominent Payment Logos (Clean, unboxed, pure highlighted brand logos) */}
          <div className="flex flex-wrap items-center justify-center gap-10 sm:gap-14 md:gap-16 pt-2">
            {/* bKash */}
            <div className="flex items-center justify-center transition-transform duration-300 hover:scale-110 cursor-pointer">
              <img
                src={bkashLogo}
                alt="bKash"
                className="h-10 sm:h-12 md:h-14 w-auto object-contain drop-shadow-lg"
              />
            </div>

            {/* Nagad */}
            <div className="flex items-center justify-center transition-transform duration-300 hover:scale-110 cursor-pointer">
              <img
                src={nagadLogo}
                alt="Nagad"
                className="h-10 sm:h-12 md:h-14 w-auto object-contain drop-shadow-lg"
              />
            </div>

            {/* Rocket */}
            <div className="flex items-center justify-center transition-transform duration-300 hover:scale-110 cursor-pointer">
              <img
                src={rocketLogo}
                alt="Rocket"
                className="h-10 sm:h-12 md:h-14 w-auto object-contain drop-shadow-lg"
              />
            </div>

            {/* SSLCommerz */}
            <div className="flex items-center justify-center transition-transform duration-300 hover:scale-110 cursor-pointer">
              <img
                src={sslcommerzLogo}
                alt="SSLCOMMERZ"
                className="h-10 sm:h-12 md:h-14 w-auto object-contain drop-shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
