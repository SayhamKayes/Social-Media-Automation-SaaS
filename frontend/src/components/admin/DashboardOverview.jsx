import React from 'react';
import { Facebook, ShoppingBag, MessageSquare, ArrowUpRight, CheckCircle, Zap } from 'lucide-react';

export default function DashboardOverview({ pages = [], orders = [], onNavigate }) {
  const activePages = pages.filter(p => p.is_active);
  const totalRevenue = orders.reduce((acc, curr) => acc + (Number(curr.total_amount_bdt) || 0), 0);

  const stats = [
    {
      title: "Connected Pages",
      value: activePages.length,
      change: `${pages.length} total`,
      icon: Facebook,
      color: "text-blue-400",
      bg: "bg-blue-500/10"
    },
    {
      title: "Secured Orders",
      value: orders.length,
      change: "Auto-confirmed",
      icon: ShoppingBag,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10"
    },
    {
      title: "Est. Revenue (BDT)",
      value: `৳${totalRevenue.toLocaleString()}`,
      change: "From bot sales",
      icon: Zap,
      color: "text-amber-400",
      bg: "bg-amber-500/10"
    },
    {
      title: "AI Response Status",
      value: "Online 24/7",
      change: "Gemini 2.5 Flash",
      icon: MessageSquare,
      color: "text-indigo-400",
      bg: "bg-indigo-500/10"
    }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Dashboard Overview</h2>
        <p className="text-sm text-slate-400 mt-1">
          Monitor your active Facebook pages, AI automation health, and incoming customer orders.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div key={idx} className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{s.title}</span>
                <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${s.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="text-xs text-slate-500 mt-1">{s.change}</p>
            </div>
          );
        })}
      </div>

      {/* Quick Actions & Recent Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white">Active Facebook Pages</h3>
            <button
              onClick={() => onNavigate('facebook')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center space-x-1"
            >
              <span>Manage Pages</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {pages.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-slate-800 rounded-xl">
              <Facebook className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-300">No Facebook Pages connected yet</p>
              <p className="text-xs text-slate-500 mt-1">Connect your first page to start automating replies.</p>
              <button
                onClick={() => onNavigate('facebook')}
                className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
              >
                Connect Facebook Page
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {pages.map((page, idx) => (
                <div key={idx} className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <div>
                    <p className="text-sm font-bold text-white">{page.page_name}</p>
                    <p className="text-xs text-slate-500 font-mono">Page ID: {page.page_id}</p>
                  </div>
                  <span className="inline-flex items-center space-x-1 text-xs text-emerald-400 font-medium bg-emerald-500/10 px-2.5 py-1 rounded-full">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Active & Ready</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live Setup Guide */}
        <div className="p-6 rounded-2xl bg-gradient-to-b from-indigo-950/40 to-slate-900 border border-indigo-500/20">
          <h3 className="text-base font-bold text-white mb-2">Automation Checklist</h3>
          <p className="text-xs text-slate-400 mb-4">Complete these steps to ensure end-to-end reliability:</p>

          <div className="space-y-3 text-xs text-slate-300">
            <div className="flex items-start space-x-2">
              <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px] mt-0.5">✓</span>
              <span>Supabase Database & RLS policies enabled</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="w-4 h-4 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-[10px] mt-0.5">2</span>
              <span>Deploy n8n on Render free tier with healthz cron keep-alive</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="w-4 h-4 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-[10px] mt-0.5">3</span>
              <span>Connect Facebook Page ID & Access Token</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="w-4 h-4 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-[10px] mt-0.5">4</span>
              <span>Test conversation flow in the Chat Simulator</span>
            </div>
          </div>

          <button
            onClick={() => onNavigate('simulator')}
            className="w-full mt-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-md shadow-indigo-600/30"
          >
            Launch Chat Simulator
          </button>
        </div>
      </div>
    </div>
  );
}

