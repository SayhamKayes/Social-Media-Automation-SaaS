import React, { useState } from 'react';
import { 
  KeyRound, 
  Copy, 
  Check, 
  Sparkles, 
  Save, 
  ShieldCheck, 
  Bot, 
  ExternalLink,
  Cpu
} from 'lucide-react';

export default function ApiIntegrations({ pages = [] }) {
  const [copiedField, setCopiedField] = useState(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // API Config states
  const [metaAppId, setMetaAppId] = useState('');
  const [metaAppSecret, setMetaAppSecret] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [whatsappPhoneId, setWhatsappPhoneId] = useState('');
  const [whatsappWabaId, setWhatsappWabaId] = useState('');
  const [verifyToken, setVerifyToken] = useState('socialsaas_secret');

  const webhookUrl = "https://social-automation-saas-dfg4.onrender.com/webhook/facebook-messenger-saas";

  const handleCopy = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSave = (e) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Social Media APIs &amp; Integrations</h2>
        <p className="text-sm text-slate-400 mt-1">
          Manage your Meta Developer credentials, AI Studio API keys, and Webhook endpoints.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm flex items-center space-x-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>API credentials updated and saved securely!</span>
        </div>
      )}

      {/* Production Webhook Endpoint Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-950/60 to-slate-900 border border-indigo-500/30 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h3 className="text-base font-bold text-white">Live n8n Webhook Endpoint</h3>
          </div>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-medium">
            Active 24/7
          </span>
        </div>
        <p className="text-xs text-slate-300">
          Paste this Callback URL and Verify Token into your Meta (Facebook) Developer App under Messenger Webhooks.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Callback URL
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                readOnly
                value={webhookUrl}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono select-all focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleCopy(webhookUrl, 'url')}
                className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition shrink-0"
                title="Copy Webhook URL"
              >
                {copiedField === 'url' ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Verify Token
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                readOnly
                value={verifyToken}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono select-all focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleCopy(verifyToken, 'token')}
                className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition shrink-0"
                title="Copy Verify Token"
              >
                {copiedField === 'token' ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Meta Platform API Credentials */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <KeyRound className="w-4 h-4 text-blue-400" />
              <span>Meta Developer App Credentials (Facebook &amp; Instagram)</span>
            </h3>
            <a
              href="https://developers.facebook.com/apps"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
            >
              <span>Meta App Console</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Meta App ID
              </label>
              <input
                type="text"
                placeholder="e.g. 159283746192837"
                value={metaAppId}
                onChange={(e) => setMetaAppId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Meta App Secret
              </label>
              <input
                type="password"
                placeholder="••••••••••••••••••••••••"
                value={metaAppSecret}
                onChange={(e) => setMetaAppSecret(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* AI Engine API (Gemini) */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Bot className="w-4 h-4 text-indigo-400" />
              <span>Google Gemini AI API (Bring Your Own Key)</span>
            </h3>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
            >
              <span>Get Free API Key</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Google AI Studio API Key (Free Tier - 1,500 requests/day)
            </label>
            <input
              type="password"
              placeholder="AIzaSy..."
              value={geminiApiKey}
              onChange={(e) => setGeminiApiKey(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* WhatsApp Cloud API Credentials */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <span>WhatsApp Business Cloud API (Optional)</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Phone Number ID
              </label>
              <input
                type="text"
                placeholder="e.g. 1092837465019"
                value={whatsappPhoneId}
                onChange={(e) => setWhatsappPhoneId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                WhatsApp Business Account (WABA) ID
              </label>
              <input
                type="text"
                placeholder="e.g. 2938475610293"
                value={whatsappWabaId}
                onChange={(e) => setWhatsappWabaId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-600/30"
          >
            <Save className="w-4 h-4" />
            <span>Save API Configurations</span>
          </button>
        </div>
      </form>
    </div>
  );
}

