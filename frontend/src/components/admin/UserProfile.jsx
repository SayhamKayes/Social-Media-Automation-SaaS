import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Key, 
  ShieldCheck, 
  ShieldAlert,
  Clock,
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  Crown, 
  ArrowUpRight, 
  Lock, 
  AlertCircle, 
  CheckCircle2, 
  Layers, 
  Calendar,
  Sparkles,
  Zap
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import { 
  getLocalQuotaUsage, 
  fetchSupabaseQuotaUsage, 
  getEffectiveUserQuota 
} from '../../lib/knowledgeLibrary';

export default function UserProfile({ 
  user, 
  userProfile, 
  pages = [],
  onUpdateSubscription,
  onOpenCheckout,
  onNavigateLandingPricing
}) {
  const [showTenantId, setShowTenantId] = useState(false);
  const [copied, setCopied] = useState(false);

  /* Password Change State */
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');

  /* Upgrade Modal State */
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState(false);

  const tenantId = user?.id || userProfile?.id || 'ten_usr_demo_7739';
  const maskedId = tenantId.slice(0, 8) + '••••••••••••••••••••' + tenantId.slice(-4);

  const [usageState, setUsageState] = useState(() => getLocalQuotaUsage(tenantId));

  useEffect(() => {
    let isMounted = true;
    fetchSupabaseQuotaUsage(tenantId).then((fresh) => {
      if (isMounted && fresh) setUsageState(fresh);
    });
    return () => {
      isMounted = false;
    };
  }, [tenantId]);

  const effectiveQuota = getEffectiveUserQuota(userProfile, usageState);
  const tokenPercent = Math.min(100, Math.round((effectiveQuota.tokensUsed / effectiveQuota.tokenLimit) * 100));
  const resetDateFormatted = effectiveQuota.nextResetDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const planTier = (userProfile?.plan_tier || 'free').toLowerCase();
  const maxPages = Number(userProfile?.max_pages) || 1;
  const isUnlimited = maxPages >= 999 || planTier === 'agency';
  const currentPagesCount = pages.length;
  const quotaPercent = isUnlimited ? 15 : Math.min(100, Math.round((currentPagesCount / maxPages) * 100));

  /* User Status and 30-Day Subscription Lifecycle Calculation */
  const isUserSuspended = userProfile?.status === 'suspended';

  const startedAt = userProfile?.subscription_started_at 
    ? new Date(userProfile.subscription_started_at)
    : userProfile?.created_at 
      ? new Date(userProfile.created_at)
      : new Date();

  const expiresAt = userProfile?.subscription_expires_at
    ? new Date(userProfile.subscription_expires_at)
    : new Date(startedAt.getTime() + 30 * 24 * 60 * 60 * 1000);

  const now = new Date();
  const isExpired = now > expiresAt;
  const isFreeTrial = planTier === 'free';
  const isFreeTrialExpired = isFreeTrial && isExpired;
  const daysRemaining = Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  const daysUsed = Math.min(30, Math.max(0, 30 - daysRemaining));
  const subscriptionProgressPercent = Math.min(100, Math.round((daysUsed / 30) * 100));

  const planDisplayNames = {
    free: { name: 'Free Trial', price: '৳0 / 1 Month', badge: '1 Month Trial', color: 'text-slate-300 bg-slate-800 border-slate-700' },
    starter: { name: 'Starter Growth', price: '৳1,499 / mo', badge: 'Popular', color: 'text-blue-300 bg-blue-500/20 border-blue-500/40' },
    business: { name: 'Business Pro', price: '৳3,999 / mo', badge: 'High Value', color: 'text-purple-300 bg-purple-500/20 border-purple-500/40' },
    agency: { name: 'Agency Enterprise', price: '৳9,999 / mo', badge: 'Master Tier', color: 'text-amber-300 bg-amber-500/20 border-amber-500/40' }
  };

  const currentPlanInfo = planDisplayNames[planTier] || planDisplayNames.free;

  const handleCopyTenantId = () => {
    navigator.clipboard.writeText(tenantId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');

    if (newPassword.length < 6) {
      setPwError('Password must contain at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwError('New password and confirmation password do not match.');
      return;
    }

    setPwLoading(true);
    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase.auth.updateUser({
          password: newPassword
        });
        if (error) throw error;
        setPwSuccess('Password updated successfully!');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPwSuccess('Password updated in local demo session!');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      setPwError(err.message || 'Failed to update password.');
    } finally {
      setPwLoading(false);
    }
  };

  const handleSelectUpgradeTier = async (targetTierId, targetMaxPages) => {
    setUpgradeLoading(true);
    try {
      if (onUpdateSubscription) {
        await onUpdateSubscription(targetTierId, targetMaxPages);
      }
      setShowUpgradeModal(false);
    } catch (err) {
      console.error('Upgrade tier error:', err);
    } finally {
      setUpgradeLoading(false);
    }
  };

  const tierRanks = { free: 1, starter: 2, business: 3, agency: 4 };

  const upgradeOptions = [
    { 
      id: 'free', 
      name: 'Free Trial', 
      pages: 1, 
      priceBDT: '৳0', 
      priceUSD: '$0', 
      period: '1 Month Service',
      messageCredit: '5K Msg/Mo',
      aiTokens: '50K AI Tokens',
      autoPost: '5 Auto-Posts',
      description: 'Introductory 1-month service for small businesses testing AI sales automation.'
    },
    { 
      id: 'starter', 
      name: 'Starter Growth', 
      pages: 3, 
      priceBDT: '৳1,499 / mo', 
      priceUSD: '$15', 
      period: '/ mo',
      messageCredit: '50K Msg/Mo',
      aiTokens: '500K AI Tokens',
      autoPost: '20 Auto-Posts',
      description: 'Ideal for independent shops and boutique ecommerce brands.'
    },
    { 
      id: 'business', 
      name: 'Business Pro', 
      pages: 10, 
      priceBDT: '৳3,999 / mo', 
      priceUSD: '$39', 
      period: '/ mo',
      messageCredit: '250K Msg/Mo',
      aiTokens: '2.5M AI Tokens',
      autoPost: '60 Auto-Posts',
      description: 'High-volume businesses needing multi-channel auto-sales bots.'
    },
    { 
      id: 'agency', 
      name: 'Agency Enterprise', 
      pages: 9999, 
      priceBDT: '৳9,999 / mo', 
      priceUSD: '$99', 
      period: '/ mo',
      messageCredit: '10M Msg/Mo',
      aiTokens: '10M AI Tokens',
      autoPost: 'Unlimited Posts',
      description: 'For digital agencies managing unlimited client brand pages.'
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div>
        <h2 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
          <span>Account Profile &amp; Subscription</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Manage your account credentials, view secret Tenant ID, and monitor your social automation quotas.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans): Identity & Active Subscription */}
        <div className="lg:col-span-2 space-y-6">
          {/* Identity & Tenant ID Card */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-lg">
                  {userProfile?.full_name ? userProfile.full_name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {userProfile?.full_name || user?.user_metadata?.name || 'Active Tenant Account'}
                  </h3>
                  <p className="text-xs text-slate-400 flex items-center space-x-1.5 mt-0.5">
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    <span>{user?.email || userProfile?.email || 'tenant@socialsaas.com'}</span>
                  </p>
                </div>
              </div>

              {isUserSuspended ? (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30 flex items-center space-x-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                  <span>Suspended Account</span>
                </span>
              ) : isFreeTrialExpired ? (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center space-x-1">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Free Trial Expired</span>
                </span>
              ) : isExpired ? (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center space-x-1">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Subscription Expired</span>
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Active Account</span>
                </span>
              )}
            </div>

            {/* Tenant ID with Eye Toggle */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                  UID
                </span>
                <span className="text-[11px] text-slate-500">Account Identifier</span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-xs text-indigo-300 font-bold select-all break-all">
                  {showTenantId ? tenantId : maskedId}
                </span>

                <div className="flex items-center space-x-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowTenantId(!showTenantId)}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition"
                    title={showTenantId ? 'Mask UID' : 'Reveal UID'}
                  >
                    {showTenantId ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyTenantId}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition"
                    title="Copy UID to Clipboard"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Active Subscription Tier & Quota Card */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase font-bold tracking-wider text-slate-400">Current Subscription</p>
                <h3 className="text-xl font-black text-white mt-0.5">{currentPlanInfo.name}</h3>
              </div>
              <span className={`text-xs font-bold uppercase px-3 py-1 rounded-full border ${currentPlanInfo.color}`}>
                {currentPlanInfo.badge}
              </span>
            </div>

            {/* Price & Quota Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-800">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Plan Billing Rate</span>
                <span className="text-sm font-black text-white mt-1 block">{currentPlanInfo.price}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Connected Pages Limit</span>
                <span className="text-sm font-black text-indigo-400 mt-1 block">
                  {isUnlimited ? 'Unlimited' : `${maxPages} Page${maxPages > 1 ? 's' : ''}`}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Remaining AI Tokens</span>
                <span className={`text-sm font-black font-mono mt-1 block ${
                  effectiveQuota.isTokenExhausted ? 'text-rose-400' : 'text-purple-300'
                }`}>
                  {effectiveQuota.tokensRemaining.toLocaleString()} / {effectiveQuota.tokenLimit.toLocaleString()}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Next Token Reset</span>
                <span className="text-sm font-black font-mono text-emerald-400 mt-1 block">
                  {resetDateFormatted}
                </span>
              </div>
            </div>

            {/* AI Token Quota Progress Bar & Exhausted Notification */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-slate-300 font-semibold flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>Bot AI Token Usage</span>
                </span>
                <span className="font-mono text-slate-300">
                  Used: <strong className="text-white">{effectiveQuota.tokensUsed.toLocaleString()}</strong> • Remaining: <strong className={effectiveQuota.isTokenExhausted ? 'text-rose-400' : 'text-purple-300'}>{effectiveQuota.tokensRemaining.toLocaleString()}</strong> (Resets on {resetDateFormatted})
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    effectiveQuota.isTokenExhausted ? 'bg-rose-500' : 'bg-purple-500'
                  }`}
                  style={{ width: `${Math.max(4, tokenPercent)}%` }}
                />
              </div>

              {effectiveQuota.isTokenExhausted && (
                <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-rose-200 mt-2">
                  <div className="flex items-start sm:items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5 sm:mt-0" />
                    <span>
                      <strong>Token Limit Exhausted:</strong> Your monthly AI token limit has ended and will automatically reset on <strong>{resetDateFormatted}</strong>. Add a payment or upgrade your plan to increase your token limit immediately.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowUpgradeModal(true)}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold shrink-0 transition"
                  >
                    Add Payment / Top-Up
                  </button>
                </div>
              )}
            </div>

            {/* Visual Quota Progress Bar */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">Page Quota Usage</span>
                <span className="font-mono text-slate-400">
                  {currentPagesCount} of {isUnlimited ? '∞' : maxPages} pages active ({quotaPercent}%)
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                <div 
                  className={`h-full transition-all duration-500 rounded-full ${
                    quotaPercent >= 100 
                      ? 'bg-amber-500 shadow-md shadow-amber-500/30' 
                      : 'bg-indigo-500 shadow-md shadow-indigo-500/30'
                  }`}
                  style={{ width: `${quotaPercent}%` }}
                />
              </div>
            </div>

            {/* Upgrade Plan Call To Action */}
            <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-xs text-slate-400 leading-relaxed">
                Need more concurrent social pages or WhatsApp order integration?
              </p>
              <button
                type="button"
                onClick={() => setShowUpgradeModal(true)}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-lg shadow-indigo-600/30 shrink-0"
              >
                <Crown className="w-3.5 h-3.5" />
                <span>Upgrade Plan</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 30-Day Subscription Expiry Lifecycle Card */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs uppercase font-bold tracking-wider text-slate-400">Subscription Lifecycle</p>
                  <h3 className="text-base font-bold text-white">30-Day Billing Validity</h3>
                </div>
              </div>

              {isFreeTrialExpired ? (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center space-x-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Free Trial Expired</span>
                </span>
              ) : isExpired ? (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center space-x-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Expired</span>
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{daysRemaining} Days Remaining</span>
                </span>
              )}
            </div>

            {/* Date metrics */}
            <div className="grid grid-cols-2 gap-4 pt-1">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Cycle Started</span>
                <span className="text-xs font-mono font-bold text-slate-200 mt-1 block">
                  {startedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Cycle Expires</span>
                <span className={`text-xs font-mono font-bold mt-1 block ${isExpired ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {expiresAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">30-Day Validity Cycle</span>
                <span className="font-mono text-slate-400">
                  {isExpired ? '30 of 30 days used' : `${daysUsed} of 30 days elapsed`} ({subscriptionProgressPercent}%)
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                <div 
                  className={`h-full transition-all duration-500 rounded-full ${
                    isExpired ? 'bg-rose-500' : subscriptionProgressPercent > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${subscriptionProgressPercent}%` }}
                />
              </div>
            </div>

            {/* Expired Action or Warning */}
            {isFreeTrialExpired ? (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
                <div className="flex items-start sm:items-center space-x-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
                  <div>
                    <p className="font-bold text-amber-300">Your 1-Month Free Trial has expired</p>
                    <p className="text-[11px] text-amber-300/80 mt-0.5">
                      To continue using automated Facebook Messenger bots and AI lead capture, please upgrade and pay for a subscription package.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowUpgradeModal(true)}
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shrink-0 shadow-md shadow-amber-500/20"
                >
                  Pay &amp; Upgrade Now
                </button>
              </div>
            ) : isExpired ? (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start sm:items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5 sm:mt-0" />
                  <span>Subscription has expired. Autopilot replies are halted until renewed.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowUpgradeModal(true)}
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shrink-0"
                >
                  Renew Now
                </button>
              </div>
            ) : (
              <p className="text-[11px] text-slate-500">
                Subscriptions automatically suspend automated chat operations after 30 days unless renewed or upgraded.
              </p>
            )}
          </div>
        </div>

        {/* Right Column (1 span): Change Password & Security */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-800">
              <Lock className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">Security &amp; Password</h3>
            </div>

            {pwError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{pwError}</span>
              </div>
            )}

            {pwSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{pwSuccess}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              <button
                type="submit"
                disabled={pwLoading}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition border border-slate-700 disabled:opacity-50 mt-1"
              >
                {pwLoading ? 'Updating Password...' : 'Update Password'}
              </button>
            </form>

            <div className="pt-3 border-t border-slate-800/80">
              <span className="text-[10px] text-slate-500 block leading-relaxed">
                Supabase Auth automatically encrypts and salts your credentials via Bcrypt hashing.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2 text-indigo-400">
                <Crown className="w-5 h-5" />
                <h3 className="text-base font-bold text-white">Upgrade Subscription Tier</h3>
              </div>
              <button 
                onClick={() => setShowUpgradeModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Select the plan you wish to upgrade your account to. Connected pages quotas and advanced sales features unlock immediately upon selection:
            </p>

            <div className="space-y-3">
              {upgradeOptions.map((opt) => {
                const isCurrent = planTier === opt.id;
                return (
                  <div
                    key={opt.id}
                    className={`p-4 rounded-xl border flex items-center justify-between gap-4 transition ${
                      isCurrent
                        ? 'bg-slate-950 border-slate-800 opacity-60'
                        : 'bg-slate-950 border-slate-800 hover:border-indigo-500/60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-bold text-white">{opt.name}</h4>
                        {isCurrent && (
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                            Current Tier
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-indigo-400 font-semibold mt-0.5">
                        {opt.pages >= 999 ? 'Unlimited Connected Accounts' : `Up to ${opt.pages} Connected Social Accounts`}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px]">
                        <span className="text-white font-bold">{opt.priceBDT}</span>
                        <span className="text-emerald-400">• {opt.messageCredit}</span>
                        <span className="text-purple-300">• {opt.aiTokens}</span>
                        <span className="text-amber-300">• {opt.autoPost}</span>
                      </div>
                    </div>

                    {!isCurrent && (
                      <button
                        type="button"
                        disabled={upgradeLoading}
                        onClick={() => {
                          if (opt.id === 'free') {
                            handleSelectUpgradeTier(opt.id, opt.pages);
                          } else if (onOpenCheckout) {
                            setShowUpgradeModal(false);
                            onOpenCheckout(opt);
                          } else {
                            handleSelectUpgradeTier(opt.id, opt.pages);
                          }
                        }}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-md shrink-0 ${
                          (tierRanks[opt.id] || 1) > (tierRanks[planTier] || 1)
                            ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                        }`}
                      >
                        {(tierRanks[opt.id] || 1) > (tierRanks[planTier] || 1)
                          ? `Upgrade to ${opt.name}`
                          : `Switch to ${opt.name}`}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowUpgradeModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

