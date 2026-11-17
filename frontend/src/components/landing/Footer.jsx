import React, { useState, useEffect } from 'react';
import { Bot, ExternalLink, ShieldCheck } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';

export default function Footer() {
  const isLocalHost =
    typeof window !== 'undefined' &&
    (window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1'));

  const [adminPortalUrl, setAdminPortalUrl] = useState(
    import.meta.env.VITE_ADMIN_PORTAL_URL ||
    (isLocalHost ? 'http://localhost:3001' : 'https://adminskzbot.vercel.app')
  );

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    supabase
      .from('platform_settings')
      .select('setting_value')
      .eq('setting_key', 'live_admin_host_url')
      .maybeSingle()
      .then(({ data }) => {
        if (data?.setting_value && data.setting_value.trim()) {
          setAdminPortalUrl(data.setting_value.trim().replace(/\/+$/, ''));
        }
      });
  }, []);

  return (
    <footer className="py-12 bg-slate-900/40 border-t border-slate-900 text-slate-500 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <span className="text-base font-bold text-white tracking-tight">
            AutoReply <span className="text-indigo-400">AI</span>
          </span>
        </div>

        <p className="text-xs sm:text-sm text-slate-400">
          &copy; {new Date().getFullYear()} AutoReply AI. Developed by <a href="https://theskzlab.com/" target='_blank' rel='noopener noreferrer' className="hover:text-slate-300 transition">SKzLAB</a>.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-5 text-xs sm:text-sm">
          <a href="#features" className="hover:text-slate-300 transition">Features</a>
          <a href="#how-it-works" className="hover:text-slate-300 transition">How it Works</a>
          <a href="#pricing" className="hover:text-slate-300 transition">Pricing</a>
        </div>
      </div>
    </footer>
  );
}
