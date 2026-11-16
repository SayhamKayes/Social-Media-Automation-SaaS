import React, { useState, useEffect } from 'react';
import { Save, FileSpreadsheet, CheckCircle2, AlertCircle, ShieldCheck, Building2 } from 'lucide-react';

export default function AIAgentConfig({ pages = [], userProfile = null, onUpdatePageConfig, onUpgradePlan }) {
  const [selectedPageId, setSelectedPageId] = useState(pages[0]?.page_id || '');
  const [productsSheetId, setProductsSheetId] = useState('');
  const [faqSheetId, setFaqSheetId] = useState('');
  const [ordersSheetId, setOrdersSheetId] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const expiresAt = userProfile?.subscription_expires_at 
    ? new Date(userProfile.subscription_expires_at) 
    : userProfile?.created_at 
      ? new Date(new Date(userProfile.created_at).getTime() + 30 * 24 * 60 * 60 * 1000)
      : null;
  const isSubscriptionExpired = expiresAt ? (new Date() > expiresAt) : false;
  const isFreeTrial = (userProfile?.plan_tier || 'free').toLowerCase() === 'free';
  const isFreeTrialExpired = isFreeTrial && isSubscriptionExpired;

  /* Update Sheet ID fields when selected business page changes */
  useEffect(() => {
    if (!selectedPageId && pages.length > 0) {
      setSelectedPageId(pages[0].page_id);
    }
    const currentPage = pages.find(p => p.page_id === selectedPageId);
    if (currentPage) {
      setProductsSheetId(currentPage.products_sheet_id || '15YQgYbQ7DDMGEEk33VlIfsv090abgBXBvUTaYG-LujM');
      setFaqSheetId(currentPage.faq_sheet_id || '15YQgYbQ7DDMGEEk33VlIfsv090abgBXBvUTaYG-LujM');
      setOrdersSheetId(currentPage.orders_sheet_id || '15YQgYbQ7DDMGEEk33VlIfsv090abgBXBvUTaYG-LujM');
    }
  }, [selectedPageId, pages]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!selectedPageId) {
      setErrorMsg('Please select a connected business account first.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await onUpdatePageConfig(selectedPageId, {
        products_sheet_id: productsSheetId.trim(),
        faq_sheet_id: faqSheetId.trim(),
        orders_sheet_id: ordersSheetId.trim()
      });
      setSuccessMsg('Business Account Google Sheet IDs saved and synced successfully!');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save Google Sheet configuration.');
    } finally {
      setLoading(false);
    }
  };

  if (pages.length === 0) {
    return (
      <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800">
        <FileSpreadsheet className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-base font-bold text-white">No Connected Business Accounts</h3>
        <p className="text-xs text-slate-400 mt-1">
          Please connect at least one social media business account before configuring Google Sheets.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Business Account &amp; Google Sheets Config</h2>
          <p className="text-sm text-slate-400 mt-1">
            Select your connected business account and map Google Sheet IDs for automated product lookup, FAQs, and order capture.
          </p>
        </div>

        <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold shrink-0 self-start sm:self-auto">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>AI Prompts &amp; Knowledge Synced by Admin</span>
        </span>
      </div>

      {/* 1-Month Free Trial Expired Warning */}
      {isFreeTrialExpired && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-amber-200 shadow-xl">
          <div className="flex items-start sm:items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-300">
                1-Month Free Trial Has Expired (Payment Required)
              </p>
              <p className="text-xs text-amber-300/80 mt-0.5 leading-relaxed">
                Your 30-day trial period has ended. Google Sheet mappings remain safely saved, but automated AI bot responses are suspended until a paid subscription package is activated.
              </p>
            </div>
          </div>
          {onUpgradePlan && (
            <button
              type="button"
              onClick={onUpgradePlan}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shrink-0 transition"
            >
              Upgrade &amp; Pay Now
            </button>
          )}
        </div>
      )}

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

      <form onSubmit={handleSave} className="space-y-6">
        {/* Select Business Account to Configure */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center space-x-1.5">
              <Building2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Select Business Account to Configure</span>
            </label>
            <select
              value={selectedPageId}
              onChange={(e) => setSelectedPageId(e.target.value)}
              className="w-full sm:w-auto min-w-[280px] px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500"
            >
              {pages.map((p) => (
                <option key={p.page_id} value={p.page_id}>
                  {p.page_name} (ID: {p.page_id})
                </option>
              ))}
            </select>
          </div>
          <div className="text-xs text-slate-400">
            AI System Prompts &amp; Knowledge Base files are automatically synchronized to this page from Master Admin settings.
          </div>
        </div>

        {/* Google Sheets Integration */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center space-x-2 text-white font-bold text-base">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            <span>Google Sheets Integration</span>
          </div>
          <p className="text-xs text-slate-400">
            Provide Google Sheet IDs for reading live product pricing, answering catalog FAQs, and automatically recording incoming customer orders.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Products Sheet ID
              </label>
              <input
                type="text"
                value={productsSheetId}
                onChange={(e) => setProductsSheetId(e.target.value)}
                placeholder="15YQgYbQ7DDMGE..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                FAQ Sheet ID
              </label>
              <input
                type="text"
                value={faqSheetId}
                onChange={(e) => setFaqSheetId(e.target.value)}
                placeholder="15YQgYbQ7DDMGE..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Orders Sheet ID
              </label>
              <input
                type="text"
                value={ordersSheetId}
                onChange={(e) => setOrdersSheetId(e.target.value)}
                placeholder="15YQgYbQ7DDMGE..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition shadow-lg shadow-indigo-600/30 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Saving Settings...' : 'Save Configuration'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
