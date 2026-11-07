import React, { useState } from 'react';
import { Facebook, Plus, Trash2, CheckCircle2, AlertCircle, HelpCircle, ExternalLink, ShieldCheck } from 'lucide-react';

export default function FacebookConnect({ pages = [], onSavePage, onDeletePage }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form states
  const [pageId, setPageId] = useState('');
  const [pageName, setPageName] = useState('');
  const [pageAccessToken, setPageAccessToken] = useState('');
  const [verifyToken, setVerifyToken] = useState('socialsaas_secret');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

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

      setSuccessMsg('Facebook Page connected and saved successfully!');
      setPageId('');
      setPageName('');
      setPageAccessToken('');
      setShowAddForm(false);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save page.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Facebook Pages Management</h2>
          <p className="text-sm text-slate-400 mt-1">
            Connect and manage multiple Facebook business pages with custom Page Access Tokens.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowTutorial(!showTutorial)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
          >
            <HelpCircle className="w-4 h-4 text-indigo-400" />
            <span>How to Get Access Token?</span>
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-600/30"
          >
            <Plus className="w-4 h-4" />
            <span>{showAddForm ? 'Cancel' : 'Connect New Page'}</span>
          </button>
        </div>
      </div>

      {/* Tutorial Card */}
      {showTutorial && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-indigo-500/30 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Facebook className="w-4 h-4 text-blue-400" />
              <span>3-Minute Guide: Getting your Facebook Page ID & Access Token</span>
            </h3>
            <button onClick={() => setShowTutorial(false)} className="text-xs text-slate-500 hover:text-white">
              Close
            </button>
          </div>
          <ol className="list-decimal list-inside space-y-2 text-xs text-slate-300 leading-relaxed">
            <li>Open your Facebook Page in your browser and go to <strong>About -> Page transparency</strong> to copy your numeric <strong>Page ID</strong>.</li>
            <li>Go to <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noreferrer" className="text-indigo-400 underline inline-flex items-center space-x-1"><span>Meta Graph API Explorer</span><ExternalLink className="w-3 h-3" /></a>.</li>
            <li>Select your Meta App, choose your Facebook Page in the dropdown, and check permissions: <code className="bg-slate-800 px-1 py-0.5 rounded text-indigo-300">pages_messaging</code> and <code className="bg-slate-800 px-1 py-0.5 rounded text-indigo-300">pages_manage_metadata</code>.</li>
            <li>Click <strong>Generate Access Token</strong> and extend it to a <strong>Never-Expiring Long-Lived Token</strong> using the Access Token Tool.</li>
            <li>Paste your <strong>Page ID</strong> and <strong>Access Token</strong> below and save!</li>
          </ol>
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

      {/* Add Page Form */}
      {showAddForm && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
          <h3 className="text-base font-bold text-white mb-4">Connect New Facebook Page</h3>
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
                  placeholder="e.g. 109827364512345"
                  value={pageId}
                  onChange={(e) => setPageId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500 font-mono transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Page Access Token (Permanent / Long-Lived)
              </label>
              <textarea
                required
                rows={3}
                placeholder="EAAbx1whxNGcBS2..."
                value={pageAccessToken}
                onChange={(e) => setPageAccessToken(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-indigo-500 transition"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Your token is stored securely in Supabase with Row Level Security.
              </p>
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
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-600/30 disabled:opacity-50"
              >
                {loading ? 'Connecting...' : 'Save & Connect Page'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Pages List */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Your Connected Pages ({pages.length})</h3>
          <span className="text-xs text-slate-500">Auto-routes to n8n webhook</span>
        </div>

        {pages.length === 0 ? (
          <div className="p-12 text-center">
            <Facebook className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-base font-semibold text-slate-300">No Facebook Pages Connected</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Add your first Facebook Page to enable automated customer service and order capture.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {pages.map((page) => (
              <div key={page.page_id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-3">
                    <span className="text-base font-bold text-white">{page.page_name}</span>
                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Ready</span>
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono">
                    Page ID: <span className="text-indigo-400">{page.page_id}</span>
                  </p>
                  <p className="text-xs text-slate-500 font-mono">
                    Access Token: {page.page_access_token ? `${page.page_access_token.slice(0, 18)}...` : 'None'}
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => onDeletePage(page.page_id)}
                    className="p-2 rounded-xl text-rose-400 hover:bg-rose-500/10 transition"
                    title="Disconnect Page"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

