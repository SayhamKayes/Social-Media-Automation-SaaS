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
  Cpu,
  Info,
  Pencil
} from 'lucide-react';

export default function ApiIntegrations({ pages = [] }) {
  const [copiedField, setCopiedField] = useState(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isEditingWebhook, setIsEditingWebhook] = useState(false);

  // Webhook URL state with localStorage persistence
  const [webhookUrl, setWebhookUrl] = useState(() => {
    return localStorage.getItem('saas_webhook_url') || "https://social-automation-saas-dfg4.onrender.com/webhook/facebook-messenger-saas";
  });

  // API Config states
  const [metaAppId, setMetaAppId] = useState(() => localStorage.getItem('saas_meta_app_id') || '');
  const [metaAppSecret, setMetaAppSecret] = useState(() => localStorage.getItem('saas_meta_app_secret') || '');
  const [geminiApiKey, setGeminiApiKey] = useState(() => localStorage.getItem('saas_gemini_api_key') || '');
  const [whatsappPhoneId, setWhatsappPhoneId] = useState('');
  const [whatsappWabaId, setWhatsappWabaId] = useState('');
  const [verifyToken, setVerifyToken] = useState('socialsaas_secret');

  const handleCopy = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSaveWebhookUrl = () => {
    localStorage.setItem('saas_webhook_url', webhookUrl);
    setIsEditingWebhook(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleSave = (e) => {
    e.preventDefault();
    localStorage.setItem('saas_meta_app_id', metaAppId);
    localStorage.setItem('saas_meta_app_secret', metaAppSecret);
    localStorage.setItem('saas_gemini_api_key', geminiApiKey);
    localStorage.setItem('saas_webhook_url', webhookUrl);
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
          <span>API credentials and Webhook URL saved successfully!</span>
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

        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 space-y-1">
          <p className="flex items-center space-x-1.5 font-semibold text-white">
            <Info className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>Where to paste this in Meta?</span>
          </p>
          <p className="text-slate-400 pl-5 leading-relaxed">
            Copy this <strong>Callback URL</strong> and <strong>Verify Token</strong> into{' '}
            <a href="https://developers.facebook.com" target="_blank" rel="noreferrer" className="text-indigo-400 underline">Meta Developer Portal</a>{' '}
            $\rightarrow$ <em>Messenger $\rightarrow$ Webhooks</em>. If you are using Ngrok locally, paste your live Ngrok URL here.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Callback URL {isEditingWebhook && '(Edit your Ngrok or Domain URL)'}
              </label>
              <button
                type="button"
                onClick={() => {
                  if (isEditingWebhook) {
                    handleSaveWebhookUrl();
                  } else {
                    setIsEditingWebhook(true);
                  }
                }}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
              >
                <Pencil className="w-3 h-3" />
                <span>{isEditingWebhook ? 'Save URL' : 'Change URL'}</span>
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                readOnly={!isEditingWebhook}
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://your-domain.com/webhook/facebook-messenger-saas"
                className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono focus:outline-none ${
                  isEditingWebhook ? 'border-indigo-500 ring-1 ring-indigo-500' : 'select-all'
                }`}
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
              <span>Owner Meta Developer App (Optional / Advanced)</span>
            </h3>
            <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 font-medium">
              Only for SaaS Owner
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Note: Clients only need their <strong>Page ID</strong> and <strong>Page Access Token</strong> in the Social Media tab. You only need to configure App ID and Secret here if you plan to enable automatic Facebook OAuth Login.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Meta App ID
              </label>
              <input
                type="text"
                placeholder="e.g. 15928394018234"
                value={metaAppId}
                onChange={(e) => setMetaAppId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500 font-mono transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Meta App Secret
              </label>
              <input
                type="password"
                placeholder="••••••••••••••••••••••••••••••••"
                value={metaAppSecret}
                onChange={(e) => setMetaAppSecret(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500 font-mono transition"
              />
            </div>
          </div>
        </div>

        {/* Gemini API Key */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Bot className="w-4 h-4 text-emerald-400" />
              <span>Google Gemini AI API Key</span>
            </h3>
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-indigo-400 hover:text-indigo-300 inline-flex items-center space-x-1"
            >
              <span>Get Free Key</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Gemini API Studio Key
            </label>
            <input
              type="password"
              placeholder="AIzaSy..."
              value={geminiApiKey}
              onChange={(e) => setGeminiApiKey(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500 font-mono transition"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Used by n8n LangChain AI Agent for generating natural, persuasive sales messages in Bengali/English.
            </p>
          </div>
        </div>

        {/* Save All API Credentials */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-600/30"
          >
            <Save className="w-4 h-4" />
            <span>Save API Configurations</span>
          </button>
        </div>
      </form>
    </div>
  );
}
