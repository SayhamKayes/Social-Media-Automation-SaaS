import React, { useState, useEffect } from 'react';
import { 
  Facebook, 
  ShoppingBag, 
  MessageSquare, 
  ArrowUpRight, 
  CheckCircle, 
  Zap, 
  Share2, 
  KeyRound,
  Sparkles,
  ShieldAlert,
  AlertCircle,
  Clock
} from 'lucide-react';
import { 
  getLocalQuotaUsage, 
  fetchSupabaseQuotaUsage, 
  getEffectiveUserQuota 
} from '../../lib/knowledgeLibrary';

export default function DashboardOverview({ pages = [], orders = [], userProfile = null, onNavigate }) {
  const userId = userProfile?.id || 'default';
  const [usageState, setUsageState] = useState(() => getLocalQuotaUsage(userId));

  useEffect(() => {
    let isMounted = true;
    fetchSupabaseQuotaUsage(userId).then((fresh) => {
      if (isMounted && fresh) setUsageState(fresh);
    });
    const handleQuotaEvent = (e) => {
      if (isMounted && (!e.detail?.userId || e.detail.userId === userId)) {
        setUsageState(e.detail?.usage || getLocalQuotaUsage(userId));
      }
    };
    window.addEventListener('saas-quota-updated', handleQuotaEvent);
    return () => {
      isMounted = false;
      window.removeEventListener('saas-quota-updated', handleQuotaEvent);
    };
  }, [userId]);

  const effectiveQuota = getEffectiveUserQuota(userProfile, usageState);
  const msgPercent = Math.min(100, Math.round((effectiveQuota.messagesUsed / effectiveQuota.messageLimit) * 100));
  const tokenPercent = Math.min(100, Math.round((effectiveQuota.tokensUsed / effectiveQuota.tokenLimit) * 100));
  const postPercent = Math.min(100, Math.round((effectiveQuota.postsUsed / effectiveQuota.postLimit) * 100));
  const resetDateFormatted = effectiveQuota.nextResetDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  const isUserSuspended = userProfile?.status === 'suspended';
  const expiresAt = userProfile?.subscription_expires_at 
    ? new Date(userProfile.subscription_expires_at) 
    : userProfile?.created_at 
      ? new Date(new Date(userProfile.created_at).getTime() + 30 * 24 * 60 * 60 * 1000)
      : null;
  const isSubscriptionExpired = expiresAt ? (new Date() > expiresAt) : false;
  const isFreeTrial = (userProfile?.plan_tier || 'free').toLowerCase() === 'free';
  const isFreeTrialExpired = isFreeTrial && isSubscriptionExpired;

  const activePages = pages.filter(p => p.is_active && !isUserSuspended && p.bot_status !== 'SUSPENDED' && !isSubscriptionExpired);
  const totalRevenue = orders.reduce((acc, curr) => acc + (Number(curr.total_amount_bdt) || 0), 0);

  const stats = [
    {
      title: "Active Channels",
      value: isUserSuspended 
        ? "0 Active" 
        : isFreeTrialExpired
          ? "0 Active"
          : `${activePages.length} Pages`,
      change: isUserSuspended 
        ? "Suspended by Admin" 
        : isFreeTrialExpired
          ? "Trial Expired (Pay Required)"
          : "Facebook & Instagram",
      icon: Share2,
      color: isUserSuspended ? "text-rose-400" : isFreeTrialExpired ? "text-amber-400" : "text-blue-400",
      bg: isUserSuspended ? "bg-rose-500/10" : isFreeTrialExpired ? "bg-amber-500/10" : "bg-blue-500/10"
    },
    {
      title: "Secured Orders",
      value: orders.length,
      change: "Across all channels",
      icon: ShoppingBag,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10"
    },
    {
      title: "Est. Revenue (BDT)",
      value: `৳${totalRevenue.toLocaleString()}`,
      change: "From bot sales",
      icon: Zap,
      color: "text-amber-400",
      bg: "bg-amber-500/10"
    },
    {
      title: "AI Response Status",
      value: isUserSuspended 
        ? "HALTED" 
        : isFreeTrialExpired
          ? "TRIAL EXPIRED"
          : isSubscriptionExpired 
            ? "PAUSED" 
            : "Online 24/7",
      change: isUserSuspended 
        ? "Admin Suspension Active" 
        : isFreeTrialExpired
          ? "Payment required to resume"
          : isSubscriptionExpired 
            ? "30-Day Period Expired" 
            : "Gemini 2.5 Flash",
      icon: MessageSquare,
      color: isUserSuspended 
        ? "text-rose-400" 
        : isFreeTrialExpired || isSubscriptionExpired
          ? "text-amber-400" 
          : "text-indigo-400",
      bg: isUserSuspended 
        ? "bg-rose-500/10" 
        : isFreeTrialExpired || isSubscriptionExpired
          ? "bg-amber-500/10" 
          : "bg-indigo-500/10"
    }
  ];

  return (
    <div className="space-y-8">
      {/* Top Banner Alert for Suspended Accounts */}
      {isUserSuspended && (
        <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-rose-300 shadow-xl">
          <div className="flex items-start sm:items-center space-x-3">
            <ShieldAlert className="w-6 h-6 text-rose-400 shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-rose-300">
                Account Suspended by Administrator
              </p>
              <p className="text-xs text-rose-300/80 mt-0.5">
                Your entire multi-tenant tenant has been marked as suspended by a platform administrator. Incoming Messenger hooks and automated AI replies are completely halted.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('profile')}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shrink-0 transition"
          >
            Review Profile
          </button>
        </div>
      )}

      {/* Top Banner Alert for Expired Free Trial */}
      {isFreeTrialExpired && !isUserSuspended && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-amber-500/15 to-amber-950/30 border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-amber-200 shadow-2xl">
          <div className="flex items-start sm:items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
              <AlertCircle className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <p className="text-sm font-black uppercase tracking-wider text-amber-300">
                  1-Month Free Trial Has Expired
                </p>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                  Payment Required
                </span>
              </div>
              <p className="text-xs text-amber-200/90 mt-1 leading-relaxed">
                Your 30-day Free Trial period has ended and automated AI bot replies are now halted. To continue using the AutoReply system and reactivate your bots, please choose and pay for a subscription package.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('profile')}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shrink-0 transition shadow-lg shadow-amber-500/30 flex items-center justify-center space-x-1.5 self-start sm:self-auto"
          >
            <span>Upgrade &amp; Pay Now</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Banner Alert for Expired Paid Subscriptions */}
      {isSubscriptionExpired && !isFreeTrial && !isUserSuspended && (
        <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-amber-200 shadow-xl">
          <div className="flex items-start sm:items-center space-x-3">
            <AlertCircle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-amber-300">
                30-Day Subscription Has Expired
              </p>
              <p className="text-xs text-amber-300/80 mt-0.5">
                Your 30-day billing period has concluded. Autopilot replies are currently paused. Renew your subscription to immediately restore automated customer responses.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('profile')}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shrink-0 transition"
          >
            Renew Plan
          </button>
        </div>
      )}

      {/* Top Banner Alert when AI Token Limit is Exhausted */}
      {effectiveQuota.isTokenExhausted && !isUserSuspended && (
        <div className="p-4 sm:p-5 rounded-2xl bg-rose-500/15 border border-rose-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-rose-200 shadow-2xl">
          <div className="flex items-start sm:items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center shrink-0">
              <AlertCircle className="w-6 h-6 text-rose-400" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-black uppercase tracking-wider text-rose-300">
                  AI Token Limit Exhausted (0 Tokens Remaining)
                </p>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30 flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>Resets on: {resetDateFormatted}</span>
                </span>
              </div>
              <p className="text-xs text-rose-200/90 mt-1 leading-relaxed">
                Your monthly Bot AI Token allowance ({effectiveQuota.tokenLimit.toLocaleString()} Tokens) has been fully consumed. Your token quota will automatically reset on <strong>{resetDateFormatted}</strong>, or you can upgrade / add payment now to top up extra tokens immediately.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('profile')}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shrink-0 transition shadow-lg shadow-rose-600/30 flex items-center justify-center space-x-1.5 self-start sm:self-auto"
          >
            <span>Add Payment / Top-Up Tokens</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Dashboard Overview</h2>
        <p className="text-sm text-slate-400 mt-1">
          Monitor your active social media channels, multi-tenant automated replies, and incoming customer leads.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div key={idx} className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{s.title}</span>
                <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${s.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="text-xs text-slate-500 mt-1">{s.change}</p>
            </div>
          );
        })}
      </div>

      {/* Monthly Plan Quota & AI Token Meter */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">
              Monthly Plan Quotas ({effectiveQuota.planName} • {effectiveQuota.priceBDT})
            </h3>
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-[11px] font-semibold">
              <Clock className="w-3 h-3" />
              <span>Next Token Reset: {resetDateFormatted}</span>
            </span>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('profile')}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center space-x-1 self-start sm:self-auto"
          >
            <span>Increase Quota / Upgrade Plan</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Message Credit Meter */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-semibold">Message Credit</span>
              <span className="font-mono font-bold text-emerald-400">
                {effectiveQuota.messagesUsed.toLocaleString()} / {effectiveQuota.messageLimit.toLocaleString()}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${Math.max(4, msgPercent)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
              <span>Remaining: <strong className="text-emerald-300 font-mono">{effectiveQuota.messagesRemaining.toLocaleString()}</strong></span>
              <span>Resets: {resetDateFormatted}</span>
            </div>
          </div>

          {/* Bot AI Token Meter */}
          <div className={`p-3.5 rounded-xl bg-slate-950 border space-y-2 ${
            effectiveQuota.isTokenExhausted ? 'border-rose-500/50 bg-rose-950/10' : 'border-slate-800'
          }`}>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-semibold flex items-center space-x-1.5">
                <span>Bot AI Token Quota</span>
                {effectiveQuota.isTokenExhausted && (
                  <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[9px] font-bold uppercase border border-rose-500/30">
                    Exhausted
                  </span>
                )}
              </span>
              <span className={`font-mono font-bold ${effectiveQuota.isTokenExhausted ? 'text-rose-400' : 'text-purple-300'}`}>
                {effectiveQuota.tokensUsed.toLocaleString()} / {effectiveQuota.tokenLimit.toLocaleString()}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${effectiveQuota.isTokenExhausted ? 'bg-rose-500' : 'bg-purple-500'}`}
                style={{ width: `${Math.max(4, tokenPercent)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
              <span>
                Remaining:{' '}
                <strong className={`font-mono ${effectiveQuota.isTokenExhausted ? 'text-rose-400' : 'text-purple-300'}`}>
                  {effectiveQuota.tokensRemaining.toLocaleString()} Tokens
                </strong>
              </span>
              <span>Resets: {resetDateFormatted}</span>
            </div>
          </div>

          {/* Social Auto-Post Meter */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-semibold">Social Auto-Posting</span>
              <span className="font-mono font-bold text-amber-300">
                {effectiveQuota.postsUsed.toLocaleString()} / {effectiveQuota.postLimit >= 9999 ? 'Unlimited' : effectiveQuota.postLimit}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all"
                style={{ width: `${Math.max(4, postPercent)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
              <span>
                Remaining:{' '}
                <strong className="text-amber-300 font-mono">
                  {effectiveQuota.postLimit >= 9999 ? 'Unlimited' : effectiveQuota.postsRemaining.toLocaleString()}
                </strong>
              </span>
              <span>Resets: {resetDateFormatted}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions & Recent Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Share2 className="w-4 h-4 text-indigo-400" />
              <span>Connected Social Media Accounts</span>
            </h3>
            <button
              onClick={() => onNavigate('social-media')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center space-x-1"
            >
              <span>Manage Channels</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {pages.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-slate-800 rounded-xl">
              <Share2 className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-300">No Social Media Accounts Connected</p>
              <p className="text-xs text-slate-500 mt-1">Connect your Facebook, Instagram, or WhatsApp accounts.</p>
              <button
                onClick={() => onNavigate('social-media')}
                className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
              >
                Connect Channels
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {pages.map((page, idx) => {
                const isItemSuspended = isUserSuspended || page.bot_status === 'SUSPENDED';

                return (
                  <div key={idx} className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                        <Facebook className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{page.page_name}</p>
                        <p className="text-xs text-slate-500 font-mono">Page ID: {page.page_id}</p>
                      </div>
                    </div>

                    {isItemSuspended ? (
                      <span className="inline-flex items-center space-x-1 text-xs text-rose-400 font-medium bg-rose-500/15 border border-rose-500/30 px-2.5 py-1 rounded-full">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>Suspended by Admin</span>
                      </span>
                    ) : isFreeTrialExpired ? (
                      <span className="inline-flex items-center space-x-1 text-xs text-amber-400 font-medium bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 rounded-full">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Free Trial Expired (Pay to Resume)</span>
                      </span>
                    ) : isSubscriptionExpired ? (
                      <span className="inline-flex items-center space-x-1 text-xs text-amber-400 font-medium bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 rounded-full">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Subscription Expired</span>
                      </span>
                    ) : page.is_active ? (
                      <span className="inline-flex items-center space-x-1 text-xs text-emerald-400 font-medium bg-emerald-500/10 px-2.5 py-1 rounded-full">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Active &amp; Ready</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 text-xs text-slate-400 font-medium bg-slate-800 px-2.5 py-1 rounded-full">
                        <span>Paused</span>
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Live Setup Guide */}
        <div className="p-6 rounded-2xl bg-gradient-to-b from-indigo-950/40 to-slate-900 border border-indigo-500/20">
          <h3 className="text-base font-bold text-white mb-2">Automation Checklist</h3>
          <p className="text-xs text-slate-400 mb-4">Steps to launch your multi-tenant bot:</p>

          <div className="space-y-3 text-xs text-slate-300">
            <div className="flex items-start space-x-2">
              <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px] mt-0.5">✓</span>
              <span>Supabase Database &amp; RLS policies active</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="w-4 h-4 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-[10px] mt-0.5">2</span>
              <span>Connect Facebook, Instagram, or WhatsApp accounts</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="w-4 h-4 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-[10px] mt-0.5">3</span>
              <span>Map Google Sheets IDs for products &amp; orders</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="w-4 h-4 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-[10px] mt-0.5">4</span>
              <span>Test live sales conversation in Chat Simulator</span>
            </div>
          </div>

          <button
            onClick={() => onNavigate('simulator')}
            className="w-full mt-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-md shadow-indigo-600/30"
          >
            Launch Chat Simulator
          </button>
        </div>
      </div>
    </div>
  );
}
