import React from 'react';
import { 
  Users, 
  Share2, 
  ShoppingBag, 
  DollarSign, 
  TrendingUp, 
  Server, 
  ShieldCheck, 
  Activity,
  ArrowUpRight,
  ExternalLink
} from 'lucide-react';

export default function OverviewMetrics({ 
  users = [], 
  pages = [], 
  orders = [],
  onNavigateTab
}) {
  const totalRevenueBDT = orders.reduce((acc, curr) => acc + (Number(curr.total_amount_bdt) || 0), 0);
  const totalRevenueUSD = orders.reduce((acc, curr) => acc + (Number(curr.total_amount_usd) || 0), 0);
  const activePages = pages.filter(p => p.is_active !== false).length;

  const cards = [
    {
      title: 'Total Registered Tenants',
      value: users.length,
      detail: `${users.filter(u => u.status === 'active').length} active accounts`,
      icon: Users,
      color: 'from-blue-600/20 to-indigo-600/20 border-blue-500/30 text-blue-400',
      action: () => onNavigateTab('users')
    },
    {
      title: 'Connected Social Pages',
      value: pages.length,
      detail: `${activePages} currently running bots`,
      icon: Share2,
      color: 'from-purple-600/20 to-pink-600/20 border-purple-500/30 text-purple-400',
      action: () => onNavigateTab('pages')
    },
    {
      title: 'Total Platform Leads & Orders',
      value: orders.length,
      detail: 'Captured via Messenger bots',
      icon: ShoppingBag,
      color: 'from-emerald-600/20 to-teal-600/20 border-emerald-500/30 text-emerald-400',
      action: () => onNavigateTab('orders')
    },
    {
      title: 'Gross Platform Sales',
      value: `৳${totalRevenueBDT.toLocaleString()}`,
      detail: `${orders.length} total orders recorded`,
      icon: DollarSign,
      color: 'from-amber-600/20 to-orange-600/20 border-amber-500/30 text-amber-400',
      action: () => onNavigateTab('orders')
    }
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-black text-white tracking-tight">Master Platform Overview</h2>
        <p className="text-xs text-slate-400 mt-1">
          Real-time metrics, tenant health, and conversational commerce performance across all accounts.
        </p>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div
              key={i}
              onClick={c.action}
              className={`p-5 rounded-2xl bg-gradient-to-br ${c.color} border cursor-pointer hover:scale-[1.01] transition shadow-lg shadow-black/20`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">{c.title}</span>
                <Icon className="w-5 h-5 shrink-0" />
              </div>
              <p className="text-2xl font-black text-white mt-3 tracking-tight">{c.value}</p>
              <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400">
                <span>{c.detail}</span>
                <ArrowUpRight className="w-3.5 h-3.5 opacity-60" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Infrastructure Health Status */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">System Infrastructure & Services</h3>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
            All Systems Operational
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-white">n8n Orchestration Engine</p>
              <p className="text-[11px] text-slate-400">Port 5678 (Ngrok / VPS Tunnel)</p>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-white">Supabase PostgreSQL</p>
              <p className="text-[11px] text-slate-400">Seoul Pooler (Port 6543)</p>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-white">Google Gemini 1.5 Flash</p>
              <p className="text-[11px] text-slate-400">1,500 Daily Free Quota</p>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Quick Summary Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Registered Users */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Users className="w-4 h-4 text-blue-400" />
              <span>Recent Tenants ({users.length})</span>
            </h3>
            <button
              onClick={() => onNavigateTab('users')}
              className="text-xs text-purple-400 hover:text-purple-300 font-semibold"
            >
              View All
            </button>
          </div>

          {users.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">No tenants registered yet.</p>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {users.slice(0, 5).map((u) => (
                <div key={u.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-white">{u.email}</p>
                    <p className="text-[10px] text-slate-500 font-mono">ID: {u.id ? `${u.id.slice(0, 10)}...` : 'N/A'}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 uppercase text-[10px] font-bold">
                      {u.plan_tier || 'free'}
                    </span>
                    <span className={`w-2 h-2 rounded-full ${u.status === 'active' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Captured Orders */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <ShoppingBag className="w-4 h-4 text-emerald-400" />
              <span>Recent Live Orders ({orders.length})</span>
            </h3>
            <button
              onClick={() => onNavigateTab('orders')}
              className="text-xs text-purple-400 hover:text-purple-300 font-semibold"
            >
              View All
            </button>
          </div>

          {orders.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">No orders recorded yet.</p>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {orders.slice(0, 5).map((o, idx) => (
                <div key={o.id || idx} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-white">{o.customer_name || 'Customer'}</p>
                    <p className="text-[10px] text-slate-400">{o.selected_package || 'Inquiry'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-emerald-400">
                      {o.total_amount_bdt ? `৳${Number(o.total_amount_bdt).toLocaleString()}` : 'Lead'}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {o.phone_number || 'Messenger'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

