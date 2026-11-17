import React, { useState, useEffect } from 'react';
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
  Pencil,
  RotateCcw,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';

export default function ApiIntegrations({ pages = [] }) {
  const [copiedField, setCopiedField] = useState(null);
  const [savedSuccess, setSavedSuccess] = useState('');
  
  /* Platform Master Defaults (fetched from Supabase) */
  const [platformDefaults, setPlatformDefaults] = useState({
    webhook_url: "https://social-automation-saas-dfg4.onrender.com/webhook/facebook-messenger-saas",
    verify_token: "socialsaas_secret",
    meta_app_id: "",
    meta_app_secret: "",
    gemini_api_key: ""
  });

  // User Config states
  const [webhookUrl, setWebhookUrl] = useState("https://social-automation-saas-dfg4.onrender.com/webhook/facebook-messenger-saas");
  const [autoPostWebhookUrl, setAutoPostWebhookUrl] = useState(
    () => localStorage.getItem('saas_autopost_webhook') || "https://social-automation-saas-dfg4.onrender.com/webhook/social-auto-post"
  );
  const [verifyToken, setVerifyToken] = useState("socialsaas_secret");
  const [metaAppId, setMetaAppId] = useState("");
  const [metaAppSecret, setMetaAppSecret] = useState("");
  const [whatsappWabaId, setWhatsappWabaId] = useState(() => localStorage.getItem('saas_waba_id') || "");
  const [linkedinClientId, setLinkedinClientId] = useState(() => localStorage.getItem('saas_linkedin_client_id') || "");
  const [linkedinClientSecret, setLinkedinClientSecret] = useState(() => localStorage.getItem('saas_linkedin_client_secret') || "");
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [isCustomOverride, setIsCustomOverride] = useState(false);

  /* Load master platform settings from Supabase */
  useEffect(() => {
    const fetchPlatformDefaults = async () => {
      if (!isSupabaseConfigured()) return;
      try {
        const { data, error } = await supabase
          .from('platform_settings')
          .select('*');

        if (!error && data && data.length > 0) {
          const map = {};
          data.forEach(item => {
            map[item.setting_key] = item.setting_value;
          });

          setPlatformDefaults(prev => ({
            ...prev,
            ...map
          }));

          /* If user hasn't explicitly set a custom override, default to platform master */
          const hasCustom = localStorage.getItem('saas_custom_override_active') === 'true';
          setIsCustomOverride(hasCustom);

          if (!hasCustom) {
            if (map.webhook_url) setWebhookUrl(map.webhook_url);
            if (map.verify_token) setVerifyToken(map.verify_token);
            if (map.meta_app_id) setMetaAppId(map.meta_app_id);
            if (map.meta_app_secret) setMetaAppSecret(map.meta_app_secret);
            if (map.gemini_api_key) setGeminiApiKey(map.gemini_api_key);
          } else {
            /* Load saved user overrides */
            setWebhookUrl(localStorage.getItem('saas_webhook_url') || map.webhook_url || '');
            setVerifyToken(localStorage.getItem('saas_verify_token') || map.verify_token || 'socialsaas_secret');
            setMetaAppId(localStorage.getItem('saas_meta_app_id') || '');
            setMetaAppSecret(localStorage.getItem('saas_meta_app_secret') || '');
            setGeminiApiKey(localStorage.getItem('saas_gemini_api_key') || '');
          }
        }
      } catch (err) {
        console.warn('Could not load live platform defaults:', err);
      }
    };

    fetchPlatformDefaults();
  }, []);

  const handleCopy = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleResetToDefaults = () => {
    localStorage.removeItem('saas_custom_override_active');
    localStorage.removeItem('saas_webhook_url');
    localStorage.removeItem('saas_autopost_webhook');
    localStorage.removeItem('saas_verify_token');
    localStorage.removeItem('saas_meta_app_id');
    localStorage.removeItem('saas_meta_app_secret');
    localStorage.removeItem('saas_waba_id');
    localStorage.removeItem('saas_linkedin_client_id');
    localStorage.removeItem('saas_linkedin_client_secret');
    localStorage.removeItem('saas_gemini_api_key');

    setWebhookUrl(platformDefaults.webhook_url || "https://social-automation-saas-dfg4.onrender.com/webhook/facebook-messenger-saas");
    setAutoPostWebhookUrl("https://social-automation-saas-dfg4.onrender.com/webhook/social-auto-post");
    setVerifyToken(platformDefaults.verify_token || "socialsaas_secret");
    setMetaAppId(platformDefaults.meta_app_id || "");
    setMetaAppSecret(platformDefaults.meta_app_secret || "");
    setWhatsappWabaId("");
    setLinkedinClientId("");
    setLinkedinClientSecret("");
    setGeminiApiKey(platformDefaults.gemini_api_key || "");
    setIsCustomOverride(false);

    setSavedSuccess('Reset to Official Platform Master Endpoints & Credentials!');
    setTimeout(() => setSavedSuccess(''), 4000);
  };

  const handleSave = (e) => {
    e.preventDefault();
    localStorage.setItem('saas_custom_override_active', 'true');
    localStorage.setItem('saas_webhook_url', webhookUrl.trim());
    localStorage.setItem('saas_autopost_webhook', autoPostWebhookUrl.trim());
    localStorage.setItem('saas_verify_token', verifyToken.trim());
    localStorage.setItem('saas_meta_app_id', metaAppId.trim());
    localStorage.setItem('saas_meta_app_secret', metaAppSecret.trim());
    localStorage.setItem('saas_waba_id', whatsappWabaId.trim());
    localStorage.setItem('saas_linkedin_client_id', linkedinClientId.trim());
    localStorage.setItem('saas_linkedin_client_secret', linkedinClientSecret.trim());
    localStorage.setItem('saas_gemini_api_key', geminiApiKey.trim());
    setIsCustomOverride(true);

    setSavedSuccess('Custom OAuth credentials and n8n Webhook URLs saved successfully!');
    setTimeout(() => setSavedSuccess(''), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Social Media APIs &amp; Integrations</h2>
          <p className="text-sm text-slate-400 mt-1">
            Manage your Meta Developer credentials, AI Studio API keys, and Webhook endpoints.
          </p>
        </div>

        {/* Status Chip & Reset Button */}
        <div className="flex items-center space-x-2.5">
          {isCustomOverride ? (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Custom Override Active
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Platform Master Default</span>
            </span>
          )}

          <button
            type="button"
            onClick={handleResetToDefaults}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition border border-slate-700 shadow-sm"
            title="Reset all settings to official Admin defaults"
          >
            <RotateCcw className="w-3.5 h-3.5 text-indigo-400" />
            <span>Reset to Platform Defaults</span>
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{savedSuccess}</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Meta Platform API Credentials */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <KeyRound className="w-4 h-4 text-blue-400" />
              <span>Custom Meta &amp; LinkedIn OAuth Credentials (Optional Override)</span>
            </h3>
            <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 font-medium">
              Optional Override
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Note: By default the platform master credentials handle webhooks. You can enter your custom Meta App ID, WhatsApp WABA ID, and LinkedIn OAuth Client ID/Secret below if you run dedicated custom apps.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Meta App ID (FB / IG / WA)
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

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                WhatsApp Business Account (WABA) ID
              </label>
              <input
                type="text"
                placeholder="e.g. 102938475610293"
                value={whatsappWabaId}
                onChange={(e) => setWhatsappWabaId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500 font-mono transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-800/60">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                LinkedIn OAuth Client ID
              </label>
              <input
                type="text"
                placeholder="e.g. 77x9k2m1p4q8w"
                value={linkedinClientId}
                onChange={(e) => setLinkedinClientId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500 font-mono transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                LinkedIn OAuth Client Secret
              </label>
              <input
                type="password"
                placeholder="••••••••••••••••••••••••"
                value={linkedinClientSecret}
                onChange={(e) => setLinkedinClientSecret(e.target.value)}
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
              <span>Custom Google Gemini AI API Key</span>
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
          <p className="text-xs text-slate-400">
            Leave blank to use the official platform Gemini API allocation. Enter your own API key if you want dedicated high-speed token quota.
          </p>
          <input
            type="password"
            placeholder="AIzaSy... (Leave empty to use Platform Gemini key)"
            value={geminiApiKey}
            onChange={(e) => setGeminiApiKey(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500 font-mono transition"
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handleResetToDefaults}
            className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition border border-slate-700"
          >
            <RotateCcw className="w-3.5 h-3.5 text-indigo-400" />
            <span>Discard Custom &amp; Reset to Defaults</span>
          </button>

          <button
            type="submit"
            className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-600/30"
          >
            <Save className="w-4 h-4" />
            <span>Save Custom Credentials</span>
          </button>
        </div>
      </form>
    </div>
  );
}
