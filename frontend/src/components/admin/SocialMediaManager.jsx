import React, { useState } from 'react';
import { 
  Facebook, 
  Instagram, 
  MessageCircle, 
  Linkedin, 
  Plus, 
  Trash2, 
  Pencil,
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  ExternalLink, 
  ShieldCheck,
  ShieldAlert,
  Send,
  Sparkles,
  KeyRound,
  Info,
  Crown,
  Lock,
  ArrowUpRight,
  X,
  RefreshCw,
  Check,
  Bot,
  CalendarClock
} from 'lucide-react';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import { verifyMetaPageToken } from '../../lib/metaValidator';

/* Helper to determine social platform from a business_pages row */
export const getPagePlatform = (page) => {
  if (!page) return 'facebook';
  if (page.platform) return page.platform.toLowerCase();
  const vt = String(page.verify_token || '').toLowerCase();
  if (vt.startsWith('ig:') || vt.includes('instagram')) return 'instagram';
  if (vt.startsWith('wa:') || vt.includes('whatsapp')) return 'whatsapp';
  if (vt.startsWith('li:') || vt.includes('linkedin')) return 'linkedin';
  const name = String(page.page_name || '').toLowerCase();
  if (name.startsWith('[ig]') || name.includes('(instagram)')) return 'instagram';
  if (name.startsWith('[wa]') || name.includes('(whatsapp)')) return 'whatsapp';
  if (name.startsWith('[in]') || name.includes('(linkedin)')) return 'linkedin';
  return 'facebook';
};

export const getCleanVerifyToken = (rawToken) => {
  if (!rawToken) return 'socialsaas_secret';
  return String(rawToken).replace(/^(fb|ig|wa|li):/i, '');
};

