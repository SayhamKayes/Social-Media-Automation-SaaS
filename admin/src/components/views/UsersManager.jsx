import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Key, 
  ShieldCheck, 
  ShieldAlert, 
  Edit3, 
  Trash2, 
  Mail, 
  CheckCircle2, 
  AlertCircle,
  Lock,
  X,
  RefreshCw,
  Plus,
  Eye,
  Copy,
  Check,
  Info,
  Calendar,
  Clock,
  Sparkles,
  Zap
} from 'lucide-react';
import ConfirmDeleteModal from '../ConfirmDeleteModal';

const PLAN_DEFAULT_QUOTAS = {
  free: { tokenLimit: 50000, messageLimit: 5000, postLimit: 5 },
  starter: { tokenLimit: 500000, messageLimit: 50000, postLimit: 20 },
  business: { tokenLimit: 2500000, messageLimit: 250000, postLimit: 60 },
  agency: { tokenLimit: 10000000, messageLimit: 10000000, postLimit: 99999 }
};

export default function UsersManager({ 
  users = [], 
  settings = {},
  onSaveSettings,
  onUpdateUserPlan, 
  onUpdateUserStatus,
  onResetUserPassword,
  onDeleteUser
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPlan, setFilterPlan] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  /* View User Details & Token Manager Modal State */
  const [viewingUser, setViewingUser] = useState(null);
  const [copiedUuid, setCopiedUuid] = useState(false);
  const [customTokenInput, setCustomTokenInput] = useState('');
  const [savingTokenQuota, setSavingTokenQuota] = useState(false);

  /* Delete User Confirmation State */
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  /* Password Reset Modal State */
  const [selectedUserForPassword, setSelectedUserForPassword] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [passwordModalSuccess, setPasswordModalSuccess] = useState('');
  const [passwordModalError, setPasswordModalError] = useState('');
  const [loadingAction, setLoadingAction] = useState(false);

  /* General Notification */
  const [actionNotice, setActionNotice] = useState('');

  /* Helper: Parse user quota usage & custom limits from Supabase platform_settings or localStorage */
  const getUserQuotaStats = (user) => {
    const planKey = String(user?.plan_tier || 'free').toLowerCase();
    const basePlan = PLAN_DEFAULT_QUOTAS[planKey] || PLAN_DEFAULT_QUOTAS.free;
    const settingKey = `quota_usage_${user?.id}`;
    let parsed = null;

    if (settings && settings[settingKey]) {
      try {
        parsed = JSON.parse(settings[settingKey]);
      } catch {
        parsed = null;
      }
    }

    if (!parsed && user?.id) {
      try {
        const localRaw = localStorage.getItem(`saas_quota_usage_${user.id}`);
        if (localRaw) parsed = JSON.parse(localRaw);
      } catch {
        parsed = null;
      }
    }

    const tokensUsed = Number(parsed?.tokensUsed) || 0;
    const messagesUsed = Number(parsed?.messagesUsed) || 0;
    const postsUsed = Number(parsed?.postsUsed) || 0;
    const tokenLimit = parsed?.customTokenLimit ? Number(parsed.customTokenLimit) : basePlan.tokenLimit;
    const messageLimit = parsed?.customMessageLimit ? Number(parsed.customMessageLimit) : basePlan.messageLimit;
    const postLimit = parsed?.customPostLimit ? Number(parsed.customPostLimit) : basePlan.postLimit;

    const tokensRemaining = Math.max(0, tokenLimit - tokensUsed);
    const messagesRemaining = Math.max(0, messageLimit - messagesUsed);
    const isTokenExhausted = tokensUsed >= tokenLimit;

    /* Calculate Next Token Reset Date */
    let nextResetDate = null;
    if (parsed?.nextResetAt) {
      const d = new Date(parsed.nextResetAt);
      if (!isNaN(d.getTime())) nextResetDate = d;
    }
    if (!nextResetDate && user?.subscription_expires_at) {
      const d = new Date(user.subscription_expires_at);
      if (!isNaN(d.getTime())) nextResetDate = d;
    }
    if (!nextResetDate) {
      const baseDate = user?.subscription_started_at
        ? new Date(user.subscription_started_at)
        : user?.created_at
          ? new Date(user.created_at)
          : new Date();
      nextResetDate = new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000);
      const now = new Date();
      while (nextResetDate < now) {
        nextResetDate.setTime(nextResetDate.getTime() + 30 * 24 * 60 * 60 * 1000);
      }
    }

    return {
      rawParsed: parsed || {},
      tokensUsed,
      tokenLimit,
      tokensRemaining,
      isTokenExhausted,
      messagesUsed,
      messageLimit,
      messagesRemaining,
      postsUsed,
      postLimit,
      nextResetDate
    };
  };

  /* Persist updated token quota for a user into Supabase platform_settings & localStorage */
  const handlePersistUserQuota = async (targetUser, updatedFields, successMsg) => {
    if (!targetUser?.id) return;
    setSavingTokenQuota(true);
    try {
      const currentStats = getUserQuotaStats(targetUser);
      const nextPayload = {
        messagesUsed: currentStats.messagesUsed,
        tokensUsed: currentStats.tokensUsed,
        postsUsed: currentStats.postsUsed,
        customTokenLimit: currentStats.rawParsed.customTokenLimit || null,
        customMessageLimit: currentStats.rawParsed.customMessageLimit || null,
        customPostLimit: currentStats.rawParsed.customPostLimit || null,
        nextResetAt: currentStats.rawParsed.nextResetAt || currentStats.nextResetDate.toISOString(),
        ...updatedFields,
        updatedAt: new Date().toISOString()
      };

      const serialized = JSON.stringify(nextPayload);
      localStorage.setItem(`saas_quota_usage_${targetUser.id}`, serialized);

      if (onSaveSettings) {
        await onSaveSettings({ [`quota_usage_${targetUser.id}`]: serialized });
      }

      if (nextPayload.customTokenLimit) {
        setCustomTokenInput(String(nextPayload.customTokenLimit));
      }
      setActionNotice(successMsg || `Token quota updated for ${targetUser.email}!`);
      setTimeout(() => setActionNotice(''), 3500);
    } catch (err) {
      alert('Failed to update user token quota: ' + (err.message || 'Unknown error'));
    } finally {
      setSavingTokenQuota(false);
    }
  };

  const handleOpenViewUser = (user) => {
    const stats = getUserQuotaStats(user);
    setCustomTokenInput(String(stats.tokenLimit));
    setViewingUser(user);
  };

  const handleCopyUuid = (uuid) => {
    if (!uuid) return;
    navigator.clipboard.writeText(uuid);
    setCopiedUuid(true);
    setTimeout(() => setCopiedUuid(false), 2000);
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch = 
      (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.id || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPlan = filterPlan === 'all' || u.plan_tier === filterPlan;
    const matchesStatus = filterStatus === 'all' || u.status === filterStatus;
    return matchesSearch && matchesPlan && matchesStatus;
  });

  const handlePlanChange = async (userId, newPlan) => {
    try {
      await onUpdateUserPlan(userId, newPlan);
      setActionNotice(`Plan successfully updated to ${newPlan.toUpperCase()}!`);
      setTimeout(() => setActionNotice(''), 3000);
    } catch (err) {
      alert('Failed to update plan: ' + err.message);
    }
  };

  const handleStatusToggle = async (userId, currentStatus) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      await onUpdateUserStatus(userId, nextStatus);
      setActionNotice(`User account status marked as ${nextStatus.toUpperCase()}`);
      setTimeout(() => setActionNotice(''), 3000);
    } catch (err) {
      alert('Failed to toggle status: ' + err.message);
    }
  };

  const handleOpenPasswordModal = (user) => {
    setSelectedUserForPassword(user);
    setNewPassword('');
    setPasswordModalSuccess('');
    setPasswordModalError('');
  };

  const handleSaveNewPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setPasswordModalError('Password must be at least 6 characters long.');
      return;
    }

    setLoadingAction(true);
    setPasswordModalError('');
    setPasswordModalSuccess('');

    try {
      await onResetUserPassword(selectedUserForPassword.id, newPassword);
      setPasswordModalSuccess(`Password for ${selectedUserForPassword.email} updated successfully!`);
      setTimeout(() => {
        setSelectedUserForPassword(null);
      }, 1500);
    } catch (err) {
      setPasswordModalError(err.message || 'Failed to update password.');
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">User Management</h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage client subscriptions, monitor remaining AI tokens, top up token limits on payment, and reset passwords.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs px-3 py-1.5 rounded-xl bg-purple-500/10 text-purple-300 border border-purple-500/20 font-bold">
            Total Accounts: {users.length}
          </span>
        </div>
      </div>

      {actionNotice && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search email or UID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
          />
        </div>

        <div>
          <select
            value={filterPlan}
            onChange={(e) => setFilterPlan(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-purple-500 transition"
          >
            <option value="all">All Subscription Plans</option>
            <option value="free">Free Tier</option>
            <option value="starter">Starter Plan</option>
            <option value="business">Business Plan</option>
            <option value="agency">Agency / Pro Plan</option>
          </select>
        </div>

        <div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-purple-500 transition"
          >
            <option value="all">All Account Statuses</option>
            <option value="active">Active Only</option>
            <option value="suspended">Suspended Only</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                <th className="py-3.5 px-4">User Email / Account</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Plan &amp; Package</th>
                <th className="py-3.5 px-4">AI Tokens &amp; Reset</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Registered</th>
                <th className="py-3.5 px-4 text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-500">
                    No users match the current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isOwner = user.role === 'super_admin';

                  const startedAt = user.subscription_started_at 
                    ? new Date(user.subscription_started_at)
                    : user.created_at 
                      ? new Date(user.created_at)
                      : new Date();

                  const expiresAt = user.subscription_expires_at 
                    ? new Date(user.subscription_expires_at) 
                    : new Date(startedAt.getTime() + 30 * 24 * 60 * 60 * 1000);

                  const isExpired = new Date() > expiresAt;
                  const isFreeTrial = (user.plan_tier || 'free').toLowerCase() === 'free';
                  const isFreeTrialExpired = isFreeTrial && isExpired;

                  const quotaStats = getUserQuotaStats(user);
                  const resetFormatted = quotaStats.nextResetDate.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                  });

                  return (
                    <tr key={user.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white flex items-center space-x-1.5">
                          <span>{user.email}</span>
                          {isOwner && (
                            <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                              Owner
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 font-mono">
                          UID: {user.id ? `${user.id.slice(0, 18)}...` : 'N/A'}
                        </p>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          isOwner 
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {user.role || 'user'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <select
                          value={user.plan_tier || 'free'}
                          onChange={(e) => handlePlanChange(user.id, e.target.value)}
                          className="px-2.5 py-1 rounded-lg bg-slate-950 border border-purple-900/50 text-purple-300 text-[11px] font-bold uppercase focus:outline-none focus:border-purple-500"
                        >
                          <option value="free">Free Plan</option>
                          <option value="starter">Starter</option>
                          <option value="business">Business</option>
                          <option value="agency">Agency</option>
                        </select>
                        <span className="text-[10px] text-slate-400 block mt-1 font-mono">
                          {user.plan_tier === 'agency' || Number(user.max_pages) >= 999 ? 'Unlimited' : (user.max_pages || 1)} Channels
                        </span>
                        {isFreeTrialExpired && (
                          <span className="text-[9px] text-amber-400 font-bold block mt-0.5">
                            Free Tier Expired
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono">
                        <div className="flex items-center space-x-1.5">
                          <span className={`font-bold text-xs ${
                            quotaStats.isTokenExhausted ? 'text-rose-400' : 'text-purple-300'
                          }`}>
                            {quotaStats.tokensRemaining.toLocaleString()} / {quotaStats.tokenLimit.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-slate-400">left</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-slate-400">
                            Resets: {resetFormatted}
                          </span>
                          {quotaStats.isTokenExhausted && (
                            <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[9px] font-bold uppercase animate-pulse">
                              Token Limit Exhausted
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleStatusToggle(user.id, user.status)}
                          className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition ${
                            user.status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'active' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                          <span>{user.status || 'active'}</span>
                        </button>
                      </td>

                      <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Active'}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {quotaStats.isTokenExhausted && (
                            <button
                              type="button"
                              onClick={() => handleOpenViewUser(user)}
                              className="p-1.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500 hover:text-white transition flex items-center justify-center shadow-sm shadow-rose-500/20"
                              title="Token Limit Exhausted: Click to Top Up Tokens"
                            >
                              <AlertCircle className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {isFreeTrialExpired && (
                            <div className="relative group inline-block">
                              <button
                                type="button"
                                onClick={() => handleOpenViewUser(user)}
                                className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500 hover:text-slate-950 transition flex items-center justify-center shadow-sm shadow-amber-500/20"
                                title="Free tier expire"
                              >
                                <Info className="w-3.5 h-3.5" />
                              </button>
                              <div className="absolute bottom-full right-0 mb-1.5 hidden group-hover:flex flex-col items-center z-50 pointer-events-none">
                                <div className="bg-slate-900 border border-amber-500/40 text-amber-200 text-[10px] font-bold px-2.5 py-1 rounded-md shadow-xl whitespace-nowrap flex items-center space-x-1.5">
                                  <AlertCircle className="w-3 h-3 text-amber-400 shrink-0" />
                                  <span>Free tier expire</span>
                                </div>
                                <div className="w-1.5 h-1.5 bg-slate-900 border-r border-b border-amber-500/40 transform rotate-45 -mt-0.5"></div>
                              </div>
                            </div>
                          )}

                          <button
                            onClick={() => handleOpenViewUser(user)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                            title="View User Details & Manage Tokens"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenPasswordModal(user)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-purple-600/30 text-purple-300 transition"
                            title="Reset User Password"
                          >
                            <Key className="w-3.5 h-3.5" />
                          </button>
                          {!isOwner && (
                            <button
                              onClick={() => {
                                setUserToDelete(user);
                                setIsDeleteModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-rose-400 transition"
                              title="Delete Account"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin Password Reset Modal */}
      {selectedUserForPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-2xl bg-slate-900 border border-purple-500/30 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Lock className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold text-white">Direct Password Reset</h3>
              </div>
              <button 
                onClick={() => setSelectedUserForPassword(null)}
                className="text-slate-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Set a new permanent or temporary password for: <br />
              <strong className="text-purple-300 font-mono">{selectedUserForPassword.email}</strong>
            </p>

            {passwordModalError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                {passwordModalError}
              </div>
            )}

            {passwordModalSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs">
                {passwordModalSuccess}
              </div>
            )}

            <form onSubmit={handleSaveNewPassword} className="space-y-4 pt-1">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  New Password (Minimum 6 characters)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter new secure password..."
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-purple-500 transition"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedUserForPassword(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loadingAction}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow-lg shadow-purple-600/30 disabled:opacity-50"
                >
                  {loadingAction ? 'Updating...' : 'Set New Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Details & Token Management Modal (Eye Action) */}
      {viewingUser && (() => {
        const viewingStartedAt = viewingUser.subscription_started_at 
          ? new Date(viewingUser.subscription_started_at)
          : viewingUser.created_at 
            ? new Date(viewingUser.created_at)
            : new Date();

        const viewingExpiresAt = viewingUser.subscription_expires_at 
          ? new Date(viewingUser.subscription_expires_at) 
          : new Date(viewingStartedAt.getTime() + 30 * 24 * 60 * 60 * 1000);

        const isViewingExpired = new Date() > viewingExpiresAt;
        const isViewingFreeTrial = (viewingUser.plan_tier || 'free').toLowerCase() === 'free';
        const isViewingFreeTrialExpired = isViewingFreeTrial && isViewingExpired;

        const viewingQuota = getUserQuotaStats(viewingUser);
        const viewingResetFormatted = viewingQuota.nextResetDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-xl p-6 rounded-2xl bg-slate-900 border border-purple-500/30 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                    <Eye className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">User Profile &amp; Token Management</h3>
                    <p className="text-xs text-slate-400">Inspect account details, remaining AI tokens, and top up token limits</p>
                  </div>
                </div>
                <button
                  onClick={() => setViewingUser(null)}
                  className="text-slate-400 hover:text-white transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Full Unmasked UID with 1-click Copy */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      UID
                    </span>
                    <button
                      onClick={() => handleCopyUuid(viewingUser.id)}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-300 text-[11px] font-semibold transition"
                    >
                      {copiedUuid ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy UID</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs font-mono text-purple-300 break-all select-all font-semibold">
                    {viewingUser.id || 'N/A'}
                  </p>
                </div>

                {/* Token Limit Exhausted Alert inside Eye Modal */}
                {viewingQuota.isTokenExhausted && (
                  <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs flex items-center justify-between shadow-lg">
                    <div className="flex items-center space-x-2.5">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      <div>
                        <p className="font-bold text-rose-300">Token Limit Exhausted (0 Remaining)</p>
                        <p className="text-[11px] text-rose-300/80 mt-0.5">
                          User has consumed all {viewingQuota.tokenLimit.toLocaleString()} AI tokens. Automatically resets on {viewingResetFormatted}, or add extra paid tokens below.
                        </p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-md bg-rose-500/20 text-rose-300 font-bold text-[10px] uppercase border border-rose-500/30 shrink-0">
                      Exhausted
                    </span>
                  </div>
                )}

                {/* Free Tier Expired Notice */}
                {isViewingFreeTrialExpired && (
                  <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs flex items-center justify-between shadow-lg">
                    <div className="flex items-center space-x-2.5">
                      <Info className="w-4 h-4 text-amber-400 shrink-0" />
                      <div>
                        <p className="font-bold text-amber-300">Free Tier Expired</p>
                        <p className="text-[11px] text-amber-300/80 mt-0.5">
                          1-month Free Trial has ended. User must pay to reactivate bot operations.
                        </p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 font-bold text-[10px] uppercase border border-amber-500/30 shrink-0">
                      Expired
                    </span>
                  </div>
                )}

                {/* AI Token Quota & Manual Top-Up Manager Card */}
                <div className="p-4 rounded-xl bg-slate-950 border border-purple-500/30 space-y-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                        AI Token Limit &amp; Manual Top-Up
                      </h4>
                    </div>
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 text-[10px] font-semibold">
                      <Clock className="w-3 h-3" />
                      <span>Next Token Reset: {viewingResetFormatted}</span>
                    </span>
                  </div>

                  {/* Token Counters */}
                  <div className="grid grid-cols-3 gap-2.5 text-center">
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-[10px] uppercase text-slate-400 font-bold block">Token Limit</span>
                      <span className="text-sm font-black font-mono text-white mt-0.5 block">
                        {viewingQuota.tokenLimit.toLocaleString()}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-[10px] uppercase text-slate-400 font-bold block">Tokens Used</span>
                      <span className="text-sm font-black font-mono text-amber-300 mt-0.5 block">
                        {viewingQuota.tokensUsed.toLocaleString()}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-[10px] uppercase text-slate-400 font-bold block">Remaining</span>
                      <span className={`text-sm font-black font-mono mt-0.5 block ${
                        viewingQuota.isTokenExhausted ? 'text-rose-400' : 'text-emerald-400'
                      }`}>
                        {viewingQuota.tokensRemaining.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Quick Paid Token Top-Up Buttons */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Quick Add Extra Tokens (After Payment Verification)
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { label: '+10K Tokens', amount: 10000 },
                        { label: '+50K Tokens', amount: 50000 },
                        { label: '+100K Tokens', amount: 100000 },
                        { label: '+250K Tokens', amount: 250000 }
                      ].map((pack) => (
                        <button
                          key={pack.amount}
                          type="button"
                          disabled={savingTokenQuota}
                          onClick={() => {
                            const nextLimit = viewingQuota.tokenLimit + pack.amount;
                            handlePersistUserQuota(
                              viewingUser,
                              { customTokenLimit: nextLimit },
                              `Added ${pack.label} to ${viewingUser.email} (New limit: ${nextLimit.toLocaleString()})`
                            );
                          }}
                          className="py-1.5 px-2 rounded-lg bg-purple-600/20 hover:bg-purple-600 text-purple-200 hover:text-white border border-purple-500/30 text-[11px] font-bold transition disabled:opacity-50"
                        >
                          {pack.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Token Limit Override & Reset Used Tokens */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2 pt-1">
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Set Custom Monthly Token Limit
                      </label>
                      <input
                        type="number"
                        min="1000"
                        step="1000"
                        value={customTokenInput}
                        onChange={(e) => setCustomTokenInput(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <button
                      type="button"
                      disabled={savingTokenQuota}
                      onClick={() => {
                        const val = Number(customTokenInput);
                        if (!val || val < 0) return;
                        handlePersistUserQuota(
                          viewingUser,
                          { customTokenLimit: val },
                          `Token limit set to ${val.toLocaleString()} for ${viewingUser.email}`
                        );
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shrink-0"
                    >
                      Save Limit
                    </button>
                    <button
                      type="button"
                      disabled={savingTokenQuota}
                      onClick={() => {
                        const nextCycle = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
                        handlePersistUserQuota(
                          viewingUser,
                          { tokensUsed: 0, messagesUsed: 0, nextResetAt: nextCycle },
                          `Used tokens reset to 0 for ${viewingUser.email}`
                        );
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition shrink-0"
                      title="Reset consumed tokens back to 0 and start fresh 30-day cycle"
                    >
                      Reset Used (0)
                    </button>
                  </div>
                </div>

                {/* Grid of properties */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Full Name</p>
                    <p className="font-semibold text-white mt-0.5">{viewingUser.full_name || 'Not Specified'}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Email Address</p>
                    <p className="font-semibold text-white mt-0.5 truncate">{viewingUser.email}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Role</p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      {viewingUser.role || 'user'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Account Status</p>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      viewingUser.status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-rose-500/10 text-rose-400'
                    }`}>
                      {viewingUser.status || 'active'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Subscription Tier</p>
                    <p className="font-bold text-indigo-300 uppercase mt-0.5">
                      {viewingUser.plan_tier || 'FREE'}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Allowed Pages Quota</p>
                    <p className="font-semibold text-white mt-0.5">
                      {viewingUser.plan_tier === 'agency' ? 'Unlimited' : (viewingUser.max_pages || 1)} Pages
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 col-span-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Subscription Validity</p>
                        <p className="font-mono text-xs text-slate-200 mt-0.5">
                          Expires: <span className={isViewingExpired ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>{viewingExpiresAt.toLocaleDateString()}</span>
                        </p>
                      </div>
                      {isViewingFreeTrialExpired ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Free tier expire
                        </span>
                      ) : isViewingExpired ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          Expired
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          Active
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 col-span-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Registration Timestamp</p>
                    <p className="font-mono text-slate-300 mt-0.5">
                      {viewingUser.created_at ? new Date(viewingUser.created_at).toLocaleString() : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setViewingUser(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Custom Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        title="Permanently Delete User Account"
        message={`Are you sure you want to permanently delete user account "${userToDelete?.email}" (UID: ${userToDelete?.id})? This action will remove all their multi-tenant access permanently.`}
        confirmText="Yes, Delete User"
        onConfirm={async () => {
          if (userToDelete) {
            await onDeleteUser(userToDelete.id);
          }
          setIsDeleteModalOpen(false);
          setUserToDelete(null);
        }}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setUserToDelete(null);
        }}
      />
    </div>
  );
}
