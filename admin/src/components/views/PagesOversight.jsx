import React, { useState } from 'react';
import { 
  Share2, 
  Search, 
  Facebook, 
  Instagram, 
  MessageCircle,
  Linkedin,
  ShieldCheck, 
  ShieldAlert, 
  Trash2, 
  ExternalLink,
  Power,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Copy,
  Check,
  Sparkles,
  FileSpreadsheet,
  Bot,
  X
} from 'lucide-react';
import ConfirmDeleteModal from '../ConfirmDeleteModal';
import { verifyMetaPageToken } from '../../lib/metaValidator';

const detectAppPlatform = (page) => {
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

export default function PagesOversight({ 
  pages = [], 
  users = [],
  settings = {},
  onTogglePageStatus,
  onUpdatePageBotStatus,
  onDeletePage
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState('ALL');
  const [notice, setNotice] = useState('');
  const [pageToDelete, setPageToDelete] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  /* Page Detail Oversight Modal State */
  const [selectedPage, setSelectedPage] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [targetBotStatus, setTargetBotStatus] = useState('ACTIVE');
  const [statusSaving, setStatusSaving] = useState(false);

  /* Meta Token Verification State */
  const [verifyingToken, setVerifyingToken] = useState(false);
  const [metaCheckResult, setMetaCheckResult] = useState(null);

  const getUserEmail = (userId) => {
    const found = users.find(u => u.id === userId);
    return found ? found.email : 'Unknown Owner';
  };

  const filteredPages = pages.filter((p) => {
    const plat = detectAppPlatform(p);
    const matchesPlatform = platformFilter === 'ALL' || plat === platformFilter.toLowerCase();
    const ownerEmail = getUserEmail(p.user_id).toLowerCase();
    const matchesSearch = 
      (p.page_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.page_id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      ownerEmail.includes(searchQuery.toLowerCase());
    return matchesPlatform && matchesSearch;
  });

  const handleOpenDetailModal = (page) => {
    setSelectedPage(page);
    setTargetBotStatus(page.bot_status || (page.is_active !== false ? 'ACTIVE' : 'INACTIVE'));
    setShowToken(false);
    setMetaCheckResult(null);
    setShowDetailModal(true);
  };

  const handleVerifyToken = async () => {
    if (!selectedPage?.page_access_token) return;
    setVerifyingToken(true);
    setMetaCheckResult(null);
    try {
      const result = await verifyMetaPageToken(selectedPage.page_id, selectedPage.page_access_token);
      setMetaCheckResult(result);
    } catch (err) {
      setMetaCheckResult({
        valid: false,
        message: err.message || 'Verification attempt failed'
      });
    } finally {
      setVerifyingToken(false);
    }
  };

  const handleSaveBotStatus = async () => {
    if (!selectedPage) return;
    setStatusSaving(true);
    try {
      if (onUpdatePageBotStatus) {
        await onUpdatePageBotStatus(selectedPage.page_id, targetBotStatus);
      } else if (onTogglePageStatus) {
        await onTogglePageStatus(selectedPage.page_id, targetBotStatus === 'ACTIVE');
      }
      setNotice(`Page "${selectedPage.page_name}" bot status updated to ${targetBotStatus}!`);
      setShowDetailModal(false);
      setTimeout(() => setNotice(''), 3000);
    } catch (err) {
      alert('Failed to update bot status: ' + err.message);
    } finally {
      setStatusSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Connected Apps &amp; Social Channels</h2>
          <p className="text-xs text-slate-400 mt-1">
            Audit and manage every Facebook, Instagram, WhatsApp, and LinkedIn app connected across all tenant accounts.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs px-3 py-1.5 rounded-xl bg-purple-500/10 text-purple-300 border border-purple-500/20 font-bold">
            Total Connected Apps: {pages.length}
          </span>
        </div>
      </div>

      {/* Platform Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: 'ALL', label: `All Connected Apps (${pages.length})` },
          { id: 'facebook', label: `Facebook (${pages.filter(p => detectAppPlatform(p) === 'facebook').length})` },
          { id: 'instagram', label: `Instagram (${pages.filter(p => detectAppPlatform(p) === 'instagram').length})` },
          { id: 'whatsapp', label: `WhatsApp (${pages.filter(p => detectAppPlatform(p) === 'whatsapp').length})` },
          { id: 'linkedin', label: `LinkedIn (${pages.filter(p => detectAppPlatform(p) === 'linkedin').length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setPlatformFilter(tab.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              platformFilter === tab.id
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {notice && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by Connected App Name, Account/Page ID, or Owner Email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
          />
        </div>
      </div>

      {/* Connected Apps Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                <th className="py-3.5 px-4">Connected App &amp; Platform</th>
                <th className="py-3.5 px-4">Account / Channel ID</th>
                <th className="py-3.5 px-4">Tenant Owner Email</th>
                <th className="py-3.5 px-4">Token Status</th>
                <th className="py-3.5 px-4">Workflow Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredPages.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500">
                    No connected apps found matching current filter.
                  </td>
                </tr>
              ) : (
                filteredPages.map((page) => {
                  const ownerEmail = getUserEmail(page.user_id);
                  const hasToken = Boolean(page.page_access_token && page.page_access_token.length > 20);
                  const status = page.bot_status || (page.is_active !== false ? 'ACTIVE' : 'INACTIVE');
                  const plat = detectAppPlatform(page);
                  const cleanVerify = String(page.verify_token || 'socialsaas_secret').replace(/^(fb|ig|wa|li):/i, '');

                  return (
                    <tr key={page.page_id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-2.5">
                          {plat === 'instagram' ? (
                            <div className="w-7 h-7 rounded-lg bg-pink-500/10 flex items-center justify-center text-pink-400 shrink-0">
                              <Instagram className="w-4 h-4" />
                            </div>
                          ) : plat === 'whatsapp' ? (
                            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                              <MessageCircle className="w-4 h-4" />
                            </div>
                          ) : plat === 'linkedin' ? (
                            <div className="w-7 h-7 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-400 shrink-0">
                              <Linkedin className="w-4 h-4" />
                            </div>
                          ) : (
                            <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
                              <Facebook className="w-4 h-4" />
                            </div>
                          )}
                          <div>
                            <div className="flex items-center space-x-1.5">
                              <p className="font-bold text-white">{page.page_name || 'Connected App'}</p>
                              <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                                {plat}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 font-mono">Verify: {cleanVerify}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-purple-300">
                        {page.page_id}
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-200">{ownerEmail}</p>
                        <p className="text-[10px] text-slate-500 font-mono">UID: {page.user_id ? `${page.user_id.slice(0, 10)}...` : 'N/A'}</p>
                      </td>

                      <td className="py-3.5 px-4">
                        {hasToken ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">
                            <ShieldCheck className="w-3 h-3" />
                            <span>Valid Long-Lived Token</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 text-[10px] font-bold">
                            <ShieldAlert className="w-3 h-3" />
                            <span>Token Missing</span>
                          </span>
                        )}
                      </td>

                      {/* Bot Status with Color Coded Indicators */}
                      <td className="py-3.5 px-4">
                        {status === 'SUSPENDED' ? (
                          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-rose-500/15 text-rose-400 border border-rose-500/30">
                            <AlertCircle className="w-3 h-3" />
                            <span>Suspended</span>
                          </span>
                        ) : status === 'ACTIVE' ? (
                          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Active &amp; Running</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-slate-800 text-slate-400 border border-slate-700">
                            <Power className="w-3 h-3" />
                            <span>Inactive / Paused</span>
                          </span>
                        )}
                      </td>

                      {/* Actions: View (Eye) + Delete */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => handleOpenDetailModal(page)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-purple-500/20 text-purple-400 hover:text-purple-300 transition"
                            title="View Page Details &amp; Control Status"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setPageToDelete(page);
                              setIsDeleteModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-rose-400 transition"
                            title="Unhook and Delete Page"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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

      {/* Page Detail Oversight Modal */}
      {showDetailModal && selectedPage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in select-none">
          <div className="relative w-full max-w-2xl rounded-3xl bg-slate-900 border border-purple-500/30 p-6 sm:p-7 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={() => setShowDetailModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
              <div className="w-10 h-10 rounded-2xl bg-purple-600/20 border border-purple-500/30 text-purple-400 flex items-center justify-center">
                <Facebook className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  {selectedPage.page_name || 'Business Page Details'}
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  Page ID: {selectedPage.page_id} • Owner: {getUserEmail(selectedPage.user_id)}
                </p>
              </div>
            </div>

            {/* Status Alert if Suspended */}
            {targetBotStatus === 'SUSPENDED' && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Page is SUSPENDED. All AI replies and webhook executions are blocked.</span>
              </div>
            )}

            {/* Meta Token Validation Status Message */}
            {metaCheckResult && (
              <div className={`p-3.5 rounded-xl text-xs flex items-center space-x-2 ${
                metaCheckResult.valid 
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
              }`}>
                {metaCheckResult.valid ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{metaCheckResult.message}</span>
              </div>
            )}

            {/* Page Access Token Box with Live Meta Verify */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Page Access Token
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleVerifyToken}
                    disabled={verifyingToken}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold transition disabled:opacity-50"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>{verifyingToken ? 'Verifying with Meta...' : 'Test Token with Meta'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white transition"
                    title={showToken ? 'Mask Token' : 'Reveal Token'}
                  >
                    {showToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(selectedPage.page_access_token || '');
                      setCopiedToken(true);
                      setTimeout(() => setCopiedToken(false), 2000);
                    }}
                    className="p-1 rounded-lg text-slate-400 hover:text-white transition"
                    title="Copy Token"
                  >
                    {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <p className="font-mono text-xs text-slate-300 select-all break-all bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                {showToken 
                  ? selectedPage.page_access_token 
                  : (selectedPage.page_access_token ? `${selectedPage.page_access_token.slice(0, 18)}••••••••••••••••${selectedPage.page_access_token.slice(-6)}` : 'No Token')}
              </p>
            </div>

            {/* Bot Status Administrative Selector */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Change Bot Operation Status
              </label>

              <div className="grid grid-cols-3 gap-2.5">
                {/* ACTIVE */}
                <button
                  type="button"
                  onClick={() => setTargetBotStatus('ACTIVE')}
                  className={`p-3 rounded-xl border text-center transition flex flex-col items-center space-y-1 ${
                    targetBotStatus === 'ACTIVE'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold">Active &amp; Ready</span>
                  <span className="text-[10px] text-slate-500">Auto-reply ON</span>
                </button>

                {/* INACTIVE */}
                <button
                  type="button"
                  onClick={() => setTargetBotStatus('INACTIVE')}
                  className={`p-3 rounded-xl border text-center transition flex flex-col items-center space-y-1 ${
                    targetBotStatus === 'INACTIVE'
                      ? 'bg-slate-800 border-slate-600 text-slate-200 ring-1 ring-slate-600'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Power className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-bold">Inactive</span>
                  <span className="text-[10px] text-slate-500">Temporarily paused</span>
                </button>

                {/* SUSPENDED */}
                <button
                  type="button"
                  onClick={() => setTargetBotStatus('SUSPENDED')}
                  className={`p-3 rounded-xl border text-center transition flex flex-col items-center space-y-1 ${
                    targetBotStatus === 'SUSPENDED'
                      ? 'bg-rose-500/20 border-rose-500 text-rose-300 ring-1 ring-rose-500'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                  <span className="text-xs font-bold">Suspended</span>
                  <span className="text-[10px] text-slate-500">Policy lock</span>
                </button>
              </div>
            </div>

            {/* Google Sheets Sync IDs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Products Sheet</span>
                <span className="font-mono text-slate-300 text-[11px] truncate block mt-0.5">
                  {selectedPage.products_sheet_id || 'Default'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">FAQ Sheet</span>
                <span className="font-mono text-slate-300 text-[11px] truncate block mt-0.5">
                  {selectedPage.faq_sheet_id || 'Default'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Orders Sheet</span>
                <span className="font-mono text-slate-300 text-[11px] truncate block mt-0.5">
                  {selectedPage.orders_sheet_id || 'Default'}
                </span>
              </div>
            </div>

            {/* Client Uploaded Business Identity & Knowledge Base Preview */}
            {(() => {
              let biz = null;
              try {
                const raw = settings?.[`business_profile_${selectedPage.page_id}`];
                if (raw) biz = JSON.parse(raw);
              } catch {
                biz = null;
              }
              if (!biz && !selectedPage.knowledge_base) return null;
              return (
                <div className="p-3.5 rounded-xl bg-slate-950 border border-purple-500/30 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider">
                      Client Business Profile &amp; Knowledge Base
                    </span>
                    {biz?.aiVerified && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        AI Verified
                      </span>
                    )}
                  </div>
                  {biz && (
                    <div className="text-[11px] text-slate-300 space-y-0.5">
                      {biz.businessCategory && <p><strong className="text-slate-400">Category:</strong> {biz.businessCategory}</p>}
                      {biz.servicesOffered && <p><strong className="text-slate-400">Services:</strong> {biz.servicesOffered}</p>}
                      {biz.uploadedDocName && <p><strong className="text-slate-400">Uploaded File:</strong> <span className="text-purple-300">{biz.uploadedDocName}</span></p>}
                    </div>
                  )}
                  {selectedPage.knowledge_base && (
                    <p className="text-slate-400 font-mono text-[10px] line-clamp-3 pt-1 border-t border-slate-800/80">
                      {selectedPage.knowledge_base}
                    </p>
                  )}
                </div>
              );
            })()}

            {/* System Prompt Preview */}
            {selectedPage.system_prompt && (
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  AI Sales System Prompt Preview
                </span>
                <p className="text-slate-300 font-mono text-[11px] line-clamp-3">
                  {selectedPage.system_prompt}
                </p>
              </div>
            )}

            {/* Modal Footer */}
            <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleSaveBotStatus}
                disabled={statusSaving}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 transition shadow-lg shadow-purple-600/30 disabled:opacity-50"
              >
                {statusSaving ? 'Updating...' : 'Save Bot Status'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        title="Unhook and Delete Business Page"
        message={`Are you sure you want to permanently unhook and delete page "${pageToDelete?.page_name || 'this page'}" (ID: ${pageToDelete?.page_id})? This will detach it from its tenant account immediately.`}
        confirmText="Yes, Unhook Page"
        onConfirm={async () => {
          if (pageToDelete) {
            await onDeletePage(pageToDelete.page_id);
          }
          setIsDeleteModalOpen(false);
          setPageToDelete(null);
        }}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setPageToDelete(null);
        }}
      />
    </div>
  );
}