export default function SocialMediaManager({ 
  pages = [], 
  userProfile = null,
  onSavePage, 
  onDeletePage,
  onUpgradePlan
}) {
  const [selectedPlatform, setSelectedPlatform] = useState('facebook');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  /* Meta Token Verification States */
  const [metaChecking, setMetaChecking] = useState(false);
  const [metaResult, setMetaResult] = useState(null);
  const [cardCheckingId, setCardCheckingId] = useState(null);
  const [cardCheckResults, setCardCheckResults] = useState({});

  /* Delete Confirmation Modal State */
  const [pageToDelete, setPageToDelete] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  /* Editing state */
  const [editingPageId, setEditingPageId] = useState(null);

  /* Form states for all platforms */
  const [pageId, setPageId] = useState('');
  const [pageName, setPageName] = useState('');
  const [pageAccessToken, setPageAccessToken] = useState('');
  const [verifyToken, setVerifyToken] = useState('socialsaas_secret');

  /* Quota and Expiry Calculations */
  const maxPages = Number(userProfile?.max_pages) || 1;
  const isUnlimited = maxPages >= 999 || (userProfile?.plan_tier || '').toLowerCase() === 'agency';
  const planTier = (userProfile?.plan_tier || 'free').toUpperCase();
  const currentCount = pages.length;
  const isQuotaReached = !isUnlimited && currentCount >= maxPages;

  /* Account Status Checks */
  const isUserSuspended = userProfile?.status === 'suspended';
  const expiresAt = userProfile?.subscription_expires_at 
    ? new Date(userProfile.subscription_expires_at) 
    : userProfile?.created_at 
      ? new Date(new Date(userProfile.created_at).getTime() + 30 * 24 * 60 * 60 * 1000)
      : null;
  const isSubscriptionExpired = expiresAt ? (new Date() > expiresAt) : false;
  const isFreeTrial = (userProfile?.plan_tier || 'free').toLowerCase() === 'free';
  const isFreeTrialExpired = isFreeTrial && isSubscriptionExpired;

  /* Platform Metadata & Counts */
  const fbPages = pages.filter(p => getPagePlatform(p) === 'facebook');
  const igPages = pages.filter(p => getPagePlatform(p) === 'instagram');
  const waPages = pages.filter(p => getPagePlatform(p) === 'whatsapp');
  const liPages = pages.filter(p => getPagePlatform(p) === 'linkedin');

  const platforms = [
    { 
      id: 'facebook', 
      name: 'Facebook', 
      icon: Facebook, 
      count: fbPages.length, 
      color: 'text-blue-400', 
      bg: 'bg-blue-500/10',
      borderActive: 'border-blue-500 shadow-blue-500/10',
      btnBg: 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/30',
      workflows: 'AI Chatbot + Auto-Post',
      idLabel: 'Facebook Page ID (Numeric)',
      idPlaceholder: 'e.g. 109827364512345',
      nameLabel: 'Facebook Page Name',
      namePlaceholder: 'e.g. SKzLAB Official Page',
      tokenLabel: 'Permanent Page Access Token (Meta Graph API)',
      tokenPlaceholder: 'EAAbx1whxNGcBS2...',
      prefix: 'fb'
    },
    { 
      id: 'instagram', 
      name: 'Instagram', 
      icon: Instagram, 
      count: igPages.length, 
      color: 'text-pink-400', 
      bg: 'bg-pink-500/10',
      borderActive: 'border-pink-500 shadow-pink-500/10',
      btnBg: 'bg-pink-600 hover:bg-pink-500 shadow-pink-600/30',
      workflows: 'IG DM Chatbot + Container Post',
      idLabel: 'Instagram Business Account ID (IG User ID)',
      idPlaceholder: 'e.g. 17841405822304914',
      nameLabel: 'Instagram Business Handle / Name',
      namePlaceholder: 'e.g. @skzlab.official',
      tokenLabel: 'Connected Meta Page Access Token (with instagram_basic & manage_messages)',
      tokenPlaceholder: 'EAAbx1whxNGcBS2...',
      prefix: 'ig'
    },
    { 
      id: 'whatsapp', 
      name: 'WhatsApp', 
      icon: MessageCircle, 
      count: waPages.length, 
      color: 'text-emerald-400', 
      bg: 'bg-emerald-500/10',
      borderActive: 'border-emerald-500 shadow-emerald-500/10',
      btnBg: 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30',
      workflows: 'WhatsApp Cloud AI Chatbot',
      idLabel: 'WhatsApp Phone Number ID (Cloud API)',
      idPlaceholder: 'e.g. 105928374651928',
      nameLabel: 'WhatsApp Business Display Name / Number',
      namePlaceholder: 'e.g. SKzLAB Support (+88017...)',
      tokenLabel: 'Permanent System User Access Token (WhatsApp Cloud API)',
      tokenPlaceholder: 'EAAGm0PX4ZCpsBA...',
      prefix: 'wa'
    },
    { 
      id: 'linkedin', 
      name: 'LinkedIn', 
      icon: Linkedin, 
      count: liPages.length, 
      color: 'text-sky-400', 
      bg: 'bg-sky-500/10',
      borderActive: 'border-sky-500 shadow-sky-500/10',
      btnBg: 'bg-sky-600 hover:bg-sky-500 shadow-sky-600/30',
      workflows: 'LinkedIn Auto-Posting',
      idLabel: 'LinkedIn Author URN or Organization ID',
      idPlaceholder: 'e.g. urn:li:person:AbCdEf123 or 98273645',
      nameLabel: 'LinkedIn Profile or Company Page Name',
      namePlaceholder: 'e.g. SKzLAB Technologies',
      tokenLabel: 'LinkedIn OAuth 2.0 Access Token (w_member_social / w_organization_social)',
      tokenPlaceholder: 'AQV8x9LmN2...',
      prefix: 'li'
    },
  ];

  const currentPlatformMeta = platforms.find(p => p.id === selectedPlatform) || platforms[0];
  const currentPlatformPages = pages.filter(p => getPagePlatform(p) === selectedPlatform);

  const handleStartEdit = (page) => {
    const plat = getPagePlatform(page);
    setSelectedPlatform(plat);
    setEditingPageId(page.page_id);
    setPageId(page.page_id);
    setPageName(page.page_name || '');
    setPageAccessToken(page.page_access_token || '');
    setVerifyToken(getCleanVerifyToken(page.verify_token));
    setMetaResult(null);
    setShowAddForm(true);
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleCancelForm = () => {
    setEditingPageId(null);
    setPageId('');
    setPageName('');
    setPageAccessToken('');
    setVerifyToken('socialsaas_secret');
    setMetaResult(null);
    setShowAddForm(false);
    setErrorMsg('');
  };

  const handleOpenAdd = () => {
    if (isFreeTrialExpired) {
      setErrorMsg('Free Trial Expired: Your 1-Month Free Trial has ended. Please upgrade and pay for a package to connect social channels.');
      setShowUpgradeModal(true);
      return;
    }
    if (isSubscriptionExpired) {
      setErrorMsg('Subscription Expired: Your 30-Day billing cycle has ended. Please renew to connect social channels.');
      setShowUpgradeModal(true);
      return;
    }
    if (isQuotaReached) {
      setShowUpgradeModal(true);
      return;
    }
    handleCancelForm();
    setShowAddForm(true);
  };

  const handleTestTokenInForm = async () => {
    if (!pageId.trim() || !pageAccessToken.trim()) {
      setErrorMsg(`Please enter both ${currentPlatformMeta.idLabel} and Access Token before testing.`);
      return;
    }
    setMetaChecking(true);
    setMetaResult(null);
    try {
      if (selectedPlatform === 'linkedin') {
        /* LinkedIn token format sanity check */
        if (pageAccessToken.trim().length > 25) {
          setMetaResult({ success: true, pageName: pageName || 'LinkedIn OAuth Token Ready' });
        } else {
          setMetaResult({ success: false, error: 'LinkedIn OAuth token appears too short.' });
        }
      } else {
        const res = await verifyMetaPageToken(pageId.trim(), pageAccessToken.trim());
        setMetaResult(res);
        if (res.success && res.pageName && !pageName) {
          setPageName(res.pageName);
        }
      }
    } catch (err) {
      setMetaResult({ success: false, error: err.message || 'Token verification failed' });
    } finally {
      setMetaChecking(false);
    }
  };

  const handleTestCardToken = async (page) => {
    setCardCheckingId(page.page_id);
    const plat = getPagePlatform(page);
    try {
      if (plat === 'linkedin') {
        const isValid = Boolean(page.page_access_token && page.page_access_token.length > 25);
        setCardCheckResults(prev => ({
          ...prev,
          [page.page_id]: isValid 
            ? { success: true, pageName: 'LinkedIn OAuth Ready' } 
            : { success: false, error: 'Invalid Token' }
        }));
      } else {
        const res = await verifyMetaPageToken(page.page_id, page.page_access_token);
        setCardCheckResults(prev => ({
          ...prev,
          [page.page_id]: res
        }));
      }
    } catch (err) {
      setCardCheckResults(prev => ({
        ...prev,
        [page.page_id]: { success: false, error: err.message }
      }));
    } finally {
      setCardCheckingId(null);
    }
  };

  const handleTriggerDelete = (page) => {
    setPageToDelete(page);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!pageToDelete) return;
    try {
      await onDeletePage(pageToDelete.page_id);
      setIsDeleteModalOpen(false);
      setPageToDelete(null);
    } catch (err) {
      setErrorMsg('Failed to disconnect channel: ' + (err.message || 'Unknown error'));
      setIsDeleteModalOpen(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (isFreeTrialExpired) {
      setErrorMsg('Free Trial Expired: Your 1-Month Free Trial has ended. Please upgrade to a paid package to connect or edit social accounts.');
      setShowUpgradeModal(true);
      return;
    }

    if (isSubscriptionExpired) {
      setErrorMsg('Subscription Expired: Your 30-Day billing cycle has ended. Please renew your plan to connect or edit social accounts.');
      setShowUpgradeModal(true);
      return;
    }

    if (!editingPageId && isQuotaReached) {
      setErrorMsg(`Quota Reached: Your ${planTier} plan allows maximum ${maxPages} connected account(s). Please upgrade to connect more.`);
      setShowUpgradeModal(true);
      return;
    }

    if (!pageId.trim() || !pageAccessToken.trim()) {
      setErrorMsg(`${currentPlatformMeta.idLabel} and Access Token are mandatory.`);
      return;
    }

    const cleanVt = getCleanVerifyToken(verifyToken.trim() || 'socialsaas_secret');
    const taggedVerifyToken = `${currentPlatformMeta.prefix}:${cleanVt}`;

    setLoading(true);
    try {
      await onSavePage({
        page_id: pageId.trim(),
        page_name: pageName.trim() || `My ${currentPlatformMeta.name} Account`,
        page_access_token: pageAccessToken.trim(),
        verify_token: taggedVerifyToken,
        is_active: true
      });

      setSuccessMsg(
        editingPageId 
          ? `${currentPlatformMeta.name} account credentials updated and synced with n8n workflows!` 
          : `${currentPlatformMeta.name} account connected and synced with n8n workflows!`
      );
      handleCancelForm();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save social account.');
    } finally {
      setLoading(false);
    }
  };

  const PlatformIcon = currentPlatformMeta.icon;

  return (
    <div className="space-y-6">
      {/* Header with Quota Pill */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h2 className="text-2xl font-bold text-white tracking-tight">Social Media Channels</h2>
            <div className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center space-x-1.5 ${
              isQuotaReached
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-purple-500/20 text-purple-300 border-purple-500/40'
            }`}>
              <Crown className="w-3.5 h-3.5" />
              <span>
                Plan Quota: {currentCount} / {isUnlimited ? 'Unlimited' : maxPages} ({planTier})
              </span>
            </div>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Connect Facebook, Instagram, WhatsApp, and LinkedIn credentials to power your n8n AI Chatbot and Auto-Posting workflows.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowTutorial(!showTutorial)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
          >
            <HelpCircle className="w-4 h-4 text-indigo-400" />
            <span>{currentPlatformMeta.name} Guide</span>
          </button>
          <button
            onClick={showAddForm ? handleCancelForm : handleOpenAdd}
            className={`inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition shadow-lg ${
              showAddForm
                ? 'bg-slate-800 text-slate-300 hover:text-white'
                : isQuotaReached
                  ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30'
                  : `${currentPlatformMeta.btnBg} text-white`
            }`}
          >
            {showAddForm ? (
              <span>Cancel</span>
            ) : isQuotaReached ? (
              <>
                <Lock className="w-4 h-4" />
                <span>Connect {currentPlatformMeta.name} (Limit Reached)</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Connect {currentPlatformMeta.name}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Quota Limit Reached Warning Banner */}
      {isQuotaReached && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-200">
          <div className="flex items-start sm:items-center space-x-3">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <p className="text-xs font-bold">
                Channel Limit Reached ({currentCount}/{maxPages} social accounts connected)
              </p>
              <p className="text-[11px] text-amber-300/80 mt-0.5">
                Your current <strong>{planTier}</strong> plan is capped at {maxPages} connected channel(s). Upgrade to <strong>Starter Growth (3 channels)</strong> or <strong>Business Pro (10 channels)</strong> to connect additional accounts.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowUpgradeModal(true)}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shrink-0 transition flex items-center justify-center space-x-1"
          >
            <span>Upgrade Plan</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Account Suspended by Administrator Banner */}
      {isUserSuspended && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-rose-300">
          <div className="flex items-start sm:items-center space-x-3">
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-rose-400">
                Account Suspended by Administrator
              </p>
              <p className="text-xs text-rose-300/80 mt-0.5">
                Automated n8n chatbot replies and scheduled posts are temporarily paused across all connected accounts. Please contact platform administrators.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-xl bg-rose-500/20 text-rose-300 text-xs font-bold border border-rose-500/30 self-start sm:self-auto">
            Halted
          </span>
        </div>
      )}

      {/* Expired Free Trial Banner */}
      {isFreeTrialExpired && !isUserSuspended && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 to-amber-950/30 border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-200 shadow-xl">
          <div className="flex items-start sm:items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-400">
                1-Month Free Trial Has Expired (Payment Required)
              </p>
              <p className="text-xs text-amber-300/90 mt-0.5 leading-relaxed">
                Your 30-day Free Trial period has ended. Automated bot messaging and auto-posting are suspended. Please select and pay for a subscription package to reactivate your channels.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowUpgradeModal(true)}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shrink-0 transition flex items-center justify-center space-x-1.5 self-start sm:self-auto"
          >
            <span>Upgrade &amp; Pay Now</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 30-Day Subscription Expired Banner */}
      {isSubscriptionExpired && !isFreeTrial && !isUserSuspended && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-200">
          <div className="flex items-start sm:items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-400">
                30-Day Subscription Cycle Expired
              </p>
              <p className="text-xs text-amber-300/80 mt-0.5">
                Your monthly subscription period has concluded. Autopilot replies and scheduled posts are currently paused. Renew your subscription to immediately reactivate your channels.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowUpgradeModal(true)}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shrink-0 transition flex items-center justify-center space-x-1"
          >
            <span>Renew Subscription</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 4 Compact Platform Selector Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {platforms.map((p) => {
          const Icon = p.icon;
          const isSelected = selectedPlatform === p.id;
          return (
            <button
              key={p.id}
              onClick={() => {
                setSelectedPlatform(p.id);
                handleCancelForm();
              }}
              className={`px-3.5 py-2.5 rounded-xl border transition-all flex items-center justify-between text-left ${
                isSelected
                  ? `bg-slate-900 ${p.borderActive} shadow-md`
                  : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <div className={`w-8 h-8 rounded-lg ${p.bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-4 h-4 ${p.color}`} />
                </div>
                <div>
                  <p className="text-xs font-bold text-white leading-tight">{p.name}</p>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                    {p.count} Connected
                  </p>
                </div>
              </div>
              {p.count > 0 ? (
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400 shrink-0" title="Connected & Active" />
              ) : isSelected ? (
                <span className="w-2 h-2 rounded-full bg-indigo-400 shrink-0" />
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Feedback Messages */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Platform-Specific Credential Guide */}
      {showTutorial && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-indigo-500/30 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <KeyRound className="w-4 h-4 text-indigo-400" />
              <span>How to Get Your {currentPlatformMeta.name} Credentials for n8n Automation</span>
            </h3>
            <button onClick={() => setShowTutorial(false)} className="text-xs text-slate-500 hover:text-white">
              Close
            </button>
          </div>

          {selectedPlatform === 'facebook' && (
            <ol className="list-decimal list-inside space-y-2 text-xs text-slate-300 leading-relaxed">
              <li>
                <strong>Facebook Page ID:</strong> Open your Facebook Page &gt; <strong>About &gt; Page transparency</strong> and copy your numeric <strong>Page ID</strong>.
              </li>
              <li>
                <strong>Page Access Token:</strong> Open{' '}
                <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noreferrer" className="text-indigo-400 underline">
                  Meta Graph API Explorer
                </a>, select your Page under <em>User or Page</em>, and include <code className="bg-slate-800 px-1 py-0.5 rounded text-indigo-300">pages_messaging</code>, <code className="bg-slate-800 px-1 py-0.5 rounded text-indigo-300">pages_manage_posts</code>, and <code className="bg-slate-800 px-1 py-0.5 rounded text-indigo-300">pages_read_engagement</code>.
              </li>
              <li>
                <strong>Powers Both Workflows:</strong> Once saved, n8n uses this token for both <strong>24/7 Messenger AI Chatbot</strong> and <strong>Scheduled Facebook Auto-Posting</strong>.
              </li>
            </ol>
          )}

          {selectedPlatform === 'instagram' && (
            <ol className="list-decimal list-inside space-y-2 text-xs text-slate-300 leading-relaxed">
              <li>
                <strong>Link Instagram to Facebook Page:</strong> Ensure your Instagram account is switched to a <strong>Professional / Business Account</strong> and linked to your Facebook Page.
              </li>
              <li>
                <strong>Instagram Business Account ID:</strong> In Meta Graph API Explorer, query <code className="bg-slate-800 px-1 py-0.5 rounded text-pink-300">me?fields=instagram_business_account</code> using your Page Token to copy the numeric <strong>Instagram Business ID</strong> (starts with <code className="text-pink-300">1784...</code>).
              </li>
              <li>
                <strong>Permissions Required:</strong> Grant <code className="bg-slate-800 px-1 py-0.5 rounded text-pink-300">instagram_basic</code>, <code className="bg-slate-800 px-1 py-0.5 rounded text-pink-300">instagram_content_publish</code> (for n8n Container ID Auto-Post), and <code className="bg-slate-800 px-1 py-0.5 rounded text-pink-300">instagram_manage_messages</code> (for Instagram DM AI Chatbot).
              </li>
            </ol>
          )}

          {selectedPlatform === 'whatsapp' && (
            <ol className="list-decimal list-inside space-y-2 text-xs text-slate-300 leading-relaxed">
              <li>
                <strong>WhatsApp Phone Number ID:</strong> Go to <strong>Meta Developer Portal &gt; WhatsApp &gt; API Setup</strong> and copy the numeric <strong>Phone Number ID</strong>.
              </li>
              <li>
                <strong>Permanent System User Token:</strong> In <strong>Meta Business Settings &gt; System Users</strong>, generate a permanent token with <code className="bg-slate-800 px-1 py-0.5 rounded text-emerald-300">whatsapp_business_messaging</code> and <code className="bg-slate-800 px-1 py-0.5 rounded text-emerald-300">whatsapp_business_management</code> permissions.
              </li>
              <li>
                <strong>Automated AI Replies &amp; Order Capture:</strong> Incoming WhatsApp messages trigger your n8n Gemini AI Agent and log confirmed orders directly into your Orders &amp; Leads panel.
              </li>
            </ol>
          )}

          {selectedPlatform === 'linkedin' && (
            <ol className="list-decimal list-inside space-y-2 text-xs text-slate-300 leading-relaxed">
              <li>
                <strong>LinkedIn Author URN / Organization ID:</strong> Go to the{' '}
                <a href="https://www.linkedin.com/developers/apps" target="_blank" rel="noreferrer" className="text-sky-400 underline">
                  LinkedIn Developer Portal
                </a>{' '}
                and copy your Personal URN (or Company Page Organization ID).
              </li>
              <li>
                <strong>OAuth 2.0 Access Token:</strong> Generate an OAuth2 token with <code className="bg-slate-800 px-1 py-0.5 rounded text-sky-300">w_member_social</code> or <code className="bg-slate-800 px-1 py-0.5 rounded text-sky-300">w_organization_social</code> scope.
              </li>
              <li>
                <strong>Automated LinkedIn Posting:</strong> Your n8n Auto-Posting workflow will automatically download images from Google Drive / URL and publish posts to your LinkedIn account.
              </li>
            </ol>
          )}
        </div>
      )}

      {/* ADD / EDIT CREDENTIALS FORM FOR SELECTED PLATFORM */}
      {showAddForm && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-indigo-500/30 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <PlatformIcon className={`w-5 h-5 ${currentPlatformMeta.color}`} />
              <span>
                {editingPageId 
                  ? `Edit ${currentPlatformMeta.name} Account Credentials` 
                  : `Connect New ${currentPlatformMeta.name} Account`}
              </span>
            </h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 font-medium border border-indigo-500/30">
              {currentPlatformMeta.workflows}
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  {currentPlatformMeta.nameLabel}
                </label>
                <input
                  type="text"
                  required
                  placeholder={currentPlatformMeta.namePlaceholder}
                  value={pageName}
                  onChange={(e) => setPageName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  {currentPlatformMeta.idLabel}
                </label>
                <input
                  type="text"
                  required
                  disabled={!!editingPageId}
                  placeholder={currentPlatformMeta.idPlaceholder}
                  value={pageId}
                  onChange={(e) => setPageId(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500 font-mono transition ${
                    editingPageId ? 'opacity-60 cursor-not-allowed' : ''
                  }`}
                />
                {editingPageId && (
                  <p className="text-[10px] text-slate-500 mt-1">
                    Account ID is the unique database key and cannot be altered while editing.
                  </p>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  {currentPlatformMeta.tokenLabel}
                </label>
                <button
                  type="button"
                  onClick={handleTestTokenInForm}
                  disabled={metaChecking || !pageAccessToken.trim() || !pageId.trim()}
                  className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white text-xs font-semibold border border-indigo-500/20 disabled:opacity-50 transition"
                >
                  <RefreshCw className={`w-3 h-3 ${metaChecking ? 'animate-spin' : ''}`} />
                  <span>{metaChecking ? 'Verifying...' : 'Verify Credentials'}</span>
                </button>
              </div>
              <textarea
                required
                rows={3}
                placeholder={currentPlatformMeta.tokenPlaceholder}
                value={pageAccessToken}
                onChange={(e) => setPageAccessToken(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-indigo-500 transition"
              />
              <div className="flex items-center justify-between mt-1 text-[11px]">
                <span className="text-slate-500">
                  Synced directly with n8n backend workflows via encrypted Supabase connection.
                </span>
                {metaResult && (
                  <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-md font-medium border ${
                    metaResult.success
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                  }`}>
                    {metaResult.success ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                    <span>{metaResult.success ? `Verified: ${metaResult.pageName || 'Token Active'}` : metaResult.error}</span>
                  </span>
                )}
              </div>
            </div>

            {selectedPlatform !== 'linkedin' && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Webhook Verify Token
                </label>
                <input
                  type="text"
                  value={verifyToken}
                  onChange={(e) => setVerifyToken(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500 font-mono transition"
                />
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={handleCancelForm}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`px-5 py-2 rounded-xl text-white text-xs font-bold transition shadow-lg disabled:opacity-50 ${currentPlatformMeta.btnBg}`}
              >
                {loading 
                  ? (editingPageId ? 'Updating...' : 'Connecting...') 
                  : (editingPageId ? `Update ${currentPlatformMeta.name} Account` : `Save & Connect ${currentPlatformMeta.name}`)}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CONNECTED ACCOUNTS LIST FOR SELECTED PLATFORM */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <PlatformIcon className={`w-4 h-4 ${currentPlatformMeta.color}`} />
            <span>Connected {currentPlatformMeta.name} Accounts ({currentPlatformPages.length})</span>
          </h3>
          <div className="flex items-center space-x-2 text-xs">
            {(selectedPlatform === 'facebook' || selectedPlatform === 'instagram' || selectedPlatform === 'whatsapp') && (
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[11px]">
                <Bot className="w-3 h-3" />
                <span>AI Chatbot Enabled</span>
              </span>
            )}
            {(selectedPlatform === 'facebook' || selectedPlatform === 'instagram' || selectedPlatform === 'linkedin') && (
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 text-[11px]">
                <CalendarClock className="w-3 h-3" />
                <span>Auto-Post Enabled</span>
              </span>
            )}
          </div>
        </div>

        {currentPlatformPages.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className={`w-14 h-14 rounded-2xl ${currentPlatformMeta.bg} flex items-center justify-center mx-auto ${currentPlatformMeta.color}`}>
              <PlatformIcon className="w-7 h-7" />
            </div>
            <div>
              <p className="text-base font-bold text-slate-200">No {currentPlatformMeta.name} Account Connected Yet</p>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
                Click <strong>"Connect {currentPlatformMeta.name}"</strong> above and enter your {currentPlatformMeta.idLabel} and Access Token so your n8n workflows can automatically run {currentPlatformMeta.workflows}.
              </p>
            </div>
            <button
              onClick={handleOpenAdd}
              className={`inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition shadow-lg ${currentPlatformMeta.btnBg}`}
            >
              <Plus className="w-4 h-4" />
              <span>Connect {currentPlatformMeta.name} Account Now</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {currentPlatformPages.map((page) => {
              const isCardSuspended = isUserSuspended || page.bot_status === 'SUSPENDED';
              const testRes = cardCheckResults[page.page_id];

              return (
                <div key={page.page_id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="text-base font-bold text-white">{page.page_name}</span>
                      
                      {isUserSuspended ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-400 text-xs font-semibold border border-rose-500/30">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>SUSPENDED by Administrator</span>
                        </span>
                      ) : page.bot_status === 'SUSPENDED' ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-400 text-xs font-semibold border border-rose-500/30">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>Channel Suspended by Admin</span>
                        </span>
                      ) : isFreeTrialExpired ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 text-xs font-semibold border border-amber-500/30">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Free Trial Expired (Payment Required)</span>
                        </span>
                      ) : isSubscriptionExpired ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 text-xs font-semibold border border-amber-500/30">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Subscription Expired</span>
                        </span>
                      ) : page.is_active ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Connected &amp; Active</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 text-xs font-medium">
                          <span>Paused</span>
                        </span>
                      )}

                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-semibold">
                        {currentPlatformMeta.workflows}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 font-mono">
                      {currentPlatformMeta.idLabel}: <span className="text-indigo-400 font-semibold">{page.page_id}</span>
                    </p>

                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                      <span className="text-xs text-slate-500 font-mono">
                        Access Token: {page.page_access_token ? `${page.page_access_token.slice(0, 18)}...` : 'None'}
                      </span>
                      {testRes && (
                        <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium border ${
                          testRes.success
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}>
                          {testRes.success ? <Check className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                          <span>{testRes.success ? `Verified (${testRes.pageName || 'OK'})` : testRes.error}</span>
                        </span>
                      )}
                    </div>

                    {isCardSuspended && (
                      <p className="text-[11px] text-rose-400/90 font-medium">
                        Automated n8n workflows are blocked because of administrator suspension.
                      </p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleTestCardToken(page)}
                      disabled={cardCheckingId === page.page_id}
                      className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-400 hover:text-indigo-300 transition"
                      title="Verify Credentials"
                    >
                      <RefreshCw className={`w-4 h-4 ${cardCheckingId === page.page_id ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                      onClick={() => handleStartEdit(page)}
                      className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-400 hover:text-indigo-300 transition"
                      title="Edit Credentials"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleTriggerDelete(page)}
                      className="p-2.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition"
                      title="Disconnect Account"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* All Connected Channels Overview Summary */}
      {pages.length > 0 && (
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Active Multi-Platform Summary ({pages.length} Total Connected)
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              All connected credentials above are automatically available to your n8n Auto-Posting and AI Chatbot workflows.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">
              FB: {fbPages.length}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-pink-500/10 text-pink-400 border border-pink-500/20 font-semibold">
              IG: {igPages.length}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
              WA: {waPages.length}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 font-semibold">
              IN: {liPages.length}
            </span>
          </div>
        </div>
      )}

      {/* Upgrade Required Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2 text-amber-400">
                <Crown className="w-5 h-5" />
                <h3 className="text-base font-bold text-white">Channel Quota Reached</h3>
              </div>
              <button onClick={() => setShowUpgradeModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-slate-300">
                Your account is currently on the <strong className="text-amber-400">{planTier}</strong> tier, which permits up to <strong>{maxPages} connected social channel(s)</strong>.
              </p>
              <p className="text-xs text-slate-400 leading-relaxed">
                To connect additional Facebook, Instagram, WhatsApp, or LinkedIn accounts, please upgrade to a higher tier plan:
              </p>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <p className="text-xs font-bold text-white">Starter Growth</p>
                  <p className="text-lg font-black text-indigo-400 mt-1">3 Channels</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">৳1,499 / mo</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <p className="text-xs font-bold text-white">Business Pro</p>
                  <p className="text-lg font-black text-purple-400 mt-1">10 Channels</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">৳3,999 / mo</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowUpgradeModal(false);
                  if (onUpgradePlan) onUpgradePlan();
                }}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-lg shadow-indigo-600/30"
              >
                <span>View Full Pricing Plans</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        title="Disconnect Social Account"
        message={`Are you sure you want to disconnect "${pageToDelete?.page_name || 'this account'}" (ID: ${pageToDelete?.page_id})? Automated n8n chatbot replies and scheduled posts for this channel will stop immediately.`}
        confirmText="Yes, Disconnect"
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setPageToDelete(null);
        }}
      />
    </div>
  );
}
