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
  Activity
} from 'lucide-react';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import { verifyMetaPageToken } from '../../lib/metaValidator';

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

  /* Form states for Facebook */
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
  const daysRemaining = expiresAt ? Math.max(0, Math.ceil((expiresAt - new Date()) / (1000 * 60 * 60 * 24))) : 30;

  const platforms = [
    { id: 'facebook', name: 'Facebook', icon: Facebook, count: pages.length, active: true, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { id: 'instagram', name: 'Instagram', icon: Instagram, count: 0, active: false, color: 'text-pink-400', bg: 'bg-pink-500/10' },
    { id: 'whatsapp', name: 'WhatsApp', icon: MessageCircle, count: 0, active: false, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, count: 0, active: false, color: 'text-sky-400', bg: 'bg-sky-500/10' },
  ];

  const handleStartEdit = (page) => {
    setEditingPageId(page.page_id);
    setPageId(page.page_id);
    setPageName(page.page_name || '');
    setPageAccessToken(page.page_access_token || '');
    setVerifyToken(page.verify_token || 'socialsaas_secret');
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
      setErrorMsg('Free Trial Expired: Your 1-Month Free Trial has ended. Please upgrade and pay for a package to connect pages.');
      setShowUpgradeModal(true);
      return;
    }
    if (isSubscriptionExpired) {
      setErrorMsg('Subscription Expired: Your 30-Day billing cycle has ended. Please renew to connect pages.');
      setShowUpgradeModal(true);
      return;
    }
    /* If adding a new page and quota reached, block and trigger upgrade modal */
    if (isQuotaReached) {
      setShowUpgradeModal(true);
      return;
    }
    handleCancelForm();
    setShowAddForm(true);
  };

  const handleTestTokenInForm = async () => {
    if (!pageId.trim() || !pageAccessToken.trim()) {
      setErrorMsg('Please enter both Facebook Page ID and Page Access Token before testing.');
      return;
    }
    setMetaChecking(true);
    setMetaResult(null);
    try {
      const res = await verifyMetaPageToken(pageId.trim(), pageAccessToken.trim());
      setMetaResult(res);
      if (res.success && res.pageName && !pageName) {
        setPageName(res.pageName);
      }
    } catch (err) {
      setMetaResult({ success: false, error: err.message || 'Token verification failed' });
    } finally {
      setMetaChecking(false);
    }
  };

  const handleTestCardToken = async (page) => {
    setCardCheckingId(page.page_id);
    try {
      const res = await verifyMetaPageToken(page.page_id, page.page_access_token);
      setCardCheckResults(prev => ({
        ...prev,
        [page.page_id]: res
      }));
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
      setErrorMsg('Failed to disconnect page: ' + (err.message || 'Unknown error'));
      setIsDeleteModalOpen(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (isFreeTrialExpired) {
      setErrorMsg('Free Trial Expired: Your 1-Month Free Trial has ended. Please upgrade to a paid package to connect or edit Facebook pages.');
      setShowUpgradeModal(true);
      return;
    }

    if (isSubscriptionExpired) {
      setErrorMsg('Subscription Expired: Your 30-Day billing cycle has ended. Please renew your plan to connect or edit Facebook pages.');
      setShowUpgradeModal(true);
      return;
    }

    /* Strict client side quota defense */
    if (!editingPageId && isQuotaReached) {
      setErrorMsg(`Quota Reached: Your ${planTier} plan allows maximum ${maxPages} page(s). Please upgrade to connect more.`);
      setShowUpgradeModal(true);
      return;
    }

    if (!pageId.trim() || !pageAccessToken.trim()) {
      setErrorMsg('Page ID and Page Access Token are mandatory.');
      return;
    }

    setLoading(true);
    try {
      await onSavePage({
        page_id: pageId.trim(),
        page_name: pageName.trim() || 'My Facebook Business Page',
        page_access_token: pageAccessToken.trim(),
        verify_token: verifyToken.trim() || 'socialsaas_secret',
        is_active: true
      });

      setSuccessMsg(editingPageId ? 'Facebook Page updated successfully!' : 'Facebook Page connected and saved successfully!');
      handleCancelForm();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save page.');
    } finally {
      setLoading(false);
    }
  };

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
            Connect and manage multi-tenant accounts across Facebook, Instagram, WhatsApp, and more.
          </p>
        </div>

        {selectedPlatform === 'facebook' && (
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowTutorial(!showTutorial)}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              <HelpCircle className="w-4 h-4 text-indigo-400" />
              <span>Token Guide</span>
            </button>
            <button
              onClick={showAddForm ? handleCancelForm : handleOpenAdd}
              className={`inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition shadow-lg ${
                showAddForm
                  ? 'bg-slate-800 text-slate-300 hover:text-white'
                  : isQuotaReached
                    ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
              }`}
            >
              {showAddForm ? (
                <span>Cancel</span>
              ) : isQuotaReached ? (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Connect Page (Limit Reached)</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Connect New Page</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Quota Limit Reached Warning Banner */}
      {isQuotaReached && selectedPlatform === 'facebook' && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-200">
          <div className="flex items-start sm:items-center space-x-3">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <p className="text-xs font-bold">
                Page Limit Reached ({currentCount}/{maxPages} pages connected)
              </p>
              <p className="text-[11px] text-amber-300/80 mt-0.5">
                Your current <strong>{planTier}</strong> plan is capped at {maxPages} page(s). Upgrade to <strong>Starter Growth (3 pages)</strong> or <strong>Business Pro (10 pages)</strong> to connect additional client pages.
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
                Automated Messenger bot responses are temporarily paused across all connected pages. Please contact platform administrators to restore service.
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
                Your 30-day Free Trial period has ended. Automated bot messaging is suspended across all connected pages. Please select and pay for a subscription package to reactivate your bots.
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
                Your monthly subscription period has concluded. Autopilot replies are currently paused. Renew your subscription to immediately reactivate your bots.
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

      {/* Platform Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
              className={`p-4 rounded-2xl border transition-all flex items-center justify-between text-left ${
                isSelected
                  ? 'bg-slate-900 border-indigo-500 shadow-lg shadow-indigo-500/10'
                  : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-9 h-9 rounded-xl ${p.bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${p.color}`} />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{p.name}</p>
                  <p className="text-[11px] text-slate-500">
                    {p.active ? `${p.count} Connected` : 'Ready to Connect'}
                  </p>
                </div>
              </div>
              {isSelected && <span className="w-2 h-2 rounded-full bg-indigo-400" />}
            </button>
          );
        })}
      </div>

      {/* Messages */}
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

      {/* Detailed Token Guide Card */}
      {showTutorial && selectedPlatform === 'facebook' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-indigo-500/30 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <KeyRound className="w-4 h-4 text-indigo-400" />
              <span>Step-by-Step Guide: Connecting Your Facebook Page</span>
            </h3>
            <button onClick={() => setShowTutorial(false)} className="text-xs text-slate-500 hover:text-white">
              Close
            </button>
          </div>

          <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 flex items-start space-x-2">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              <strong>Good News:</strong> You only need your <strong>Facebook Page ID</strong> and <strong>Page Access Token</strong> here. You do <em>not</em> need to enter Meta App ID or App Secret for your bot to chat!
            </span>
          </div>

          <ol className="list-decimal list-inside space-y-2.5 text-xs text-slate-300 leading-relaxed">
            <li>
              <strong>Get your Page ID:</strong> Open your Facebook Page in a browser, go to <strong>About &gt; Page transparency</strong> to copy the numeric <strong>Page ID</strong>.
            </li>
            <li>
              <strong>Generate Page Access Token:</strong> Go to the official{' '}
              <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noreferrer" className="text-indigo-400 underline inline-flex items-center space-x-1">
                <span>Meta Graph API Explorer</span>
                <ExternalLink className="w-3 h-3" />
              </a>. Select your Page under <em>User or Page</em>, and grant <code className="bg-slate-800 px-1 py-0.5 rounded text-indigo-300">pages_messaging</code> permission.
            </li>
            <li>
              <strong>Extend to Permanent Token:</strong> In{' '}
              <a href="https://developers.facebook.com/tools/debug/accesstoken/" target="_blank" rel="noreferrer" className="text-indigo-400 underline inline-flex items-center space-x-1">
                <span>Access Token Debugger</span>
                <ExternalLink className="w-3 h-3" />
              </a>, paste your token and click <strong>Extend Access Token</strong>.
            </li>
            <li>
              <strong>Paste &amp; Save:</strong> Click <strong>Connect New Page</strong>, paste your credentials, and start automated conversations!
            </li>
          </ol>
        </div>
      )}

      {/* FACEBOOK TAB CONTENT */}
      {selectedPlatform === 'facebook' && (
        <>
          {showAddForm && (
            <div className="p-6 rounded-2xl bg-slate-900 border border-indigo-500/30 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <Facebook className="w-4 h-4 text-blue-400" />
                  <span>{editingPageId ? 'Edit Facebook Page Details' : 'Connect New Facebook Page'}</span>
                </h3>
                {editingPageId && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 font-medium border border-amber-500/30">
                    Editing Mode
                  </span>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                      Page Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. SKzLAB Software Agency"
                      value={pageName}
                      onChange={(e) => setPageName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                      Facebook Page ID (Numeric)
                    </label>
                    <input
                      type="text"
                      required
                      disabled={!!editingPageId}
                      placeholder="e.g. 109827364512345"
                      value={pageId}
                      onChange={(e) => setPageId(e.target.value)}
                      className={`w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500 font-mono transition ${
                        editingPageId ? 'opacity-60 cursor-not-allowed' : ''
                      }`}
                    />
                    {editingPageId && (
                      <p className="text-[10px] text-slate-500 mt-1">
                        Page ID is the unique database key and cannot be altered while editing.
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                      Page Access Token (Permanent / Long-Lived)
                    </label>
                    <button
                      type="button"
                      onClick={handleTestTokenInForm}
                      disabled={metaChecking || !pageAccessToken.trim() || !pageId.trim()}
                      className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white text-xs font-semibold border border-indigo-500/20 disabled:opacity-50 transition"
                    >
                      <RefreshCw className={`w-3 h-3 ${metaChecking ? 'animate-spin' : ''}`} />
                      <span>{metaChecking ? 'Verifying with Meta...' : 'Test Token with Meta'}</span>
                    </button>
                  </div>
                  <textarea
                    required
                    rows={3}
                    placeholder="EAAbx1whxNGcBS2..."
                    value={pageAccessToken}
                    onChange={(e) => setPageAccessToken(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-indigo-500 transition"
                  />
                  <div className="flex items-center justify-between mt-1 text-[11px]">
                    <span className="text-slate-500">
                      Protected by Supabase Row-Level Security (RLS). Never shared across clients.
                    </span>
                    {metaResult && (
                      <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-md font-medium border ${
                        metaResult.success
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                      }`}>
                        {metaResult.success ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                        <span>{metaResult.success ? `Meta Verified: ${metaResult.pageName || 'Valid Token'}` : metaResult.error}</span>
                      </span>
                    )}
                  </div>
                </div>

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
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-600/30 disabled:opacity-50"
                  >
                    {loading 
                      ? (editingPageId ? 'Updating...' : 'Connecting...') 
                      : (editingPageId ? 'Update Page Details' : 'Save & Connect Page')}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Connected Facebook Pages List */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Facebook className="w-4 h-4 text-blue-400" />
                <span>Connected Facebook Pages ({pages.length})</span>
              </h3>
              <span className="text-xs text-slate-500">Auto-routes to production n8n webhook</span>
            </div>

            {pages.length === 0 ? (
              <div className="p-12 text-center">
                <Facebook className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-base font-semibold text-slate-300">No Facebook Pages Connected</p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Click "Connect New Page" above to add your first Facebook business page.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800">
                {pages.map((page) => {
                  const isCardSuspended = isUserSuspended || page.bot_status === 'SUSPENDED';
                  const testRes = cardCheckResults[page.page_id];

                  return (
                    <div key={page.page_id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-3">
                          <span className="text-base font-bold text-white">{page.page_name}</span>
                          
                          {isUserSuspended ? (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-400 text-xs font-semibold border border-rose-500/30">
                              <ShieldAlert className="w-3.5 h-3.5" />
                              <span>SUSPENDED by Administrator</span>
                            </span>
                          ) : page.bot_status === 'SUSPENDED' ? (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-400 text-xs font-semibold border border-rose-500/30">
                              <ShieldAlert className="w-3.5 h-3.5" />
                              <span>Page Suspended by Admin</span>
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
                            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Active &amp; Ready</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 text-xs font-medium">
                              <span>Paused</span>
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-400 font-mono">
                          Page ID: <span className="text-indigo-400 font-semibold">{page.page_id}</span>
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
                              <span>{testRes.success ? `Token Validated (${testRes.pageName || 'Meta OK'})` : testRes.error}</span>
                            </span>
                          )}
                        </div>

                        {isCardSuspended && (
                          <p className="text-[11px] text-rose-400/90 font-medium">
                            Automatic messenger replies are blocked because of administrator suspension.
                          </p>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleTestCardToken(page)}
                          disabled={cardCheckingId === page.page_id}
                          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-400 hover:text-indigo-300 transition"
                          title="Test Token with Meta Graph API"
                        >
                          <RefreshCw className={`w-4 h-4 ${cardCheckingId === page.page_id ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                          onClick={() => handleStartEdit(page)}
                          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-400 hover:text-indigo-300 transition"
                          title="Edit Page Credentials"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleTriggerDelete(page)}
                          className="p-2.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition"
                          title="Disconnect Page"
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
        </>
      )}

      {/* Upgrade Required Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2 text-amber-400">
                <Crown className="w-5 h-5" />
                <h3 className="text-base font-bold text-white">Page Quota Reached</h3>
              </div>
              <button onClick={() => setShowUpgradeModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-slate-300">
                Your account is currently on the <strong className="text-amber-400">{planTier}</strong> tier, which permits up to <strong>{maxPages} connected page(s)</strong>.
              </p>
              <p className="text-xs text-slate-400 leading-relaxed">
                To connect more brand pages, please upgrade to a higher tier plan. You can view full pricing details or contact your administrator:
              </p>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <p className="text-xs font-bold text-white">Starter Growth</p>
                  <p className="text-lg font-black text-indigo-400 mt-1">3 Pages</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">৳1,499 / mo</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <p className="text-xs font-bold text-white">Business Pro</p>
                  <p className="text-lg font-black text-purple-400 mt-1">10 Pages</p>
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

      {/* Other Platform Placeholders */}
      {selectedPlatform === 'instagram' && (
        <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center mx-auto text-pink-400">
            <Instagram className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-white">Instagram Direct Message Automation</h3>
          <p className="text-sm text-slate-400 max-w-lg mx-auto">
            Connect your Instagram Professional Account via Meta Graph API to automate DM sales and lead capture.
          </p>
        </div>
      )}

      {selectedPlatform === 'whatsapp' && (
        <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400">
            <MessageCircle className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-white">WhatsApp Cloud API Automation</h3>
          <p className="text-sm text-slate-400 max-w-lg mx-auto">
            Send automated order notifications, catalog responses, and interactive button replies on WhatsApp.
          </p>
        </div>
      )}

      {selectedPlatform === 'linkedin' && (
        <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mx-auto text-sky-400">
            <Linkedin className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-white">LinkedIn Outreach &amp; Post Automation</h3>
          <p className="text-sm text-slate-400 max-w-lg mx-auto">
            Schedule corporate updates, multi-image articles, and auto-reply to inbound networking messages.
          </p>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        title="Disconnect Business Page"
        message={`Are you sure you want to disconnect "${pageToDelete?.page_name || 'this page'}" (ID: ${pageToDelete?.page_id})? AI auto-replies will stop listening for this page immediately.`}
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
