import React, { useState, useEffect } from 'react';
import { 
  KeyRound, 
  Save, 
  Copy, 
  Check, 
  Bot, 
  ExternalLink, 
  ShieldCheck, 
  CheckCircle2,
  Cpu,
  Layers,
  Info
} from 'lucide-react';

export default function SystemSettings({ 
  settings = {}, 
  onSaveSettings 
}) {
  const [metaAppId, setMetaAppId] = useState('');
  const [metaAppSecret, setMetaAppSecret] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('https://social-automation-saas-dfg4.onrender.com/webhook/facebook-messenger-saas');
  const [verifyToken, setVerifyToken] = useState('socialsaas_secret');

  const [copiedKey, setCopiedKey] = useState(null);
  const [savedNotice, setSavedNotice] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      if (settings.meta_app_id) setMetaAppId(settings.meta_app_id);
      if (settings.meta_app_secret) setMetaAppSecret(settings.meta_app_secret);
      if (settings.gemini_api_key) setGeminiApiKey(settings.gemini_api_key);
      if (settings.webhook_url) setWebhookUrl(settings.webhook_url);
      if (settings.verify_token) setVerifyToken(settings.verify_token);
    }
  }, [settings]);

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSaveSettings({
        meta_app_id: metaAppId.trim(),
        meta_app_secret: metaAppSecret.trim(),
        gemini_api_key: geminiApiKey.trim(),
        webhook_url: webhookUrl.trim(),
        verify_token: verifyToken.trim()
      });
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 3000);
    } catch (err) {
      alert('Failed to save settings: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-white tracking-tight">Master APIs &amp; Ingestion Gateway</h2>
        <p className="text-xs text-slate-400 mt-1">
          Configure root platform API credentials, master webhook endpoints, and Google Gemini AI keys.
        </p>
      </div>

      {savedNotice && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Platform system settings saved securely to Supabase!</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Production Webhook Endpoint Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/60 to-slate-900 border border-purple-500/30 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h3 className="text-sm font-bold text-white">Central Master Ingestion Webhook</h3>
            </div>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
              Editable Master Config
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            This Master Callback URL and Verify Token are inherited by default across all client accounts. Super Admin can edit them here and persist directly to Supabase.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Callback URL (Editable Ingestion Endpoint)
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono focus:outline-none focus:border-purple-500"
                />
                <button
                  type="button"
                  onClick={() => handleCopy(webhookUrl, 'url')}
                  className="p-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition shrink-0"
                  title="Copy Webhook URL"
                >
                  {copiedKey === 'url' ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Verify Token (Editable Security Token)
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={verifyToken}
                  onChange={(e) => setVerifyToken(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono focus:outline-none focus:border-purple-500"
                />
                <button
                  type="button"
                  onClick={() => handleCopy(verifyToken, 'token')}
                  className="p-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition shrink-0"
                  title="Copy Verify Token"
                >
                  {copiedKey === 'token' ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* Meta Platform API Credentials */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <KeyRound className="w-4 h-4 text-blue-400" />
              <span>Global Meta Developer App Credentials</span>
            </h3>
            <a
              href="https://developers.facebook.com/apps"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-purple-400 hover:text-purple-300 inline-flex items-center space-x-1"
            >
              <span>Meta Apps Console</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Meta App ID
              </label>
              <input
                type="text"
                placeholder="e.g. 15928394018234"
                value={metaAppId}
                onChange={(e) => setMetaAppId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-purple-500 font-mono transition"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Meta App Secret
              </label>
              <input
                type="password"
                placeholder="Paste App Secret..."
                value={metaAppSecret}
                onChange={(e) => setMetaAppSecret(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-purple-500 font-mono transition"
              />
            </div>
          </div>
        </div>

        {/* Gemini API Key */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Bot className="w-4 h-4 text-emerald-400" />
              <span>Global Google Gemini AI API Key</span>
            </h3>
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-purple-400 hover:text-purple-300 inline-flex items-center space-x-1"
            >
              <span>Google AI Studio</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Gemini Studio API Key (AIzaSy...)
            </label>
            <input
              type="password"
              placeholder="AIzaSy..."
              value={geminiApiKey}
              onChange={(e) => setGeminiApiKey(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-purple-500 font-mono transition"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Powers LangChain conversational sales reasoning across all client business pages.
            </p>
          </div>
        </div>

        {/* Save Settings Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow-lg shadow-purple-600/30 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Master Configurations'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

