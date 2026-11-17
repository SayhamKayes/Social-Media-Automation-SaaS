import React, { useState, useEffect } from 'react';
import { Bot, LogOut, ExternalLink, ShieldCheck, ShieldAlert, AlertCircle, Sparkles } from 'lucide-react';
import { getLocalQuotaUsage, fetchSupabaseQuotaUsage, getEffectiveUserQuota } from '../../lib/knowledgeLibrary';

export default function AdminNavbar({ user, userProfile = null, onLogout, onGoToLanding }) {
  const userId = user?.id || userProfile?.id || 'default';
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
  const resetDateFormatted = effectiveQuota.nextResetDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
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

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur px-6 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center space-x-3">
        <button onClick={onGoToLanding} className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-500/20">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-white tracking-tight text-lg">
            AutoReply <span className="text-indigo-400">Dashboard</span>
          </span>
        </button>

        <span className="hidden sm:inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium ml-4">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>RLS Protected</span>
        </span>

        {effectiveQuota.isTokenExhausted ? (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold border border-rose-500/30 ml-2 animate-pulse" title={`Token Limit Reset Date: ${resetDateFormatted}`}>
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Token Limit Exhausted (Resets {resetDateFormatted})</span>
          </span>
        ) : (
          <span className="hidden md:inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300 text-xs font-semibold border border-purple-500/30 ml-2" title={`Next Reset: ${resetDateFormatted}`}>
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>{effectiveQuota.tokensRemaining.toLocaleString()} Tokens Left (Resets {resetDateFormatted})</span>
          </span>
        )}

        {isUserSuspended ? (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold border border-rose-500/30 ml-2 animate-pulse">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Account Suspended</span>
          </span>
        ) : isFreeTrialExpired ? (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30 ml-2">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Free Trial Expired</span>
          </span>
        ) : isSubscriptionExpired ? (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30 ml-2">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Subscription Expired</span>
          </span>
        ) : null}
      </div>

      <div className="flex items-center space-x-4">
        <div className="text-right hidden sm:block">
          <p className="text-xs font-semibold text-white">{user?.email || 'user@example.com'}</p>
          <p className="text-[10px] text-slate-400 font-mono">UID: {user?.id?.slice(0, 8)}...</p>
        </div>

        <button
          onClick={onLogout}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition"
          title="Log Out"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Log Out</span>
        </button>
      </div>
    </header>
  );
}

